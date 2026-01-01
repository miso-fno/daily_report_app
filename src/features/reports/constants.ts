/**
 * 日報一覧画面の定数
 */

import { ReportStatus } from "@/lib/api/schemas/report";

import type { ReportStatusType } from "@/lib/api/schemas/report";

/**
 * ステータスの選択肢
 */
export const STATUS_OPTIONS = [
  { value: "", label: "全て" },
  { value: ReportStatus.DRAFT, label: "下書き" },
  { value: ReportStatus.SUBMITTED, label: "提出済" },
  { value: ReportStatus.CONFIRMED, label: "確認済" },
] as const;

/**
 * ソートの選択肢
 */
export const SORT_OPTIONS = [
  { value: "report_date", label: "報告日" },
  { value: "created_at", label: "登録日時" },
] as const;

/**
 * ソート順の選択肢
 */
export const ORDER_OPTIONS = [
  { value: "desc", label: "降順" },
  { value: "asc", label: "昇順" },
] as const;

/**
 * APIエンドポイント
 */
export const REPORTS_API_BASE = "/api/v1/reports";

/**
 * 1ページあたりの表示件数
 */
export const DEFAULT_PER_PAGE = 20;

/**
 * ステータスバッジのバリアント
 */
export const STATUS_BADGE_VARIANTS: Record<
  ReportStatusType,
  "secondary" | "default" | "outline"
> = {
  [ReportStatus.DRAFT]: "secondary",
  [ReportStatus.SUBMITTED]: "default",
  [ReportStatus.CONFIRMED]: "outline",
};

/**
 * ステータスバッジのカラークラス
 */
export const STATUS_BADGE_COLORS: Record<ReportStatusType, string> = {
  [ReportStatus.DRAFT]: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  [ReportStatus.SUBMITTED]: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  [ReportStatus.CONFIRMED]: "bg-green-100 text-green-800 hover:bg-green-100",
};
