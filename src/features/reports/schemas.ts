/**
 * 日報一覧画面のバリデーションスキーマ
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

/**
 * フォーム値をAPIリクエスト形式に変換
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
