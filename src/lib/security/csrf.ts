/**
 * CSRF (Cross-Site Request Forgery) トークン
 *
 * NextAuth v5はデフォルトでCSRF保護を提供していますが、
 * カスタムAPIエンドポイント用にCSRFトークン生成・検証機能を提供します。
 */

import { cookies } from "next/headers";

/**
 * CSRFトークンの設定
 */
export interface CsrfConfig {
  /** Cookieの名前 */
  cookieName: string;
  /** ヘッダーの名前 */
  headerName: string;
  /** トークンの有効期限（秒） */
  maxAge: number;
  /** Cookieのパス */
  path: string;
  /** Secure属性（HTTPS必須） */
  secure: boolean;
  /** SameSite属性 */
  sameSite: "strict" | "lax" | "none";
  /** HttpOnly属性 */
  httpOnly: boolean;
}

/**
 * デフォルトのCSRF設定
 */
export const DEFAULT_CSRF_CONFIG: CsrfConfig = {
  cookieName: "__csrf_token",
  headerName: "X-CSRF-Token",
  maxAge: 60 * 60, // 1時間
  path: "/",
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  httpOnly: true,
};

/**
 * 暗号学的に安全なランダム文字列を生成
 *
 * @param length 文字列の長さ（バイト数）
 * @returns 16進数文字列
 */
export function generateRandomToken(length: number = 32): string {
  // Web Crypto APIを使用
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * CSRFトークンを生成
 *
 * @returns 生成されたトークン
 */
export function generateCsrfToken(): string {
  return generateRandomToken(32);
}

/**
 * タイミング攻撃に強い文字列比較
 *
 * @param a 比較する文字列1
 * @param b 比較する文字列2
 * @returns 一致するかどうか
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  const aBuffer = new TextEncoder().encode(a);
  const bBuffer = new TextEncoder().encode(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < aBuffer.length; i++) {
    const a = aBuffer[i];
    const b = bBuffer[i];
    if (a !== undefined && b !== undefined) {
      result |= a ^ b;
    }
  }

  return result === 0;
}

/**
 * CSRFトークンを検証
 *
 * @param token リクエストから受け取ったトークン
 * @param expectedToken 期待されるトークン（Cookieから）
 * @returns 有効かどうか
 */
export function verifyCsrfToken(
  token: string | null | undefined,
  expectedToken: string | null | undefined
): boolean {
  if (!token || !expectedToken) {
    return false;
  }

  return timingSafeEqual(token, expectedToken);
}

/**
 * CSRFトークンマネージャークラス
 *
 * サーバーサイドでのCSRFトークン管理を提供します。
 */
export class CsrfTokenManager {
  private config: CsrfConfig;

  constructor(config: Partial<CsrfConfig> = {}) {
    this.config = { ...DEFAULT_CSRF_CONFIG, ...config };
  }

  /**
   * 新しいCSRFトークンを生成してCookieに設定
   * 注意: この関数はServer Actionまたは Route Handlerで使用する必要があります
   *
   * @returns 生成されたトークン
   */
  async generateAndSetToken(): Promise<string> {
    const token = generateCsrfToken();
    const cookieStore = await cookies();

    cookieStore.set(this.config.cookieName, token, {
      maxAge: this.config.maxAge,
      path: this.config.path,
      secure: this.config.secure,
      sameSite: this.config.sameSite,
      httpOnly: this.config.httpOnly,
    });

    return token;
  }

  /**
   * CookieからCSRFトークンを取得
   *
   * @returns トークンまたはnull
   */
  async getTokenFromCookie(): Promise<string | null> {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(this.config.cookieName);
    return cookie?.value ?? null;
  }

  /**
   * リクエストヘッダーからCSRFトークンを取得
   *
   * @param request リクエストオブジェクト
   * @returns トークンまたはnull
   */
  getTokenFromHeader(request: Request): string | null {
    return request.headers.get(this.config.headerName);
  }

  /**
   * リクエストボディからCSRFトークンを取得
   *
   * @param body リクエストボディ
   * @param fieldName フィールド名（デフォルト: _csrf）
   * @returns トークンまたはnull
   */
  getTokenFromBody(
    body: Record<string, unknown>,
    fieldName: string = "_csrf"
  ): string | null {
    const token = body[fieldName];
    return typeof token === "string" ? token : null;
  }

  /**
   * CSRFトークンを検証
   *
   * @param request リクエストオブジェクト
   * @param body リクエストボディ（オプション）
   * @returns 有効かどうか
   */
  async verifyRequest(
    request: Request,
    body?: Record<string, unknown>
  ): Promise<boolean> {
    const expectedToken = await this.getTokenFromCookie();

    // ヘッダーからトークンを取得
    let token = this.getTokenFromHeader(request);

    // ヘッダーにない場合はボディから取得
    if (!token && body) {
      token = this.getTokenFromBody(body);
    }

    return verifyCsrfToken(token, expectedToken);
  }

  /**
   * CSRFトークンをクリア
   */
  async clearToken(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(this.config.cookieName);
  }

  /**
   * 設定を取得
   */
  getConfig(): CsrfConfig {
    return { ...this.config };
  }
}

/**
 * デフォルトのCSRFトークンマネージャーインスタンス
 */
export const csrfManager = new CsrfTokenManager();

/**
 * CSRFトークンの検証を行うAPIルートハンドラーラッパー
 *
 * @param handler ルートハンドラー関数
 * @param config CSRF設定
 * @returns ラップされたルートハンドラー
 *
 * @example
 * // app/api/protected/route.ts
 * import { withCsrfProtection } from '@/lib/security/csrf';
 *
 * export const POST = withCsrfProtection(async (request) => {
 *   // CSRF検証済みの処理
 *   return Response.json({ success: true });
 * });
 */
export function withCsrfProtection(
  handler: (request: Request) => Promise<Response>,
  config: Partial<CsrfConfig> = {}
): (request: Request) => Promise<Response> {
  const manager = new CsrfTokenManager(config);

  return async (request: Request) => {
    // GETとHEADリクエストはCSRF検証をスキップ
    const method = request.method.toUpperCase();
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
      return handler(request);
    }

    // リクエストボディを取得（JSONの場合）
    let body: Record<string, unknown> | undefined;
    const contentType = request.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      try {
        body = await request.clone().json();
      } catch {
        // JSONパースエラーは無視（CSRFトークンはヘッダーから取得可能）
      }
    }

    const isValid = await manager.verifyRequest(request, body);

    if (!isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "CSRF_TOKEN_INVALID",
            message: "CSRFトークンが無効または期限切れです",
          },
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    return handler(request);
  };
}

/**
 * クライアントサイドでCSRFトークンを取得するためのAPIエンドポイント用ハンドラー
 *
 * @example
 * // app/api/csrf/route.ts
 * import { getCsrfTokenHandler } from '@/lib/security/csrf';
 *
 * export const GET = getCsrfTokenHandler;
 */
export async function getCsrfTokenHandler(): Promise<Response> {
  const manager = new CsrfTokenManager();
  const token = await manager.generateAndSetToken();

  return new Response(
    JSON.stringify({
      success: true,
      data: { csrfToken: token },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
