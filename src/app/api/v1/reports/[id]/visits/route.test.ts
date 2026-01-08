/**
 * 訪問記録API一覧取得・新規作成のユニットテスト
 *
 * テスト対象:
 * - GET /api/v1/reports/{reportId}/visits - 訪問記録一覧取得
 * - POST /api/v1/reports/{reportId}/visits - 訪問記録新規作成
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "./route";

import type { NextRequest } from "next/server";

// Prismaモック
const mockPrismaReportFindUnique = vi.fn();
const mockPrismaVisitFindMany = vi.fn();
const mockPrismaVisitCreate = vi.fn();
const mockPrismaCustomerFindUnique = vi.fn();
const mockPrismaSalesPersonFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    dailyReport: {
      findUnique: (...args: unknown[]) => mockPrismaReportFindUnique(...args),
    },
    visitRecord: {
      findMany: (...args: unknown[]) => mockPrismaVisitFindMany(...args),
      create: (...args: unknown[]) => mockPrismaVisitCreate(...args),
    },
    customer: {
      findUnique: (...args: unknown[]) => mockPrismaCustomerFindUnique(...args),
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

describe("Visits API - GET /api/v1/reports/{reportId}/visits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createRequest = (reportId: string): NextRequest => {
    return new Request(`http://localhost/api/v1/reports/${reportId}/visits`, {
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

  describe("訪問記録一覧取得 - 正常系", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(memberSession);
    });

    it("訪問記録一覧を取得できること", async () => {
      mockPrismaReportFindUnique.mockResolvedValue({
        salesPersonId: 1,
      });
      mockPrismaVisitFindMany.mockResolvedValue([
        {
          id: 1,
          customerId: 1,
          visitTime: new Date("1970-01-01T10:30:00Z"),
          visitPurpose: "商談",
          visitContent: "新規提案を行いました",
          visitResult: "次回アポイント取得",
          createdAt: new Date("2024-01-15T10:00:00Z"),
          updatedAt: new Date("2024-01-15T10:00:00Z"),
          customer: { customerName: "株式会社テスト" },
        },
        {
          id: 2,
          customerId: 2,
          visitTime: new Date("1970-01-01T14:00:00Z"),
          visitPurpose: "フォローアップ",
          visitContent: "導入後の状況確認",
          visitResult: null,
          createdAt: new Date("2024-01-15T14:00:00Z"),
          updatedAt: new Date("2024-01-15T14:00:00Z"),
          customer: { customerName: "サンプル商事" },
        },
      ]);

      const request = createRequest("1");
      const response = await GET(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(2);
      expect(body.data.items[0]).toMatchObject({
        visit_id: 1,
        customer_id: 1,
        customer_name: "株式会社テスト",
        visit_time: "10:30",
        visit_content: "新規提案を行いました",
      });
    });

    it("訪問記録が0件の場合、空配列を返すこと", async () => {
      mockPrismaReportFindUnique.mockResolvedValue({
        salesPersonId: 1,
      });
      mockPrismaVisitFindMany.mockResolvedValue([]);

      const request = createRequest("1");
      const response = await GET(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(0);
    });
  });

  describe("訪問記録一覧取得 - 存在チェック", () => {
    it("存在しない日報の訪問記録を取得しようとした場合、404エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(memberSession);
      mockPrismaReportFindUnique.mockResolvedValue(null);

      const request = createRequest("999");
      const response = await GET(request, createContext("999"));
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  describe("訪問記録一覧取得 - 権限チェック", () => {
    it("他人の日報の訪問記録を取得しようとした場合、403エラーを返すこと", async () => {
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
  });
});

describe("Visits API - POST /api/v1/reports/{reportId}/visits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createRequest = (reportId: string, body: unknown): NextRequest => {
    return new Request(`http://localhost/api/v1/reports/${reportId}/visits`, {
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

  describe("認証チェック", () => {
    it("未認証の場合、401エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(null);

      const request = createRequest("1", {
        customer_id: 1,
        visit_content: "テスト訪問",
      });
      const response = await POST(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });
  });

  describe("訪問記録作成 - 正常系", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(memberSession);
    });

    it("訪問記録を作成できること", async () => {
      mockPrismaReportFindUnique.mockResolvedValue({
        salesPersonId: 1,
        status: "draft",
      });
      mockPrismaCustomerFindUnique.mockResolvedValue({
        id: 1,
        customerName: "株式会社テスト",
      });
      mockPrismaVisitCreate.mockResolvedValue({
        id: 1,
        reportId: 1,
        customerId: 1,
        createdAt: new Date("2024-01-15T10:00:00Z"),
      });

      const request = createRequest("1", {
        customer_id: 1,
        visit_time: "10:30",
        visit_purpose: "商談",
        visit_content: "新規提案を行いました",
        visit_result: "次回アポイント取得",
      });
      const response = await POST(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        visit_id: 1,
        report_id: 1,
        customer_id: 1,
        customer_name: "株式会社テスト",
      });
      expect(body.message).toBe("訪問記録を作成しました");
    });

    it("訪問時間がnullでも作成できること", async () => {
      mockPrismaReportFindUnique.mockResolvedValue({
        salesPersonId: 1,
        status: "draft",
      });
      mockPrismaCustomerFindUnique.mockResolvedValue({
        id: 1,
        customerName: "株式会社テスト",
      });
      mockPrismaVisitCreate.mockResolvedValue({
        id: 1,
        reportId: 1,
        customerId: 1,
        createdAt: new Date("2024-01-15T10:00:00Z"),
      });

      const request = createRequest("1", {
        customer_id: 1,
        visit_content: "新規提案を行いました",
      });
      const response = await POST(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
    });
  });

  describe("訪問記録作成 - バリデーションエラー", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(memberSession);
    });

    it("顧客IDが未指定の場合、バリデーションエラーになること", async () => {
      const request = createRequest("1", {
        visit_content: "テスト訪問",
      });
      const response = await POST(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });

    it("訪問内容が未入力の場合、バリデーションエラーになること", async () => {
      const request = createRequest("1", {
        customer_id: 1,
      });
      const response = await POST(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });

    it("訪問内容が1000文字を超える場合、バリデーションエラーになること", async () => {
      const longContent = "あ".repeat(1001);

      const request = createRequest("1", {
        customer_id: 1,
        visit_content: longContent,
      });
      const response = await POST(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });

    it("訪問時間がHH:MM形式でない場合、バリデーションエラーになること", async () => {
      const request = createRequest("1", {
        customer_id: 1,
        visit_content: "テスト訪問",
        visit_time: "25:00", // 不正な時間
      });
      const response = await POST(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });
  });

  describe("訪問記録作成 - 存在チェック", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(memberSession);
    });

    it("存在しない日報に訪問記録を追加しようとした場合、404エラーを返すこと", async () => {
      mockPrismaReportFindUnique.mockResolvedValue(null);

      const request = createRequest("999", {
        customer_id: 1,
        visit_content: "テスト訪問",
      });
      const response = await POST(request, createContext("999"));
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it("存在しない顧客IDを指定した場合、エラーになること", async () => {
      mockPrismaReportFindUnique.mockResolvedValue({
        salesPersonId: 1,
        status: "draft",
      });
      mockPrismaCustomerFindUnique.mockResolvedValue(null);

      const request = createRequest("1", {
        customer_id: 999,
        visit_content: "テスト訪問",
      });
      const response = await POST(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("顧客が存在しません");
    });
  });

  describe("訪問記録作成 - 権限チェック", () => {
    it("他人の日報に訪問記録を追加しようとした場合、403エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(memberSession);
      mockPrismaReportFindUnique.mockResolvedValue({
        salesPersonId: 2, // 別の人の日報
        status: "draft",
      });

      const request = createRequest("1", {
        customer_id: 1,
        visit_content: "テスト訪問",
      });
      const response = await POST(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });

    it("確認済の日報に訪問記録を追加しようとした場合、403エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(memberSession);
      mockPrismaReportFindUnique.mockResolvedValue({
        salesPersonId: 1,
        status: "confirmed", // 確認済
      });

      const request = createRequest("1", {
        customer_id: 1,
        visit_content: "テスト訪問",
      });
      const response = await POST(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain(
        "確認済の日報には訪問記録を追加できません"
      );
    });
  });
});
