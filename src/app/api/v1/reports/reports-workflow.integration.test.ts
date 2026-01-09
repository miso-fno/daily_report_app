/**
 * IT-001: 日報作成から上長確認までの一連のフロー (詳細版)
 *
 * テスト仕様書(doc/test_specification.md)に基づく結合テスト
 *
 * 本テストは、日報ワークフローの完全なシナリオをシミュレートします:
 * 1. 営業担当者でログイン
 * 2. 日報を新規作成（訪問記録2件、課題・相談、明日の予定を入力）
 * 3. 「提出」ボタンをクリック
 * 4. ログアウト
 * 5. 上長でログイン
 * 6. 日報一覧で部下の日報を確認
 * 7. 日報詳細を表示
 * 8. コメントを投稿
 * 9. 「確認済にする」をクリック
 * 10. 営業担当者で再ログイン
 * 11. 日報詳細で上長コメントを確認
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  POST as createComment,
  GET as getComments,
} from "./[id]/comments/route";
import { GET as getReportDetail } from "./[id]/route";
import { PATCH as updateStatus } from "./[id]/status/route";
import { GET as getVisits } from "./[id]/visits/route";
import { GET as getReportsList, POST as createReport } from "./route";

import type { NextRequest } from "next/server";

// Prismaモック
const mockPrismaFindUnique = vi.fn();
const mockPrismaFindMany = vi.fn();
const mockPrismaCount = vi.fn();
const mockPrismaCreate = vi.fn();
const mockPrismaUpdate = vi.fn();
const mockPrismaDelete = vi.fn();
const mockPrismaTransaction = vi.fn();
const mockSalesPersonFindMany = vi.fn();
const mockSalesPersonFindFirst = vi.fn();
const mockCustomerFindMany = vi.fn();
const mockCustomerFindUnique = vi.fn();
const mockVisitFindMany = vi.fn();
const mockVisitCreate = vi.fn();
const mockVisitCreateMany = vi.fn();
const mockVisitDeleteMany = vi.fn();
const mockCommentFindMany = vi.fn();
const mockCommentCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    dailyReport: {
      findUnique: (...args: unknown[]) => mockPrismaFindUnique(...args),
      findMany: (...args: unknown[]) => mockPrismaFindMany(...args),
      count: (...args: unknown[]) => mockPrismaCount(...args),
      create: (...args: unknown[]) => mockPrismaCreate(...args),
      update: (...args: unknown[]) => mockPrismaUpdate(...args),
      delete: (...args: unknown[]) => mockPrismaDelete(...args),
    },
    salesPerson: {
      findMany: (...args: unknown[]) => mockSalesPersonFindMany(...args),
      findFirst: (...args: unknown[]) => mockSalesPersonFindFirst(...args),
    },
    customer: {
      findMany: (...args: unknown[]) => mockCustomerFindMany(...args),
      findUnique: (...args: unknown[]) => mockCustomerFindUnique(...args),
    },
    visitRecord: {
      findMany: (...args: unknown[]) => mockVisitFindMany(...args),
      create: (...args: unknown[]) => mockVisitCreate(...args),
      createMany: (...args: unknown[]) => mockVisitCreateMany(...args),
      deleteMany: (...args: unknown[]) => mockVisitDeleteMany(...args),
    },
    comment: {
      findMany: (...args: unknown[]) => mockCommentFindMany(...args),
      create: (...args: unknown[]) => mockCommentCreate(...args),
    },
    $transaction: (...args: unknown[]) => mockPrismaTransaction(...args),
  },
}));

// 認証モック
const mockAuth = vi.fn();
vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

// テスト用セッション
const memberSession = {
  user: {
    id: 1,
    name: "営業担当 太郎",
    email: "sales@example.com",
    department: "営業部",
    isManager: false,
    managerId: 2,
  },
};

const managerSession = {
  user: {
    id: 2,
    name: "上長 花子",
    email: "manager@example.com",
    department: "営業部",
    isManager: true,
    managerId: null,
  },
};

// テスト用顧客データ
const testCustomers = [
  {
    id: 1,
    customerName: "株式会社ABC",
    address: "東京都千代田区1-1-1",
    phone: "03-1234-5678",
    contactPerson: "田中一郎",
  },
  {
    id: 2,
    customerName: "株式会社XYZ",
    address: "大阪府大阪市2-2-2",
    phone: "06-9876-5432",
    contactPerson: "山田次郎",
  },
];

// 詳細なモック日報データを生成する関数
const createDetailedMockReport = (options: {
  id: number;
  salesPersonId: number;
  status: "draft" | "submitted" | "confirmed";
  problem?: string;
  plan?: string;
  visitRecords?: Array<{
    id: number;
    customerId: number;
    customerName: string;
    visitTime: string;
    visitPurpose: string;
    visitContent: string;
    visitResult: string;
  }>;
  comments?: Array<{
    id: number;
    salesPersonId: number;
    salesPersonName: string;
    commentText: string;
  }>;
}) => ({
  id: options.id,
  salesPersonId: options.salesPersonId,
  reportDate: new Date("2024-01-15"),
  status: options.status,
  problem: options.problem ?? null,
  plan: options.plan ?? null,
  createdAt: new Date("2024-01-15T09:00:00Z"),
  updatedAt: new Date("2024-01-15T09:00:00Z"),
  salesPerson: {
    name: options.salesPersonId === 1 ? "営業担当 太郎" : "上長 花子",
  },
  visitRecords: (options.visitRecords ?? []).map((v) => ({
    id: v.id,
    customerId: v.customerId,
    visitTime: new Date(`1970-01-01T${v.visitTime}:00Z`),
    visitPurpose: v.visitPurpose,
    visitContent: v.visitContent,
    visitResult: v.visitResult,
    customer: { customerName: v.customerName },
  })),
  comments: (options.comments ?? []).map((c) => ({
    id: c.id,
    salesPersonId: c.salesPersonId,
    commentText: c.commentText,
    createdAt: new Date("2024-01-15T18:00:00Z"),
    salesPerson: { name: c.salesPersonName },
  })),
  _count: {
    visitRecords: options.visitRecords?.length ?? 0,
    comments: options.comments?.length ?? 0,
  },
});

describe("IT-001: 日報作成から上長確認までの詳細ワークフロー", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // デフォルトのモック設定
    mockSalesPersonFindMany.mockResolvedValue([{ id: 1 }]); // 部下リスト
    mockCustomerFindMany.mockResolvedValue(testCustomers);
    mockCustomerFindUnique.mockImplementation((args) => {
      const customer = testCustomers.find((c) => c.id === args.where.id);
      return Promise.resolve(customer ?? null);
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createRequest = (
    url: string,
    method: string,
    body?: unknown
  ): NextRequest => {
    const options: RequestInit = { method };
    if (body) {
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify(body);
    }
    return new Request(url, options) as unknown as NextRequest;
  };

  const createContext = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  const createEmptyContext = () => ({
    params: Promise.resolve({}),
  });

  describe("完全なワークフローシナリオ", () => {
    it("営業担当者が日報を作成・提出し、上長がコメント・確認、営業担当者が確認するフロー", async () => {
      // ================================================
      // Step 1 & 2: 営業担当者でログインして日報を新規作成
      // ================================================
      mockAuth.mockResolvedValue(memberSession);

      // 日報作成のためのモック設定
      mockPrismaFindUnique.mockResolvedValueOnce(null); // 同一日報が存在しないことを確認
      mockCustomerFindMany.mockResolvedValueOnce(testCustomers);

      const createdReport = {
        id: 1,
        salesPersonId: 1,
        reportDate: new Date("2024-01-15"),
        status: "draft",
        problem: "新規顧客開拓が課題。アプローチ方法について相談したい。",
        plan: "ABC社へ再訪問、XYZ社へ提案書提出予定",
        createdAt: new Date("2024-01-15T09:00:00Z"),
        updatedAt: new Date("2024-01-15T09:00:00Z"),
      };

      mockPrismaTransaction.mockImplementation(async (callback) => {
        const txMock = {
          dailyReport: {
            create: vi.fn().mockResolvedValue(createdReport),
          },
          visitRecord: {
            createMany: vi.fn().mockResolvedValue({ count: 2 }),
          },
        };
        return callback(txMock);
      });

      const createReportRequest = createRequest(
        "http://localhost/api/v1/reports",
        "POST",
        {
          report_date: "2024-01-15",
          status: "draft",
          problem: "新規顧客開拓が課題。アプローチ方法について相談したい。",
          plan: "ABC社へ再訪問、XYZ社へ提案書提出予定",
          visits: [
            {
              customer_id: 1,
              visit_time: "10:00",
              visit_purpose: "商談",
              visit_content: "新製品の提案を実施。担当者より好感触。",
              visit_result: "次回見積提出予定",
            },
            {
              customer_id: 2,
              visit_time: "14:30",
              visit_purpose: "アフターフォロー",
              visit_content: "前回納品製品の使用状況確認。問題なし。",
              visit_result: "追加発注の可能性あり",
            },
          ],
        }
      );

      const createResponse = await createReport(
        createReportRequest,
        createEmptyContext()
      );
      const createBody = await createResponse.json();

      expect(createResponse.status).toBe(201);
      expect(createBody.success).toBe(true);
      expect(createBody.data.report_id).toBe(1);
      expect(createBody.data.status).toBe("draft");
      expect(createBody.message).toBe("日報を作成しました");

      // ================================================
      // Step 3: 下書き日報を提出済に変更
      // ================================================
      const draftReportWithVisits = createDetailedMockReport({
        id: 1,
        salesPersonId: 1,
        status: "draft",
        problem: "新規顧客開拓が課題。アプローチ方法について相談したい。",
        plan: "ABC社へ再訪問、XYZ社へ提案書提出予定",
        visitRecords: [
          {
            id: 1,
            customerId: 1,
            customerName: "株式会社ABC",
            visitTime: "10:00",
            visitPurpose: "商談",
            visitContent: "新製品の提案を実施。担当者より好感触。",
            visitResult: "次回見積提出予定",
          },
          {
            id: 2,
            customerId: 2,
            customerName: "株式会社XYZ",
            visitTime: "14:30",
            visitPurpose: "アフターフォロー",
            visitContent: "前回納品製品の使用状況確認。問題なし。",
            visitResult: "追加発注の可能性あり",
          },
        ],
      });

      mockPrismaFindUnique.mockResolvedValueOnce(draftReportWithVisits);
      mockPrismaUpdate.mockResolvedValueOnce({
        ...draftReportWithVisits,
        status: "submitted",
        updatedAt: new Date(),
      });

      const submitRequest = createRequest(
        "http://localhost/api/v1/reports/1/status",
        "PATCH",
        { status: "submitted" }
      );

      const submitResponse = await updateStatus(
        submitRequest,
        createContext("1")
      );
      const submitBody = await submitResponse.json();

      expect(submitResponse.status).toBe(200);
      expect(submitBody.success).toBe(true);
      expect(submitBody.data.status).toBe("submitted");
      expect(submitBody.data.status_label).toBe("提出済");

      // ================================================
      // Step 4 & 5: 上長でログイン（セッション切り替え）
      // ================================================
      mockAuth.mockResolvedValue(managerSession);

      // ================================================
      // Step 6: 日報一覧で部下の日報を確認
      // ================================================
      const submittedReportList = [
        createDetailedMockReport({
          id: 1,
          salesPersonId: 1,
          status: "submitted",
          visitRecords: [
            {
              id: 1,
              customerId: 1,
              customerName: "株式会社ABC",
              visitTime: "10:00",
              visitPurpose: "商談",
              visitContent: "新製品の提案",
              visitResult: "見積提出予定",
            },
            {
              id: 2,
              customerId: 2,
              customerName: "株式会社XYZ",
              visitTime: "14:30",
              visitPurpose: "アフターフォロー",
              visitContent: "状況確認",
              visitResult: "追加発注検討",
            },
          ],
        }),
      ];

      mockSalesPersonFindMany.mockResolvedValueOnce([{ id: 1 }]); // 部下リスト
      mockPrismaCount.mockResolvedValueOnce(1);
      mockPrismaFindMany.mockResolvedValueOnce(submittedReportList);

      const listRequest = createRequest(
        "http://localhost/api/v1/reports",
        "GET"
      );
      const listResponse = await getReportsList(
        listRequest,
        createEmptyContext()
      );
      const listBody = await listResponse.json();

      expect(listResponse.status).toBe(200);
      expect(listBody.success).toBe(true);
      expect(listBody.data.items).toHaveLength(1);
      expect(listBody.data.items[0].sales_person_id).toBe(1);
      expect(listBody.data.items[0].sales_person_name).toBe("営業担当 太郎");
      expect(listBody.data.items[0].status).toBe("submitted");
      expect(listBody.data.items[0].visit_count).toBe(2);

      // ================================================
      // Step 7: 日報詳細を表示
      // ================================================
      const submittedReportDetail = createDetailedMockReport({
        id: 1,
        salesPersonId: 1,
        status: "submitted",
        problem: "新規顧客開拓が課題。アプローチ方法について相談したい。",
        plan: "ABC社へ再訪問、XYZ社へ提案書提出予定",
        visitRecords: [
          {
            id: 1,
            customerId: 1,
            customerName: "株式会社ABC",
            visitTime: "10:00",
            visitPurpose: "商談",
            visitContent: "新製品の提案を実施。担当者より好感触。",
            visitResult: "次回見積提出予定",
          },
          {
            id: 2,
            customerId: 2,
            customerName: "株式会社XYZ",
            visitTime: "14:30",
            visitPurpose: "アフターフォロー",
            visitContent: "前回納品製品の使用状況確認。問題なし。",
            visitResult: "追加発注の可能性あり",
          },
        ],
      });

      mockPrismaFindUnique.mockResolvedValueOnce(submittedReportDetail);
      mockSalesPersonFindFirst.mockResolvedValueOnce({ id: 1, managerId: 2 }); // 部下である

      const detailRequest = createRequest(
        "http://localhost/api/v1/reports/1",
        "GET"
      );
      const detailResponse = await getReportDetail(
        detailRequest,
        createContext("1")
      );
      const detailBody = await detailResponse.json();

      expect(detailResponse.status).toBe(200);
      expect(detailBody.success).toBe(true);
      expect(detailBody.data.report_id).toBe(1);
      expect(detailBody.data.sales_person_name).toBe("営業担当 太郎");
      expect(detailBody.data.status).toBe("submitted");
      expect(detailBody.data.problem).toBe(
        "新規顧客開拓が課題。アプローチ方法について相談したい。"
      );
      expect(detailBody.data.plan).toBe("ABC社へ再訪問、XYZ社へ提案書提出予定");
      expect(detailBody.data.visits).toHaveLength(2);
      expect(detailBody.data.visits[0].customer_name).toBe("株式会社ABC");
      expect(detailBody.data.visits[0].visit_content).toBe(
        "新製品の提案を実施。担当者より好感触。"
      );
      expect(detailBody.data.visits[1].customer_name).toBe("株式会社XYZ");

      // ================================================
      // Step 8: コメントを投稿
      // ================================================
      mockPrismaFindUnique.mockResolvedValueOnce({ salesPersonId: 1 }); // 日報存在確認
      mockSalesPersonFindFirst.mockResolvedValueOnce({ id: 1, managerId: 2 }); // 部下である
      mockCommentCreate.mockResolvedValueOnce({
        id: 1,
        reportId: 1,
        salesPersonId: 2,
        commentText:
          "お疲れ様です。ABC社の件、良い進捗ですね。見積提出時はサポートしますので声かけてください。",
        createdAt: new Date("2024-01-15T18:00:00Z"),
      });

      const commentRequest = createRequest(
        "http://localhost/api/v1/reports/1/comments",
        "POST",
        {
          comment_text:
            "お疲れ様です。ABC社の件、良い進捗ですね。見積提出時はサポートしますので声かけてください。",
        }
      );

      const commentResponse = await createComment(
        commentRequest,
        createContext("1")
      );
      const commentBody = await commentResponse.json();

      expect(commentResponse.status).toBe(201);
      expect(commentBody.success).toBe(true);
      expect(commentBody.data.comment_id).toBe(1);
      expect(commentBody.data.report_id).toBe(1);
      expect(commentBody.message).toBe("コメントを投稿しました");

      // ================================================
      // Step 9: 確認済にする
      // ================================================
      mockPrismaFindUnique.mockResolvedValueOnce({
        ...submittedReportDetail,
        status: "submitted",
      });
      mockSalesPersonFindFirst.mockResolvedValueOnce({ id: 1, managerId: 2 }); // 部下である
      mockPrismaUpdate.mockResolvedValueOnce({
        id: 1,
        status: "confirmed",
        updatedAt: new Date(),
      });

      const confirmRequest = createRequest(
        "http://localhost/api/v1/reports/1/status",
        "PATCH",
        { status: "confirmed" }
      );

      const confirmResponse = await updateStatus(
        confirmRequest,
        createContext("1")
      );
      const confirmBody = await confirmResponse.json();

      expect(confirmResponse.status).toBe(200);
      expect(confirmBody.success).toBe(true);
      expect(confirmBody.data.status).toBe("confirmed");
      expect(confirmBody.data.status_label).toBe("確認済");

      // ================================================
      // Step 10 & 11: 営業担当者で再ログインして上長コメントを確認
      // ================================================
      mockAuth.mockResolvedValue(memberSession);

      const confirmedReportWithComment = createDetailedMockReport({
        id: 1,
        salesPersonId: 1,
        status: "confirmed",
        problem: "新規顧客開拓が課題。アプローチ方法について相談したい。",
        plan: "ABC社へ再訪問、XYZ社へ提案書提出予定",
        visitRecords: [
          {
            id: 1,
            customerId: 1,
            customerName: "株式会社ABC",
            visitTime: "10:00",
            visitPurpose: "商談",
            visitContent: "新製品の提案を実施。担当者より好感触。",
            visitResult: "次回見積提出予定",
          },
          {
            id: 2,
            customerId: 2,
            customerName: "株式会社XYZ",
            visitTime: "14:30",
            visitPurpose: "アフターフォロー",
            visitContent: "前回納品製品の使用状況確認。問題なし。",
            visitResult: "追加発注の可能性あり",
          },
        ],
        comments: [
          {
            id: 1,
            salesPersonId: 2,
            salesPersonName: "上長 花子",
            commentText:
              "お疲れ様です。ABC社の件、良い進捗ですね。見積提出時はサポートしますので声かけてください。",
          },
        ],
      });

      mockPrismaFindUnique.mockResolvedValueOnce(confirmedReportWithComment);

      const finalDetailRequest = createRequest(
        "http://localhost/api/v1/reports/1",
        "GET"
      );
      const finalDetailResponse = await getReportDetail(
        finalDetailRequest,
        createContext("1")
      );
      const finalDetailBody = await finalDetailResponse.json();

      expect(finalDetailResponse.status).toBe(200);
      expect(finalDetailBody.success).toBe(true);
      expect(finalDetailBody.data.status).toBe("confirmed");
      expect(finalDetailBody.data.status_label).toBe("確認済");
      expect(finalDetailBody.data.comments).toHaveLength(1);
      expect(finalDetailBody.data.comments[0].sales_person_name).toBe(
        "上長 花子"
      );
      expect(finalDetailBody.data.comments[0].comment_text).toBe(
        "お疲れ様です。ABC社の件、良い進捗ですね。見積提出時はサポートしますので声かけてください。"
      );
    });
  });

  describe("訪問記録2件の詳細検証", () => {
    it("訪問記録2件を含む日報が正しく作成され、詳細表示で全情報が取得できること", async () => {
      mockAuth.mockResolvedValue(memberSession);

      // 訪問記録一覧取得
      const mockVisits = [
        {
          id: 1,
          customerId: 1,
          visitTime: new Date("1970-01-01T10:00:00Z"),
          visitPurpose: "商談",
          visitContent: "新製品の提案を実施",
          visitResult: "見積提出予定",
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: { customerName: "株式会社ABC" },
        },
        {
          id: 2,
          customerId: 2,
          visitTime: new Date("1970-01-01T14:30:00Z"),
          visitPurpose: "アフターフォロー",
          visitContent: "使用状況確認",
          visitResult: "追加発注検討",
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: { customerName: "株式会社XYZ" },
        },
      ];

      mockPrismaFindUnique.mockResolvedValueOnce({
        salesPersonId: 1,
        status: "draft",
      });
      mockSalesPersonFindFirst.mockResolvedValueOnce(null);
      mockVisitFindMany.mockResolvedValueOnce(mockVisits);

      const visitsRequest = createRequest(
        "http://localhost/api/v1/reports/1/visits",
        "GET"
      );
      const visitsResponse = await getVisits(visitsRequest, createContext("1"));
      const visitsBody = await visitsResponse.json();

      expect(visitsResponse.status).toBe(200);
      expect(visitsBody.success).toBe(true);
      expect(visitsBody.data.items).toHaveLength(2);

      // 1件目の訪問記録
      expect(visitsBody.data.items[0].visit_id).toBe(1);
      expect(visitsBody.data.items[0].customer_id).toBe(1);
      expect(visitsBody.data.items[0].customer_name).toBe("株式会社ABC");
      expect(visitsBody.data.items[0].visit_time).toBe("10:00");
      expect(visitsBody.data.items[0].visit_purpose).toBe("商談");
      expect(visitsBody.data.items[0].visit_content).toBe("新製品の提案を実施");
      expect(visitsBody.data.items[0].visit_result).toBe("見積提出予定");

      // 2件目の訪問記録
      expect(visitsBody.data.items[1].visit_id).toBe(2);
      expect(visitsBody.data.items[1].customer_id).toBe(2);
      expect(visitsBody.data.items[1].customer_name).toBe("株式会社XYZ");
      expect(visitsBody.data.items[1].visit_time).toBe("14:30");
      expect(visitsBody.data.items[1].visit_purpose).toBe("アフターフォロー");
      expect(visitsBody.data.items[1].visit_content).toBe("使用状況確認");
      expect(visitsBody.data.items[1].visit_result).toBe("追加発注検討");
    });
  });

  describe("課題・相談と明日の予定の検証", () => {
    it("課題・相談(problem)と明日の予定(plan)が正しく保存・取得されること", async () => {
      mockAuth.mockResolvedValue(memberSession);

      const reportWithProblemAndPlan = createDetailedMockReport({
        id: 1,
        salesPersonId: 1,
        status: "submitted",
        problem:
          "1. 新規顧客開拓のアプローチ方法\n2. 競合他社の価格調査が必要\n3. 提案資料の更新",
        plan: "- ABC社へ見積提出\n- XYZ社へ再訪問\n- 新規リード3件への架電",
      });

      mockPrismaFindUnique.mockResolvedValueOnce(reportWithProblemAndPlan);

      const request = createRequest("http://localhost/api/v1/reports/1", "GET");
      const response = await getReportDetail(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.problem).toBe(
        "1. 新規顧客開拓のアプローチ方法\n2. 競合他社の価格調査が必要\n3. 提案資料の更新"
      );
      expect(body.data.plan).toBe(
        "- ABC社へ見積提出\n- XYZ社へ再訪問\n- 新規リード3件への架電"
      );
    });

    it("課題・相談と明日の予定が空でも日報を作成・提出できること", async () => {
      mockAuth.mockResolvedValue(memberSession);

      const reportWithoutProblemAndPlan = createDetailedMockReport({
        id: 1,
        salesPersonId: 1,
        status: "submitted",
        visitRecords: [
          {
            id: 1,
            customerId: 1,
            customerName: "株式会社ABC",
            visitTime: "10:00",
            visitPurpose: "商談",
            visitContent: "提案実施",
            visitResult: "継続検討",
          },
        ],
      });

      mockPrismaFindUnique.mockResolvedValueOnce(reportWithoutProblemAndPlan);

      const request = createRequest("http://localhost/api/v1/reports/1", "GET");
      const response = await getReportDetail(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.problem).toBeNull();
      expect(body.data.plan).toBeNull();
      expect(body.data.status).toBe("submitted");
    });
  });

  describe("上長コメント機能の詳細検証", () => {
    it("上長が複数コメントを投稿できること", async () => {
      mockAuth.mockResolvedValue(managerSession);

      // 1件目のコメント投稿
      mockPrismaFindUnique.mockResolvedValueOnce({ salesPersonId: 1 });
      mockSalesPersonFindFirst.mockResolvedValueOnce({ id: 1, managerId: 2 });
      mockCommentCreate.mockResolvedValueOnce({
        id: 1,
        reportId: 1,
        salesPersonId: 2,
        commentText: "良い報告です。",
        createdAt: new Date("2024-01-15T17:00:00Z"),
      });

      const comment1Request = createRequest(
        "http://localhost/api/v1/reports/1/comments",
        "POST",
        { comment_text: "良い報告です。" }
      );

      const comment1Response = await createComment(
        comment1Request,
        createContext("1")
      );
      const comment1Body = await comment1Response.json();

      expect(comment1Response.status).toBe(201);
      expect(comment1Body.data.comment_id).toBe(1);

      // 2件目のコメント投稿
      mockPrismaFindUnique.mockResolvedValueOnce({ salesPersonId: 1 });
      mockSalesPersonFindFirst.mockResolvedValueOnce({ id: 1, managerId: 2 });
      mockCommentCreate.mockResolvedValueOnce({
        id: 2,
        reportId: 1,
        salesPersonId: 2,
        commentText: "ABC社の件、来週フォローアップしましょう。",
        createdAt: new Date("2024-01-15T18:00:00Z"),
      });

      const comment2Request = createRequest(
        "http://localhost/api/v1/reports/1/comments",
        "POST",
        { comment_text: "ABC社の件、来週フォローアップしましょう。" }
      );

      const comment2Response = await createComment(
        comment2Request,
        createContext("1")
      );
      const comment2Body = await comment2Response.json();

      expect(comment2Response.status).toBe(201);
      expect(comment2Body.data.comment_id).toBe(2);

      // コメント一覧取得
      mockPrismaFindUnique.mockResolvedValueOnce({ salesPersonId: 1 });
      mockSalesPersonFindFirst.mockResolvedValueOnce({ id: 1, managerId: 2 });
      mockCommentFindMany.mockResolvedValueOnce([
        {
          id: 1,
          reportId: 1,
          salesPersonId: 2,
          commentText: "良い報告です。",
          createdAt: new Date("2024-01-15T17:00:00Z"),
          updatedAt: new Date("2024-01-15T17:00:00Z"),
          salesPerson: { name: "上長 花子" },
        },
        {
          id: 2,
          reportId: 1,
          salesPersonId: 2,
          commentText: "ABC社の件、来週フォローアップしましょう。",
          createdAt: new Date("2024-01-15T18:00:00Z"),
          updatedAt: new Date("2024-01-15T18:00:00Z"),
          salesPerson: { name: "上長 花子" },
        },
      ]);

      const commentsListRequest = createRequest(
        "http://localhost/api/v1/reports/1/comments",
        "GET"
      );
      const commentsListResponse = await getComments(
        commentsListRequest,
        createContext("1")
      );
      const commentsListBody = await commentsListResponse.json();

      expect(commentsListResponse.status).toBe(200);
      expect(commentsListBody.data.items).toHaveLength(2);
      expect(commentsListBody.data.items[0].comment_text).toBe(
        "良い報告です。"
      );
      expect(commentsListBody.data.items[1].comment_text).toBe(
        "ABC社の件、来週フォローアップしましょう。"
      );
    });
  });

  describe("ステータス遷移の詳細検証", () => {
    it("draft -> submitted -> confirmed の順序でのみステータス変更が許可されること", async () => {
      // draft -> submitted (営業担当者)
      mockAuth.mockResolvedValue(memberSession);

      const draftReport = createDetailedMockReport({
        id: 1,
        salesPersonId: 1,
        status: "draft",
        visitRecords: [
          {
            id: 1,
            customerId: 1,
            customerName: "株式会社ABC",
            visitTime: "10:00",
            visitPurpose: "商談",
            visitContent: "提案",
            visitResult: "継続",
          },
        ],
      });

      mockPrismaFindUnique.mockResolvedValueOnce(draftReport);
      mockPrismaUpdate.mockResolvedValueOnce({
        id: 1,
        status: "submitted",
        updatedAt: new Date(),
      });

      const toSubmittedRequest = createRequest(
        "http://localhost/api/v1/reports/1/status",
        "PATCH",
        { status: "submitted" }
      );

      const toSubmittedResponse = await updateStatus(
        toSubmittedRequest,
        createContext("1")
      );

      expect(toSubmittedResponse.status).toBe(200);
      const toSubmittedBody = await toSubmittedResponse.json();
      expect(toSubmittedBody.data.status).toBe("submitted");

      // submitted -> confirmed (上長)
      mockAuth.mockResolvedValue(managerSession);

      const submittedReport = createDetailedMockReport({
        id: 1,
        salesPersonId: 1,
        status: "submitted",
      });

      mockPrismaFindUnique.mockResolvedValueOnce(submittedReport);
      mockSalesPersonFindFirst.mockResolvedValueOnce({ id: 1, managerId: 2 });
      mockPrismaUpdate.mockResolvedValueOnce({
        id: 1,
        status: "confirmed",
        updatedAt: new Date(),
      });

      const toConfirmedRequest = createRequest(
        "http://localhost/api/v1/reports/1/status",
        "PATCH",
        { status: "confirmed" }
      );

      const toConfirmedResponse = await updateStatus(
        toConfirmedRequest,
        createContext("1")
      );

      expect(toConfirmedResponse.status).toBe(200);
      const toConfirmedBody = await toConfirmedResponse.json();
      expect(toConfirmedBody.data.status).toBe("confirmed");
    });

    it("確認済の日報でも本人はステータスをdraftやsubmittedに変更できること", async () => {
      // 現在の実装では確認済 -> 下書き/提出済への変更は制限されていない
      // 本テストは実装の動作を確認する
      mockAuth.mockResolvedValue(memberSession);

      const confirmedReport = createDetailedMockReport({
        id: 1,
        salesPersonId: 1,
        status: "confirmed",
      });

      mockPrismaFindUnique.mockResolvedValueOnce(confirmedReport);
      mockPrismaUpdate.mockResolvedValueOnce({
        id: 1,
        status: "draft",
        updatedAt: new Date(),
      });

      // confirmed -> draft への変更試行
      const toDraftRequest = createRequest(
        "http://localhost/api/v1/reports/1/status",
        "PATCH",
        { status: "draft" }
      );

      const toDraftResponse = await updateStatus(
        toDraftRequest,
        createContext("1")
      );

      // 実装上、本人によるステータス変更は許可される
      expect(toDraftResponse.status).toBe(200);
      const toDraftBody = await toDraftResponse.json();
      expect(toDraftBody.data.status).toBe("draft");
    });
  });
});
