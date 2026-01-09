/**
 * IT-004: 訪問記録と顧客マスタの整合性
 *
 * テスト仕様書(doc/test_specification.md)に基づく結合テスト
 *
 * 本テストは、データ整合性をシミュレートします:
 * 1. 訪問記録で使用されている顧客の削除を試みる
 * 2. エラーメッセージを確認
 * 3. 顧客情報を編集して保存
 * 4. 該当顧客を使用している日報詳細を表示
 * 5. 顧客名が更新されていることを確認
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PUT as updateCustomer, DELETE as deleteCustomer } from "./[id]/route";
import { GET as getReportDetail } from "../reports/[id]/route";
import { GET as getVisitsList } from "../reports/[id]/visits/route";

import type { NextRequest } from "next/server";

// Prismaモック
const mockCustomerFindUnique = vi.fn();
const mockCustomerFindFirst = vi.fn();
const mockCustomerFindMany = vi.fn();
const mockCustomerUpdate = vi.fn();
const mockCustomerDelete = vi.fn();
const mockVisitRecordCount = vi.fn();
const mockVisitRecordFindMany = vi.fn();
const mockDailyReportFindUnique = vi.fn();
const mockSalesPersonFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    customer: {
      findUnique: (...args: unknown[]) => mockCustomerFindUnique(...args),
      findFirst: (...args: unknown[]) => mockCustomerFindFirst(...args),
      findMany: (...args: unknown[]) => mockCustomerFindMany(...args),
      update: (...args: unknown[]) => mockCustomerUpdate(...args),
      delete: (...args: unknown[]) => mockCustomerDelete(...args),
    },
    visitRecord: {
      count: (...args: unknown[]) => mockVisitRecordCount(...args),
      findMany: (...args: unknown[]) => mockVisitRecordFindMany(...args),
    },
    dailyReport: {
      findUnique: (...args: unknown[]) => mockDailyReportFindUnique(...args),
    },
    salesPerson: {
      findFirst: (...args: unknown[]) => mockSalesPersonFindFirst(...args),
    },
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

const adminSession = {
  user: {
    id: 3,
    name: "管理者 三郎",
    email: "admin@example.com",
    department: "管理部",
    isManager: true,
    managerId: null,
  },
};

// テスト用顧客データ
const testCustomer = {
  id: 1,
  customerName: "株式会社ABC",
  address: "東京都千代田区1-1-1",
  phone: "03-1234-5678",
  contactPerson: "田中一郎",
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
};

// テスト用日報データ（訪問記録付き）
const createReportWithVisits = (customerId: number, customerName: string) => ({
  id: 1,
  salesPersonId: 1,
  reportDate: new Date("2024-01-15"),
  status: "submitted",
  problem: "テスト課題",
  plan: "テスト予定",
  createdAt: new Date("2024-01-15T10:00:00Z"),
  updatedAt: new Date("2024-01-15T10:00:00Z"),
  salesPerson: { name: "営業担当 太郎" },
  visitRecords: [
    {
      id: 1,
      customerId: customerId,
      visitTime: new Date("1970-01-01T10:00:00Z"),
      visitPurpose: "商談",
      visitContent: "新製品の提案",
      visitResult: "継続検討",
      customer: { customerName: customerName },
    },
  ],
  comments: [],
  _count: { visitRecords: 1, comments: 0 },
});

describe("IT-004: 訪問記録と顧客マスタの整合性", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  describe("完全なデータ整合性シナリオ", () => {
    it("訪問記録で使用されている顧客を削除しようとするとエラーになり、更新後は日報に反映されること", async () => {
      mockAuth.mockResolvedValue(adminSession);

      // ================================================
      // Step 1 & 2: 訪問記録で使用されている顧客の削除を試みてエラー確認
      // ================================================
      mockCustomerFindUnique.mockResolvedValueOnce(testCustomer);
      mockVisitRecordCount.mockResolvedValueOnce(3); // 3件の訪問記録で使用中

      const deleteRequest = createRequest(
        "http://localhost/api/v1/customers/1",
        "DELETE"
      );
      const deleteResponse = await deleteCustomer(
        deleteRequest,
        createContext("1")
      );
      const deleteBody = await deleteResponse.json();

      expect(deleteResponse.status).toBe(409); // RESOURCE_IN_USE returns 409 Conflict
      expect(deleteBody.success).toBe(false);
      expect(deleteBody.error.code).toBe("RESOURCE_IN_USE");
      expect(deleteBody.error.message).toBe(
        "この顧客は訪問記録で使用されているため削除できません"
      );

      // ================================================
      // Step 3: 顧客情報を編集して保存
      // ================================================
      const updatedCustomer = {
        ...testCustomer,
        customerName: "株式会社ABC（新社名）",
        address: "東京都千代田区2-2-2（移転後）",
        phone: "03-9999-9999",
        contactPerson: "田中太郎",
        updatedAt: new Date("2024-01-15T10:00:00Z"),
      };

      mockCustomerFindUnique.mockResolvedValueOnce(testCustomer);
      mockCustomerFindFirst.mockResolvedValueOnce(null); // 重複なし
      mockCustomerUpdate.mockResolvedValueOnce(updatedCustomer);

      const updateRequest = createRequest(
        "http://localhost/api/v1/customers/1",
        "PUT",
        {
          customer_name: "株式会社ABC（新社名）",
          address: "東京都千代田区2-2-2（移転後）",
          phone: "03-9999-9999",
          contact_person: "田中太郎",
        }
      );

      const updateResponse = await updateCustomer(
        updateRequest,
        createContext("1")
      );
      const updateBody = await updateResponse.json();

      expect(updateResponse.status).toBe(200);
      expect(updateBody.success).toBe(true);
      expect(updateBody.data.customer_name).toBe("株式会社ABC（新社名）");
      expect(updateBody.data.address).toBe("東京都千代田区2-2-2（移転後）");
      expect(updateBody.message).toBe("顧客情報を更新しました");

      // ================================================
      // Step 4 & 5: 該当顧客を使用している日報詳細を表示して顧客名が更新されていることを確認
      // ================================================
      mockAuth.mockResolvedValue(memberSession);

      // 顧客名が更新された日報データ
      const reportWithUpdatedCustomer = createReportWithVisits(
        1,
        "株式会社ABC（新社名）"
      );

      mockDailyReportFindUnique.mockResolvedValueOnce(
        reportWithUpdatedCustomer
      );

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
      expect(detailBody.data.visits).toHaveLength(1);
      expect(detailBody.data.visits[0].customer_name).toBe(
        "株式会社ABC（新社名）"
      );
    });
  });

  describe("顧客削除の制約検証", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(adminSession);
    });

    it("訪問記録が1件でも存在する場合は削除できないこと", async () => {
      mockCustomerFindUnique.mockResolvedValueOnce(testCustomer);
      mockVisitRecordCount.mockResolvedValueOnce(1); // 1件のみ使用中

      const request = createRequest(
        "http://localhost/api/v1/customers/1",
        "DELETE"
      );
      const response = await deleteCustomer(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(409); // RESOURCE_IN_USE returns 409 Conflict
      expect(body.error.code).toBe("RESOURCE_IN_USE");
      expect(body.error.message).toBe(
        "この顧客は訪問記録で使用されているため削除できません"
      );
    });

    it("訪問記録が存在しない顧客は削除できること", async () => {
      mockCustomerFindUnique.mockResolvedValueOnce(testCustomer);
      mockVisitRecordCount.mockResolvedValueOnce(0); // 未使用
      mockCustomerDelete.mockResolvedValueOnce(testCustomer);

      const request = createRequest(
        "http://localhost/api/v1/customers/1",
        "DELETE"
      );
      const response = await deleteCustomer(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe("顧客を削除しました");
    });

    it("存在しない顧客の削除は404エラーになること", async () => {
      mockCustomerFindUnique.mockResolvedValueOnce(null);

      const request = createRequest(
        "http://localhost/api/v1/customers/999",
        "DELETE"
      );
      const response = await deleteCustomer(request, createContext("999"));
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.message).toBe("指定された顧客が見つかりません");
    });
  });

  describe("顧客情報更新の整合性検証", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(adminSession);
    });

    it("訪問記録で使用中の顧客も情報更新は可能であること", async () => {
      mockCustomerFindUnique.mockResolvedValueOnce(testCustomer);
      mockCustomerFindFirst.mockResolvedValueOnce(null); // 重複なし
      mockCustomerUpdate.mockResolvedValueOnce({
        ...testCustomer,
        customerName: "更新後株式会社ABC",
        updatedAt: new Date(),
      });

      const request = createRequest(
        "http://localhost/api/v1/customers/1",
        "PUT",
        {
          customer_name: "更新後株式会社ABC",
          address: testCustomer.address,
          phone: testCustomer.phone,
          contact_person: testCustomer.contactPerson,
        }
      );

      const response = await updateCustomer(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.customer_name).toBe("更新後株式会社ABC");
    });

    it("顧客更新後、訪問記録一覧で更新された顧客名が表示されること", async () => {
      mockAuth.mockResolvedValue(memberSession);

      // 訪問記録一覧を取得
      const visitsWithUpdatedCustomer = [
        {
          id: 1,
          customerId: 1,
          visitTime: new Date("1970-01-01T10:00:00Z"),
          visitPurpose: "商談",
          visitContent: "提案実施",
          visitResult: "継続検討",
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: { customerName: "更新後株式会社ABC" }, // 更新された顧客名
        },
        {
          id: 2,
          customerId: 1,
          visitTime: new Date("1970-01-01T14:00:00Z"),
          visitPurpose: "フォロー",
          visitContent: "状況確認",
          visitResult: "好感触",
          createdAt: new Date(),
          updatedAt: new Date(),
          customer: { customerName: "更新後株式会社ABC" }, // 同じ顧客
        },
      ];

      mockDailyReportFindUnique.mockResolvedValueOnce({
        salesPersonId: 1,
        status: "submitted",
      });
      mockVisitRecordFindMany.mockResolvedValueOnce(visitsWithUpdatedCustomer);

      const request = createRequest(
        "http://localhost/api/v1/reports/1/visits",
        "GET"
      );
      const response = await getVisitsList(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.items).toHaveLength(2);
      expect(body.data.items[0].customer_name).toBe("更新後株式会社ABC");
      expect(body.data.items[1].customer_name).toBe("更新後株式会社ABC");
    });
  });

  describe("複数日報での顧客使用状況検証", () => {
    it("複数の日報で使用されている顧客も削除できないこと", async () => {
      mockAuth.mockResolvedValue(adminSession);

      mockCustomerFindUnique.mockResolvedValueOnce(testCustomer);
      mockVisitRecordCount.mockResolvedValueOnce(10); // 10件の訪問記録で使用中

      const request = createRequest(
        "http://localhost/api/v1/customers/1",
        "DELETE"
      );
      const response = await deleteCustomer(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(409); // RESOURCE_IN_USE returns 409 Conflict
      expect(body.error.code).toBe("RESOURCE_IN_USE");
    });

    it("複数顧客が存在する場合、特定の顧客のみ削除対象になること", async () => {
      mockAuth.mockResolvedValue(adminSession);

      // 顧客1は使用中
      const customer1 = { ...testCustomer, id: 1 };
      mockCustomerFindUnique.mockResolvedValueOnce(customer1);
      mockVisitRecordCount.mockResolvedValueOnce(5);

      const delete1Request = createRequest(
        "http://localhost/api/v1/customers/1",
        "DELETE"
      );
      const delete1Response = await deleteCustomer(
        delete1Request,
        createContext("1")
      );
      expect(delete1Response.status).toBe(409); // RESOURCE_IN_USE returns 409 Conflict

      // 顧客2は未使用
      const customer2 = { ...testCustomer, id: 2, customerName: "株式会社XYZ" };
      mockCustomerFindUnique.mockResolvedValueOnce(customer2);
      mockVisitRecordCount.mockResolvedValueOnce(0);
      mockCustomerDelete.mockResolvedValueOnce(customer2);

      const delete2Request = createRequest(
        "http://localhost/api/v1/customers/2",
        "DELETE"
      );
      const delete2Response = await deleteCustomer(
        delete2Request,
        createContext("2")
      );
      expect(delete2Response.status).toBe(200);
    });
  });

  describe("顧客名変更時の重複チェック", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(adminSession);
    });

    it("他の顧客と同じ名前に変更しようとするとエラーになること", async () => {
      mockCustomerFindUnique.mockResolvedValueOnce(testCustomer);
      mockCustomerFindFirst.mockResolvedValueOnce({
        id: 2,
        customerName: "既存株式会社",
      }); // 重複あり

      const request = createRequest(
        "http://localhost/api/v1/customers/1",
        "PUT",
        {
          customer_name: "既存株式会社",
          address: testCustomer.address,
          phone: testCustomer.phone,
          contact_person: testCustomer.contactPerson,
        }
      );

      const response = await updateCustomer(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.message).toBe("この顧客名は既に登録されています");
    });

    it("自分自身と同じ名前への更新は許可されること", async () => {
      mockCustomerFindUnique.mockResolvedValueOnce(testCustomer);
      mockCustomerFindFirst.mockResolvedValueOnce(null); // 重複なし（自分自身は除外される）
      mockCustomerUpdate.mockResolvedValueOnce({
        ...testCustomer,
        address: "新住所",
        updatedAt: new Date(),
      });

      const request = createRequest(
        "http://localhost/api/v1/customers/1",
        "PUT",
        {
          customer_name: testCustomer.customerName, // 同じ名前
          address: "新住所",
          phone: testCustomer.phone,
          contact_person: testCustomer.contactPerson,
        }
      );

      const response = await updateCustomer(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.customer_name).toBe(testCustomer.customerName);
      expect(body.data.address).toBe("新住所");
    });
  });

  describe("日報詳細表示時の顧客情報整合性", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(memberSession);
    });

    it("日報詳細で訪問記録の顧客名が正しく表示されること", async () => {
      const report = createReportWithVisits(1, "株式会社ABC");
      mockDailyReportFindUnique.mockResolvedValueOnce(report);

      const request = createRequest("http://localhost/api/v1/reports/1", "GET");
      const response = await getReportDetail(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.visits[0].customer_id).toBe(1);
      expect(body.data.visits[0].customer_name).toBe("株式会社ABC");
    });

    it("複数の訪問記録でそれぞれ異なる顧客名が正しく表示されること", async () => {
      const reportWithMultipleCustomers = {
        id: 1,
        salesPersonId: 1,
        reportDate: new Date("2024-01-15"),
        status: "submitted",
        problem: null,
        plan: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        salesPerson: { name: "営業担当 太郎" },
        visitRecords: [
          {
            id: 1,
            customerId: 1,
            visitTime: new Date("1970-01-01T10:00:00Z"),
            visitPurpose: "商談",
            visitContent: "提案",
            visitResult: "継続",
            customer: { customerName: "株式会社ABC" },
          },
          {
            id: 2,
            customerId: 2,
            visitTime: new Date("1970-01-01T14:00:00Z"),
            visitPurpose: "フォロー",
            visitContent: "確認",
            visitResult: "完了",
            customer: { customerName: "株式会社XYZ" },
          },
          {
            id: 3,
            customerId: 3,
            visitTime: new Date("1970-01-01T16:00:00Z"),
            visitPurpose: "新規",
            visitContent: "紹介",
            visitResult: "次回約束",
            customer: { customerName: "株式会社123" },
          },
        ],
        comments: [],
      };

      mockDailyReportFindUnique.mockResolvedValueOnce(
        reportWithMultipleCustomers
      );

      const request = createRequest("http://localhost/api/v1/reports/1", "GET");
      const response = await getReportDetail(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.visits).toHaveLength(3);
      expect(body.data.visits[0].customer_name).toBe("株式会社ABC");
      expect(body.data.visits[1].customer_name).toBe("株式会社XYZ");
      expect(body.data.visits[2].customer_name).toBe("株式会社123");
    });
  });

  describe("カスケード操作の整合性", () => {
    it("顧客削除時に訪問記録存在チェックが正しく動作すること", async () => {
      mockAuth.mockResolvedValue(adminSession);

      // モック呼び出しの順序を確認
      mockCustomerFindUnique.mockResolvedValueOnce(testCustomer);
      mockVisitRecordCount.mockResolvedValueOnce(5);

      const request = createRequest(
        "http://localhost/api/v1/customers/1",
        "DELETE"
      );
      await deleteCustomer(request, createContext("1"));

      // 訪問記録のカウントが正しい条件で呼ばれたことを確認
      expect(mockVisitRecordCount).toHaveBeenCalledWith({
        where: { customerId: 1 },
      });
    });
  });
});
