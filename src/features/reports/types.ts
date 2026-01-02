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

// ============================================
// 日報詳細・作成・編集用の型定義
// ============================================

/**
 * 訪問記録（レスポンス用）
 */
export interface VisitRecord {
  visit_id: number;
  customer_id: number;
  customer_name: string;
  visit_time: string | null;
  visit_purpose: string | null;
  visit_content: string;
  visit_result: string | null;
}

/**
 * コメント
 */
export interface Comment {
  comment_id: number;
  sales_person_id: number;
  sales_person_name: string;
  comment_text: string;
  created_at: string;
}

/**
 * 日報詳細
 */
export interface ReportDetail {
  report_id: number;
  report_date: string;
  sales_person_id: number;
  sales_person_name: string;
  status: ReportStatusType;
  status_label: string;
  problem: string | null;
  plan: string | null;
  visits: VisitRecord[];
  comments: Comment[];
  created_at: string;
  updated_at: string;
}

/**
 * 日報詳細取得APIレスポンス
 */
export interface ReportDetailResponse {
  success: boolean;
  data: ReportDetail;
  message?: string;
}

/**
 * 日報作成リクエスト
 */
export interface CreateReportRequest {
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
}

/**
 * 日報作成APIレスポンス
 */
export interface CreateReportResponse {
  success: boolean;
  data: {
    report_id: number;
    report_date: string;
    status: ReportStatusType;
    created_at: string;
  };
  message?: string;
}

/**
 * 日報更新APIレスポンス
 */
export interface UpdateReportResponse {
  success: boolean;
  data: {
    report_id: number;
    report_date: string;
    status: ReportStatusType;
    updated_at: string;
  };
  message?: string;
}

/**
 * 顧客選択用
 */
export interface CustomerOption {
  customer_id: number;
  customer_name: string;
}

/**
 * 顧客一覧取得APIレスポンス
 */
export interface CustomersOptionsResponse {
  success: boolean;
  data: {
    items: CustomerOption[];
    pagination: Pagination;
  };
  message?: string;
}

/**
 * ステータス更新APIレスポンス
 */
export interface UpdateStatusResponse {
  success: boolean;
  data: {
    report_id: number;
    status: ReportStatusType;
    status_label: string;
    updated_at: string;
  };
  message?: string;
}

/**
 * コメント作成APIレスポンス
 */
export interface CreateCommentResponse {
  success: boolean;
  data: {
    comment_id: number;
    report_id: number;
    created_at: string;
  };
  message?: string;
}

/**
 * コメント削除APIレスポンス
 */
export interface DeleteCommentResponse {
  success: boolean;
  data: {
    comment_id: number;
  };
  message?: string;
}
