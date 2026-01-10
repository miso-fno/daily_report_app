/**
 * コンポーネント遅延読み込みユーティリティ
 *
 * Next.jsのdynamic importを使用した遅延読み込み機能を提供
 *
 * 注: 現時点では、各ページで直接next/dynamicを使用することを推奨します。
 * このモジュールは将来の拡張のために予約されています。
 */

import dynamic from "next/dynamic";

import type { DynamicOptionsLoadingProps } from "next/dynamic";
import type { ComponentType, ReactNode } from "react";

/**
 * 遅延読み込み設定オプション
 */
export interface LazyLoadOptions {
  /** SSRを無効にするかどうか（クライアントのみでレンダリング） */
  ssr?: boolean;
  /** ローディング中に表示する関数 */
  loading?: (props: DynamicOptionsLoadingProps) => ReactNode;
}

/**
 * コンポーネントを遅延読み込みする
 *
 * @param importFn コンポーネントをインポートする関数
 * @param options 遅延読み込みオプション
 * @returns 遅延読み込みされたコンポーネント
 *
 * @example
 * ```typescript
 * const LazyReportForm = lazyLoad(
 *   () => import('@/features/reports/components/ReportForm').then(mod => mod.ReportForm),
 *   { ssr: false, loading: () => <ReportFormSkeleton /> }
 * );
 * ```
 */
export function lazyLoad<T extends ComponentType<unknown>>(
  importFn: () => Promise<T>,
  options: LazyLoadOptions = {}
): ComponentType<React.ComponentProps<T>> {
  // exactOptionalPropertyTypesに対応するため、オプションを条件付きで構築
  if (options.loading) {
    return dynamic(async () => importFn(), {
      ssr: options.ssr ?? true,
      loading: options.loading,
    }) as ComponentType<React.ComponentProps<T>>;
  }

  return dynamic(async () => importFn(), {
    ssr: options.ssr ?? true,
  }) as ComponentType<React.ComponentProps<T>>;
}

/**
 * クライアントサイドのみでレンダリングするコンポーネントを遅延読み込み
 *
 * ブラウザ固有のAPIを使用するコンポーネントに使用
 *
 * @param importFn コンポーネントをインポートする関数
 * @param options 遅延読み込みオプション
 * @returns 遅延読み込みされたコンポーネント
 */
export function lazyLoadClient<T extends ComponentType<unknown>>(
  importFn: () => Promise<T>,
  options: Omit<LazyLoadOptions, "ssr"> = {}
): ComponentType<React.ComponentProps<T>> {
  return lazyLoad(importFn, { ...options, ssr: false });
}
