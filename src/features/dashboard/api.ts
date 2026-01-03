/**
 * ダッシュボードAPI関数
 */

import type { ApiErrorResponse, DashboardResponse } from "./types";

/**
 * APIエンドポイント
 */
export const DASHBOARD_API_BASE = "/api/v1/dashboard";

/**
 * ダッシュボードデータを取得
 */
export async function fetchDashboardData(): Promise<DashboardResponse> {
  const response = await fetch(DASHBOARD_API_BASE, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = (await response.json()) as ApiErrorResponse;
    throw new Error(
      errorData.error?.message || "ダッシュボードデータの取得に失敗しました"
    );
  }

  return response.json();
}
