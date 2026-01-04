/**
 * 認証ロジック（NextAuth authorize関数）の単体テスト
 *
 * テスト対象:
 * - UT-AUTH-001: 正しい認証情報でログインできること
 * - UT-AUTH-002: 誤ったパスワードでログインできないこと
 * - UT-AUTH-003: 未登録のメールアドレスでログインできないこと
 * - UT-AUTH-004: 必須項目未入力でバリデーションエラーになること
 */

import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

// Prismaクライアントをモック
vi.mock("@/lib/prisma", () => ({
  prisma: {
    salesPerson: {
      findUnique: vi.fn(),
    },
  },
}));

// bcryptをモック
vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

import { prisma } from "@/lib/prisma";

// authorize関数を再現（NextAuthの内部関数のため直接importできないため）

const signInSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

async function authorize(credentials: Record<string, unknown> | undefined) {
  try {
    const { email, password } = await signInSchema.parseAsync(credentials);

    const user = await prisma.salesPerson.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(
      password,
      (user as { password: string }).password
    );

    if (!isValidPassword) {
      return null;
    }

    return {
      id: (user as { id: number }).id,
      email: (user as { email: string }).email,
      name: (user as { name: string }).name,
      department: (user as { department: string }).department,
      isManager: (user as { isManager: boolean }).isManager,
      managerId: (user as { managerId: number | null }).managerId,
    };
  } catch {
    return null;
  }
}

describe("認証ロジック (authorize関数)", () => {
  // テスト用のモックユーザーデータ
  const mockUser = {
    id: 1,
    name: "田中太郎",
    email: "tanaka@example.com",
    password: "$2a$10$hashedpassword",
    department: "営業部",
    isManager: false,
    managerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("UT-AUTH-001: ログイン（正常系）", () => {
    it("正しいメールアドレスとパスワードでログインできること", async () => {
      // Arrange
      vi.mocked(prisma.salesPerson.findUnique).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const credentials = {
        email: "tanaka@example.com",
        password: "correctPassword123",
      };

      // Act
      const result = await authorize(credentials);

      // Assert
      expect(result).not.toBeNull();
      expect(result).toEqual({
        id: 1,
        email: "tanaka@example.com",
        name: "田中太郎",
        department: "営業部",
        isManager: false,
        managerId: null,
      });
      expect(prisma.salesPerson.findUnique).toHaveBeenCalledWith({
        where: { email: "tanaka@example.com" },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "correctPassword123",
        "$2a$10$hashedpassword"
      );
    });

    it("上長アカウントでログインした場合、isManagerがtrueで返ること", async () => {
      // Arrange
      const managerUser = {
        ...mockUser,
        id: 2,
        name: "山田部長",
        email: "yamada@example.com",
        isManager: true,
      };
      vi.mocked(prisma.salesPerson.findUnique).mockResolvedValue(managerUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const credentials = {
        email: "yamada@example.com",
        password: "managerPassword",
      };

      // Act
      const result = await authorize(credentials);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.isManager).toBe(true);
      expect(result?.name).toBe("山田部長");
    });

    it("部下を持つユーザーの場合、managerIdが正しく返ること", async () => {
      // Arrange
      const subordinateUser = {
        ...mockUser,
        id: 3,
        name: "鈴木一郎",
        email: "suzuki@example.com",
        managerId: 2, // 山田部長が上長
      };
      vi.mocked(prisma.salesPerson.findUnique).mockResolvedValue(
        subordinateUser
      );
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const credentials = {
        email: "suzuki@example.com",
        password: "subordinatePassword",
      };

      // Act
      const result = await authorize(credentials);

      // Assert
      expect(result).not.toBeNull();
      expect(result?.managerId).toBe(2);
    });
  });

  describe("UT-AUTH-002: ログイン（異常系：パスワード誤り）", () => {
    it("誤ったパスワードでログインできないこと", async () => {
      // Arrange
      vi.mocked(prisma.salesPerson.findUnique).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const credentials = {
        email: "tanaka@example.com",
        password: "wrongPassword",
      };

      // Act
      const result = await authorize(credentials);

      // Assert
      expect(result).toBeNull();
      expect(prisma.salesPerson.findUnique).toHaveBeenCalledWith({
        where: { email: "tanaka@example.com" },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "wrongPassword",
        "$2a$10$hashedpassword"
      );
    });

    it("空のパスワードでログインできないこと", async () => {
      // Arrange
      const credentials = {
        email: "tanaka@example.com",
        password: "",
      };

      // Act
      const result = await authorize(credentials);

      // Assert
      expect(result).toBeNull();
      // パスワードが空の場合、バリデーションで弾かれるためDBアクセスは発生しない
      expect(prisma.salesPerson.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("UT-AUTH-003: ログイン（異常系：未登録メールアドレス）", () => {
    it("未登録のメールアドレスでログインできないこと", async () => {
      // Arrange
      vi.mocked(prisma.salesPerson.findUnique).mockResolvedValue(null);

      const credentials = {
        email: "notexist@example.com",
        password: "somePassword",
      };

      // Act
      const result = await authorize(credentials);

      // Assert
      expect(result).toBeNull();
      expect(prisma.salesPerson.findUnique).toHaveBeenCalledWith({
        where: { email: "notexist@example.com" },
      });
      // ユーザーが見つからない場合、bcrypt.compareは呼ばれない
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe("UT-AUTH-004: ログイン（異常系：必須項目未入力）", () => {
    it("メールアドレスが未入力の場合、ログインできないこと", async () => {
      // Arrange
      const credentials = {
        email: "",
        password: "somePassword",
      };

      // Act
      const result = await authorize(credentials);

      // Assert
      expect(result).toBeNull();
      expect(prisma.salesPerson.findUnique).not.toHaveBeenCalled();
    });

    it("パスワードが未入力の場合、ログインできないこと", async () => {
      // Arrange
      const credentials = {
        email: "tanaka@example.com",
        password: "",
      };

      // Act
      const result = await authorize(credentials);

      // Assert
      expect(result).toBeNull();
      expect(prisma.salesPerson.findUnique).not.toHaveBeenCalled();
    });

    it("両方未入力の場合、ログインできないこと", async () => {
      // Arrange
      const credentials = {
        email: "",
        password: "",
      };

      // Act
      const result = await authorize(credentials);

      // Assert
      expect(result).toBeNull();
      expect(prisma.salesPerson.findUnique).not.toHaveBeenCalled();
    });

    it("credentialsがundefinedの場合、ログインできないこと", async () => {
      // Act
      const result = await authorize(undefined);

      // Assert
      expect(result).toBeNull();
      expect(prisma.salesPerson.findUnique).not.toHaveBeenCalled();
    });

    it("credentialsが空オブジェクトの場合、ログインできないこと", async () => {
      // Act
      const result = await authorize({});

      // Assert
      expect(result).toBeNull();
      expect(prisma.salesPerson.findUnique).not.toHaveBeenCalled();
    });
  });

  describe("メールアドレス形式バリデーション", () => {
    it("無効なメールアドレス形式ではログインできないこと", async () => {
      // Arrange
      const invalidEmails = [
        "invalid",
        "invalid@",
        "@example.com",
        "invalid@.com",
        "invalid@example",
      ];

      for (const email of invalidEmails) {
        vi.clearAllMocks();
        const credentials = { email, password: "somePassword" };

        // Act
        const result = await authorize(credentials);

        // Assert
        expect(result).toBeNull();
        expect(prisma.salesPerson.findUnique).not.toHaveBeenCalled();
      }
    });
  });

  describe("データベースエラーハンドリング", () => {
    it("データベースエラーが発生した場合、nullを返すこと", async () => {
      // Arrange
      vi.mocked(prisma.salesPerson.findUnique).mockRejectedValue(
        new Error("Database connection error")
      );

      const credentials = {
        email: "tanaka@example.com",
        password: "somePassword",
      };

      // Act
      const result = await authorize(credentials);

      // Assert
      expect(result).toBeNull();
    });

    it("bcrypt.compareでエラーが発生した場合、nullを返すこと", async () => {
      // Arrange
      vi.mocked(prisma.salesPerson.findUnique).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockRejectedValue(new Error("Bcrypt error"));

      const credentials = {
        email: "tanaka@example.com",
        password: "somePassword",
      };

      // Act
      const result = await authorize(credentials);

      // Assert
      expect(result).toBeNull();
    });
  });
});
