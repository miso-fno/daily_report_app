/**
 * 顧客マスタAPI - 詳細取得・更新・削除のユニットテスト
 *
 * テスト対象:
 * - GET /api/v1/customers/{id} - 顧客詳細取得
 * - PUT /api/v1/customers/{id} - 顧客更新 (UT-CST-005)
 * - DELETE /api/v1/customers/{id} - 顧客削除 (UT-CST-006, UT-CST-007)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, GET, PUT } from "./route";

import type { NextRequest } from "next/server";

// Prismaモック
const mockCustomerFindUnique = vi.fn();
const mockCustomerFindFirst = vi.fn();
const mockCustomerUpdate = vi.fn();
const mockCustomerDelete = vi.fn();
const mockVisitRecordCount = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    customer: {
      findUnique: (...args: unknown[]) => mockCustomerFindUnique(...args),
      findFirst: (...args: unknown[]) => mockCustomerFindFirst(...args),
      update: (...args: unknown[]) => mockCustomerUpdate(...args),
      delete: (...args: unknown[]) => mockCustomerDelete(...args),
    },
    visitRecord: {
      count: (...args: unknown[]) => mockVisitRecordCount(...args),
    },
  },
}));

// テスト用ヘルパー関数
const createContext = (id: string) => ({
  params: Promise.resolve({ id }),
});

// テスト用モックデータ
const mockCustomerData = {
  id: 1,
  customerName: "株式会社テスト",
  address: "東京都渋谷区",
  phone: "03-1234-5678",
  contactPerson: "山田太郎",
  createdAt: new Date("2024-01-10T09:00:00Z"),
  updatedAt: new Date("2024-01-10T09:00:00Z"),
};

describe("Customers API - GET /api/v1/customers/{id}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createRequest = (id: string): NextRequest => {
    return new Request(`http://localhost/api/v1/customers/${id}`, {
      method: "GET",
    }) as unknown as NextRequest;
  };

  describe("顧客詳細取得 - 正常系", () => {
    it("顧客詳細が正しく取得できること", async () => {
      mockCustomerFindUnique.mockResolvedValue(mockCustomerData);

      const request = createRequest("1");
      const response = await GET(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        customer_id: 1,
        customer_name: "株式会社テスト",
        address: "東京都渋谷区",
        phone: "03-1234-5678",
        contact_person: "山田太郎",
      });
      expect(body.data.created_at).toBe("2024-01-10T09:00:00.000Z");
      expect(body.data.updated_at).toBe("2024-01-10T09:00:00.000Z");
    });

    it("オプション項目がnullの顧客も取得できること", async () => {
      const nullableCustomer = {
        id: 2,
        customerName: "最小項目顧客",
        address: null,
        phone: null,
        contactPerson: null,
        createdAt: new Date("2024-01-15T10:00:00Z"),
        updatedAt: new Date("2024-01-15T10:00:00Z"),
      };
      mockCustomerFindUnique.mockResolvedValue(nullableCustomer);

      const request = createRequest("2");
      const response = await GET(request, createContext("2"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.address).toBeNull();
      expect(body.data.phone).toBeNull();
      expect(body.data.contact_person).toBeNull();
    });
  });

  describe("顧客詳細取得 - 異常系", () => {
    it("存在しない顧客IDの場合、404エラーを返すこと", async () => {
      mockCustomerFindUnique.mockResolvedValue(null);

      const request = createRequest("999");
      const response = await GET(request, createContext("999"));
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
      expect(body.error.message).toContain("顧客が見つかりません");
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

    it("IDが0の場合、422エラーを返すこと", async () => {
      const request = createRequest("0");
      const response = await GET(request, createContext("0"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });
  });

  describe("エラーハンドリング", () => {
    it("データベースエラー時、500エラーを返すこと", async () => {
      mockCustomerFindUnique.mockRejectedValue(new Error("Database error"));

      const request = createRequest("1");
      const response = await GET(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("INTERNAL_ERROR");
    });
  });
});

describe("Customers API - PUT /api/v1/customers/{id}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createRequest = (id: string, body: unknown): NextRequest => {
    return new Request(`http://localhost/api/v1/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }) as unknown as NextRequest;
  };

  describe("顧客編集 - 正常系 (UT-CST-005)", () => {
    it("顧客情報を更新できること", async () => {
      mockCustomerFindUnique.mockResolvedValue(mockCustomerData);
      mockCustomerFindFirst.mockResolvedValue(null); // 重複なし

      const updatedCustomer = {
        ...mockCustomerData,
        customerName: "株式会社更新済",
        address: "東京都新宿区",
        updatedAt: new Date("2024-01-20T15:00:00Z"),
      };
      mockCustomerUpdate.mockResolvedValue(updatedCustomer);

      const request = createRequest("1", {
        customer_name: "株式会社更新済",
        address: "東京都新宿区",
        phone: "03-1234-5678",
        contact_person: "山田太郎",
      });

      const response = await PUT(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe("顧客情報を更新しました");
      expect(body.data.customer_name).toBe("株式会社更新済");
      expect(body.data.address).toBe("東京都新宿区");
    });

    it("オプション項目をnullに更新できること", async () => {
      mockCustomerFindUnique.mockResolvedValue(mockCustomerData);
      mockCustomerFindFirst.mockResolvedValue(null);

      const updatedCustomer = {
        ...mockCustomerData,
        address: null,
        phone: null,
        contactPerson: null,
        updatedAt: new Date("2024-01-20T15:00:00Z"),
      };
      mockCustomerUpdate.mockResolvedValue(updatedCustomer);

      const request = createRequest("1", {
        customer_name: "株式会社テスト",
        address: null,
        phone: null,
        contact_person: null,
      });

      const response = await PUT(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.address).toBeNull();
      expect(body.data.phone).toBeNull();
      expect(body.data.contact_person).toBeNull();
    });
  });

  describe("顧客編集 - 重複チェック", () => {
    it("他の顧客と顧客名が重複する場合、エラーを返すこと", async () => {
      mockCustomerFindUnique.mockResolvedValue(mockCustomerData);
      mockCustomerFindFirst.mockResolvedValue({
        id: 2,
        customerName: "既存顧客名",
      });

      const request = createRequest("1", {
        customer_name: "既存顧客名",
        address: "東京都渋谷区",
      });

      const response = await PUT(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("DUPLICATE_ENTRY");
    });

    it("自分自身の顧客名と同じ場合は更新できること", async () => {
      mockCustomerFindUnique.mockResolvedValue(mockCustomerData);
      mockCustomerFindFirst.mockResolvedValue(null); // 自分以外に重複なし

      const updatedCustomer = {
        ...mockCustomerData,
        address: "更新された住所",
        updatedAt: new Date(),
      };
      mockCustomerUpdate.mockResolvedValue(updatedCustomer);

      const request = createRequest("1", {
        customer_name: "株式会社テスト", // 同じ顧客名
        address: "更新された住所",
      });

      const response = await PUT(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });

  describe("顧客編集 - 存在チェック", () => {
    it("存在しない顧客を更新しようとした場合、404エラーを返すこと", async () => {
      mockCustomerFindUnique.mockResolvedValue(null);

      const request = createRequest("999", {
        customer_name: "テスト顧客",
        address: "東京都渋谷区",
      });

      const response = await PUT(request, createContext("999"));
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
    });
  });

  describe("顧客編集 - バリデーションエラー", () => {
    it("顧客名が空の場合、バリデーションエラーになること", async () => {
      mockCustomerFindUnique.mockResolvedValue(mockCustomerData);

      const request = createRequest("1", {
        customer_name: "",
      });

      const response = await PUT(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("顧客名が100文字を超える場合、バリデーションエラーになること", async () => {
      mockCustomerFindUnique.mockResolvedValue(mockCustomerData);

      const longName = "あ".repeat(101);
      const request = createRequest("1", {
        customer_name: longName,
      });

      const response = await PUT(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });

    it("不正な電話番号形式の場合、バリデーションエラーになること", async () => {
      mockCustomerFindUnique.mockResolvedValue(mockCustomerData);

      const request = createRequest("1", {
        customer_name: "テスト顧客",
        phone: "invalid-phone",
      });

      const response = await PUT(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });

    it("不正なIDフォーマットの場合、422エラーを返すこと", async () => {
      const request = createRequest("abc", {
        customer_name: "テスト顧客",
      });

      const response = await PUT(request, createContext("abc"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });

    it("リクエストボディが不正なJSONの場合、バリデーションエラーになること", async () => {
      mockCustomerFindUnique.mockResolvedValue(mockCustomerData);

      const request = new Request("http://localhost/api/v1/customers/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      }) as unknown as NextRequest;

      const response = await PUT(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });
  });

  describe("エラーハンドリング", () => {
    it("データベースエラー時、500エラーを返すこと", async () => {
      mockCustomerFindUnique.mockResolvedValue(mockCustomerData);
      mockCustomerFindFirst.mockResolvedValue(null);
      mockCustomerUpdate.mockRejectedValue(new Error("Database error"));

      const request = createRequest("1", {
        customer_name: "テスト顧客",
      });

      const response = await PUT(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("INTERNAL_ERROR");
    });
  });
});

describe("Customers API - DELETE /api/v1/customers/{id}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createRequest = (id: string): NextRequest => {
    return new Request(`http://localhost/api/v1/customers/${id}`, {
      method: "DELETE",
    }) as unknown as NextRequest;
  };

  describe("顧客削除 - 正常系 (UT-CST-006)", () => {
    it("訪問記録で使用されていない顧客を削除できること", async () => {
      mockCustomerFindUnique.mockResolvedValue(mockCustomerData);
      mockVisitRecordCount.mockResolvedValue(0);
      mockCustomerDelete.mockResolvedValue(mockCustomerData);

      const request = createRequest("1");
      const response = await DELETE(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toBe("顧客を削除しました");
    });
  });

  describe("顧客削除 - 使用中チェック (UT-CST-007)", () => {
    it("訪問記録で使用されている顧客は削除できないこと", async () => {
      mockCustomerFindUnique.mockResolvedValue(mockCustomerData);
      mockVisitRecordCount.mockResolvedValue(5); // 訪問記録で使用中

      const request = createRequest("1");
      const response = await DELETE(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("RESOURCE_IN_USE");
      expect(body.error.message).toContain(
        "訪問記録で使用されているため削除できません"
      );
    });
  });

  describe("顧客削除 - 存在チェック", () => {
    it("存在しない顧客を削除しようとした場合、404エラーを返すこと", async () => {
      mockCustomerFindUnique.mockResolvedValue(null);

      const request = createRequest("999");
      const response = await DELETE(request, createContext("999"));
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("RESOURCE_NOT_FOUND");
    });
  });

  describe("顧客削除 - バリデーションエラー", () => {
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

  describe("エラーハンドリング", () => {
    it("データベースエラー時、500エラーを返すこと", async () => {
      mockCustomerFindUnique.mockResolvedValue(mockCustomerData);
      mockVisitRecordCount.mockResolvedValue(0);
      mockCustomerDelete.mockRejectedValue(new Error("Database error"));

      const request = createRequest("1");
      const response = await DELETE(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("INTERNAL_ERROR");
    });
  });
});
