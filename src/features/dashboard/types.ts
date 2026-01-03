/**
 * ダッシュボード機能の型定義
 */

import type {
  DashboardData,
  RecentCommentItem,
  RecentReportItem,
} from "@/lib/api/schemas/dashboard";

/**
 * APIレスポンスの再エクスポート
 */
export type {
  DashboardData,
  RecentCommentItem,
  RecentReportItem,
} from "@/lib/api/schemas/dashboard";

/**
 * ダッシュボードデータ取得APIレスポンス
 */
export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
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
 * 統計カードのプロパティ
 */
export interface StatCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon?: React.ReactNode;
}

/**
 * 最近の日報リストのプロパティ
 */
export interface RecentReportsListProps {
  reports: RecentReportItem[];
}

/**
 * 新着コメントリストのプロパティ
 */
export interface RecentCommentsListProps {
  comments: RecentCommentItem[];
}

/**
 * ダッシュボードコンポーネントのプロパティ
 */
export interface DashboardProps {
  userName: string;
  isManager: boolean;
  dashboardData: DashboardData;
}
