/**
 * 営業担当者マスタAPIのZodバリデーションスキーマ
 */

import { z } from "zod";

import { CommonSchemas } from "../validation";

/**
 * 営業担当者一覧取得用クエリパラメータスキーマ
 */
export const SalesPersonsQuerySchema = z.object({
  name: z.string().optional(),
  department: z.string().optional(),
  is_manager: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined || val === "") {
        return undefined;
      }
      return val === "true";
    }),
  page: CommonSchemas.page,
  per_page: CommonSchemas.perPage,
});

export type SalesPersonsQuery = z.infer<typeof SalesPersonsQuerySchema>;

/**
 * 営業担当者作成用リクエストボディスキーマ
 */
export const CreateSalesPersonSchema = z.object({
  name: z
    .string()
    .min(1, "氏名は必須です")
    .max(50, "氏名は50文字以内で入力してください"),
  email: CommonSchemas.email,
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
  department: z
    .string()
    .min(1, "部署は必須です")
    .max(100, "部署は100文字以内で入力してください"),
  manager_id: z.number().int().positive().nullable().optional(),
  is_manager: z.boolean(),
});

export type CreateSalesPersonInput = z.infer<typeof CreateSalesPersonSchema>;

/**
 * 営業担当者更新用リクエストボディスキーマ
 */
export const UpdateSalesPersonSchema = z.object({
  name: z
    .string()
    .min(1, "氏名は必須です")
    .max(50, "氏名は50文字以内で入力してください"),
  email: CommonSchemas.email,
  password: z
    .string()
    .min(8, "パスワードは8文字以上で入力してください")
    .optional(),
  department: z
    .string()
    .min(1, "部署は必須です")
    .max(100, "部署は100文字以内で入力してください"),
  manager_id: z.number().int().positive().nullable().optional(),
  is_manager: z.boolean(),
});

export type UpdateSalesPersonInput = z.infer<typeof UpdateSalesPersonSchema>;

/**
 * 営業担当者IDパスパラメータスキーマ
 */
export const SalesPersonIdParamSchema = z.object({
  id: CommonSchemas.positiveInt,
});

export type SalesPersonIdParam = z.infer<typeof SalesPersonIdParamSchema>;

/**
 * 営業担当者レスポンス型（パスワードを除外）
 */
export interface SalesPersonResponse {
  sales_person_id: number;
  name: string;
  email: string;
  department: string;
  manager_id: number | null;
  manager_name: string | null;
  is_manager: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 営業担当者一覧レスポンス型
 */
export interface SalesPersonListItem {
  sales_person_id: number;
  name: string;
  email: string;
  department: string;
  manager_id: number | null;
  manager_name: string | null;
  is_manager: boolean;
}
