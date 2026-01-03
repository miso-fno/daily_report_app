/**
 * ダッシュボードAPIのレスポンス型定義
 */

import type { ReportStatusType } from "./report";

/**
 * 最近の日報レスポンス型
 */
export interface RecentReportItem {
  report_id: number;
  report_date: string;
  visit_count: number;
  status: ReportStatusType;
  status_label: string;
}

/**
 * 新着コメントレスポンス型
 */
export interface RecentCommentItem {
  comment_id: number;
  report_id: number;
  report_date: string;
  commenter_name: string;
  comment_text: string;
  created_at: string;
}

/**
 * ダッシュボードデータレスポンス型
 */
export interface DashboardData {
  /** 今月の訪問件数（ログインユーザーの訪問記録数） */
  monthly_visit_count: number;
  /** 未確認日報件数（上長のみ：部下の submitted ステータスの日報数） */
  unconfirmed_report_count: number | null;
  /** 最近の日報（直近5件） */
  recent_reports: RecentReportItem[];
  /** 新着コメント（自分の日報に対するコメント、直近5件） */
  recent_comments: RecentCommentItem[];
}
