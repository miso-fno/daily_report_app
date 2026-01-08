/**
 * 日報API一覧取得・新規作成のユニットテスト
 *
 * テスト対象:
 * - GET /api/v1/reports - 日報一覧取得
 * - POST /api/v1/reports - 日報新規作成
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "./route";

import type { NextRequest } from "next/server";

// Prismaモック
const mockPrismaFindMany = vi.fn();
const mockPrismaFindUnique = vi.fn();
const mockPrismaCount = vi.fn();
const mockPrismaCreate = vi.fn();
const mockPrismaTransaction = vi.fn();
const mockSalesPersonFindMany = vi.fn();
const mockCustomerFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    dailyReport: {
      findMany: (...args: unknown[]) => mockPrismaFindMany(...args),
      findUnique: (...args: unknown[]) => mockPrismaFindUnique(...args),
      count: (...args: unknown[]) => mockPrismaCount(...args),
      create: (...args: unknown[]) => mockPrismaCreate(...args),
    },
    salesPerson: {
      findMany: (...args: unknown[]) => mockSalesPersonFindMany(...args),
    },
    customer: {
      findMany: (...args: unknown[]) => mockCustomerFindMany(...args),
    },
    visitRecord: {
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

describe("Reports API - GET /api/v1/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createRequest = (params: Record<string, string> = {}): NextRequest => {
    const searchParams = new URLSearchParams(params);
    const url = `http://localhost/api/v1/reports?${searchParams.toString()}`;
    return new Request(url, { method: "GET" }) as unknown as NextRequest;
  };

  const createContext = () => ({
    params: Promise.resolve({}),
  });

  describe("認証チェック", () => {
    it("未認証の場合、401エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(null);

      const request = createRequest();
      const response = await GET(request, createContext());
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("AUTH_UNAUTHORIZED");
    });

    it("セッションにユーザー情報がない場合、401エラーを返すこと", async () => {
      mockAuth.mockResolvedValue({ user: null });

      const request = createRequest();
      const response = await GET(request, createContext());
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });
  });

  describe("一覧取得 - 一般営業担当者", () => {
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

    it("自分の日報一覧を取得できること", async () => {
      const mockReports = [
        {
          id: 1,
          reportDate: new Date("2024-01-15"),
          salesPersonId: 1,
          status: "submitted",
          createdAt: new Date("2024-01-15T10:00:00Z"),
          updatedAt: new Date("2024-01-15T18:00:00Z"),
          salesPerson: { name: "テスト太郎" },
          _count: { visitRecords: 3, comments: 1 },
        },
        {
          id: 2,
          reportDate: new Date("2024-01-14"),
          salesPersonId: 1,
          status: "draft",
          createdAt: new Date("2024-01-14T10:00:00Z"),
          updatedAt: new Date("2024-01-14T12:00:00Z"),
          salesPerson: { name: "テスト太郎" },
          _count: { visitRecords: 0, comments: 0 },
        },
      ];

      mockPrismaCount.mockResolvedValue(2);
      mockPrismaFindMany.mockResolvedValue(mockReports);

      const request = createRequest();
      const response = await GET(request, createContext());
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(2);
      expect(body.data.items[0]).toMatchObject({
        report_id: 1,
        report_date: "2024-01-15",
        sales_person_id: 1,
        sales_person_name: "テスト太郎",
        status: "submitted",
        status_label: "提出済",
        visit_count: 3,
        comment_count: 1,
      });
      expect(body.data.pagination.total).toBe(2);
    });

    it("日報が0件の場合、空配列を返すこと", async () => {
      mockPrismaCount.mockResolvedValue(0);
      mockPrismaFindMany.mockResolvedValue([]);

      const request = createRequest();
      const response = await GET(request, createContext());
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(0);
      expect(body.data.pagination.total).toBe(0);
    });
  });

  describe("検索条件フィルタリング", () => {
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
      mockPrismaCount.mockResolvedValue(0);
      mockPrismaFindMany.mockResolvedValue([]);
    });

    it("期間指定で検索できること（UT-RPT-002）", async () => {
      const request = createRequest({
        date_from: "2024-01-01",
        date_to: "2024-01-31",
      });

      await GET(request, createContext());

      expect(mockPrismaCount).toHaveBeenCalled();
      const countCall = mockPrismaCount.mock.calls[0]![0];
      expect(countCall.where.reportDate).toMatchObject({
        gte: new Date("2024-01-01"),
        lte: new Date("2024-01-31"),
      });
    });

    it("ステータス指定で検索できること（UT-RPT-003）", async () => {
      const request = createRequest({ status: "submitted" });

      await GET(request, createContext());

      expect(mockPrismaCount).toHaveBeenCalled();
      const countCall = mockPrismaCount.mock.calls[0]![0];
      expect(countCall.where.status).toBe("submitted");
    });

    it("ページネーションが正しく動作すること", async () => {
      mockPrismaCount.mockResolvedValue(50);

      const request = createRequest({ page: "2", per_page: "10" });
      const response = await GET(request, createContext());
      const body = await response.json();

      expect(body.data.pagination).toMatchObject({
        current_page: 2,
        per_page: 10,
        total: 50,
        last_page: 5,
      });
    });

    it("ソート条件が正しく適用されること", async () => {
      const request = createRequest({ sort: "created_at", order: "asc" });

      await GET(request, createContext());

      const findManyCall = mockPrismaFindMany.mock.calls[0]![0];
      expect(findManyCall.orderBy.createdAt).toBe("asc");
    });
  });

  describe("一覧取得 - 上長", () => {
    const managerSession = {
      user: {
        id: 2,
        name: "テスト上長",
        email: "manager@example.com",
        isManager: true,
      },
    };

    beforeEach(() => {
      mockAuth.mockResolvedValue(managerSession);
      // 部下IDを取得するためのfindManyモック
      mockSalesPersonFindMany.mockResolvedValue([{ id: 1 }]);
      mockPrismaCount.mockResolvedValue(0);
      mockPrismaFindMany.mockResolvedValue([]);
    });

    it("自分と部下の日報を取得できること", async () => {
      const request = createRequest();

      const response = await GET(request, createContext());
      const body = await response.json();

      // レスポンスが成功することを確認
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});

describe("Reports API - POST /api/v1/reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createRequest = (body: unknown): NextRequest => {
    return new Request("http://localhost/api/v1/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }) as unknown as NextRequest;
  };

  const createContext = () => ({
    params: Promise.resolve({}),
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

      const request = createRequest({
        report_date: "2024-01-15",
        status: "draft",
      });
      const response = await POST(request, createContext());
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });
  });

  describe("日報作成 - 正常系", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(memberSession);
      mockPrismaFindUnique.mockResolvedValue(null); // 同一日の日報なし
    });

    it("日報を新規作成できること（UT-RPT-004）", async () => {
      const mockCreatedReport = {
        id: 1,
        salesPersonId: 1,
        reportDate: new Date("2024-01-15"),
        status: "submitted",
        createdAt: new Date("2024-01-15T10:00:00Z"),
        updatedAt: new Date("2024-01-15T10:00:00Z"),
      };

      // 顧客が存在することをモック
      mockCustomerFindMany.mockResolvedValue([{ id: 1 }]);

      mockPrismaTransaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          return callback({
            dailyReport: {
              create: vi.fn().mockResolvedValue(mockCreatedReport),
            },
            visitRecord: {
              createMany: vi.fn().mockResolvedValue({ count: 1 }),
            },
          });
        }
      );

      const request = createRequest({
        report_date: "2024-01-15",
        problem: "課題テスト",
        plan: "予定テスト",
        status: "submitted",
        visits: [
          {
            customer_id: 1,
            visit_time: "10:30",
            visit_content: "商談を行いました",
          },
        ],
      });

      const response = await POST(request, createContext());
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.report_id).toBe(1);
      expect(body.data.status).toBe("submitted");
      expect(body.message).toBe("日報を作成しました");
    });

    it("日報を下書き保存できること（UT-RPT-005）", async () => {
      const mockCreatedReport = {
        id: 1,
        salesPersonId: 1,
        reportDate: new Date("2024-01-15"),
        status: "draft",
        createdAt: new Date("2024-01-15T10:00:00Z"),
        updatedAt: new Date("2024-01-15T10:00:00Z"),
      };

      mockPrismaTransaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          return callback({
            dailyReport: {
              create: vi.fn().mockResolvedValue(mockCreatedReport),
            },
            visitRecord: {
              createMany: vi.fn(),
            },
          });
        }
      );

      const request = createRequest({
        report_date: "2024-01-15",
        status: "draft",
        visits: [],
      });

      const response = await POST(request, createContext());
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe("draft");
    });
  });

  describe("日報作成 - バリデーションエラー", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(memberSession);
    });

    it("報告日が未入力の場合、バリデーションエラーになること", async () => {
      const request = createRequest({
        status: "draft",
      });

      const response = await POST(request, createContext());
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("報告日が未来日の場合、バリデーションエラーになること", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const futureDateStr = futureDate.toISOString().split("T")[0];

      const request = createRequest({
        report_date: futureDateStr,
        status: "draft",
      });

      const response = await POST(request, createContext());
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining("未来日"),
          }),
        ])
      );
    });

    it("提出時に訪問記録がない場合、バリデーションエラーになること（UT-RPT-006）", async () => {
      const request = createRequest({
        report_date: "2024-01-15",
        status: "submitted",
        visits: [],
      });

      const response = await POST(request, createContext());
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining("訪問記録を1件以上"),
          }),
        ])
      );
    });

    it("課題・相談が2000文字を超える場合、バリデーションエラーになること", async () => {
      const longProblem = "あ".repeat(2001);

      const request = createRequest({
        report_date: "2024-01-15",
        status: "draft",
        problem: longProblem,
      });

      const response = await POST(request, createContext());
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });

    it("明日の予定が2000文字を超える場合、バリデーションエラーになること", async () => {
      const longPlan = "あ".repeat(2001);

      const request = createRequest({
        report_date: "2024-01-15",
        status: "draft",
        plan: longPlan,
      });

      const response = await POST(request, createContext());
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });
  });

  describe("日報作成 - 重複チェック", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(memberSession);
    });

    it("同一日の日報が既に存在する場合、エラーになること", async () => {
      mockPrismaFindUnique.mockResolvedValue({
        id: 1,
        salesPersonId: 1,
        reportDate: new Date("2024-01-15"),
      });

      const request = createRequest({
        report_date: "2024-01-15",
        status: "draft",
      });

      const response = await POST(request, createContext());
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("DUPLICATE_ENTRY");
    });
  });

  describe("日報作成 - 訪問記録", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(memberSession);
      mockPrismaFindUnique.mockResolvedValue(null);
    });

    it("訪問記録を複数追加できること（UT-RPT-007）", async () => {
      const mockCreatedReport = {
        id: 1,
        salesPersonId: 1,
        reportDate: new Date("2024-01-15"),
        status: "submitted",
        createdAt: new Date("2024-01-15T10:00:00Z"),
        updatedAt: new Date("2024-01-15T10:00:00Z"),
      };

      // 顧客が存在することをモック
      mockCustomerFindMany.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);

      let visitRecordsData: unknown[] = [];
      mockPrismaTransaction.mockImplementation(
        async (callback: (tx: unknown) => Promise<unknown>) => {
          return callback({
            dailyReport: {
              create: vi.fn().mockResolvedValue(mockCreatedReport),
            },
            visitRecord: {
              createMany: vi.fn().mockImplementation(({ data }) => {
                visitRecordsData = data;
                return { count: data.length };
              }),
            },
          });
        }
      );

      const request = createRequest({
        report_date: "2024-01-15",
        status: "submitted",
        visits: [
          { customer_id: 1, visit_content: "訪問1" },
          { customer_id: 2, visit_content: "訪問2" },
          { customer_id: 3, visit_content: "訪問3" },
        ],
      });

      const response = await POST(request, createContext());
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(visitRecordsData).toHaveLength(3);
    });

    it("訪問記録の訪問内容が必須であること", async () => {
      const request = createRequest({
        report_date: "2024-01-15",
        status: "draft",
        visits: [
          { customer_id: 1 }, // visit_contentがない
        ],
      });

      const response = await POST(request, createContext());
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });

    it("訪問記録の訪問内容が1000文字を超える場合、バリデーションエラーになること", async () => {
      const longContent = "あ".repeat(1001);

      const request = createRequest({
        report_date: "2024-01-15",
        status: "draft",
        visits: [{ customer_id: 1, visit_content: longContent }],
      });

      const response = await POST(request, createContext());
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });

    it("訪問時間がHH:MM形式でない場合、バリデーションエラーになること", async () => {
      const request = createRequest({
        report_date: "2024-01-15",
        status: "draft",
        visits: [
          { customer_id: 1, visit_content: "テスト", visit_time: "25:00" },
        ],
      });

      const response = await POST(request, createContext());
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });
  });

  describe("日報作成 - 顧客存在チェック", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(memberSession);
      mockPrismaFindUnique.mockResolvedValue(null);
    });

    it("存在しない顧客IDを指定した場合、エラーになること", async () => {
      // 顧客が存在しないことをモック
      mockCustomerFindMany.mockResolvedValue([]);

      const request = createRequest({
        report_date: "2024-01-15",
        status: "submitted",
        visits: [{ customer_id: 999, visit_content: "存在しない顧客" }],
      });

      const response = await POST(request, createContext());
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("顧客が存在しません");
    });
  });
});
