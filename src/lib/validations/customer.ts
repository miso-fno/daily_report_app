/**
 * 顧客マスタのバリデーションスキーマ
 */

import { z } from "zod";

/**
 * 日本の電話番号形式の正規表現
 * - 固定電話: 03-1234-5678, 06-9876-5432 など
 * - 携帯電話: 090-1234-5678, 080-9876-5432 など
 * - ハイフンあり・なしの両方に対応
 */
const PHONE_REGEX = /^(0[0-9]{1,4}-?[0-9]{1,4}-?[0-9]{4}|0[0-9]{9,10})$/;

/**
 * 顧客作成リクエストのスキーマ
 */
export const createCustomerSchema = z.object({
  customer_name: z
    .string({
      required_error: "顧客名は必須です",
      invalid_type_error: "顧客名は文字列である必要があります",
    })
    .min(1, "顧客名は必須です")
    .max(100, "顧客名は100文字以内で入力してください"),

  address: z
    .string()
    .max(200, "住所は200文字以内で入力してください")
    .nullish()
    .transform((val) => val ?? null),

  phone: z
    .string()
    .refine((val) => !val || PHONE_REGEX.test(val), {
      message:
        "電話番号の形式が正しくありません（例: 03-1234-5678, 090-1234-5678）",
    })
    .nullish()
    .transform((val) => val ?? null),

  contact_person: z
    .string()
    .max(50, "担当者名は50文字以内で入力してください")
    .nullish()
    .transform((val) => val ?? null),
});

/**
 * 顧客更新リクエストのスキーマ
 */
export const updateCustomerSchema = z.object({
  customer_name: z
    .string({
      required_error: "顧客名は必須です",
      invalid_type_error: "顧客名は文字列である必要があります",
    })
    .min(1, "顧客名は必須です")
    .max(100, "顧客名は100文字以内で入力してください"),

  address: z
    .string()
    .max(200, "住所は200文字以内で入力してください")
    .nullish()
    .transform((val) => val ?? null),

  phone: z
    .string()
    .refine((val) => !val || PHONE_REGEX.test(val), {
      message:
        "電話番号の形式が正しくありません（例: 03-1234-5678, 090-1234-5678）",
    })
    .nullish()
    .transform((val) => val ?? null),

  contact_person: z
    .string()
    .max(50, "担当者名は50文字以内で入力してください")
    .nullish()
    .transform((val) => val ?? null),
});

/**
 * 顧客一覧取得クエリパラメータのスキーマ
 */
export const customerListQuerySchema = z.object({
  customer_name: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(["customer_name", "created_at"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * 顧客IDパラメータのスキーマ
 */
export const customerIdSchema = z.object({
  id: z.coerce.number().int().positive("顧客IDは正の整数である必要があります"),
});

/**
 * 型定義のエクスポート
 */
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;
export type CustomerIdParams = z.infer<typeof customerIdSchema>;
