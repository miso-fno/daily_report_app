import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { checkRateLimit, RateLimitPresets } from "@/lib/security/rate-limit";

/**
 * セキュリティヘッダーを追加
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // 基本的なセキュリティヘッダーはnext.config.tsで設定されているが、
  // ミドルウェアでも追加の制御が可能
  response.headers.set("X-Request-Id", crypto.randomUUID());

  return response;
}

/**
 * レート制限の対象となるAPIパスを判定
 */
function getRateLimitConfig(pathname: string): {
  name: string;
  config: { limit: number; windowMs: number };
} | null {
  // ログインエンドポイント
  if (pathname === "/api/auth/callback/credentials" || pathname === "/login") {
    return { name: "login", config: RateLimitPresets.login };
  }

  // 一般的なAPIエンドポイント
  if (pathname.startsWith("/api/v1/")) {
    return { name: "api", config: RateLimitPresets.api };
  }

  return null;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // レート制限のチェック
  const rateLimitConfig = getRateLimitConfig(pathname);
  if (rateLimitConfig) {
    const { result, headers } = checkRateLimit(
      req,
      rateLimitConfig.name,
      rateLimitConfig.config,
      pathname
    );

    if (!result.allowed) {
      const response = NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message:
              "リクエスト数が制限を超えました。しばらくしてから再試行してください。",
          },
        },
        { status: 429 }
      );

      // レート制限ヘッダーを追加
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return addSecurityHeaders(response);
    }
  }

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/api/auth"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Allow public routes
  if (isPublicRoute) {
    // Redirect authenticated users away from login page
    if (pathname === "/login" && session) {
      return addSecurityHeaders(NextResponse.redirect(new URL("/", req.url)));
    }
    return addSecurityHeaders(NextResponse.next());
  }

  // Protect all other routes
  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return addSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  return addSecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: [
    // Match all routes except static files and _next
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
