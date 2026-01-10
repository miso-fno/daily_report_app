/**
 * パフォーマンス計測ユーティリティ
 *
 * APIレスポンス時間の計測とロギング機能を提供
 */

/**
 * パフォーマンス計測結果
 */
export interface PerformanceMetrics {
  /** 処理開始時刻 */
  startTime: number;
  /** 処理終了時刻 */
  endTime?: number;
  /** 処理時間（ミリ秒） */
  duration?: number;
  /** 操作名 */
  operation: string;
  /** 追加のメタデータ */
  metadata?: Record<string, unknown>;
}

/**
 * パフォーマンス基準値（ミリ秒）
 * 非機能要件に基づく
 */
export const PerformanceThresholds = {
  /** 画面表示: 3秒以内 */
  PAGE_LOAD: 3000,
  /** 検索処理: 5秒以内 */
  SEARCH: 5000,
  /** 登録/更新処理: 3秒以内 */
  MUTATION: 3000,
  /** API呼び出し警告閾値 */
  API_WARNING: 1000,
  /** API呼び出し危険閾値 */
  API_CRITICAL: 2000,
} as const;

/**
 * パフォーマンスログのレベル
 */
type LogLevel = "info" | "warn" | "error";

/**
 * パフォーマンス計測を開始
 *
 * @param operation 操作名
 * @param metadata 追加のメタデータ
 * @returns パフォーマンス計測オブジェクト
 */
export function startMeasurement(
  operation: string,
  metadata?: Record<string, unknown>
): PerformanceMetrics {
  const result: PerformanceMetrics = {
    startTime: performance.now(),
    operation,
  };

  if (metadata) {
    result.metadata = metadata;
  }

  return result;
}

/**
 * パフォーマンス計測を終了し、結果をログ出力
 *
 * @param metrics 計測オブジェクト
 * @param threshold 警告閾値（ミリ秒）
 * @returns 計測結果
 */
export function endMeasurement(
  metrics: PerformanceMetrics,
  threshold: number = PerformanceThresholds.API_WARNING
): PerformanceMetrics {
  const endTime = performance.now();
  const duration = endTime - metrics.startTime;

  const result: PerformanceMetrics = {
    ...metrics,
    endTime,
    duration,
  };

  // ログレベルを決定
  let level: LogLevel = "info";
  if (duration >= PerformanceThresholds.API_CRITICAL) {
    level = "error";
  } else if (duration >= threshold) {
    level = "warn";
  }

  // 開発環境またはパフォーマンス問題がある場合のみログ出力
  if (process.env.NODE_ENV === "development" || level !== "info") {
    logPerformance(result, level);
  }

  return result;
}

/**
 * パフォーマンスログを出力
 *
 * @param metrics 計測結果
 * @param level ログレベル
 */
function logPerformance(metrics: PerformanceMetrics, level: LogLevel): void {
  const message = `[Performance] ${metrics.operation}: ${metrics.duration?.toFixed(2)}ms`;

  const logData = {
    operation: metrics.operation,
    duration: metrics.duration,
    timestamp: new Date().toISOString(),
    ...metrics.metadata,
  };

  switch (level) {
    case "error":
      console.error(message, logData);
      break;
    case "warn":
      console.warn(message, logData);
      break;
    default:
      // eslint-disable-next-line no-console
      console.info(message, logData);
  }
}

/**
 * 非同期関数の実行時間を計測するラッパー
 *
 * @param fn 計測対象の非同期関数
 * @param operation 操作名
 * @param threshold 警告閾値（ミリ秒）
 * @returns ラップされた関数
 *
 * @example
 * ```typescript
 * const fetchData = withPerformanceMeasurement(
 *   async () => prisma.customer.findMany(),
 *   'fetchCustomers',
 *   PerformanceThresholds.SEARCH
 * );
 * const customers = await fetchData();
 * ```
 */
export function withPerformanceMeasurement<T>(
  fn: () => Promise<T>,
  operation: string,
  threshold?: number
): () => Promise<T> {
  return async () => {
    const metrics = startMeasurement(operation);
    try {
      const result = await fn();
      endMeasurement(metrics, threshold);
      return result;
    } catch (error) {
      endMeasurement(metrics, threshold);
      throw error;
    }
  };
}

/**
 * APIハンドラーの実行時間を計測するラッパー
 *
 * @param handler APIハンドラー関数
 * @param operation 操作名
 * @returns ラップされたハンドラー
 */
export function measureApiHandler<TArgs extends unknown[], TReturn>(
  handler: (...args: TArgs) => Promise<TReturn>,
  operation: string
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs) => {
    const metrics = startMeasurement(operation, {
      handler: operation,
    });

    try {
      const result = await handler(...args);
      endMeasurement(metrics, PerformanceThresholds.API_WARNING);
      return result;
    } catch (error) {
      endMeasurement(metrics, PerformanceThresholds.API_WARNING);
      throw error;
    }
  };
}
