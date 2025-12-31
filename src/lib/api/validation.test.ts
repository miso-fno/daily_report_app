/**
 * Zodバリデーション共通処理のテスト
 */

import { z } from "zod";

import { ApiError, ErrorCode } from "./errors";
import {
  CommonSchemas,
  PaginationQuerySchema,
  parseAndValidateBody,
  searchParamsToObject,
  validatePathParams,
  validateQueryParams,
  validateWithSchema,
  zodErrorToDetails,
} from "./validation";

describe("zodErrorToDetails", () => {
  it("Zodエラーを正しい形式に変換する", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const result = schema.safeParse({ name: 123, age: "invalid" });

    if (result.success) {
      throw new Error("バリデーションが成功すべきではない");
    }

    const details = zodErrorToDetails(result.error);

    expect(details.length).toBe(2);
    expect(details[0]).toEqual({
      field: "name",
      message: expect.any(String),
      code: "invalid_type",
    });
    expect(details[1]).toEqual({
      field: "age",
      message: expect.any(String),
      code: "invalid_type",
    });
  });

  it("ネストしたパスを正しく変換する", () => {
    const schema = z.object({
      user: z.object({
        profile: z.object({
          email: z.string().email(),
        }),
      }),
    });

    const result = schema.safeParse({
      user: { profile: { email: "invalid" } },
    });

    if (result.success) {
      throw new Error("バリデーションが成功すべきではない");
    }

    const details = zodErrorToDetails(result.error);

    expect(details[0]?.field).toBe("user.profile.email");
  });

  it("配列のインデックスを含むパスを変換する", () => {
    const schema = z.object({
      items: z.array(z.string()),
    });

    const result = schema.safeParse({
      items: ["valid", 123, "also valid"],
    });

    if (result.success) {
      throw new Error("バリデーションが成功すべきではない");
    }

    const details = zodErrorToDetails(result.error);

    expect(details[0]?.field).toBe("items.1");
  });
});

describe("validateWithSchema", () => {
  it("有効なデータをそのまま返す", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const data = { name: "山田太郎", age: 30 };
    const result = validateWithSchema(schema, data);

    expect(result).toEqual(data);
  });

  it("無効なデータの場合ApiErrorをスローする", () => {
    const schema = z.object({
      name: z.string(),
    });

    expect(() => validateWithSchema(schema, { name: 123 })).toThrow(ApiError);
  });

  it("スローされるApiErrorが正しいコードを持つ", () => {
    const schema = z.object({
      name: z.string(),
    });

    try {
      validateWithSchema(schema, { name: 123 });
      throw new Error("例外がスローされるべき");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(error.statusCode).toBe(422);
        expect(error.details).toBeDefined();
      }
    }
  });

  it("スキーマの変換が適用される", () => {
    const schema = z.object({
      count: z.coerce.number(),
    });

    const result = validateWithSchema(schema, { count: "42" });

    expect(result.count).toBe(42);
  });
});

describe("parseAndValidateBody", () => {
  it("有効なJSONボディをパースして検証する", async () => {
    const schema = z.object({
      name: z.string(),
    });

    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "テスト" }),
    });

    const result = await parseAndValidateBody(request, schema);

    expect(result).toEqual({ name: "テスト" });
  });

  it("無効なJSONの場合ApiErrorをスローする", async () => {
    const schema = z.object({
      name: z.string(),
    });

    const request = new Request("http://localhost", {
      method: "POST",
      body: "invalid json",
    });

    await expect(parseAndValidateBody(request, schema)).rejects.toThrow(
      ApiError
    );
  });

  it("JSONパースエラー時の正しいエラーメッセージ", async () => {
    const schema = z.object({});

    const request = new Request("http://localhost", {
      method: "POST",
      body: "not json",
    });

    try {
      await parseAndValidateBody(request, schema);
      throw new Error("例外がスローされるべき");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      if (error instanceof ApiError) {
        expect(error.message).toBe(
          "リクエストボディのJSONパースに失敗しました"
        );
      }
    }
  });

  it("バリデーションエラーの場合ApiErrorをスローする", async () => {
    const schema = z.object({
      email: z.string().email(),
    });

    const request = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ email: "invalid" }),
    });

    await expect(parseAndValidateBody(request, schema)).rejects.toThrow(
      ApiError
    );
  });
});

describe("searchParamsToObject", () => {
  it("URLSearchParamsをオブジェクトに変換する", () => {
    const params = new URLSearchParams("name=test&page=1");
    const result = searchParamsToObject(params);

    expect(result).toEqual({
      name: "test",
      page: "1",
    });
  });

  it("同じキーが複数ある場合は配列にする", () => {
    const params = new URLSearchParams(
      "tag=javascript&tag=typescript&tag=react"
    );
    const result = searchParamsToObject(params);

    expect(result).toEqual({
      tag: ["javascript", "typescript", "react"],
    });
  });

  it("空のURLSearchParamsは空オブジェクトを返す", () => {
    const params = new URLSearchParams("");
    const result = searchParamsToObject(params);

    expect(result).toEqual({});
  });
});

describe("validateQueryParams", () => {
  it("クエリパラメータを検証してパースする", () => {
    const schema = z.object({
      page: z.coerce.number(),
      search: z.string().optional(),
    });

    const params = new URLSearchParams("page=2&search=test");
    const result = validateQueryParams(params, schema);

    expect(result).toEqual({
      page: 2,
      search: "test",
    });
  });

  it("無効なパラメータの場合ApiErrorをスローする", () => {
    const schema = z.object({
      page: z.coerce.number().positive(),
    });

    const params = new URLSearchParams("page=-1");

    expect(() => validateQueryParams(params, schema)).toThrow(ApiError);
  });
});

describe("validatePathParams", () => {
  it("パスパラメータを検証する", () => {
    const schema = z.object({
      id: z.string().uuid(),
    });

    const params = { id: "550e8400-e29b-41d4-a716-446655440000" };
    const result = validatePathParams(params, schema);

    expect(result).toEqual(params);
  });

  it("無効なパスパラメータの場合ApiErrorをスローする", () => {
    const schema = z.object({
      id: z.string().uuid(),
    });

    const params = { id: "not-a-uuid" };

    expect(() => validatePathParams(params, schema)).toThrow(ApiError);
  });
});

describe("CommonSchemas", () => {
  describe("uuid", () => {
    it("有効なUUIDを受け入れる", () => {
      const result = CommonSchemas.uuid.safeParse(
        "550e8400-e29b-41d4-a716-446655440000"
      );
      expect(result.success).toBe(true);
    });

    it("無効なUUIDを拒否する", () => {
      const result = CommonSchemas.uuid.safeParse("not-a-uuid");
      expect(result.success).toBe(false);
    });
  });

  describe("positiveInt", () => {
    it("正の整数を受け入れる", () => {
      const result = CommonSchemas.positiveInt.safeParse(42);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it("文字列を数値に変換する", () => {
      const result = CommonSchemas.positiveInt.safeParse("42");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it("0を拒否する", () => {
      const result = CommonSchemas.positiveInt.safeParse(0);
      expect(result.success).toBe(false);
    });

    it("負の数を拒否する", () => {
      const result = CommonSchemas.positiveInt.safeParse(-1);
      expect(result.success).toBe(false);
    });

    it("小数を拒否する", () => {
      const result = CommonSchemas.positiveInt.safeParse(3.14);
      expect(result.success).toBe(false);
    });
  });

  describe("page", () => {
    it("有効なページ番号を受け入れる", () => {
      const result = CommonSchemas.page.safeParse(5);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(5);
      }
    });

    it("デフォルト値として1を使用する", () => {
      const result = CommonSchemas.page.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(1);
      }
    });

    it("0を拒否する", () => {
      const result = CommonSchemas.page.safeParse(0);
      expect(result.success).toBe(false);
    });
  });

  describe("perPage", () => {
    it("有効な表示件数を受け入れる", () => {
      const result = CommonSchemas.perPage.safeParse(50);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(50);
      }
    });

    it("デフォルト値として20を使用する", () => {
      const result = CommonSchemas.perPage.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(20);
      }
    });

    it("100を超える値を拒否する", () => {
      const result = CommonSchemas.perPage.safeParse(101);
      expect(result.success).toBe(false);
    });

    it("0を拒否する", () => {
      const result = CommonSchemas.perPage.safeParse(0);
      expect(result.success).toBe(false);
    });
  });

  describe("email", () => {
    it("有効なメールアドレスを受け入れる", () => {
      const result = CommonSchemas.email.safeParse("test@example.com");
      expect(result.success).toBe(true);
    });

    it("無効なメールアドレスを拒否する", () => {
      const result = CommonSchemas.email.safeParse("invalid-email");
      expect(result.success).toBe(false);
    });
  });

  describe("requiredString", () => {
    it("空でない文字列を受け入れる", () => {
      const result = CommonSchemas.requiredString.safeParse("hello");
      expect(result.success).toBe(true);
    });

    it("空文字列を拒否する", () => {
      const result = CommonSchemas.requiredString.safeParse("");
      expect(result.success).toBe(false);
    });
  });

  describe("optionalString", () => {
    it("文字列を受け入れる", () => {
      const result = CommonSchemas.optionalString.safeParse("hello");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("hello");
      }
    });

    it("空文字列をundefinedに変換する", () => {
      const result = CommonSchemas.optionalString.safeParse("");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });

    it("undefinedを受け入れる", () => {
      const result = CommonSchemas.optionalString.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeUndefined();
      }
    });
  });

  describe("dateString", () => {
    it("有効なISO 8601形式の日時を受け入れる", () => {
      const result = CommonSchemas.dateString.safeParse(
        "2024-01-15T10:30:00.000Z"
      );
      expect(result.success).toBe(true);
    });

    it("無効な日時形式を拒否する", () => {
      const result = CommonSchemas.dateString.safeParse("2024-01-15");
      expect(result.success).toBe(false);
    });
  });

  describe("dateOnly", () => {
    it("有効なYYYY-MM-DD形式を受け入れる", () => {
      const result = CommonSchemas.dateOnly.safeParse("2024-01-15");
      expect(result.success).toBe(true);
    });

    it("無効な形式を拒否する", () => {
      const result = CommonSchemas.dateOnly.safeParse("2024/01/15");
      expect(result.success).toBe(false);
    });

    it("日時形式を拒否する", () => {
      const result = CommonSchemas.dateOnly.safeParse("2024-01-15T10:30:00Z");
      expect(result.success).toBe(false);
    });
  });

  describe("sortOrder", () => {
    it("ascを受け入れる", () => {
      const result = CommonSchemas.sortOrder.safeParse("asc");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("asc");
      }
    });

    it("descを受け入れる", () => {
      const result = CommonSchemas.sortOrder.safeParse("desc");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("desc");
      }
    });

    it("デフォルト値としてdescを使用する", () => {
      const result = CommonSchemas.sortOrder.safeParse(undefined);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("desc");
      }
    });

    it("無効な値を拒否する", () => {
      const result = CommonSchemas.sortOrder.safeParse("ascending");
      expect(result.success).toBe(false);
    });
  });
});

describe("PaginationQuerySchema", () => {
  it("有効なページネーションパラメータを受け入れる", () => {
    const result = PaginationQuerySchema.safeParse({
      page: 2,
      per_page: 50,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        page: 2,
        per_page: 50,
      });
    }
  });

  it("文字列を数値に変換する", () => {
    const result = PaginationQuerySchema.safeParse({
      page: "3",
      per_page: "25",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        page: 3,
        per_page: 25,
      });
    }
  });

  it("デフォルト値を適用する", () => {
    const result = PaginationQuerySchema.safeParse({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        page: 1,
        per_page: 20,
      });
    }
  });

  it("無効なページ番号を拒否する", () => {
    const result = PaginationQuerySchema.safeParse({
      page: 0,
    });

    expect(result.success).toBe(false);
  });

  it("範囲外のper_pageを拒否する", () => {
    const result = PaginationQuerySchema.safeParse({
      per_page: 200,
    });

    expect(result.success).toBe(false);
  });
});
