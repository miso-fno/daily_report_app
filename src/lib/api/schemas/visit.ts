/**
 * 訪問記録APIのZodバリデーションスキーマ
 *
 * 訪問記録の作成・更新時のバリデーションルールを定義
 */

import { z } from "zod";

import { CommonSchemas } from "../validation";

/**
 * 訪問時間のバリデーションスキーマ
 * HH:MM形式（00:00-23:59）
 */
export const VisitTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "HH:MM形式で入力してください")
  .nullable()
  .optional();

/**
 * 訪問記録作成用リクエストボディスキーマ
 */
export const CreateVisitSchema = z.object({
  customer_id: z.number().int().positive("顧客を選択してください"),
  visit_time: VisitTimeSchema,
  visit_purpose: z
    .string()
    .max(100, "訪問目的は100文字以内で入力してください")
    .nullable()
    .optional(),
  visit_content: z
    .string()
    .min(1, "訪問内容は必須です")
    .max(1000, "訪問内容は1000文字以内で入力してください"),
  visit_result: z
    .string()
    .max(200, "訪問結果は200文字以内で入力してください")
    .nullable()
    .optional(),
});

export type CreateVisitInput = z.infer<typeof CreateVisitSchema>;

/**
 * 訪問記録更新用リクエストボディスキーマ
 * 作成スキーマと同じだが、将来的に部分更新に対応できるよう分離
 */
export const UpdateVisitSchema = z.object({
  customer_id: z.number().int().positive("顧客を選択してください"),
  visit_time: VisitTimeSchema,
  visit_purpose: z
    .string()
    .max(100, "訪問目的は100文字以内で入力してください")
    .nullable()
    .optional(),
  visit_content: z
    .string()
    .min(1, "訪問内容は必須です")
    .max(1000, "訪問内容は1000文字以内で入力してください"),
  visit_result: z
    .string()
    .max(200, "訪問結果は200文字以内で入力してください")
    .nullable()
    .optional(),
});

export type UpdateVisitInput = z.infer<typeof UpdateVisitSchema>;

/**
 * 訪問記録IDパスパラメータスキーマ
 */
export const VisitIdParamSchema = z.object({
  id: CommonSchemas.positiveInt,
});

export type VisitIdParam = z.infer<typeof VisitIdParamSchema>;

/**
 * 日報IDパスパラメータスキーマ（訪問記録API用）
 */
export const ReportIdParamSchema = z.object({
  id: CommonSchemas.positiveInt,
});

export type ReportIdParam = z.infer<typeof ReportIdParamSchema>;

/**
 * 訪問記録レスポンス型
 */
export interface VisitRecordResponse {
  visit_id: number;
  customer_id: number;
  customer_name: string;
  visit_time: string | null;
  visit_purpose: string | null;
  visit_content: string;
  visit_result: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 訪問記録作成レスポンス型
 */
export interface CreateVisitResponse {
  visit_id: number;
  report_id: number;
  customer_id: number;
  customer_name: string;
  created_at: string;
}

/**
 * 訪問記録更新レスポンス型
 */
export interface UpdateVisitResponse {
  visit_id: number;
  report_id: number;
  customer_id: number;
  customer_name: string;
  updated_at: string;
}
