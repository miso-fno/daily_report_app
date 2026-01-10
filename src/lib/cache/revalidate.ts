/**
 * キャッシュ再検証ユーティリティ
 *
 * データ更新時にキャッシュを無効化するためのユーティリティ関数
 */

import { revalidateTag } from "next/cache";

import { CacheTags } from "./index";

import type { CacheTag } from "./index";

/**
 * 単一のキャッシュタグを再検証
 *
 * @param tag 再検証するタグ
 */
export function invalidateCache(tag: CacheTag): void {
  revalidateTag(tag);
}

/**
 * 複数のキャッシュタグを再検証
 *
 * @param tags 再検証するタグの配列
 */
export function invalidateCaches(tags: CacheTag[]): void {
  tags.forEach((tag) => revalidateTag(tag));
}

/**
 * 顧客マスタのキャッシュを無効化
 */
export function invalidateCustomersCache(): void {
  invalidateCache(CacheTags.CUSTOMERS);
}

/**
 * 営業担当者マスタのキャッシュを無効化
 */
export function invalidateSalesPersonsCache(): void {
  invalidateCache(CacheTags.SALES_PERSONS);
}

/**
 * 日報関連のキャッシュを無効化
 * ダッシュボードのキャッシュも併せて無効化
 */
export function invalidateReportsCache(): void {
  invalidateCaches([CacheTags.REPORTS, CacheTags.DASHBOARD]);
}

/**
 * 訪問記録関連のキャッシュを無効化
 * 日報とダッシュボードのキャッシュも併せて無効化
 */
export function invalidateVisitsCache(): void {
  invalidateCaches([CacheTags.VISITS, CacheTags.REPORTS, CacheTags.DASHBOARD]);
}

/**
 * コメント関連のキャッシュを無効化
 * 日報とダッシュボードのキャッシュも併せて無効化
 */
export function invalidateCommentsCache(): void {
  invalidateCaches([
    CacheTags.COMMENTS,
    CacheTags.REPORTS,
    CacheTags.DASHBOARD,
  ]);
}

/**
 * 全てのキャッシュを無効化
 * 管理者操作や大規模なデータ変更時に使用
 */
export function invalidateAllCaches(): void {
  Object.values(CacheTags).forEach((tag) => revalidateTag(tag));
}
