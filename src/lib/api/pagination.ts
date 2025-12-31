/**
 * ページネーションヘルパー
 *
 * ページネーションに関するユーティリティ関数を提供します
 */

import type { PaginationInfo } from "./response";

/**
 * ページネーションオプション
 */
export interface PaginationOptions {
  /** 現在のページ番号 (1始まり) */
  page: number;
  /** 1ページあたりのアイテム数 */
  perPage: number;
  /** 総アイテム数 */
  total: number;
}

/**
 * ページネーション情報を計算
 *
 * @param options ページネーションオプション
 * @returns ページネーション情報
 */
export function calculatePagination(
  options: PaginationOptions
): PaginationInfo {
  const { page, perPage, total } = options;

  // ページ番号とperPageは正の整数であることを保証
  const safePage = Math.max(1, Math.floor(page));
  const safePerPage = Math.max(1, Math.floor(perPage));
  const safeTotal = Math.max(0, Math.floor(total));

  // 最後のページを計算
  const lastPage = Math.max(1, Math.ceil(safeTotal / safePerPage));

  // 現在のページが最後のページを超えている場合は調整
  const currentPage = Math.min(safePage, lastPage);

  // 開始位置と終了位置を計算
  const from = safeTotal === 0 ? 0 : (currentPage - 1) * safePerPage + 1;
  const to = Math.min(currentPage * safePerPage, safeTotal);

  return {
    total: safeTotal,
    per_page: safePerPage,
    current_page: currentPage,
    last_page: lastPage,
    from,
    to,
  };
}

/**
 * Prismaのskip/take形式に変換するためのオフセット計算
 *
 * @param page ページ番号 (1始まり)
 * @param perPage 1ページあたりのアイテム数
 * @returns { skip, take } Prisma形式のオフセット
 */
export function calculateOffset(
  page: number,
  perPage: number
): { skip: number; take: number } {
  const safePage = Math.max(1, Math.floor(page));
  const safePerPage = Math.max(1, Math.floor(perPage));

  return {
    skip: (safePage - 1) * safePerPage,
    take: safePerPage,
  };
}

/**
 * ページネーション付きデータの取得をサポートするヘルパー関数
 *
 * @param options ページネーションオプション
 * @returns ページネーション情報とオフセット
 */
export function getPaginationParams(options: {
  page: number;
  perPage: number;
}): {
  skip: number;
  take: number;
} {
  return calculateOffset(options.page, options.perPage);
}

/**
 * デフォルトのページネーション設定
 */
export const DEFAULT_PAGINATION = {
  page: 1,
  perPage: 20,
  maxPerPage: 100,
} as const;

/**
 * ページネーションパラメータを正規化
 *
 * @param page ページ番号（未指定の場合はデフォルト値）
 * @param perPage 1ページあたりのアイテム数（未指定の場合はデフォルト値）
 * @returns 正規化されたページネーションパラメータ
 */
export function normalizePaginationParams(
  page?: number | string | null,
  perPage?: number | string | null
): { page: number; perPage: number } {
  let normalizedPage: number = DEFAULT_PAGINATION.page;
  let normalizedPerPage: number = DEFAULT_PAGINATION.perPage;

  if (page !== undefined && page !== null) {
    const parsed = typeof page === "string" ? parseInt(page, 10) : page;
    if (!isNaN(parsed) && parsed >= 1) {
      normalizedPage = Math.floor(parsed);
    }
  }

  if (perPage !== undefined && perPage !== null) {
    const parsed =
      typeof perPage === "string" ? parseInt(perPage, 10) : perPage;
    if (!isNaN(parsed) && parsed >= 1) {
      normalizedPerPage = Math.min(
        Math.floor(parsed),
        DEFAULT_PAGINATION.maxPerPage
      );
    }
  }

  return { page: normalizedPage, perPage: normalizedPerPage };
}
