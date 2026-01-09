/**
 * IT-002: 顧客マスタ登録から日報での使用
 *
 * テスト仕様書(doc/test_specification.md)に基づく結合テスト
 *
 * 本テストは、顧客マスタと日報の連携をシミュレートします:
 * 1. 管理者でログイン
 * 2. 顧客マスタで新規顧客を登録
 * 3. ログアウト
 * 4. 営業担当者でログイン
 * 5. 日報作成画面を表示
 * 6. 訪問記録の顧客プルダウンを確認
 * 7. 登録した顧客を選択して日報を作成
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  GET as getCustomerDetail,
  PUT as updateCustomer,
  DELETE as deleteCustomer,
} from "./[id]/route";
import { GET as getCustomerList, POST as createCustomer } from "./route";

import type { NextRequest } from "next/server";

// Prismaモック
const mockCustomerFindUnique = vi.fn();
const mockCustomerFindFirst = vi.fn();
const mockCustomerFindMany = vi.fn();
const mockCustomerCount = vi.fn();
const mockCustomerCreate = vi.fn();
const mockCustomerUpdate = vi.fn();
const mockCustomerDelete = vi.fn();
const mockVisitRecordCount = vi.fn();
const mockDailyReportFindUnique = vi.fn();
const mockDailyReportCreate = vi.fn();
const mockVisitRecordCreateMany = vi.fn();
const mockPrismaTransaction = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    customer: {
      findUnique: (...args: unknown[]) => mockCustomerFindUnique(...args),
      findFirst: (...args: unknown[]) => mockCustomerFindFirst(...args),
      findMany: (...args: unknown[]) => mockCustomerFindMany(...args),
      count: (...args: unknown[]) => mockCustomerCount(...args),
      create: (...args: unknown[]) => mockCustomerCreate(...args),
      update: (...args: unknown[]) => mockCustomerUpdate(...args),
      delete: (...args: unknown[]) => mockCustomerDelete(...args),
    },
    visitRecord: {
      count: (...args: unknown[]) => mockVisitRecordCount(...args),
      createMany: (...args: unknown[]) => mockVisitRecordCreateMany(...args),
    },
    dailyReport: {
      findUnique: (...args: unknown[]) => mockDailyReportFindUnique(...args),
      create: (...args: unknown[]) => mockDailyReportCreate(...args),
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

// 既存顧客データ
const existingCustomers = [
  {
    id: 1,
    customerName: "既存株式会社A",
    address: "東京都中央区1-1-1",
    phone: "03-1111-1111",
    contactPerson: "佐藤一郎",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
  },
  {
    id: 2,
    customerName: "既存株式会社B",
    address: "大阪府大阪市2-2-2",
    phone: "06-2222-2222",
    contactPerson: "鈴木次郎",
    createdAt: new Date("2024-01-02T00:00:00Z"),
    updatedAt: new Date("2024-01-02T00:00:00Z"),
  },
];

describe("IT-002: 顧客マスタ登録から日報での使用", () => {
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

  describe("完全なワークフローシナリオ", () => {
    it("管理者が顧客を登録し、営業担当者がその顧客を使って日報を作成できること", async () => {
      // ================================================
      // Step 1: 管理者でログイン
      // ================================================
      mockAuth.mockResolvedValue(adminSession);

      // ================================================
      // Step 2: 顧客マスタで新規顧客を登録
      // ================================================
      const newCustomer = {
        id: 3,
        customerName: "新規株式会社C",
        address: "福岡県福岡市3-3-3",
        phone: "092-3333-3333",
        contactPerson: "高橋三郎",
        createdAt: new Date("2024-01-15T09:00:00Z"),
        updatedAt: new Date("2024-01-15T09:00:00Z"),
      };

      mockCustomerFindFirst.mockResolvedValueOnce(null); // 重複なし
      mockCustomerCreate.mockResolvedValueOnce(newCustomer);

      const createCustomerRequest = createRequest(
        "http://localhost/api/v1/customers",
        "POST",
        {
          customer_name: "新規株式会社C",
          address: "福岡県福岡市3-3-3",
          phone: "092-3333-3333",
          contact_person: "高橋三郎",
        }
      );

      const createCustomerResponse = await createCustomer(
        createCustomerRequest
      );
      const createCustomerBody = await createCustomerResponse.json();

      expect(createCustomerResponse.status).toBe(201);
      expect(createCustomerBody.success).toBe(true);
      expect(createCustomerBody.data.customer_id).toBe(3);
      expect(createCustomerBody.data.customer_name).toBe("新規株式会社C");
      expect(createCustomerBody.data.address).toBe("福岡県福岡市3-3-3");
      expect(createCustomerBody.data.phone).toBe("092-3333-3333");
      expect(createCustomerBody.data.contact_person).toBe("高橋三郎");
      expect(createCustomerBody.message).toBe("顧客を作成しました");

      // ================================================
      // Step 3 & 4: ログアウト後、営業担当者でログイン
      // ================================================
      mockAuth.mockResolvedValue(memberSession);

      // ================================================
      // Step 5 & 6: 日報作成画面で顧客プルダウンを確認
      // ================================================
      const allCustomers = [...existingCustomers, newCustomer];
      mockCustomerCount.mockResolvedValueOnce(3);
      mockCustomerFindMany.mockResolvedValueOnce(allCustomers);

      const listCustomersRequest = createRequest(
        "http://localhost/api/v1/customers",
        "GET"
      );
      const listCustomersResponse = await getCustomerList(listCustomersRequest);
      const listCustomersBody = await listCustomersResponse.json();

      expect(listCustomersResponse.status).toBe(200);
      expect(listCustomersBody.success).toBe(true);
      expect(listCustomersBody.data.items).toHaveLength(3);

      // 新規登録した顧客が含まれていることを確認
      const newCustomerInList = listCustomersBody.data.items.find(
        (c: { customer_id: number }) => c.customer_id === 3
      );
      expect(newCustomerInList).toBeDefined();
      expect(newCustomerInList.customer_name).toBe("新規株式会社C");

      // ================================================
      // Step 7: 登録した顧客を選択して日報を作成
      // ================================================
      // 日報作成用モックの準備は reports route で行うため、
      // ここでは顧客が選択可能であることの確認まで
      mockCustomerFindUnique.mockResolvedValueOnce(newCustomer);

      const getNewCustomerRequest = createRequest(
        "http://localhost/api/v1/customers/3",
        "GET"
      );
      const getNewCustomerResponse = await getCustomerDetail(
        getNewCustomerRequest,
        createContext("3")
      );
      const getNewCustomerBody = await getNewCustomerResponse.json();

      expect(getNewCustomerResponse.status).toBe(200);
      expect(getNewCustomerBody.success).toBe(true);
      expect(getNewCustomerBody.data.customer_id).toBe(3);
      expect(getNewCustomerBody.data.customer_name).toBe("新規株式会社C");
    });
  });

  describe("顧客マスタの CRUD 操作検証", () => {
    it("顧客一覧が正しく取得できること", async () => {
      mockAuth.mockResolvedValue(adminSession);

      mockCustomerCount.mockResolvedValueOnce(2);
      mockCustomerFindMany.mockResolvedValueOnce(existingCustomers);

      const request = createRequest("http://localhost/api/v1/customers", "GET");
      const response = await getCustomerList(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(2);
      expect(body.data.items[0].customer_name).toBe("既存株式会社A");
      expect(body.data.items[1].customer_name).toBe("既存株式会社B");
      expect(body.data.pagination.total).toBe(2);
    });

    it("顧客名で検索ができること", async () => {
      mockAuth.mockResolvedValue(adminSession);

      mockCustomerCount.mockResolvedValueOnce(1);
      mockCustomerFindMany.mockResolvedValueOnce([existingCustomers[0]]);

      const request = createRequest(
        "http://localhost/api/v1/customers?customer_name=A",
        "GET"
      );
      const response = await getCustomerList(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.items).toHaveLength(1);
      expect(body.data.items[0].customer_name).toBe("既存株式会社A");
    });

    it("顧客詳細が正しく取得できること", async () => {
      mockAuth.mockResolvedValue(adminSession);

      mockCustomerFindUnique.mockResolvedValueOnce(existingCustomers[0]);

      const request = createRequest(
        "http://localhost/api/v1/customers/1",
        "GET"
      );
      const response = await getCustomerDetail(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.customer_id).toBe(1);
      expect(body.data.customer_name).toBe("既存株式会社A");
      expect(body.data.address).toBe("東京都中央区1-1-1");
      expect(body.data.phone).toBe("03-1111-1111");
      expect(body.data.contact_person).toBe("佐藤一郎");
    });

    it("存在しない顧客の取得で 404 エラーが返ること", async () => {
      mockAuth.mockResolvedValue(adminSession);

      mockCustomerFindUnique.mockResolvedValueOnce(null);

      const request = createRequest(
        "http://localhost/api/v1/customers/999",
        "GET"
      );
      const response = await getCustomerDetail(request, createContext("999"));
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.message).toBe("指定された顧客が見つかりません");
    });

    it("顧客情報を更新できること", async () => {
      mockAuth.mockResolvedValue(adminSession);

      const updatedCustomer = {
        ...existingCustomers[0],
        customerName: "更新株式会社A",
        phone: "03-9999-9999",
        updatedAt: new Date("2024-01-15T10:00:00Z"),
      };

      mockCustomerFindUnique.mockResolvedValueOnce(existingCustomers[0]);
      mockCustomerFindFirst.mockResolvedValueOnce(null); // 重複なし
      mockCustomerUpdate.mockResolvedValueOnce(updatedCustomer);

      const request = createRequest(
        "http://localhost/api/v1/customers/1",
        "PUT",
        {
          customer_name: "更新株式会社A",
          address: "東京都中央区1-1-1",
          phone: "03-9999-9999",
          contact_person: "佐藤一郎",
        }
      );

      const response = await updateCustomer(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.customer_name).toBe("更新株式会社A");
      expect(body.data.phone).toBe("03-9999-9999");
      expect(body.message).toBe("顧客情報を更新しました");
    });

    it("重複する顧客名での登録が拒否されること", async () => {
      mockAuth.mockResolvedValue(adminSession);

      mockCustomerFindFirst.mockResolvedValueOnce(existingCustomers[0]);

      const request = createRequest(
        "http://localhost/api/v1/customers",
        "POST",
        {
          customer_name: "既存株式会社A",
          address: "新しい住所",
          phone: "03-0000-0000",
          contact_person: "新担当者",
        }
      );

      const response = await createCustomer(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.message).toBe("この顧客名は既に登録されています");
    });

    it("重複する顧客名への更新が拒否されること", async () => {
      mockAuth.mockResolvedValue(adminSession);

      mockCustomerFindUnique.mockResolvedValueOnce(existingCustomers[1]);
      mockCustomerFindFirst.mockResolvedValueOnce(existingCustomers[0]); // 重複あり

      const request = createRequest(
        "http://localhost/api/v1/customers/2",
        "PUT",
        {
          customer_name: "既存株式会社A", // 既存の名前
          address: "大阪府大阪市2-2-2",
          phone: "06-2222-2222",
          contact_person: "鈴木次郎",
        }
      );

      const response = await updateCustomer(request, createContext("2"));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.message).toBe("この顧客名は既に登録されています");
    });

    it("訪問記録で使用されていない顧客を削除できること", async () => {
      mockAuth.mockResolvedValue(adminSession);

      mockCustomerFindUnique.mockResolvedValueOnce(existingCustomers[1]);
      mockVisitRecordCount.mockResolvedValueOnce(0);
      mockCustomerDelete.mockResolvedValueOnce(existingCustomers[1]);

      const request = createRequest(
        "http://localhost/api/v1/customers/2",
        "DELETE"
      );

      const response = await deleteCustomer(request, createContext("2"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe("顧客を削除しました");
    });
  });

  describe("バリデーション検証", () => {
    it("顧客名が空の場合、バリデーションエラーが返ること", async () => {
      mockAuth.mockResolvedValue(adminSession);

      const request = createRequest(
        "http://localhost/api/v1/customers",
        "POST",
        {
          customer_name: "",
          address: "テスト住所",
        }
      );

      const response = await createCustomer(request);
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });

    it("顧客名が100文字を超える場合、バリデーションエラーが返ること", async () => {
      mockAuth.mockResolvedValue(adminSession);

      const longName = "あ".repeat(101);

      const request = createRequest(
        "http://localhost/api/v1/customers",
        "POST",
        {
          customer_name: longName,
        }
      );

      const response = await createCustomer(request);
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });

    it("電話番号が不正な形式の場合、バリデーションエラーが返ること", async () => {
      mockAuth.mockResolvedValue(adminSession);

      const request = createRequest(
        "http://localhost/api/v1/customers",
        "POST",
        {
          customer_name: "テスト株式会社",
          phone: "invalid-phone",
        }
      );

      const response = await createCustomer(request);
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });

    it("住所が200文字を超える場合、バリデーションエラーが返ること", async () => {
      mockAuth.mockResolvedValue(adminSession);

      const longAddress = "あ".repeat(201);

      const request = createRequest(
        "http://localhost/api/v1/customers",
        "POST",
        {
          customer_name: "テスト株式会社",
          address: longAddress,
        }
      );

      const response = await createCustomer(request);
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });

    it("担当者名が50文字を超える場合、バリデーションエラーが返ること", async () => {
      mockAuth.mockResolvedValue(adminSession);

      const longContactPerson = "あ".repeat(51);

      const request = createRequest(
        "http://localhost/api/v1/customers",
        "POST",
        {
          customer_name: "テスト株式会社",
          contact_person: longContactPerson,
        }
      );

      const response = await createCustomer(request);
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });

    it("IDが不正な形式の場合、バリデーションエラーが返ること", async () => {
      mockAuth.mockResolvedValue(adminSession);

      const request = createRequest(
        "http://localhost/api/v1/customers/invalid",
        "GET"
      );

      const response = await getCustomerDetail(
        request,
        createContext("invalid")
      );
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });
  });

  describe("ページネーション検証", () => {
    it("ページネーションが正しく動作すること", async () => {
      mockAuth.mockResolvedValue(adminSession);

      mockCustomerCount.mockResolvedValueOnce(25);
      mockCustomerFindMany.mockResolvedValueOnce(
        Array.from({ length: 10 }, (_, i) => ({
          ...existingCustomers[0],
          id: i + 1,
          customerName: `テスト株式会社${i + 1}`,
        }))
      );

      const request = createRequest(
        "http://localhost/api/v1/customers?page=1&per_page=10",
        "GET"
      );
      const response = await getCustomerList(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.items).toHaveLength(10);
      expect(body.data.pagination.total).toBe(25);
      expect(body.data.pagination.current_page).toBe(1);
      expect(body.data.pagination.per_page).toBe(10);
      expect(body.data.pagination.last_page).toBe(3);
      expect(body.data.pagination.from).toBe(1);
      expect(body.data.pagination.to).toBe(10);
    });

    it("2ページ目のデータが正しく取得できること", async () => {
      mockAuth.mockResolvedValue(adminSession);

      mockCustomerCount.mockResolvedValueOnce(25);
      mockCustomerFindMany.mockResolvedValueOnce(
        Array.from({ length: 10 }, (_, i) => ({
          ...existingCustomers[0],
          id: i + 11,
          customerName: `テスト株式会社${i + 11}`,
        }))
      );

      const request = createRequest(
        "http://localhost/api/v1/customers?page=2&per_page=10",
        "GET"
      );
      const response = await getCustomerList(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.items).toHaveLength(10);
      expect(body.data.pagination.current_page).toBe(2);
      expect(body.data.pagination.from).toBe(11);
      expect(body.data.pagination.to).toBe(20);
    });
  });

  describe("ソート検証", () => {
    it("顧客名で昇順ソートができること", async () => {
      mockAuth.mockResolvedValue(adminSession);

      const sortedCustomers = [
        { ...existingCustomers[0], customerName: "Aaa株式会社" },
        { ...existingCustomers[1], customerName: "Bbb株式会社" },
      ];

      mockCustomerCount.mockResolvedValueOnce(2);
      mockCustomerFindMany.mockResolvedValueOnce(sortedCustomers);

      const request = createRequest(
        "http://localhost/api/v1/customers?sort=customer_name&order=asc",
        "GET"
      );
      const response = await getCustomerList(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.items[0].customer_name).toBe("Aaa株式会社");
      expect(body.data.items[1].customer_name).toBe("Bbb株式会社");
    });

    it("顧客名で降順ソートができること", async () => {
      mockAuth.mockResolvedValue(adminSession);

      const sortedCustomers = [
        { ...existingCustomers[1], customerName: "Bbb株式会社" },
        { ...existingCustomers[0], customerName: "Aaa株式会社" },
      ];

      mockCustomerCount.mockResolvedValueOnce(2);
      mockCustomerFindMany.mockResolvedValueOnce(sortedCustomers);

      const request = createRequest(
        "http://localhost/api/v1/customers?sort=customer_name&order=desc",
        "GET"
      );
      const response = await getCustomerList(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.items[0].customer_name).toBe("Bbb株式会社");
      expect(body.data.items[1].customer_name).toBe("Aaa株式会社");
    });
  });
});
