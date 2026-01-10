/**
 * キャッシュユーティリティ
 *
 * Next.js App Routerのunstable_cacheを使用したデータキャッシュ機能を提供
 * マスタデータや頻繁にアクセスされるデータのキャッシュに使用
 */

import { unstable_cache } from "next/cache";

/**
 * キャッシュタグの定義
 * revalidateTagで使用するタグを一元管理
 */
export const CacheTags = {
  /** 顧客マスタ */
  CUSTOMERS: "customers",
  /** 営業担当者マスタ */
  SALES_PERSONS: "sales-persons",
  /** 日報 */
  REPORTS: "reports",
  /** 訪問記録 */
  VISITS: "visits",
  /** コメント */
  COMMENTS: "comments",
  /** ダッシュボード */
  DASHBOARD: "dashboard",
} as const;

export type CacheTag = (typeof CacheTags)[keyof typeof CacheTags];

/**
 * キャッシュの再検証時間（秒）
 */
export const CacheRevalidation = {
  /** 短い期間（1分）- 頻繁に更新されるデータ */
  SHORT: 60,
  /** 中程度（5分）- ダッシュボードなど */
  MEDIUM: 300,
  /** 長い期間（30分）- マスタデータなど */
  LONG: 1800,
  /** 非常に長い期間（1時間）- ほとんど変更されないデータ */
  VERY_LONG: 3600,
} as const;

/**
 * キャッシュ可能な関数をラップする
 *
 * @param fn キャッシュする非同期関数
 * @param keys キャッシュキー
 * @param options キャッシュオプション
 * @returns キャッシュされた関数
 *
 * @example
 * ```typescript
 * const getCachedCustomers = createCachedFunction(
 *   async () => prisma.customer.findMany(),
 *   ['customers-list'],
 *   { tags: [CacheTags.CUSTOMERS], revalidate: CacheRevalidation.LONG }
 * );
 * ```
 */
export function createCachedFunction<T>(
  fn: () => Promise<T>,
  keys: string[],
  options?: {
    tags?: string[];
    revalidate?: number;
  }
): () => Promise<T> {
  const cacheOptions: { revalidate: number; tags?: string[] } = {
    revalidate: options?.revalidate ?? CacheRevalidation.MEDIUM,
  };

  if (options?.tags) {
    cacheOptions.tags = options.tags;
  }

  return unstable_cache(fn, keys, cacheOptions);
}

/**
 * IDをキーに含むキャッシュ関数を作成
 *
 * @param fn キャッシュする非同期関数
 * @param keyPrefix キャッシュキーのプレフィックス
 * @param options キャッシュオプション
 * @returns IDを受け取るキャッシュされた関数
 *
 * @example
 * ```typescript
 * const getCachedCustomer = createCachedFunctionWithId(
 *   async (id) => prisma.customer.findUnique({ where: { id } }),
 *   'customer',
 *   { tags: [CacheTags.CUSTOMERS], revalidate: CacheRevalidation.LONG }
 * );
 *
 * const customer = await getCachedCustomer(1);
 * ```
 */
export function createCachedFunctionWithId<T, ID extends string | number>(
  fn: (id: ID) => Promise<T>,
  keyPrefix: string,
  options?: {
    tags?: string[];
    revalidate?: number;
  }
): (id: ID) => Promise<T> {
  return (id: ID) => {
    const cacheOptions: { revalidate: number; tags?: string[] } = {
      revalidate: options?.revalidate ?? CacheRevalidation.MEDIUM,
    };

    if (options?.tags) {
      cacheOptions.tags = options.tags;
    }

    const cachedFn = unstable_cache(
      async () => fn(id),
      [`${keyPrefix}-${id}`],
      cacheOptions
    );
    return cachedFn();
  };
}
