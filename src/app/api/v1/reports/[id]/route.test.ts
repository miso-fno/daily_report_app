/**
 * 日報API詳細取得・更新・削除のユニットテスト
 *
 * テスト対象:
 * - GET /api/v1/reports/{id} - 日報詳細取得
 * - PUT /api/v1/reports/{id} - 日報更新
 * - DELETE /api/v1/reports/{id} - 日報削除
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, GET, PUT } from "./route";

import type { NextRequest } from "next/server";

// Prismaモック
const mockPrismaFindUnique = vi.fn();
const mockPrismaFindFirst = vi.fn();
const mockPrismaUpdate = vi.fn();
const mockPrismaDelete = vi.fn();
const mockPrismaTransaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    dailyReport: {
      findUnique: (...args: unknown[]) => mockPrismaFindUnique(...args),
      update: (...args: unknown[]) => mockPrismaUpdate(...args),
      delete: (...args: unknown[]) => mockPrismaDelete(...args),
    },
    salesPerson: {
      findFirst: (...args: unknown[]) => mockPrismaFindFirst(...args),
    },
    customer: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    visitRecord: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: (...args: unknown[]) => mockPrismaTransaction(...args),
  },
}));

// 認証モック
const mockAuth = vi.fn();
vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

// テスト用データ
const mockReportDetailData = {
  id: 1,
  reportDate: new Date("2024-01-15"),
  salesPersonId: 1,
  status: "submitted",
  problem: "課題テスト",
  plan: "予定テスト",
  createdAt: new Date("2024-01-15T10:00:00Z"),
  updatedAt: new Date("2024-01-15T18:00:00Z"),
  salesPerson: { name: "テスト太郎" },
  visitRecords: [
    {
      id: 1,
      customerId: 1,
      visitTime: new Date("1970-01-01T10:30:00Z"),
      visitPurpose: "商談",
      visitContent: "新規提案を行いました",
      visitResult: "次回アポイント取得",
      customer: { customerName: "株式会社テスト" },
    },
  ],
  comments: [
    {
      id: 1,
      salesPersonId: 2,
      commentText: "お疲れ様です",
      createdAt: new Date("2024-01-15T19:00:00Z"),
      salesPerson: { name: "テスト上長" },
    },
  ],
};

describe("Reports API - GET /api/v1/reports/{id}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createRequest = (id: string): NextRequest => {
    return new Request(`http://localhost/api/v1/reports/${id}`, {
      method: "GET",
    }) as unknown as NextRequest;
  };

  const createContext = (id: string) => ({
    params: Promise.resolve({ id }),
  });

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

  describe("日報詳細取得 - 正常系", () => {
    const memberSession = {
      user: {
        id: 1,
        name: "テスト太郎",
        email: "member@example.com",
        isManager: false,
      },
    };

    beforeEach(() => {
      mockAuth.mockResolvedValue(memberSession);
    });

    it("日報詳細が正しく表示されること（UT-RPT-012）", async () => {
      mockPrismaFindUnique.mockResolvedValue(mockReportDetailData);

      const request = createRequest("1");
      const response = await GET(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        report_id: 1,
        report_date: "2024-01-15",
        sales_person_id: 1,
        sales_person_name: "テスト太郎",
        status: "submitted",
        status_label: "提出済",
        problem: "課題テスト",
        plan: "予定テスト",
      });
      expect(body.data.visits).toHaveLength(1);
      expect(body.data.visits[0]).toMatchObject({
        visit_id: 1,
        customer_id: 1,
        customer_name: "株式会社テスト",
        visit_time: "10:30",
        visit_content: "新規提案を行いました",
      });
      expect(body.data.comments).toHaveLength(1);
      expect(body.data.comments[0]).toMatchObject({
        comment_id: 1,
        sales_person_name: "テスト上長",
        comment_text: "お疲れ様です",
      });
    });
  });

  describe("日報詳細取得 - 異常系", () => {
    it("存在しない日報IDの場合、404エラーを返すこと", async () => {
      mockAuth.mockResolvedValue({
        user: { id: 1, isManager: false },
      });
      mockPrismaFindUnique.mockResolvedValue(null);

      const request = createRequest("999");
      const response = await GET(request, createContext("999"));
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
    });

    it("不正なIDフォーマットの場合、422エラーを返すこと", async () => {
      mockAuth.mockResolvedValue({
        user: { id: 1, isManager: false },
      });

      const request = createRequest("abc");
      const response = await GET(request, createContext("abc"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });
  });

  describe("日報詳細取得 - 権限チェック", () => {
    it("他人の日報を閲覧しようとした場合、403エラーを返すこと", async () => {
      mockAuth.mockResolvedValue({
        user: { id: 3, name: "別のユーザー", isManager: false },
      });
      mockPrismaFindUnique.mockResolvedValue({
        ...mockReportDetailData,
        salesPersonId: 1, // 別の人の日報
      });
      mockPrismaFindFirst.mockResolvedValue(null); // 部下ではない

      const request = createRequest("1");
      const response = await GET(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("FORBIDDEN_ACCESS");
    });

    it("上長は部下の日報を閲覧できること", async () => {
      mockAuth.mockResolvedValue({
        user: { id: 2, name: "テスト上長", isManager: true },
      });
      mockPrismaFindUnique.mockResolvedValue(mockReportDetailData);
      mockPrismaFindFirst.mockResolvedValue({ id: 1 }); // 部下である

      const request = createRequest("1");
      const response = await GET(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});

describe("Reports API - PUT /api/v1/reports/{id}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createRequest = (id: string, body: unknown): NextRequest => {
    return new Request(`http://localhost/api/v1/reports/${id}`, {
      method: "PUT",
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
        report_date: "2024-01-15",
        status: "submitted",
      });
      const response = await PUT(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });
  });

  describe("日報編集 - 正常系", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(memberSession);
    });

    it("日報を編集できること（UT-RPT-009）", async () => {
      // 既存の日報（下書き）
      mockPrismaFindUnique.mockResolvedValue({
        id: 1,
        salesPersonId: 1,
        reportDate: new Date("2024-01-15"),
        status: "draft",
      });

      const mockUpdatedReport = {
        id: 1,
        salesPersonId: 1,
        reportDate: new Date("2024-01-15"),
        status: "submitted",
        updatedAt: new Date("2024-01-15T20:00:00Z"),
      };

      mockPrismaTransaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          return callback({
            visitRecord: {
              deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
              createMany: vi.fn().mockResolvedValue({ count: 1 }),
            },
            dailyReport: {
              update: vi.fn().mockResolvedValue(mockUpdatedReport),
            },
          });
        }
      );

      // 顧客が存在することをモック
      vi.mocked(await import("@/lib/prisma")).prisma.customer.findMany = vi
        .fn()
        .mockResolvedValue([{ id: 1 }]);

      const request = createRequest("1", {
        report_date: "2024-01-15",
        problem: "更新された課題",
        plan: "更新された予定",
        status: "submitted",
        visits: [{ customer_id: 1, visit_content: "更新された訪問内容" }],
      });

      const response = await PUT(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe("日報を更新しました");
    });
  });

  describe("日報編集 - 権限チェック", () => {
    it("確認済の日報は編集できないこと（UT-RPT-010）", async () => {
      mockAuth.mockResolvedValue(memberSession);
      mockPrismaFindUnique.mockResolvedValue({
        id: 1,
        salesPersonId: 1,
        reportDate: new Date("2024-01-15"),
        status: "confirmed", // 確認済
      });

      // 有効なリクエストボディを提供（バリデーションを通過させる）
      const request = createRequest("1", {
        report_date: "2024-01-15",
        status: "draft",
        visits: [],
      });

      const response = await PUT(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("確認済の日報は編集できません");
    });

    it("他人の日報を編集しようとした場合、403エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(memberSession);
      mockPrismaFindUnique.mockResolvedValue({
        id: 1,
        salesPersonId: 2, // 別の人の日報
        reportDate: new Date("2024-01-15"),
        status: "draft",
      });

      // 有効なリクエストボディを提供
      const request = createRequest("1", {
        report_date: "2024-01-15",
        status: "draft",
        visits: [],
      });

      const response = await PUT(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });
  });

  describe("日報編集 - 存在チェック", () => {
    it("存在しない日報を編集しようとした場合、404エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(memberSession);
      mockPrismaFindUnique.mockResolvedValue(null);

      // 有効なリクエストボディを提供
      const request = createRequest("999", {
        report_date: "2024-01-15",
        status: "draft",
        visits: [],
      });

      const response = await PUT(request, createContext("999"));
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  describe("日報編集 - 日付変更時の重複チェック", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(memberSession);
    });

    it("日付変更時に同一日の日報が既に存在する場合、エラーになること", async () => {
      // 既存の日報（編集対象）
      mockPrismaFindUnique
        .mockResolvedValueOnce({
          id: 1,
          salesPersonId: 1,
          reportDate: new Date("2024-01-15"),
          status: "draft",
        })
        // 変更先日付に既存の日報がある
        .mockResolvedValueOnce({
          id: 2,
          salesPersonId: 1,
          reportDate: new Date("2024-01-16"),
        });

      const request = createRequest("1", {
        report_date: "2024-01-16", // 別の日付に変更
        status: "draft",
        visits: [],
      });

      const response = await PUT(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("DUPLICATE_ENTRY");
    });
  });
});

describe("Reports API - DELETE /api/v1/reports/{id}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createRequest = (id: string): NextRequest => {
    return new Request(`http://localhost/api/v1/reports/${id}`, {
      method: "DELETE",
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
      const response = await DELETE(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });
  });

  describe("日報削除 - 正常系", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(memberSession);
    });

    it("日報を削除できること（UT-RPT-011）", async () => {
      mockPrismaFindUnique.mockResolvedValue({
        id: 1,
        salesPersonId: 1,
        status: "draft", // 下書きのみ削除可能
      });
      mockPrismaDelete.mockResolvedValue({ id: 1 });

      const request = createRequest("1");
      const response = await DELETE(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe("日報を削除しました");
      expect(body.data.report_id).toBe(1);
    });
  });

  describe("日報削除 - 権限チェック", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(memberSession);
    });

    it("下書き以外の日報は削除できないこと", async () => {
      mockPrismaFindUnique.mockResolvedValue({
        id: 1,
        salesPersonId: 1,
        status: "submitted", // 提出済
      });

      const request = createRequest("1");
      const response = await DELETE(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("下書き以外の日報は削除できません");
    });

    it("他人の日報を削除しようとした場合、403エラーを返すこと", async () => {
      mockPrismaFindUnique.mockResolvedValue({
        id: 1,
        salesPersonId: 2, // 別の人の日報
        status: "draft",
      });

      const request = createRequest("1");
      const response = await DELETE(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });
  });

  describe("日報削除 - 存在チェック", () => {
    it("存在しない日報を削除しようとした場合、404エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(memberSession);
      mockPrismaFindUnique.mockResolvedValue(null);

      const request = createRequest("999");
      const response = await DELETE(request, createContext("999"));
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });
  });
});
