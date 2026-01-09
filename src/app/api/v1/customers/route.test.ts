/**
 * 顧客マスタAPI - 一覧取得・新規作成のユニットテスト
 *
 * テスト対象:
 * - GET /api/v1/customers - 顧客一覧取得 (UT-CST-001, UT-CST-002)
 * - POST /api/v1/customers - 顧客新規作成 (UT-CST-003, UT-CST-004)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "./route";

import type { NextRequest } from "next/server";

// Prismaモック
const mockCustomerFindMany = vi.fn();
const mockCustomerFindFirst = vi.fn();
const mockCustomerCount = vi.fn();
const mockCustomerCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    customer: {
      findMany: (...args: unknown[]) => mockCustomerFindMany(...args),
      findFirst: (...args: unknown[]) => mockCustomerFindFirst(...args),
      count: (...args: unknown[]) => mockCustomerCount(...args),
      create: (...args: unknown[]) => mockCustomerCreate(...args),
    },
  },
}));

describe("Customers API - GET /api/v1/customers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createRequest = (params: Record<string, string> = {}): NextRequest => {
    const searchParams = new URLSearchParams(params);
    const url = `http://localhost/api/v1/customers?${searchParams.toString()}`;
    return new Request(url, { method: "GET" }) as unknown as NextRequest;
  };

  describe("顧客一覧表示 (UT-CST-001)", () => {
    it("顧客一覧が正しく取得できること", async () => {
      const mockCustomers = [
        {
          id: 1,
          customerName: "株式会社テスト",
          address: "東京都渋谷区",
          phone: "03-1234-5678",
          contactPerson: "山田太郎",
          createdAt: new Date("2024-01-10T09:00:00Z"),
          updatedAt: new Date("2024-01-10T09:00:00Z"),
        },
        {
          id: 2,
          customerName: "株式会社サンプル",
          address: "大阪府大阪市",
          phone: "06-9876-5432",
          contactPerson: "佐藤花子",
          createdAt: new Date("2024-01-11T10:00:00Z"),
          updatedAt: new Date("2024-01-11T10:00:00Z"),
        },
      ];

      mockCustomerCount.mockResolvedValue(2);
      mockCustomerFindMany.mockResolvedValue(mockCustomers);

      const request = createRequest();
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(2);
      expect(body.data.items[0]).toMatchObject({
        customer_id: 1,
        customer_name: "株式会社テスト",
        address: "東京都渋谷区",
        phone: "03-1234-5678",
        contact_person: "山田太郎",
      });
      expect(body.data.items[1]).toMatchObject({
        customer_id: 2,
        customer_name: "株式会社サンプル",
        address: "大阪府大阪市",
        phone: "06-9876-5432",
        contact_person: "佐藤花子",
      });
      expect(body.data.pagination.total).toBe(2);
    });

    it("顧客が0件の場合、空配列を返すこと", async () => {
      mockCustomerCount.mockResolvedValue(0);
      mockCustomerFindMany.mockResolvedValue([]);

      const request = createRequest();
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(0);
      expect(body.data.pagination.total).toBe(0);
      expect(body.data.pagination.from).toBe(0);
      expect(body.data.pagination.to).toBe(0);
    });

    it("ページネーション情報が正しく返されること", async () => {
      mockCustomerCount.mockResolvedValue(50);
      mockCustomerFindMany.mockResolvedValue([]);

      const request = createRequest({ page: "2", per_page: "10" });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data.pagination).toMatchObject({
        current_page: 2,
        per_page: 10,
        total: 50,
        last_page: 5,
        from: 11,
        to: 20,
      });
    });
  });

  describe("顧客検索 (UT-CST-002)", () => {
    it("顧客名で検索できること", async () => {
      const mockCustomers = [
        {
          id: 1,
          customerName: "株式会社テスト",
          address: "東京都渋谷区",
          phone: "03-1234-5678",
          contactPerson: "山田太郎",
          createdAt: new Date("2024-01-10T09:00:00Z"),
          updatedAt: new Date("2024-01-10T09:00:00Z"),
        },
      ];

      mockCustomerCount.mockResolvedValue(1);
      mockCustomerFindMany.mockResolvedValue(mockCustomers);

      const request = createRequest({ customer_name: "テスト" });
      await GET(request);

      // countとfindManyに検索条件が渡されていることを確認
      expect(mockCustomerCount).toHaveBeenCalled();
      const countCall = mockCustomerCount.mock.calls[0]![0];
      expect(countCall.where.customerName).toMatchObject({
        contains: "テスト",
        mode: "insensitive",
      });

      expect(mockCustomerFindMany).toHaveBeenCalled();
      const findCall = mockCustomerFindMany.mock.calls[0]![0];
      expect(findCall.where.customerName).toMatchObject({
        contains: "テスト",
        mode: "insensitive",
      });
    });

    it("検索結果が0件の場合、空配列を返すこと", async () => {
      mockCustomerCount.mockResolvedValue(0);
      mockCustomerFindMany.mockResolvedValue([]);

      const request = createRequest({ customer_name: "存在しない顧客" });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.items).toHaveLength(0);
    });
  });

  describe("ソート機能", () => {
    beforeEach(() => {
      mockCustomerCount.mockResolvedValue(0);
      mockCustomerFindMany.mockResolvedValue([]);
    });

    it("顧客名で昇順ソートできること", async () => {
      const request = createRequest({ sort: "customer_name", order: "asc" });
      await GET(request);

      const findCall = mockCustomerFindMany.mock.calls[0]![0];
      expect(findCall.orderBy.customerName).toBe("asc");
    });

    it("作成日時で降順ソートできること（デフォルト）", async () => {
      const request = createRequest();
      await GET(request);

      const findCall = mockCustomerFindMany.mock.calls[0]![0];
      expect(findCall.orderBy.createdAt).toBe("desc");
    });
  });

  describe("バリデーションエラー", () => {
    it("不正なページ番号の場合、バリデーションエラーになること", async () => {
      const request = createRequest({ page: "0" });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("不正なper_pageの場合、バリデーションエラーになること", async () => {
      const request = createRequest({ per_page: "150" });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("不正なソート列の場合、バリデーションエラーになること", async () => {
      const request = createRequest({ sort: "invalid_column" });
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });
  });

  describe("エラーハンドリング", () => {
    it("データベースエラー時、500エラーを返すこと", async () => {
      mockCustomerCount.mockRejectedValue(new Error("Database error"));

      const request = createRequest();
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("INTERNAL_ERROR");
    });
  });
});

describe("Customers API - POST /api/v1/customers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createRequest = (body: unknown): NextRequest => {
    return new Request("http://localhost/api/v1/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }) as unknown as NextRequest;
  };

  describe("顧客登録 - 正常系 (UT-CST-003)", () => {
    it("全項目入力で顧客を新規作成できること", async () => {
      mockCustomerFindFirst.mockResolvedValue(null); // 重複なし

      const mockCreatedCustomer = {
        id: 1,
        customerName: "株式会社新規",
        address: "東京都千代田区",
        phone: "03-1234-5678",
        contactPerson: "新規太郎",
        createdAt: new Date("2024-01-15T10:00:00Z"),
        updatedAt: new Date("2024-01-15T10:00:00Z"),
      };
      mockCustomerCreate.mockResolvedValue(mockCreatedCustomer);

      const request = createRequest({
        customer_name: "株式会社新規",
        address: "東京都千代田区",
        phone: "03-1234-5678",
        contact_person: "新規太郎",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.message).toBe("顧客を作成しました");
      expect(body.data).toMatchObject({
        customer_id: 1,
        customer_name: "株式会社新規",
        address: "東京都千代田区",
        phone: "03-1234-5678",
        contact_person: "新規太郎",
      });
    });

    it("必須項目のみで顧客を新規作成できること", async () => {
      mockCustomerFindFirst.mockResolvedValue(null);

      const mockCreatedCustomer = {
        id: 2,
        customerName: "最小項目顧客",
        address: null,
        phone: null,
        contactPerson: null,
        createdAt: new Date("2024-01-15T10:00:00Z"),
        updatedAt: new Date("2024-01-15T10:00:00Z"),
      };
      mockCustomerCreate.mockResolvedValue(mockCreatedCustomer);

      const request = createRequest({
        customer_name: "最小項目顧客",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.data.customer_name).toBe("最小項目顧客");
      expect(body.data.address).toBeNull();
      expect(body.data.phone).toBeNull();
      expect(body.data.contact_person).toBeNull();
    });
  });

  describe("顧客登録 - 重複チェック (UT-CST-004)", () => {
    it("顧客名が重複する場合、エラーを返すこと", async () => {
      mockCustomerFindFirst.mockResolvedValue({
        id: 1,
        customerName: "株式会社既存",
      });

      const request = createRequest({
        customer_name: "株式会社既存",
        address: "東京都渋谷区",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("DUPLICATE_ENTRY");
      expect(body.error.message).toContain("顧客名は既に登録されています");
    });
  });

  describe("顧客登録 - バリデーションエラー", () => {
    it("顧客名が空の場合、バリデーションエラーになること", async () => {
      const request = createRequest({
        customer_name: "",
        address: "東京都渋谷区",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining("顧客名は必須です"),
          }),
        ])
      );
    });

    it("顧客名が100文字を超える場合、バリデーションエラーになること", async () => {
      const longName = "あ".repeat(101);

      const request = createRequest({
        customer_name: longName,
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining("100文字以内"),
          }),
        ])
      );
    });

    it("住所が200文字を超える場合、バリデーションエラーになること", async () => {
      const longAddress = "あ".repeat(201);

      const request = createRequest({
        customer_name: "テスト顧客",
        address: longAddress,
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining("200文字以内"),
          }),
        ])
      );
    });

    it("不正な電話番号形式の場合、バリデーションエラーになること", async () => {
      const request = createRequest({
        customer_name: "テスト顧客",
        phone: "invalid-phone",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining("電話番号の形式"),
          }),
        ])
      );
    });

    it("担当者名が50文字を超える場合、バリデーションエラーになること", async () => {
      const longContactPerson = "あ".repeat(51);

      const request = createRequest({
        customer_name: "テスト顧客",
        contact_person: longContactPerson,
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining("50文字以内"),
          }),
        ])
      );
    });

    it("リクエストボディが不正なJSONの場合、バリデーションエラーになること", async () => {
      const request = new Request("http://localhost/api/v1/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json",
      }) as unknown as NextRequest;

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });
  });

  describe("顧客登録 - 電話番号形式", () => {
    beforeEach(() => {
      mockCustomerFindFirst.mockResolvedValue(null);
    });

    it("固定電話形式（ハイフンあり）を受け付けること", async () => {
      const mockCreatedCustomer = {
        id: 1,
        customerName: "テスト顧客",
        address: null,
        phone: "03-1234-5678",
        contactPerson: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockCustomerCreate.mockResolvedValue(mockCreatedCustomer);

      const request = createRequest({
        customer_name: "テスト顧客",
        phone: "03-1234-5678",
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });

    it("携帯電話形式（ハイフンあり）を受け付けること", async () => {
      const mockCreatedCustomer = {
        id: 1,
        customerName: "テスト顧客",
        address: null,
        phone: "090-1234-5678",
        contactPerson: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockCustomerCreate.mockResolvedValue(mockCreatedCustomer);

      const request = createRequest({
        customer_name: "テスト顧客",
        phone: "090-1234-5678",
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
    });
  });

  describe("エラーハンドリング", () => {
    it("データベースエラー時、500エラーを返すこと", async () => {
      mockCustomerFindFirst.mockResolvedValue(null);
      mockCustomerCreate.mockRejectedValue(new Error("Database error"));

      const request = createRequest({
        customer_name: "テスト顧客",
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe("INTERNAL_ERROR");
    });
  });
});
