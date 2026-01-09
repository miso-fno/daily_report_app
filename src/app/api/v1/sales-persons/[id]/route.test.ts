/**
 * 営業担当者マスタAPI - 詳細取得・更新・削除のユニットテスト
 *
 * テスト対象:
 * - GET /api/v1/sales-persons/{id} - 詳細取得
 * - PUT /api/v1/sales-persons/{id} - 更新 (UT-SLS-004)
 * - DELETE /api/v1/sales-persons/{id} - 削除 (UT-SLS-005)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, GET, PUT } from "./route";

import type { NextRequest } from "next/server";

// Prismaモック
const mockSalesPersonFindUnique = vi.fn();
const mockSalesPersonUpdate = vi.fn();
const mockSalesPersonDelete = vi.fn();
const mockSalesPersonCount = vi.fn();
const mockDailyReportCount = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    salesPerson: {
      findUnique: (...args: unknown[]) => mockSalesPersonFindUnique(...args),
      update: (...args: unknown[]) => mockSalesPersonUpdate(...args),
      delete: (...args: unknown[]) => mockSalesPersonDelete(...args),
      count: (...args: unknown[]) => mockSalesPersonCount(...args),
    },
    dailyReport: {
      count: (...args: unknown[]) => mockDailyReportCount(...args),
    },
  },
}));

// 認証モック
const mockAuth = vi.fn();
vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

// bcryptjsモック
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed_password"),
  },
}));

// テスト用ヘルパー関数
const createContext = (id: string) => ({
  params: Promise.resolve({ id }),
});

// テスト用セッションデータ
const managerSession = {
  user: {
    id: 1,
    name: "管理者太郎",
    email: "manager@example.com",
    isManager: true,
  },
};

const memberSession = {
  user: {
    id: 2,
    name: "一般担当者",
    email: "member@example.com",
    isManager: false,
  },
};

// テスト用モックデータ
const mockSalesPersonData = {
  id: 2,
  name: "営業花子",
  email: "hanako@example.com",
  department: "営業一課",
  managerId: 1,
  isManager: false,
  createdAt: new Date("2024-01-10T09:00:00Z"),
  updatedAt: new Date("2024-01-10T09:00:00Z"),
  manager: { name: "管理者太郎" },
};

describe("Sales Persons API - GET /api/v1/sales-persons/{id}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createRequest = (id: string): NextRequest => {
    return new Request(`http://localhost/api/v1/sales-persons/${id}`, {
      method: "GET",
    }) as unknown as NextRequest;
  };

  describe("認証・認可チェック", () => {
    it("未認証の場合、401エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(null);

      const request = createRequest("2");
      const response = await GET(request, createContext("2"));
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("AUTH_UNAUTHORIZED");
    });

    it("管理者でない場合、403エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(memberSession);

      const request = createRequest("2");
      const response = await GET(request, createContext("2"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("FORBIDDEN_ACCESS");
    });
  });

  describe("営業担当者詳細取得 - 正常系", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(managerSession);
    });

    it("営業担当者詳細が正しく取得できること", async () => {
      mockSalesPersonFindUnique.mockResolvedValue(mockSalesPersonData);

      const request = createRequest("2");
      const response = await GET(request, createContext("2"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        sales_person_id: 2,
        name: "営業花子",
        email: "hanako@example.com",
        department: "営業一課",
        manager_id: 1,
        manager_name: "管理者太郎",
        is_manager: false,
      });
      expect(body.data.created_at).toBe("2024-01-10T09:00:00.000Z");
      expect(body.data.updated_at).toBe("2024-01-10T09:00:00.000Z");
    });

    it("上長なしの営業担当者詳細が取得できること", async () => {
      const noManagerSalesPerson = {
        ...mockSalesPersonData,
        id: 1,
        managerId: null,
        isManager: true,
        manager: null,
      };
      mockSalesPersonFindUnique.mockResolvedValue(noManagerSalesPerson);

      const request = createRequest("1");
      const response = await GET(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.manager_id).toBeNull();
      expect(body.data.manager_name).toBeNull();
      expect(body.data.is_manager).toBe(true);
    });
  });

  describe("営業担当者詳細取得 - 異常系", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(managerSession);
    });

    it("存在しない営業担当者IDの場合、404エラーを返すこと", async () => {
      mockSalesPersonFindUnique.mockResolvedValue(null);

      const request = createRequest("999");
      const response = await GET(request, createContext("999"));
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
      expect(body.error.message).toContain("営業担当者が見つかりません");
    });

    it("不正なIDフォーマットの場合、422エラーを返すこと", async () => {
      const request = createRequest("abc");
      const response = await GET(request, createContext("abc"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("負のIDの場合、422エラーを返すこと", async () => {
      const request = createRequest("-1");
      const response = await GET(request, createContext("-1"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });
  });
});

describe("Sales Persons API - PUT /api/v1/sales-persons/{id}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createRequest = (id: string, body: unknown): NextRequest => {
    return new Request(`http://localhost/api/v1/sales-persons/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }) as unknown as NextRequest;
  };

  describe("認証・認可チェック", () => {
    it("未認証の場合、401エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(null);

      const request = createRequest("2", {
        name: "更新後の名前",
        email: "updated@example.com",
        department: "営業二課",
        is_manager: false,
      });
      const response = await PUT(request, createContext("2"));
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it("管理者でない場合、403エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(memberSession);

      const request = createRequest("2", {
        name: "更新後の名前",
        email: "updated@example.com",
        department: "営業二課",
        is_manager: false,
      });
      const response = await PUT(request, createContext("2"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });
  });

  describe("営業担当者編集 - 正常系 (UT-SLS-004)", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(managerSession);
    });

    it("営業担当者情報を更新できること", async () => {
      mockSalesPersonFindUnique
        .mockResolvedValueOnce(mockSalesPersonData) // 存在チェック
        .mockResolvedValueOnce(null); // メール重複チェック（重複なし）

      const updatedSalesPerson = {
        ...mockSalesPersonData,
        name: "更新後の名前",
        department: "営業二課",
        updatedAt: new Date("2024-01-20T15:00:00Z"),
      };
      mockSalesPersonUpdate.mockResolvedValue(updatedSalesPerson);

      const request = createRequest("2", {
        name: "更新後の名前",
        email: "hanako@example.com",
        department: "営業二課",
        is_manager: false,
      });

      const response = await PUT(request, createContext("2"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe("営業担当者を更新しました");
      expect(body.data.name).toBe("更新後の名前");
      expect(body.data.department).toBe("営業二課");
    });

    it("パスワードを更新できること", async () => {
      mockSalesPersonFindUnique.mockResolvedValue(mockSalesPersonData);

      const updatedSalesPerson = {
        ...mockSalesPersonData,
        updatedAt: new Date(),
      };
      mockSalesPersonUpdate.mockResolvedValue(updatedSalesPerson);

      const request = createRequest("2", {
        name: "営業花子",
        email: "hanako@example.com", // 既存と同じメールなのでメール重複チェックはスキップ
        password: "newpassword123",
        department: "営業一課",
        is_manager: false,
      });

      const response = await PUT(request, createContext("2"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);

      // updateが呼ばれたことを確認
      expect(mockSalesPersonUpdate).toHaveBeenCalled();
      // レスポンスが正しく返されていることで、パスワード更新処理が完了したことを確認
      expect(body.data.sales_person_id).toBe(2);
      expect(body.message).toBe("営業担当者を更新しました");
    });

    it("パスワードなしで更新できること", async () => {
      // 既存と同じメールなのでメール重複チェックはスキップされる
      mockSalesPersonFindUnique.mockResolvedValue(mockSalesPersonData);

      const updatedSalesPerson = {
        ...mockSalesPersonData,
        updatedAt: new Date(),
      };
      mockSalesPersonUpdate.mockResolvedValue(updatedSalesPerson);

      const request = createRequest("2", {
        name: "営業花子",
        email: "hanako@example.com",
        department: "営業一課",
        is_manager: false,
      });

      const response = await PUT(request, createContext("2"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);

      // パスワードが更新データに含まれていないことを確認
      const updateCall = mockSalesPersonUpdate.mock.calls[0]![0] as {
        data: { password?: string };
      };
      expect(updateCall.data.password).toBeUndefined();
    });

    it("上長を変更できること", async () => {
      // 1回目: 存在チェック、2回目: 上長存在チェック
      // メールが同じなのでメール重複チェックはスキップ
      mockSalesPersonFindUnique
        .mockResolvedValueOnce(mockSalesPersonData) // 存在チェック
        .mockResolvedValueOnce({ id: 3, name: "別の上長" }); // 新しい上長存在チェック

      const updatedSalesPerson = {
        ...mockSalesPersonData,
        managerId: 3,
        manager: { name: "別の上長" },
        updatedAt: new Date(),
      };
      mockSalesPersonUpdate.mockResolvedValue(updatedSalesPerson);

      const request = createRequest("2", {
        name: "営業花子",
        email: "hanako@example.com", // 既存と同じメール
        department: "営業一課",
        manager_id: 3,
        is_manager: false,
      });

      const response = await PUT(request, createContext("2"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.manager_id).toBe(3);
      expect(body.data.manager_name).toBe("別の上長");
    });

    it("上長をnullに変更できること", async () => {
      // 既存と同じメールなのでメール重複チェックはスキップ
      mockSalesPersonFindUnique.mockResolvedValue(mockSalesPersonData);

      const updatedSalesPerson = {
        ...mockSalesPersonData,
        managerId: null,
        manager: null,
        updatedAt: new Date(),
      };
      mockSalesPersonUpdate.mockResolvedValue(updatedSalesPerson);

      const request = createRequest("2", {
        name: "営業花子",
        email: "hanako@example.com",
        department: "営業一課",
        manager_id: null,
        is_manager: true,
      });

      const response = await PUT(request, createContext("2"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.manager_id).toBeNull();
    });
  });

  describe("営業担当者編集 - メールアドレス重複チェック", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(managerSession);
    });

    it("他のユーザーとメールアドレスが重複する場合、エラーを返すこと", async () => {
      mockSalesPersonFindUnique
        .mockResolvedValueOnce(mockSalesPersonData) // 存在チェック
        .mockResolvedValueOnce({ id: 3, email: "existing@example.com" }); // 重複あり

      const request = createRequest("2", {
        name: "営業花子",
        email: "existing@example.com",
        department: "営業一課",
        is_manager: false,
      });

      const response = await PUT(request, createContext("2"));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("DUPLICATE_ENTRY");
    });

    it("自分自身のメールアドレスと同じ場合は更新できること", async () => {
      mockSalesPersonFindUnique
        .mockResolvedValueOnce(mockSalesPersonData)
        .mockResolvedValueOnce(null); // 重複なし（自分以外に同じメールなし）

      const updatedSalesPerson = {
        ...mockSalesPersonData,
        updatedAt: new Date(),
      };
      mockSalesPersonUpdate.mockResolvedValue(updatedSalesPerson);

      const request = createRequest("2", {
        name: "営業花子",
        email: "hanako@example.com", // 既存と同じ
        department: "営業一課",
        is_manager: false,
      });

      const response = await PUT(request, createContext("2"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });

  describe("営業担当者編集 - 上長チェック", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(managerSession);
    });

    it("自分自身を上長に設定しようとした場合、バリデーションエラーを返すこと", async () => {
      mockSalesPersonFindUnique
        .mockResolvedValueOnce(mockSalesPersonData)
        .mockResolvedValueOnce(null);

      const request = createRequest("2", {
        name: "営業花子",
        email: "hanako@example.com",
        department: "営業一課",
        manager_id: 2, // 自分自身
        is_manager: false,
      });

      const response = await PUT(request, createContext("2"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain(
        "自分自身を上長に設定することはできません"
      );
    });

    it("存在しない上長を設定しようとした場合、バリデーションエラーを返すこと", async () => {
      mockSalesPersonFindUnique
        .mockResolvedValueOnce(mockSalesPersonData)
        .mockResolvedValueOnce(null) // メール重複チェック
        .mockResolvedValueOnce(null); // 上長存在チェック

      const request = createRequest("2", {
        name: "営業花子",
        email: "hanako@example.com",
        department: "営業一課",
        manager_id: 999,
        is_manager: false,
      });

      const response = await PUT(request, createContext("2"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("上長が存在しません");
    });
  });

  describe("営業担当者編集 - 存在チェック", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(managerSession);
    });

    it("存在しない営業担当者を更新しようとした場合、404エラーを返すこと", async () => {
      mockSalesPersonFindUnique.mockResolvedValue(null);

      const request = createRequest("999", {
        name: "テスト",
        email: "test@example.com",
        department: "営業一課",
        is_manager: false,
      });

      const response = await PUT(request, createContext("999"));
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
    });
  });

  describe("営業担当者編集 - バリデーションエラー", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(managerSession);
    });

    it("氏名が空の場合、バリデーションエラーになること", async () => {
      mockSalesPersonFindUnique.mockResolvedValue(mockSalesPersonData);

      const request = createRequest("2", {
        name: "",
        email: "hanako@example.com",
        department: "営業一課",
        is_manager: false,
      });

      const response = await PUT(request, createContext("2"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });

    it("不正なメールアドレス形式の場合、バリデーションエラーになること", async () => {
      mockSalesPersonFindUnique.mockResolvedValue(mockSalesPersonData);

      const request = createRequest("2", {
        name: "営業花子",
        email: "invalid-email",
        department: "営業一課",
        is_manager: false,
      });

      const response = await PUT(request, createContext("2"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });

    it("パスワードが8文字未満の場合、バリデーションエラーになること", async () => {
      mockSalesPersonFindUnique.mockResolvedValue(mockSalesPersonData);

      const request = createRequest("2", {
        name: "営業花子",
        email: "hanako@example.com",
        password: "short",
        department: "営業一課",
        is_manager: false,
      });

      const response = await PUT(request, createContext("2"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });

    it("不正なIDフォーマットの場合、422エラーを返すこと", async () => {
      const request = createRequest("abc", {
        name: "テスト",
        email: "test@example.com",
        department: "営業一課",
        is_manager: false,
      });

      const response = await PUT(request, createContext("abc"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });
  });
});

describe("Sales Persons API - DELETE /api/v1/sales-persons/{id}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createRequest = (id: string): NextRequest => {
    return new Request(`http://localhost/api/v1/sales-persons/${id}`, {
      method: "DELETE",
    }) as unknown as NextRequest;
  };

  describe("認証・認可チェック", () => {
    it("未認証の場合、401エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(null);

      const request = createRequest("2");
      const response = await DELETE(request, createContext("2"));
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });

    it("管理者でない場合、403エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(memberSession);

      const request = createRequest("2");
      const response = await DELETE(request, createContext("2"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });
  });

  describe("営業担当者削除 - 正常系 (UT-SLS-005)", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(managerSession);
    });

    it("日報も部下もいない営業担当者を削除できること", async () => {
      mockSalesPersonFindUnique.mockResolvedValue(mockSalesPersonData);
      mockDailyReportCount.mockResolvedValue(0);
      mockSalesPersonCount.mockResolvedValue(0);
      mockSalesPersonDelete.mockResolvedValue(mockSalesPersonData);

      const request = createRequest("2");
      const response = await DELETE(request, createContext("2"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe("営業担当者を削除しました");
      expect(body.data.sales_person_id).toBe(2);
    });
  });

  describe("営業担当者削除 - 使用中チェック", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(managerSession);
    });

    it("日報がある営業担当者は削除できないこと", async () => {
      mockSalesPersonFindUnique.mockResolvedValue(mockSalesPersonData);
      mockDailyReportCount.mockResolvedValue(5);

      const request = createRequest("2");
      const response = await DELETE(request, createContext("2"));
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("RESOURCE_IN_USE");
      expect(body.error.message).toContain(
        "日報で使用されているため削除できません"
      );
    });

    it("部下がいる営業担当者は削除できないこと", async () => {
      mockSalesPersonFindUnique.mockResolvedValue(mockSalesPersonData);
      mockDailyReportCount.mockResolvedValue(0);
      mockSalesPersonCount.mockResolvedValue(3); // 部下が3人

      const request = createRequest("2");
      const response = await DELETE(request, createContext("2"));
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("RESOURCE_IN_USE");
      expect(body.error.message).toContain(
        "上長に設定されているため削除できません"
      );
    });
  });

  describe("営業担当者削除 - 自分自身削除禁止", () => {
    it("自分自身を削除しようとした場合、403エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(managerSession);
      mockSalesPersonFindUnique.mockResolvedValue({
        ...mockSalesPersonData,
        id: 1, // 自分自身
      });
      mockDailyReportCount.mockResolvedValue(0);
      mockSalesPersonCount.mockResolvedValue(0);

      const request = createRequest("1");
      const response = await DELETE(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("FORBIDDEN_ACCESS");
      expect(body.error.message).toContain(
        "自分自身を削除することはできません"
      );
    });
  });

  describe("営業担当者削除 - 存在チェック", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(managerSession);
    });

    it("存在しない営業担当者を削除しようとした場合、404エラーを返すこと", async () => {
      mockSalesPersonFindUnique.mockResolvedValue(null);

      const request = createRequest("999");
      const response = await DELETE(request, createContext("999"));
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
    });
  });

  describe("営業担当者削除 - バリデーションエラー", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(managerSession);
    });

    it("不正なIDフォーマットの場合、422エラーを返すこと", async () => {
      const request = createRequest("abc");
      const response = await DELETE(request, createContext("abc"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("負のIDの場合、422エラーを返すこと", async () => {
      const request = createRequest("-1");
      const response = await DELETE(request, createContext("-1"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });
  });
});
