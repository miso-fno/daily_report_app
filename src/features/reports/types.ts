/**
 * 日報一覧画面の型定義
 */

import type { ReportStatusType } from "@/lib/api/schemas/report";

/**
 * 日報一覧項目
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
 * ページネーション情報
 */
export interface Pagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

/**
 * 一覧取得APIレスポンス
 */
export interface ReportsListResponse {
  success: boolean;
  data: {
    items: ReportListItem[];
    pagination: Pagination;
  };
  message?: string;
}

/**
 * 営業担当者選択用
 */
export interface SalesPersonOption {
  sales_person_id: number;
  name: string;
}

/**
 * 担当者一覧取得APIレスポンス
 */
export interface SalesPersonsOptionsResponse {
  success: boolean;
  data: {
    items: SalesPersonOption[];
  };
  message?: string;
}

/**
 * APIエラーレスポンス
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

/**
 * 検索パラメータ
 */
export interface ReportsSearchParams {
  date_from?: string;
  date_to?: string;
  sales_person_id?: number;
  status?: ReportStatusType | "";
  page?: number;
  per_page?: number;
  sort?: "report_date" | "created_at";
  order?: "asc" | "desc";
}
