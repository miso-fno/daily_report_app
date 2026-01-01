/**
 * コメントAPIのZodバリデーションスキーマ
 *
 * コメントの作成・削除時のバリデーションルールを定義
 */

import { z } from "zod";

import { CommonSchemas } from "../validation";

/**
 * コメント作成用リクエストボディスキーマ
 *
 * バリデーションルール:
 * - comment_text: 必須、1-500文字
 */
export const CreateCommentSchema = z.object({
  comment_text: z
    .string()
    .min(1, "コメント内容は必須です")
    .max(500, "コメント内容は500文字以内で入力してください"),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;

/**
 * コメントIDパスパラメータスキーマ
 */
export const CommentIdParamSchema = z.object({
  id: CommonSchemas.positiveInt,
});

export type CommentIdParam = z.infer<typeof CommentIdParamSchema>;

/**
 * 日報IDパスパラメータスキーマ（コメントAPI用）
 */
export const ReportIdParamSchema = z.object({
  id: CommonSchemas.positiveInt,
});

export type ReportIdParam = z.infer<typeof ReportIdParamSchema>;

/**
 * コメントレスポンス型
 */
export interface CommentResponse {
  comment_id: number;
  report_id: number;
  sales_person_id: number;
  sales_person_name: string;
  comment_text: string;
  created_at: string;
  updated_at: string;
}

/**
 * コメント作成レスポンス型
 */
export interface CreateCommentResponse {
  comment_id: number;
  report_id: number;
  created_at: string;
}

/**
 * コメント削除レスポンス型
 */
export interface DeleteCommentResponse {
  comment_id: number;
}
