/**
 * Rate Limiting ユーティリティ
 *
 * インメモリのウィンドウベースレート制限を提供します。
 * 本番環境では Redis などの外部ストアを検討してください。
 */

/**
 * レート制限の設定
 */
export interface RateLimitConfig {
  /** ウィンドウ内の最大リクエスト数 */
  limit: number;
  /** ウィンドウサイズ（ミリ秒） */
  windowMs: number;
}

/**
 * レート制限の結果
 */
export interface RateLimitResult {
  /** リクエストが許可されたかどうか */
  allowed: boolean;
  /** 残りのリクエスト数 */
  remaining: number;
  /** リセットまでの時間（ミリ秒） */
  resetIn: number;
  /** リセット時刻（Unix timestamp） */
  resetAt: number;
}

/**
 * レート制限エントリ
 */
interface RateLimitEntry {
  /** リクエスト数 */
  count: number;
  /** ウィンドウ開始時刻 */
  windowStart: number;
}

/**
 * プリセットされたレート制限設定
 */
export const RateLimitPresets = {
  /** 一般的なAPI用（1分間に60リクエスト） */
  api: {
    limit: 60,
    windowMs: 60 * 1000,
  },
  /** 検索API用（1分間に30リクエスト） */
  search: {
    limit: 30,
    windowMs: 60 * 1000,
  },
  /** ログイン試行用（15分間に5リクエスト） */
  login: {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  },
  /** パスワードリセット用（1時間に3リクエスト） */
  passwordReset: {
    limit: 3,
    windowMs: 60 * 60 * 1000,
  },
  /** ファイルアップロード用（1分間に10リクエスト） */
  upload: {
    limit: 10,
    windowMs: 60 * 1000,
  },
} as const;

/**
 * インメモリレート制限クラス
 *
 * 注意: このクラスはサーバーレス環境やマルチインスタンス環境では
 * 正確なレート制限を保証できません。本番環境では Redis 等の
 * 外部ストアを使用することを推奨します。
 */
export class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * 古いエントリをクリーンアップするインターバルを開始
   * サーバーサイドで長時間動作する場合に使用
   */
  startCleanup(intervalMs: number = 60 * 1000): void {
    if (this.cleanupInterval) {
      return;
    }
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, intervalMs);
  }

  /**
   * クリーンアップインターバルを停止
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * 期限切れのエントリを削除
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.windowStart >= this.config.windowMs) {
        this.store.delete(key);
      }
    }
  }

  /**
   * リクエストをチェックし、許可されるかどうかを判定
   *
   * @param key 識別子（IP、ユーザーID、APIキーなど）
   * @returns レート制限の結果
   */
  check(key: string): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);

    // エントリがない場合は新規作成
    if (!entry) {
      this.store.set(key, { count: 1, windowStart: now });
      return {
        allowed: true,
        remaining: this.config.limit - 1,
        resetIn: this.config.windowMs,
        resetAt: now + this.config.windowMs,
      };
    }

    const elapsed = now - entry.windowStart;

    // ウィンドウが期限切れの場合はリセット
    if (elapsed >= this.config.windowMs) {
      this.store.set(key, { count: 1, windowStart: now });
      return {
        allowed: true,
        remaining: this.config.limit - 1,
        resetIn: this.config.windowMs,
        resetAt: now + this.config.windowMs,
      };
    }

    const resetIn = this.config.windowMs - elapsed;
    const resetAt = entry.windowStart + this.config.windowMs;

    // 制限に達している場合
    if (entry.count >= this.config.limit) {
      return {
        allowed: false,
        remaining: 0,
        resetIn,
        resetAt,
      };
    }

    // カウントを増加
    entry.count++;
    return {
      allowed: true,
      remaining: this.config.limit - entry.count,
      resetIn,
      resetAt,
    };
  }

  /**
   * 特定のキーのエントリをリセット
   *
   * @param key 識別子
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * 全てのエントリをクリア
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * 現在の設定を取得
   */
  getConfig(): RateLimitConfig {
    return { ...this.config };
  }

  /**
   * 設定を更新
   */
  setConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 現在のストアサイズを取得（テスト・デバッグ用）
   */
  getStoreSize(): number {
    return this.store.size;
  }
}

/**
 * グローバルレートリミッターインスタンス
 * API種別ごとに異なるインスタンスを使用
 */
const rateLimiters: Map<string, RateLimiter> = new Map();

/**
 * 指定された設定でレートリミッターを取得または作成
 *
 * @param name レートリミッターの名前
 * @param config レート制限の設定
 * @returns RateLimiter インスタンス
 */
export function getRateLimiter(
  name: string,
  config: RateLimitConfig
): RateLimiter {
  let limiter = rateLimiters.get(name);
  if (!limiter) {
    limiter = new RateLimiter(config);
    rateLimiters.set(name, limiter);
  }
  return limiter;
}

/**
 * プリセットを使用してレートリミッターを取得
 *
 * @param preset プリセット名
 * @returns RateLimiter インスタンス
 */
export function getRateLimiterByPreset(
  preset: keyof typeof RateLimitPresets
): RateLimiter {
  return getRateLimiter(preset, RateLimitPresets[preset]);
}

/**
 * IPアドレスからレート制限キーを生成
 *
 * @param request NextRequest オブジェクト
 * @returns IPアドレスベースのキー
 */
export function getClientIp(request: Request): string {
  // プロキシ経由の場合はX-Forwarded-Forを使用
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // 複数のIPがある場合は最初のものを使用
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) {
      return ip;
    }
  }

  // X-Real-IPヘッダー
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // デフォルト値
  return "unknown";
}

/**
 * レート制限ヘッダーを生成
 *
 * @param result レート制限の結果
 * @param config レート制限の設定
 * @returns ヘッダーオブジェクト
 */
export function createRateLimitHeaders(
  result: RateLimitResult,
  config: RateLimitConfig
): Record<string, string> {
  return {
    "X-RateLimit-Limit": config.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetAt / 1000).toString(),
    "Retry-After": result.allowed
      ? "0"
      : Math.ceil(result.resetIn / 1000).toString(),
  };
}

/**
 * レート制限チェックを実行するユーティリティ関数
 *
 * @param request リクエストオブジェクト
 * @param limiterName レートリミッター名
 * @param config レート制限設定
 * @param keyPrefix キーのプレフィックス（オプション）
 * @returns レート制限の結果とヘッダー
 */
export function checkRateLimit(
  request: Request,
  limiterName: string,
  config: RateLimitConfig,
  keyPrefix?: string
): { result: RateLimitResult; headers: Record<string, string> } {
  const limiter = getRateLimiter(limiterName, config);
  const clientIp = getClientIp(request);
  const key = keyPrefix ? `${keyPrefix}:${clientIp}` : clientIp;
  const result = limiter.check(key);
  const headers = createRateLimitHeaders(result, config);

  return { result, headers };
}
