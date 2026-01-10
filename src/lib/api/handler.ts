/**
 * APIルートハンドラーラッパー
 *
 * 統一されたエラーハンドリングと認証チェックを提供します
 * パフォーマンス計測機能を含む
 */

import { ZodError } from "zod";

import { ApiError } from "./errors";
import {
  apiErrorResponse,
  internalErrorResponse,
  validationErrorResponse,
} from "./response";
import { zodErrorToDetails } from "./validation";
import {
  endMeasurement,
  PerformanceThresholds,
  startMeasurement,
} from "../performance";

import type { ErrorDetail, ErrorResponse } from "./response";
import type { NextRequest, NextResponse } from "next/server";

/**
 * ルートハンドラーのコンテキスト型
 */
export interface RouteContext<TParams = Record<string, string | string[]>> {
  params: Promise<TParams>;
}

/**
 * ルートハンドラーの基本型
 */
export type RouteHandler<TParams = Record<string, string | string[]>> = (
  request: NextRequest,
  context: RouteContext<TParams>
) => Promise<NextResponse>;

/**
 * ハンドラーオプション
 */
export interface HandlerOptions {
  /** エラーをコンソールに出力するかどうか (デフォルト: true in development) */
  logErrors?: boolean;
  /** パフォーマンス計測を有効にするかどうか (デフォルト: true in development) */
  measurePerformance?: boolean;
  /** 操作名（パフォーマンスログ用） */
  operationName?: string;
}

/**
 * エラーをNextResponseに変換
 *
 * @param error 発生したエラー
 * @param options ハンドラーオプション
 * @returns NextResponse
 */
function handleError(
  error: unknown,
  options?: HandlerOptions
): NextResponse<ErrorResponse> {
  const shouldLog =
    options?.logErrors ?? process.env.NODE_ENV === "development";

  // ApiError の場合
  if (error instanceof ApiError) {
    if (shouldLog) {
      console.error(
        `[ApiError] ${error.code}: ${error.message}`,
        error.details
      );
    }
    return apiErrorResponse(error);
  }

  // ZodError の場合
  if (error instanceof ZodError) {
    const details = zodErrorToDetails(error);
    if (shouldLog) {
      console.error("[ZodError] Validation failed:", details);
    }
    return validationErrorResponse(details);
  }

  // SyntaxError (JSON パースエラー) の場合
  if (error instanceof SyntaxError && error.message.includes("JSON")) {
    if (shouldLog) {
      console.error("[SyntaxError] JSON parse error:", error.message);
    }
    const details: ErrorDetail[] = [
      { message: "リクエストボディのJSONパースに失敗しました" },
    ];
    return validationErrorResponse(details, "リクエスト形式が不正です");
  }

  // その他のエラー
  if (shouldLog) {
    console.error("[UnhandledError]", error);
  }

  // 本番環境では詳細なエラー情報を隠す
  const message =
    process.env.NODE_ENV === "development" && error instanceof Error
      ? error.message
      : "サーバー内部エラーが発生しました";

  return internalErrorResponse(message);
}

/**
 * APIルートハンドラーをラップしてエラーハンドリングを追加
 *
 * @param handler ルートハンドラー関数
 * @param options ハンドラーオプション
 * @returns ラップされたルートハンドラー
 *
 * @example
 * ```typescript
 * // app/api/users/route.ts
 * import { withHandler } from '@/lib/api/handler';
 * import { successResponse } from '@/lib/api/response';
 *
 * export const GET = withHandler(async (request) => {
 *   const users = await getUsers();
 *   return successResponse(users);
 * });
 * ```
 */
export function withHandler<TParams = Record<string, string | string[]>>(
  handler: RouteHandler<TParams>,
  options?: HandlerOptions
): RouteHandler<TParams> {
  return async (request: NextRequest, context: RouteContext<TParams>) => {
    // パフォーマンス計測の設定
    const shouldMeasure =
      options?.measurePerformance ?? process.env.NODE_ENV === "development";

    // 安全にパス名を取得（テスト環境でnextUrlがない場合に対応）
    const pathname = request.nextUrl?.pathname ?? request.url ?? "unknown";
    const operationName =
      options?.operationName ?? `${request.method} ${pathname}`;

    // 計測開始
    const metrics = shouldMeasure
      ? startMeasurement(operationName, {
          method: request.method,
          path: pathname,
        })
      : null;

    try {
      const response = await handler(request, context);

      // 計測終了（成功）
      if (metrics) {
        endMeasurement(metrics, PerformanceThresholds.API_WARNING);
      }

      return response;
    } catch (error) {
      // 計測終了（エラー）
      if (metrics) {
        endMeasurement(metrics, PerformanceThresholds.API_WARNING);
      }

      return handleError(error, options);
    }
  };
}

/**
 * 認証が必要なAPIルートハンドラーをラップ
 *
 * @param handler ルートハンドラー関数
 * @param options ハンドラーオプション
 * @returns ラップされたルートハンドラー
 *
 * @example
 * ```typescript
 * // app/api/protected/route.ts
 * import { withAuthHandler } from '@/lib/api/handler';
 * import { successResponse } from '@/lib/api/response';
 *
 * export const GET = withAuthHandler(async (request, context) => {
 *   const { session } = context;
 *   return successResponse({ userId: session.user.id });
 * });
 * ```
 */
export function withAuthHandler<TParams = Record<string, string | string[]>>(
  handler: RouteHandler<TParams>,
  options?: HandlerOptions
): RouteHandler<TParams> {
  return withHandler(async (request, context) => {
    // 認証チェックは auth.ts の getServerSession を使用
    // ここでは基本的なハンドラーラッピングのみ提供
    // 実際の認証チェックは各ルートで行う
    return handler(request, context);
  }, options);
}

/**
 * 複数のHTTPメソッドに対応するハンドラーを作成
 *
 * @param handlers メソッド別のハンドラー
 * @param options ハンドラーオプション
 * @returns メソッド別にエクスポートできるハンドラーオブジェクト
 *
 * @example
 * ```typescript
 * // app/api/users/route.ts
 * import { createHandlers } from '@/lib/api/handler';
 * import { successResponse, createdResponse } from '@/lib/api/response';
 *
 * const handlers = createHandlers({
 *   GET: async (request) => {
 *     const users = await getUsers();
 *     return successResponse(users);
 *   },
 *   POST: async (request) => {
 *     const body = await request.json();
 *     const user = await createUser(body);
 *     return createdResponse(user);
 *   },
 * });
 *
 * export const { GET, POST } = handlers;
 * ```
 */
export function createHandlers<TParams = Record<string, string | string[]>>(
  handlers: Partial<{
    GET: RouteHandler<TParams>;
    POST: RouteHandler<TParams>;
    PUT: RouteHandler<TParams>;
    PATCH: RouteHandler<TParams>;
    DELETE: RouteHandler<TParams>;
  }>,
  options?: HandlerOptions
): {
  GET?: RouteHandler<TParams>;
  POST?: RouteHandler<TParams>;
  PUT?: RouteHandler<TParams>;
  PATCH?: RouteHandler<TParams>;
  DELETE?: RouteHandler<TParams>;
} {
  const result: Partial<{
    GET: RouteHandler<TParams>;
    POST: RouteHandler<TParams>;
    PUT: RouteHandler<TParams>;
    PATCH: RouteHandler<TParams>;
    DELETE: RouteHandler<TParams>;
  }> = {};

  if (handlers.GET) {
    result.GET = withHandler(handlers.GET, options);
  }
  if (handlers.POST) {
    result.POST = withHandler(handlers.POST, options);
  }
  if (handlers.PUT) {
    result.PUT = withHandler(handlers.PUT, options);
  }
  if (handlers.PATCH) {
    result.PATCH = withHandler(handlers.PATCH, options);
  }
  if (handlers.DELETE) {
    result.DELETE = withHandler(handlers.DELETE, options);
  }

  return result;
}
