/**
 * 日報のバリデーションスキーマ
 */

import { z } from "zod";

/**
 * 検索フォームのスキーマ
 */
export const searchFormSchema = z.object({
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  sales_person_id: z.string().optional(),
  status: z.string().optional(),
});

export type SearchFormValues = z.infer<typeof searchFormSchema>;

// ============================================
// 日報作成・編集フォームのスキーマ
// ============================================

/**
 * 訪問記録フォームのスキーマ
 */
export const visitRecordFormSchema = z.object({
  customer_id: z.string().min(1, "顧客を選択してください"),
  visit_time: z.string().optional(),
  visit_purpose: z
    .string()
    .max(100, "訪問目的は100文字以内で入力してください")
    .optional(),
  visit_content: z
    .string()
    .min(1, "訪問内容は必須です")
    .max(1000, "訪問内容は1000文字以内で入力してください"),
  visit_result: z
    .string()
    .max(200, "訪問結果は200文字以内で入力してください")
    .optional(),
});

export type VisitRecordFormValues = z.infer<typeof visitRecordFormSchema>;

/**
 * 日報フォームのスキーマ
 */
export const reportFormSchema = z.object({
  report_date: z.string().min(1, "報告日は必須です"),
  problem: z
    .string()
    .max(2000, "課題・相談は2000文字以内で入力してください")
    .optional(),
  plan: z
    .string()
    .max(2000, "明日の予定は2000文字以内で入力してください")
    .optional(),
  visits: z.array(visitRecordFormSchema),
});

export type ReportFormValues = z.infer<typeof reportFormSchema>;

/**
 * 日報フォームのデフォルト値
 */
export function getDefaultReportFormValues(): ReportFormValues {
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0] ?? "";
  return {
    report_date: formattedDate,
    problem: "",
    plan: "",
    visits: [],
  };
}

/**
 * 訪問記録のデフォルト値
 */
export function getDefaultVisitRecordValues(): VisitRecordFormValues {
  return {
    customer_id: "",
    visit_time: "",
    visit_purpose: "",
    visit_content: "",
    visit_result: "",
  };
}

/**
 * 報告日が未来日かどうかを検証
 * @param dateStr - YYYY-MM-DD形式の日付文字列
 * @returns エラーメッセージ。問題なければnull
 */
export function validateReportDate(dateStr: string): string | null {
  if (!dateStr) {
    return "報告日は必須です";
  }

  const reportDate = new Date(dateStr);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (reportDate > today) {
    return "報告日に未来日は指定できません";
  }

  return null;
}

/**
 * 提出時のバリデーション
 * @param values - フォーム値
 * @returns エラーメッセージの配列。問題なければ空配列
 */
export function validateForSubmission(values: ReportFormValues): string[] {
  const errors: string[] = [];

  // 報告日の検証
  const dateError = validateReportDate(values.report_date);
  if (dateError) {
    errors.push(dateError);
  }

  // 訪問記録の必須チェック
  if (values.visits.length === 0) {
    errors.push("提出時は訪問記録を1件以上登録してください");
  }

  return errors;
}

/**
 * フォーム値をAPIリクエスト形式に変換
 */
export function convertFormToApiRequest(
  formData: ReportFormValues,
  status: "draft" | "submitted"
): {
  report_date: string;
  problem: string | null;
  plan: string | null;
  status: "draft" | "submitted";
  visits: Array<{
    customer_id: number;
    visit_time: string | null;
    visit_purpose: string | null;
    visit_content: string;
    visit_result: string | null;
  }>;
} {
  return {
    report_date: formData.report_date,
    problem: formData.problem || null,
    plan: formData.plan || null,
    status,
    visits: formData.visits.map((visit) => ({
      customer_id: parseInt(visit.customer_id, 10),
      visit_time: visit.visit_time || null,
      visit_purpose: visit.visit_purpose || null,
      visit_content: visit.visit_content,
      visit_result: visit.visit_result || null,
    })),
  };
}

/**
 * 検索フォーム値をAPIリクエスト形式に変換
 */
export function convertSearchFormToParams(formData: SearchFormValues): {
  date_from?: string;
  date_to?: string;
  sales_person_id?: number;
  status?: string;
} {
  const result: {
    date_from?: string;
    date_to?: string;
    sales_person_id?: number;
    status?: string;
  } = {};

  if (formData.date_from) {
    result.date_from = formData.date_from;
  }
  if (formData.date_to) {
    result.date_to = formData.date_to;
  }
  if (
    formData.sales_person_id &&
    formData.sales_person_id !== "" &&
    formData.sales_person_id !== "_all"
  ) {
    const parsed = parseInt(formData.sales_person_id, 10);
    if (!isNaN(parsed)) {
      result.sales_person_id = parsed;
    }
  }
  if (formData.status && formData.status !== "_all" && formData.status !== "") {
    result.status = formData.status;
  }

  return result;
}
