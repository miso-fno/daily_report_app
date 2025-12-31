/**
 * Zodバリデーション共通処理
 *
 * Zodスキーマを使用したリクエストボディのバリデーションを提供します
 */

import { z } from "zod";

import { ApiError, ErrorCode } from "./errors";

import type { ErrorDetail } from "./response";
import type { ZodError, ZodSchema } from "zod";

/**
 * ZodエラーをAPIエラー詳細形式に変換
 *
 * @param zodError Zodのエラーオブジェクト
 * @returns ErrorDetail配列
 */
export function zodErrorToDetails(zodError: ZodError): ErrorDetail[] {
  return zodError.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
}

/**
 * Zodスキーマでデータをバリデーション
 *
 * @param schema Zodスキーマ
 * @param data バリデーション対象のデータ
 * @returns バリデーション済みデータ
 * @throws ApiError バリデーションエラー時
 */
export function validateWithSchema<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const details = zodErrorToDetails(result.error);
    throw new ApiError(
      ErrorCode.VALIDATION_ERROR,
      "入力内容に誤りがあります",
      details
    );
  }

  return result.data;
}

/**
 * リクエストボディのJSONパースとバリデーション
 *
 * @param request Request オブジェクト
 * @param schema Zodスキーマ
 * @returns バリデーション済みデータ
 * @throws ApiError JSONパースエラーまたはバリデーションエラー時
 */
export async function parseAndValidateBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<T> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ApiError(
      ErrorCode.VALIDATION_ERROR,
      "リクエストボディのJSONパースに失敗しました"
    );
  }

  return validateWithSchema(schema, body);
}

/**
 * URLSearchParamsをオブジェクトに変換
 *
 * @param searchParams URLSearchParams
 * @returns パラメータオブジェクト
 */
export function searchParamsToObject(
  searchParams: URLSearchParams
): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};

  searchParams.forEach((value, key) => {
    const existing = result[key];
    if (existing !== undefined) {
      // 同じキーが複数ある場合は配列にする
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        result[key] = [existing, value];
      }
    } else {
      result[key] = value;
    }
  });

  return result;
}

/**
 * クエリパラメータのバリデーション
 *
 * @param searchParams URLSearchParams
 * @param schema Zodスキーマ
 * @returns バリデーション済みデータ
 * @throws ApiError バリデーションエラー時
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): T {
  const params = searchParamsToObject(searchParams);
  return validateWithSchema(schema, params);
}

/**
 * パスパラメータのバリデーション
 *
 * @param params パスパラメータオブジェクト
 * @param schema Zodスキーマ
 * @returns バリデーション済みデータ
 * @throws ApiError バリデーションエラー時
 */
export function validatePathParams<T>(
  params: Record<string, string | string[]>,
  schema: ZodSchema<T>
): T {
  return validateWithSchema(schema, params);
}

/**
 * 共通のバリデーションスキーマ
 */
export const CommonSchemas = {
  /** ID (UUID形式) */
  uuid: z.string().uuid("有効なUUID形式で入力してください"),

  /** ID (正の整数) */
  positiveInt: z.coerce
    .number()
    .int("整数で入力してください")
    .positive("正の整数で入力してください"),

  /** ページ番号 */
  page: z.coerce
    .number()
    .int("ページ番号は整数で入力してください")
    .min(1, "ページ番号は1以上で入力してください")
    .default(1),

  /** 1ページあたりのアイテム数 */
  perPage: z.coerce
    .number()
    .int("表示件数は整数で入力してください")
    .min(1, "表示件数は1以上で入力してください")
    .max(100, "表示件数は100以下で入力してください")
    .default(20),

  /** メールアドレス */
  email: z.string().email("有効なメールアドレスを入力してください"),

  /** 必須文字列 */
  requiredString: z.string().min(1, "この項目は必須です"),

  /** オプション文字列 (空文字を null として扱う) */
  optionalString: z
    .string()
    .optional()
    .transform((val) => (val === "" ? undefined : val)),

  /** 日付文字列 (ISO 8601形式) */
  dateString: z.string().datetime("有効な日時形式で入力してください"),

  /** 日付のみ (YYYY-MM-DD形式) */
  dateOnly: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD形式で入力してください"),

  /** ソート順 */
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
};

/**
 * ページネーションクエリパラメータのスキーマ
 */
export const PaginationQuerySchema = z.object({
  page: CommonSchemas.page,
  per_page: CommonSchemas.perPage,
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
