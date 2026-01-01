/**
 * 営業担当者マスタ画面の型定義
 */

/**
 * 営業担当者一覧項目
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

/**
 * 営業担当者詳細レスポンス
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
export interface SalesPersonsListResponse {
  success: boolean;
  data: {
    items: SalesPersonListItem[];
    pagination: Pagination;
  };
  message?: string;
}

/**
 * 詳細取得APIレスポンス
 */
export interface SalesPersonDetailResponse {
  success: boolean;
  data: SalesPersonResponse;
  message?: string;
}

/**
 * 作成・更新APIレスポンス
 */
export interface SalesPersonMutationResponse {
  success: boolean;
  data: SalesPersonResponse;
  message?: string;
}

/**
 * 削除APIレスポンス
 */
export interface SalesPersonDeleteResponse {
  success: boolean;
  data: {
    sales_person_id: number;
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
export interface SearchParams {
  name?: string;
  department?: string;
  page?: number;
  per_page?: number;
}
