/**
 * 営業担当者マスタ画面のバリデーションスキーマ
 */

import { z } from "zod";

/**
 * フォーム入力のベーススキーマ（共通項目）
 */
const baseFormSchema = {
  name: z
    .string()
    .min(1, "氏名を入力してください")
    .max(50, "氏名は50文字以内で入力してください"),
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("正しいメールアドレス形式で入力してください"),
  department: z.string().min(1, "部署を選択してください"),
  manager_id: z.string(), // 空文字列は「なし」として扱う
  role: z.enum(["general", "manager"], {
    required_error: "権限を選択してください",
  }),
};

/**
 * 新規登録フォームのスキーマ
 */
export const createSalesPersonFormSchema = z.object({
  ...baseFormSchema,
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

/**
 * 新規登録フォームの入力値型
 */
export type CreateSalesPersonFormValues = z.infer<
  typeof createSalesPersonFormSchema
>;

/**
 * 編集フォームのスキーマ
 * パスワードは任意（空の場合は変更しない）
 */
export const updateSalesPersonFormSchema = z.object({
  ...baseFormSchema,
  password: z
    .string()
    .refine(
      (val) => val === "" || val.length >= 8,
      "パスワードは8文字以上で入力してください"
    ),
});

/**
 * 編集フォームの入力値型
 */
export type UpdateSalesPersonFormValues = z.infer<
  typeof updateSalesPersonFormSchema
>;

/**
 * 検索フォームのスキーマ
 */
export const searchFormSchema = z.object({
  name: z.string().optional(),
  department: z.string().optional(),
});

export type SearchFormValues = z.infer<typeof searchFormSchema>;

/**
 * フォーム値をAPIリクエスト形式に変換
 */
export function convertFormToApiRequest(
  formData: CreateSalesPersonFormValues | UpdateSalesPersonFormValues,
  isEdit: boolean
): {
  name: string;
  email: string;
  password?: string;
  department: string;
  manager_id: number | null;
  is_manager: boolean;
} {
  const { name, email, password, department, manager_id, role } = formData;

  // "_none" は「なし」を表す特殊値
  const managerId =
    manager_id && manager_id !== "" && manager_id !== "_none"
      ? parseInt(manager_id, 10)
      : null;

  const result: {
    name: string;
    email: string;
    password?: string;
    department: string;
    manager_id: number | null;
    is_manager: boolean;
  } = {
    name,
    email,
    department,
    manager_id: isNaN(managerId as number) ? null : managerId,
    is_manager: role === "manager",
  };

  // パスワードは新規の場合は必須、編集の場合は入力があった時のみ含める
  if (!isEdit) {
    result.password = password;
  } else if (password && password.length > 0) {
    result.password = password;
  }

  return result;
}
