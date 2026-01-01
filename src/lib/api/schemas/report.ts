/**
 * 日報APIのZodバリデーションスキーマ
 */

import { z } from "zod";

import { CommonSchemas } from "../validation";

/**
 * ステータス定義
 */
export const ReportStatus = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  CONFIRMED: "confirmed",
} as const;

export type ReportStatusType = (typeof ReportStatus)[keyof typeof ReportStatus];

/**
 * ステータスラベル変換
 */
export const StatusLabels: Record<ReportStatusType, string> = {
  [ReportStatus.DRAFT]: "下書き",
  [ReportStatus.SUBMITTED]: "提出済",
  [ReportStatus.CONFIRMED]: "確認済",
};

/**
 * ステータスをラベルに変換
 */
export function getStatusLabel(status: ReportStatusType): string {
  return StatusLabels[status] || status;
}

/**
 * 日報一覧取得用クエリパラメータスキーマ
 */
export const ReportsQuerySchema = z.object({
  date_from: CommonSchemas.dateOnly.optional(),
  date_to: CommonSchemas.dateOnly.optional(),
  sales_person_id: z.coerce.number().int().positive().optional(),
  status: z.enum(["draft", "submitted", "confirmed"]).optional(),
  page: CommonSchemas.page,
  per_page: CommonSchemas.perPage,
  sort: z.enum(["report_date", "created_at"]).default("report_date"),
  order: CommonSchemas.sortOrder,
});

export type ReportsQuery = z.infer<typeof ReportsQuerySchema>;

/**
 * 訪問記録スキーマ（作成・更新共通）
 */
export const VisitRecordSchema = z.object({
  customer_id: z.number().int().positive("顧客を選択してください"),
  visit_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "HH:MM形式で入力してください")
    .nullable()
    .optional(),
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

export type VisitRecordInput = z.infer<typeof VisitRecordSchema>;

/**
 * 日報作成用リクエストボディスキーマ
 */
export const CreateReportSchema = z
  .object({
    report_date: CommonSchemas.dateOnly,
    problem: z
      .string()
      .max(2000, "課題・相談は2000文字以内で入力してください")
      .nullable()
      .optional(),
    plan: z
      .string()
      .max(2000, "明日の予定は2000文字以内で入力してください")
      .nullable()
      .optional(),
    status: z.enum(["draft", "submitted"]),
    visits: z.array(VisitRecordSchema).optional().default([]),
  })
  .superRefine((data, ctx) => {
    // 報告日の未来日チェック
    const reportDate = new Date(data.report_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (reportDate > today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "報告日に未来日は指定できません",
        path: ["report_date"],
      });
    }

    // 提出時は訪問記録が必須
    if (data.status === "submitted" && data.visits.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "提出時は訪問記録を1件以上登録してください",
        path: ["visits"],
      });
    }
  });

export type CreateReportInput = z.infer<typeof CreateReportSchema>;

/**
 * 日報更新用リクエストボディスキーマ
 */
export const UpdateReportSchema = z
  .object({
    report_date: CommonSchemas.dateOnly,
    problem: z
      .string()
      .max(2000, "課題・相談は2000文字以内で入力してください")
      .nullable()
      .optional(),
    plan: z
      .string()
      .max(2000, "明日の予定は2000文字以内で入力してください")
      .nullable()
      .optional(),
    status: z.enum(["draft", "submitted"]),
    visits: z.array(VisitRecordSchema).optional().default([]),
  })
  .superRefine((data, ctx) => {
    // 報告日の未来日チェック
    const reportDate = new Date(data.report_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (reportDate > today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "報告日に未来日は指定できません",
        path: ["report_date"],
      });
    }

    // 提出時は訪問記録が必須
    if (data.status === "submitted" && data.visits.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "提出時は訪問記録を1件以上登録してください",
        path: ["visits"],
      });
    }
  });

export type UpdateReportInput = z.infer<typeof UpdateReportSchema>;

/**
 * ステータス更新用リクエストボディスキーマ
 */
export const UpdateStatusSchema = z.object({
  status: z.enum(["draft", "submitted", "confirmed"]),
});

export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;

/**
 * 日報IDパスパラメータスキーマ
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
}

/**
 * コメントレスポンス型
 */
export interface CommentResponse {
  comment_id: number;
  sales_person_id: number;
  sales_person_name: string;
  comment_text: string;
  created_at: string;
}

/**
 * 日報一覧アイテムレスポンス型
 */
export interface ReportListItem {
  report_id: number;
  report_date: string;
  sales_person_id: number;
  sales_person_name: string;
  status: ReportStatusType;
  status_label: string;
  visit_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * 日報詳細レスポンス型
 */
export interface ReportDetailResponse {
  report_id: number;
  report_date: string;
  sales_person_id: number;
  sales_person_name: string;
  status: ReportStatusType;
  status_label: string;
  problem: string | null;
  plan: string | null;
  visits: VisitRecordResponse[];
  comments: CommentResponse[];
  created_at: string;
  updated_at: string;
}

/**
 * 日報作成レスポンス型
 */
export interface CreateReportResponse {
  report_id: number;
  report_date: string;
  status: ReportStatusType;
  created_at: string;
}

/**
 * 日報更新レスポンス型
 */
export interface UpdateReportResponse {
  report_id: number;
  report_date: string;
  status: ReportStatusType;
  updated_at: string;
}

/**
 * ステータス更新レスポンス型
 */
export interface UpdateStatusResponse {
  report_id: number;
  status: ReportStatusType;
  status_label: string;
  updated_at: string;
}
