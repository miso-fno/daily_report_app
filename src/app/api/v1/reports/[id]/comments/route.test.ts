/**
 * コメントAPI一覧取得・新規作成のユニットテスト
 *
 * テスト対象:
 * - GET /api/v1/reports/{reportId}/comments - コメント一覧取得
 * - POST /api/v1/reports/{reportId}/comments - コメント新規作成
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "./route";

import type { NextRequest } from "next/server";

// Prismaモック
const mockPrismaReportFindUnique = vi.fn();
const mockPrismaCommentFindMany = vi.fn();
const mockPrismaCommentCreate = vi.fn();
const mockPrismaSalesPersonFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    dailyReport: {
      findUnique: (...args: unknown[]) => mockPrismaReportFindUnique(...args),
    },
    comment: {
      findMany: (...args: unknown[]) => mockPrismaCommentFindMany(...args),
      create: (...args: unknown[]) => mockPrismaCommentCreate(...args),
    },
    salesPerson: {
      findFirst: (...args: unknown[]) =>
        mockPrismaSalesPersonFindFirst(...args),
    },
  },
}));

// 認証モック
const mockAuth = vi.fn();
vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

describe("Comments API - GET /api/v1/reports/{reportId}/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createRequest = (reportId: string): NextRequest => {
    return new Request(`http://localhost/api/v1/reports/${reportId}/comments`, {
      method: "GET",
    }) as unknown as NextRequest;
  };

  const createContext = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  const memberSession = {
    user: {
      id: 1,
      name: "テスト太郎",
      email: "member@example.com",
      isManager: false,
    },
  };

  describe("認証チェック", () => {
    it("未認証の場合、401エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(null);

      const request = createRequest("1");
      const response = await GET(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });
  });

  describe("コメント一覧取得 - 正常系", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(memberSession);
    });

    it("コメント一覧を取得できること", async () => {
      mockPrismaReportFindUnique.mockResolvedValue({
        salesPersonId: 1,
      });
      mockPrismaCommentFindMany.mockResolvedValue([
        {
          id: 1,
          reportId: 1,
          salesPersonId: 2,
          commentText: "お疲れ様です。良い成果ですね。",
          createdAt: new Date("2024-01-15T19:00:00Z"),
          updatedAt: new Date("2024-01-15T19:00:00Z"),
          salesPerson: { name: "テスト上長" },
        },
        {
          id: 2,
          reportId: 1,
          salesPersonId: 2,
          commentText: "次回も頑張ってください。",
          createdAt: new Date("2024-01-15T19:30:00Z"),
          updatedAt: new Date("2024-01-15T19:30:00Z"),
          salesPerson: { name: "テスト上長" },
        },
      ]);

      const request = createRequest("1");
      const response = await GET(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(2);
      expect(body.data.items[0]).toMatchObject({
        comment_id: 1,
        report_id: 1,
        sales_person_id: 2,
        sales_person_name: "テスト上長",
        comment_text: "お疲れ様です。良い成果ですね。",
      });
    });

    it("コメントが0件の場合、空配列を返すこと", async () => {
      mockPrismaReportFindUnique.mockResolvedValue({
        salesPersonId: 1,
      });
      mockPrismaCommentFindMany.mockResolvedValue([]);

      const request = createRequest("1");
      const response = await GET(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(0);
    });
  });

  describe("コメント一覧取得 - 存在チェック", () => {
    it("存在しない日報のコメントを取得しようとした場合、404エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(memberSession);
      mockPrismaReportFindUnique.mockResolvedValue(null);

      const request = createRequest("999");
      const response = await GET(request, createContext("999"));
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  describe("コメント一覧取得 - 権限チェック", () => {
    it("他人の日報のコメントを取得しようとした場合、403エラーを返すこと", async () => {
      mockAuth.mockResolvedValue({
        user: { id: 3, name: "別のユーザー", isManager: false },
      });
      mockPrismaReportFindUnique.mockResolvedValue({
        salesPersonId: 1, // 別の人の日報
      });
      mockPrismaSalesPersonFindFirst.mockResolvedValue(null); // 部下ではない

      const request = createRequest("1");
      const response = await GET(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });

    it("上長は部下の日報のコメントを取得できること", async () => {
      mockAuth.mockResolvedValue({
        user: { id: 2, name: "テスト上長", isManager: true },
      });
      mockPrismaReportFindUnique.mockResolvedValue({
        salesPersonId: 1, // 部下の日報
      });
      mockPrismaSalesPersonFindFirst.mockResolvedValue({ id: 1, managerId: 2 }); // 部下である
      mockPrismaCommentFindMany.mockResolvedValue([]);

      const request = createRequest("1");
      const response = await GET(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});

describe("Comments API - POST /api/v1/reports/{reportId}/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createRequest = (reportId: string, body: unknown): NextRequest => {
    return new Request(`http://localhost/api/v1/reports/${reportId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }) as unknown as NextRequest;
  };

  const createContext = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  const memberSession = {
    user: {
      id: 1,
      name: "テスト太郎",
      email: "member@example.com",
      isManager: false,
    },
  };

  const managerSession = {
    user: {
      id: 2,
      name: "テスト上長",
      email: "manager@example.com",
      isManager: true,
    },
  };

  describe("認証チェック", () => {
    it("未認証の場合、401エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(null);

      const request = createRequest("1", { comment_text: "テストコメント" });
      const response = await POST(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });
  });

  describe("コメント投稿 - 正常系", () => {
    it("上長がコメントを投稿できること（UT-CMT-001）", async () => {
      mockAuth.mockResolvedValue(managerSession);
      mockPrismaReportFindUnique.mockResolvedValue({
        salesPersonId: 1, // 部下の日報
      });
      mockPrismaSalesPersonFindFirst.mockResolvedValue({ id: 1, managerId: 2 }); // 部下である
      mockPrismaCommentCreate.mockResolvedValue({
        id: 1,
        reportId: 1,
        salesPersonId: 2,
        createdAt: new Date("2024-01-15T19:00:00Z"),
      });

      const request = createRequest("1", {
        comment_text: "お疲れ様です。良い成果ですね。",
      });
      const response = await POST(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        comment_id: 1,
        report_id: 1,
      });
      expect(body.message).toBe("コメントを投稿しました");
    });
  });

  describe("コメント投稿 - 権限チェック", () => {
    it("一般営業担当者はコメントを投稿できないこと（UT-CMT-002）", async () => {
      mockAuth.mockResolvedValue(memberSession);

      const request = createRequest("1", { comment_text: "テストコメント" });
      const response = await POST(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("上長のみ");
    });

    it("上長でもアクセス権限のない日報にはコメントできないこと", async () => {
      mockAuth.mockResolvedValue(managerSession);
      mockPrismaReportFindUnique.mockResolvedValue({
        salesPersonId: 3, // 部下でない人の日報
      });
      mockPrismaSalesPersonFindFirst.mockResolvedValue(null); // 部下ではない

      const request = createRequest("1", { comment_text: "テストコメント" });
      const response = await POST(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });
  });

  describe("コメント投稿 - バリデーションエラー", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(managerSession);
    });

    it("コメント内容が未入力の場合、バリデーションエラーになること", async () => {
      const request = createRequest("1", { comment_text: "" });
      const response = await POST(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });

    it("コメント内容が500文字を超える場合、バリデーションエラーになること", async () => {
      const longComment = "あ".repeat(501);

      const request = createRequest("1", { comment_text: longComment });
      const response = await POST(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });
  });

  describe("コメント投稿 - 存在チェック", () => {
    it("存在しない日報にコメントしようとした場合、404エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(managerSession);
      mockPrismaReportFindUnique.mockResolvedValue(null);

      const request = createRequest("999", { comment_text: "テストコメント" });
      const response = await POST(request, createContext("999"));
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });
  });
});
