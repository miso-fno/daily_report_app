/**
 * 日報機能 結合テスト
 *
 * IT-001: 日報作成から上長確認までの一連のフロー
 *
 * テスト仕様書(doc/test_specification.md)に基づく結合テスト
 *
 * 本テストは、日報ワークフローの各ステップをシミュレートし、
 * ステータス遷移と権限チェックが正しく機能することを検証します。
 *
 * ワークフローの流れ:
 * 1. 営業担当者が日報を作成して提出
 * 2. 上長が日報を確認してコメントを投稿
 * 3. 上長が日報を確認済ステータスに変更
 * 4. 営業担当者が上長コメントを確認
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST as createComment } from "./[id]/comments/route";
import {
  DELETE as deleteReport,
  GET as getReportDetail,
  PUT as updateReport,
} from "./[id]/route";
import { PATCH as updateStatus } from "./[id]/status/route";
import { POST as createVisit } from "./[id]/visits/route";
import { GET as getReportsList } from "./route";

import type { NextRequest } from "next/server";

// Prismaモック
const mockPrismaFindUnique = vi.fn();
const mockPrismaFindMany = vi.fn();
const mockPrismaCount = vi.fn();
const mockPrismaUpdate = vi.fn();
const mockPrismaDelete = vi.fn();
const mockPrismaTransaction = vi.fn();
const mockSalesPersonFindMany = vi.fn();
const mockSalesPersonFindFirst = vi.fn();
const mockCustomerFindMany = vi.fn();
const mockCustomerFindUnique = vi.fn();
const mockVisitFindMany = vi.fn();
const mockVisitCreate = vi.fn();
const mockCommentFindMany = vi.fn();
const mockCommentCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    dailyReport: {
      findUnique: (...args: unknown[]) => mockPrismaFindUnique(...args),
      findMany: (...args: unknown[]) => mockPrismaFindMany(...args),
      count: (...args: unknown[]) => mockPrismaCount(...args),
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
      createMany: vi.fn(),
      deleteMany: vi.fn(),
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

// テスト用日報データ
const createMockReport = (
  id: number,
  salesPersonId: number,
  status: string,
  options: {
    problem?: string;
    plan?: string;
    visitCount?: number;
    commentCount?: number;
  } = {}
) => ({
  id,
  salesPersonId,
  reportDate: new Date("2024-01-15"),
  status,
  problem: options.problem ?? null,
  plan: options.plan ?? null,
  createdAt: new Date("2024-01-15T10:00:00Z"),
  updatedAt: new Date("2024-01-15T10:00:00Z"),
  salesPerson: { name: salesPersonId === 1 ? "テスト太郎" : "テスト上長" },
  visitRecords: Array.from({ length: options.visitCount ?? 0 }, (_, i) => ({
    id: i + 1,
    customerId: i + 1,
    visitTime: new Date("1970-01-01T10:00:00Z"),
    visitPurpose: "商談",
    visitContent: `訪問内容${i + 1}`,
    visitResult: "結果",
    customer: { customerName: `顧客${i + 1}` },
  })),
  comments: Array.from({ length: options.commentCount ?? 0 }, (_, i) => ({
    id: i + 1,
    salesPersonId: 2,
    commentText: `コメント${i + 1}`,
    createdAt: new Date("2024-01-15T19:00:00Z"),
    salesPerson: { name: "テスト上長" },
  })),
  _count: {
    visitRecords: options.visitCount ?? 0,
    comments: options.commentCount ?? 0,
  },
});

describe("IT-001: 日報作成から上長確認までの一連のフロー", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // デフォルトのモック設定
    mockSalesPersonFindMany.mockResolvedValue([{ id: 1 }]); // 部下リスト
    mockCustomerFindMany.mockResolvedValue([{ id: 1 }, { id: 2 }]); // 顧客リスト
    mockCustomerFindUnique.mockResolvedValue({
      id: 1,
      customerName: "株式会社テスト",
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

  describe("ワークフロー全体のステータス遷移検証", () => {
    it("日報のステータスが 下書き -> 提出済 -> 確認済 と正しく遷移すること", async () => {
      // ================================================
      // Step 1: 営業担当者が下書きから提出済に変更
      // ================================================
      mockAuth.mockResolvedValue(memberSession);

      // 下書き状態の日報
      const draftReport = createMockReport(1, 1, "draft", { visitCount: 2 });
      mockPrismaFindUnique.mockResolvedValueOnce(draftReport);
      mockPrismaUpdate.mockResolvedValueOnce({
        ...draftReport,
        status: "submitted",
        updatedAt: new Date(),
      });

      // 下書きから提出済に変更
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
      // Step 2: 上長が確認済に変更
      // ================================================
      mockAuth.mockResolvedValue(managerSession);

      // 提出済状態の日報
      const submittedReport = createMockReport(1, 1, "submitted", {
        visitCount: 2,
      });
      mockPrismaFindUnique.mockResolvedValueOnce(submittedReport);
      mockSalesPersonFindFirst.mockResolvedValueOnce({ id: 1, managerId: 2 }); // 部下である
      mockPrismaUpdate.mockResolvedValueOnce({
        ...submittedReport,
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
    });

    it("上長がコメントを投稿して日報を確認済にするフローが正常に動作すること", async () => {
      // ================================================
      // Step 1: 上長がコメントを投稿
      // ================================================
      mockAuth.mockResolvedValue(managerSession);

      const submittedReport = createMockReport(1, 1, "submitted", {
        visitCount: 2,
      });
      mockPrismaFindUnique.mockResolvedValueOnce({ salesPersonId: 1 }); // 日報の存在確認
      mockSalesPersonFindFirst.mockResolvedValueOnce({ id: 1, managerId: 2 }); // 部下である
      mockCommentCreate.mockResolvedValueOnce({
        id: 1,
        reportId: 1,
        salesPersonId: 2,
        commentText: "お疲れ様です。良い成果ですね。",
        createdAt: new Date(),
      });

      const commentRequest = createRequest(
        "http://localhost/api/v1/reports/1/comments",
        "POST",
        { comment_text: "お疲れ様です。良い成果ですね。" }
      );

      const commentResponse = await createComment(
        commentRequest,
        createContext("1")
      );
      const commentBody = await commentResponse.json();

      expect(commentResponse.status).toBe(201);
      expect(commentBody.success).toBe(true);
      expect(commentBody.data.comment_id).toBe(1);
      expect(commentBody.message).toBe("コメントを投稿しました");

      // ================================================
      // Step 2: 上長が確認済に変更
      // ================================================
      mockPrismaFindUnique.mockResolvedValueOnce(submittedReport);
      mockSalesPersonFindFirst.mockResolvedValueOnce({ id: 1, managerId: 2 }); // 部下である
      mockPrismaUpdate.mockResolvedValueOnce({
        ...submittedReport,
        status: "confirmed",
        updatedAt: new Date(),
      });

      const statusRequest = createRequest(
        "http://localhost/api/v1/reports/1/status",
        "PATCH",
        { status: "confirmed" }
      );

      const statusResponse = await updateStatus(
        statusRequest,
        createContext("1")
      );
      const statusBody = await statusResponse.json();

      expect(statusResponse.status).toBe(200);
      expect(statusBody.success).toBe(true);
      expect(statusBody.data.status).toBe("confirmed");

      // ================================================
      // Step 3: 営業担当者がコメントを確認
      // ================================================
      mockAuth.mockResolvedValue(memberSession);

      const confirmedReport = createMockReport(1, 1, "confirmed", {
        visitCount: 2,
        commentCount: 1,
        problem: "テスト課題",
        plan: "テスト予定",
      });
      mockPrismaFindUnique.mockResolvedValueOnce(confirmedReport);

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
      expect(detailBody.data.status).toBe("confirmed");
      expect(detailBody.data.status_label).toBe("確認済");
      expect(detailBody.data.comments).toHaveLength(1);
    });
  });

  describe("権限チェックの検証", () => {
    it("一般営業担当者は自分の日報を確認済にできないこと", async () => {
      mockAuth.mockResolvedValue(memberSession);

      const submittedReport = createMockReport(1, 1, "submitted");
      mockPrismaFindUnique.mockResolvedValue(submittedReport);

      const request = createRequest(
        "http://localhost/api/v1/reports/1/status",
        "PATCH",
        { status: "confirmed" }
      );

      const response = await updateStatus(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain(
        "自分の日報を確認済にすることはできません"
      );
    });

    it("上長は自分の日報を確認済にできないこと", async () => {
      mockAuth.mockResolvedValue(managerSession);

      // 上長自身の日報
      const ownReport = createMockReport(1, 2, "submitted"); // salesPersonId=2 (上長)
      mockPrismaFindUnique.mockResolvedValue(ownReport);

      const request = createRequest(
        "http://localhost/api/v1/reports/1/status",
        "PATCH",
        { status: "confirmed" }
      );

      const response = await updateStatus(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain(
        "自分の日報を確認済にすることはできません"
      );
    });

    it("一般営業担当者はコメントを投稿できないこと", async () => {
      mockAuth.mockResolvedValue(memberSession);

      const request = createRequest(
        "http://localhost/api/v1/reports/1/comments",
        "POST",
        { comment_text: "テストコメント" }
      );

      const response = await createComment(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("上長のみ");
    });

    it("確認済の日報は編集できないこと", async () => {
      mockAuth.mockResolvedValue(memberSession);

      const confirmedReport = createMockReport(1, 1, "confirmed");
      mockPrismaFindUnique.mockResolvedValue(confirmedReport);

      const request = createRequest(
        "http://localhost/api/v1/reports/1",
        "PUT",
        {
          report_date: "2024-01-15",
          status: "draft",
          visits: [],
        }
      );

      const response = await updateReport(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("確認済の日報は編集できません");
    });

    it("上長は部下以外の日報にアクセスできないこと", async () => {
      mockAuth.mockResolvedValue(managerSession);

      // 部下ではない人の日報
      const otherReport = createMockReport(1, 3, "submitted"); // salesPersonId=3 (別の人)
      mockPrismaFindUnique.mockResolvedValue(otherReport);
      mockSalesPersonFindFirst.mockResolvedValue(null); // 部下ではない

      const request = createRequest("http://localhost/api/v1/reports/1", "GET");

      const response = await getReportDetail(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("閲覧する権限がありません");
    });
  });

  describe("下書き・削除の検証", () => {
    it("下書き状態の日報は削除できること", async () => {
      mockAuth.mockResolvedValue(memberSession);

      const draftReport = createMockReport(1, 1, "draft");
      mockPrismaFindUnique.mockResolvedValue(draftReport);
      mockPrismaDelete.mockResolvedValue(draftReport);

      const request = createRequest(
        "http://localhost/api/v1/reports/1",
        "DELETE"
      );

      const response = await deleteReport(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe("日報を削除しました");
    });

    it("提出済の日報は削除できないこと", async () => {
      mockAuth.mockResolvedValue(memberSession);

      const submittedReport = createMockReport(1, 1, "submitted");
      mockPrismaFindUnique.mockResolvedValue(submittedReport);

      const request = createRequest(
        "http://localhost/api/v1/reports/1",
        "DELETE"
      );

      const response = await deleteReport(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("下書き以外の日報は削除できません");
    });

    it("確認済の日報は削除できないこと", async () => {
      mockAuth.mockResolvedValue(memberSession);

      const confirmedReport = createMockReport(1, 1, "confirmed");
      mockPrismaFindUnique.mockResolvedValue(confirmedReport);

      const request = createRequest(
        "http://localhost/api/v1/reports/1",
        "DELETE"
      );

      const response = await deleteReport(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("下書き以外の日報は削除できません");
    });
  });

  describe("訪問記録の操作検証", () => {
    it("確認済の日報には訪問記録を追加できないこと", async () => {
      mockAuth.mockResolvedValue(memberSession);

      // 確認済の日報
      mockPrismaFindUnique.mockResolvedValue({
        salesPersonId: 1,
        status: "confirmed",
      });

      const request = createRequest(
        "http://localhost/api/v1/reports/1/visits",
        "POST",
        {
          customer_id: 1,
          visit_content: "追加しようとした訪問記録",
        }
      );

      const response = await createVisit(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain(
        "確認済の日報には訪問記録を追加できません"
      );
    });

    it("下書き状態の日報には訪問記録を追加できること", async () => {
      mockAuth.mockResolvedValue(memberSession);

      // 下書き状態の日報
      mockPrismaFindUnique.mockResolvedValue({
        salesPersonId: 1,
        status: "draft",
      });
      mockCustomerFindUnique.mockResolvedValue({
        id: 1,
        customerName: "株式会社テスト",
      });
      mockVisitCreate.mockResolvedValue({
        id: 1,
        reportId: 1,
        customerId: 1,
        createdAt: new Date(),
      });

      const request = createRequest(
        "http://localhost/api/v1/reports/1/visits",
        "POST",
        {
          customer_id: 1,
          visit_time: "10:00",
          visit_content: "新しい訪問記録",
        }
      );

      const response = await createVisit(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.message).toBe("訪問記録を作成しました");
    });
  });

  describe("日報一覧の権限フィルタリング検証", () => {
    it("一般営業担当者は自分の日報のみ取得できること", async () => {
      mockAuth.mockResolvedValue(memberSession);

      const myReports = [
        createMockReport(1, 1, "submitted", { visitCount: 2 }),
        createMockReport(2, 1, "draft", { visitCount: 0 }),
      ];
      mockPrismaCount.mockResolvedValue(2);
      mockPrismaFindMany.mockResolvedValue(myReports);

      const request = createRequest("http://localhost/api/v1/reports", "GET");

      const response = await getReportsList(request, createEmptyContext());
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(2);
      // 全て自分の日報であることを確認
      body.data.items.forEach((item: { sales_person_id: number }) => {
        expect(item.sales_person_id).toBe(1);
      });
    });

    it("上長は自分と部下の日報を取得できること", async () => {
      mockAuth.mockResolvedValue(managerSession);

      // 上長の部下
      mockSalesPersonFindMany.mockResolvedValue([{ id: 1 }]);

      const reports = [
        createMockReport(1, 1, "submitted", { visitCount: 2 }), // 部下の日報
        createMockReport(2, 2, "draft", { visitCount: 1 }), // 自分の日報
      ];
      mockPrismaCount.mockResolvedValue(2);
      mockPrismaFindMany.mockResolvedValue(reports);

      const request = createRequest("http://localhost/api/v1/reports", "GET");

      const response = await getReportsList(request, createEmptyContext());
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(2);
    });
  });
});
