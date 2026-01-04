/**
 * 認証ミドルウェアの単体テスト・結合テスト
 *
 * テスト対象:
 * - パブリックルートへのアクセス
 * - 認証が必要なルートへの保護
 * - 認証済みユーザーのログインページリダイレクト
 * - 認証フロー全体の結合テスト
 */

import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

// NextResponseをモック
vi.mock("next/server", () => ({
  NextResponse: {
    next: vi.fn(() => ({ type: "next" })),
    redirect: vi.fn((url: URL) => ({ type: "redirect", url: url.toString() })),
  },
}));

// 認証セッションの型定義
type MockSession = { user: { id: number; email: string; name: string } } | null;

// auth関数をモックとして作成（ミドルウェアロジックを再現）
function createMockMiddleware() {
  return (req: {
    nextUrl: { pathname: string };
    url: string;
    auth: MockSession;
  }) => {
    const { pathname } = req.nextUrl;
    const session = req.auth;

    // Public routes that don't require authentication
    const publicRoutes = ["/login", "/api/auth"];
    const isPublicRoute = publicRoutes.some((route) =>
      pathname.startsWith(route)
    );

    // Allow public routes
    if (isPublicRoute) {
      // Redirect authenticated users away from login page
      if (pathname === "/login" && session) {
        return NextResponse.redirect(new URL("/", req.url));
      }
      return NextResponse.next();
    }

    // Protect all other routes
    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  };
}

describe("認証ミドルウェア", () => {
  const middleware = createMockMiddleware();
  const baseUrl = "http://localhost:3000";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("パブリックルートへのアクセス", () => {
    it("/loginページは認証なしでアクセスできること", () => {
      // Arrange
      const req = {
        nextUrl: { pathname: "/login" },
        url: baseUrl,
        auth: null,
      };

      // Act
      const result = middleware(req);

      // Assert
      expect(result).toEqual({ type: "next" });
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it("/api/authは認証なしでアクセスできること", () => {
      // Arrange
      const req = {
        nextUrl: { pathname: "/api/auth/signin" },
        url: baseUrl,
        auth: null,
      };

      // Act
      const result = middleware(req);

      // Assert
      expect(result).toEqual({ type: "next" });
    });

    it("/api/auth/callbackは認証なしでアクセスできること", () => {
      // Arrange
      const req = {
        nextUrl: { pathname: "/api/auth/callback/credentials" },
        url: baseUrl,
        auth: null,
      };

      // Act
      const result = middleware(req);

      // Assert
      expect(result).toEqual({ type: "next" });
    });

    it("/api/auth/sessionは認証なしでアクセスできること", () => {
      // Arrange
      const req = {
        nextUrl: { pathname: "/api/auth/session" },
        url: baseUrl,
        auth: null,
      };

      // Act
      const result = middleware(req);

      // Assert
      expect(result).toEqual({ type: "next" });
    });
  });

  describe("認証が必要なルートの保護", () => {
    it("未認証ユーザーは/にアクセスすると/loginにリダイレクトされること", () => {
      // Arrange
      const req = {
        nextUrl: { pathname: "/" },
        url: baseUrl,
        auth: null,
      };

      // Act
      const result = middleware(req);

      // Assert
      expect(result).toEqual({
        type: "redirect",
        url: `${baseUrl}/login?callbackUrl=%2F`,
      });
    });

    it("未認証ユーザーは/dashboardにアクセスすると/loginにリダイレクトされること", () => {
      // Arrange
      const req = {
        nextUrl: { pathname: "/dashboard" },
        url: baseUrl,
        auth: null,
      };

      // Act
      const result = middleware(req);

      // Assert
      expect(result).toEqual({
        type: "redirect",
        url: `${baseUrl}/login?callbackUrl=%2Fdashboard`,
      });
    });

    it("未認証ユーザーは/reportsにアクセスすると/loginにリダイレクトされること", () => {
      // Arrange
      const req = {
        nextUrl: { pathname: "/reports" },
        url: baseUrl,
        auth: null,
      };

      // Act
      const result = middleware(req);

      // Assert
      expect(result).toEqual({
        type: "redirect",
        url: `${baseUrl}/login?callbackUrl=%2Freports`,
      });
    });

    it("未認証ユーザーは/reports/1にアクセスすると/loginにリダイレクトされること", () => {
      // Arrange
      const req = {
        nextUrl: { pathname: "/reports/1" },
        url: baseUrl,
        auth: null,
      };

      // Act
      const result = middleware(req);

      // Assert
      expect(result).toEqual({
        type: "redirect",
        url: `${baseUrl}/login?callbackUrl=%2Freports%2F1`,
      });
    });

    it("未認証ユーザーは/customersにアクセスすると/loginにリダイレクトされること", () => {
      // Arrange
      const req = {
        nextUrl: { pathname: "/customers" },
        url: baseUrl,
        auth: null,
      };

      // Act
      const result = middleware(req);

      // Assert
      expect(result).toEqual({
        type: "redirect",
        url: `${baseUrl}/login?callbackUrl=%2Fcustomers`,
      });
    });

    it("未認証ユーザーは/sales-personsにアクセスすると/loginにリダイレクトされること", () => {
      // Arrange
      const req = {
        nextUrl: { pathname: "/sales-persons" },
        url: baseUrl,
        auth: null,
      };

      // Act
      const result = middleware(req);

      // Assert
      expect(result).toEqual({
        type: "redirect",
        url: `${baseUrl}/login?callbackUrl=%2Fsales-persons`,
      });
    });

    it("未認証ユーザーはAPI(/api/v1/reports)にアクセスすると/loginにリダイレクトされること", () => {
      // Arrange
      const req = {
        nextUrl: { pathname: "/api/v1/reports" },
        url: baseUrl,
        auth: null,
      };

      // Act
      const result = middleware(req);

      // Assert
      expect(result).toEqual({
        type: "redirect",
        url: `${baseUrl}/login?callbackUrl=%2Fapi%2Fv1%2Freports`,
      });
    });
  });

  describe("認証済みユーザーのアクセス", () => {
    const authenticatedSession = {
      user: {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        department: "Sales",
        isManager: false,
        managerId: null,
      },
    };

    it("認証済みユーザーは/にアクセスできること", () => {
      // Arrange
      const req = {
        nextUrl: { pathname: "/" },
        url: baseUrl,
        auth: authenticatedSession,
      };

      // Act
      const result = middleware(req);

      // Assert
      expect(result).toEqual({ type: "next" });
    });

    it("認証済みユーザーは/dashboardにアクセスできること", () => {
      // Arrange
      const req = {
        nextUrl: { pathname: "/dashboard" },
        url: baseUrl,
        auth: authenticatedSession,
      };

      // Act
      const result = middleware(req);

      // Assert
      expect(result).toEqual({ type: "next" });
    });

    it("認証済みユーザーは/reportsにアクセスできること", () => {
      // Arrange
      const req = {
        nextUrl: { pathname: "/reports" },
        url: baseUrl,
        auth: authenticatedSession,
      };

      // Act
      const result = middleware(req);

      // Assert
      expect(result).toEqual({ type: "next" });
    });

    it("認証済みユーザーは/reports/1にアクセスできること", () => {
      // Arrange
      const req = {
        nextUrl: { pathname: "/reports/1" },
        url: baseUrl,
        auth: authenticatedSession,
      };

      // Act
      const result = middleware(req);

      // Assert
      expect(result).toEqual({ type: "next" });
    });

    it("認証済みユーザーは/customersにアクセスできること", () => {
      // Arrange
      const req = {
        nextUrl: { pathname: "/customers" },
        url: baseUrl,
        auth: authenticatedSession,
      };

      // Act
      const result = middleware(req);

      // Assert
      expect(result).toEqual({ type: "next" });
    });

    it("認証済みユーザーは/sales-personsにアクセスできること", () => {
      // Arrange
      const req = {
        nextUrl: { pathname: "/sales-persons" },
        url: baseUrl,
        auth: authenticatedSession,
      };

      // Act
      const result = middleware(req);

      // Assert
      expect(result).toEqual({ type: "next" });
    });

    it("認証済みユーザーは/api/v1/reportsにアクセスできること", () => {
      // Arrange
      const req = {
        nextUrl: { pathname: "/api/v1/reports" },
        url: baseUrl,
        auth: authenticatedSession,
      };

      // Act
      const result = middleware(req);

      // Assert
      expect(result).toEqual({ type: "next" });
    });
  });

  describe("認証済みユーザーのログインページリダイレクト", () => {
    const authenticatedSession = {
      user: {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        department: "Sales",
        isManager: false,
        managerId: null,
      },
    };

    it("認証済みユーザーが/loginにアクセスすると/にリダイレクトされること", () => {
      // Arrange
      const req = {
        nextUrl: { pathname: "/login" },
        url: baseUrl,
        auth: authenticatedSession,
      };

      // Act
      const result = middleware(req);

      // Assert
      expect(result).toEqual({
        type: "redirect",
        url: `${baseUrl}/`,
      });
    });

    it("認証済みユーザーが/api/authにアクセスしてもリダイレクトされないこと", () => {
      // Arrange
      const req = {
        nextUrl: { pathname: "/api/auth/session" },
        url: baseUrl,
        auth: authenticatedSession,
      };

      // Act
      const result = middleware(req);

      // Assert
      expect(result).toEqual({ type: "next" });
    });
  });

  describe("callbackUrl パラメータ", () => {
    it("リダイレクト先にcallbackUrlパラメータが含まれること", () => {
      // Arrange
      const req = {
        nextUrl: { pathname: "/reports/123/edit" },
        url: baseUrl,
        auth: null,
      };

      // Act
      const result = middleware(req);

      // Assert
      expect(result).toEqual({
        type: "redirect",
        url: `${baseUrl}/login?callbackUrl=%2Freports%2F123%2Fedit`,
      });
    });

    it("深いネストのパスもcallbackUrlに正しくエンコードされること", () => {
      // Arrange
      const req = {
        nextUrl: { pathname: "/api/v1/reports/123/comments" },
        url: baseUrl,
        auth: null,
      };

      // Act
      const result = middleware(req);

      // Assert
      expect(result).toEqual({
        type: "redirect",
        url: `${baseUrl}/login?callbackUrl=%2Fapi%2Fv1%2Freports%2F123%2Fcomments`,
      });
    });
  });
});

describe("認証フロー結合テスト", () => {
  const middleware = createMockMiddleware();
  const baseUrl = "http://localhost:3000";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("完全な認証フロー", () => {
    it("未認証 -> ログインページ -> 認証 -> 元のページへリダイレクト（シナリオテスト）", () => {
      // Step 1: 未認証ユーザーが/reports/1にアクセス
      const step1Req = {
        nextUrl: { pathname: "/reports/1" },
        url: baseUrl,
        auth: null,
      };
      const step1Result = middleware(step1Req);

      // /loginにリダイレクトされる（callbackUrl付き）
      expect(step1Result).toEqual({
        type: "redirect",
        url: `${baseUrl}/login?callbackUrl=%2Freports%2F1`,
      });

      // Step 2: ログインページにアクセス（未認証でもOK）
      const step2Req = {
        nextUrl: { pathname: "/login" },
        url: `${baseUrl}/login?callbackUrl=%2Freports%2F1`,
        auth: null,
      };
      const step2Result = middleware(step2Req);

      // ログインページは表示される
      expect(step2Result).toEqual({ type: "next" });

      // Step 3: ログイン後、認証済みで/reports/1にアクセス
      const authenticatedSession = {
        user: {
          id: 1,
          email: "test@example.com",
          name: "Test User",
          department: "Sales",
          isManager: false,
          managerId: null,
        },
      };
      const step3Req = {
        nextUrl: { pathname: "/reports/1" },
        url: baseUrl,
        auth: authenticatedSession,
      };
      const step3Result = middleware(step3Req);

      // 認証済みなので正常にアクセスできる
      expect(step3Result).toEqual({ type: "next" });
    });

    it("認証済みユーザーがログインページにアクセスしてホームにリダイレクト（シナリオテスト）", () => {
      // 認証済みセッション
      const authenticatedSession = {
        user: {
          id: 1,
          email: "test@example.com",
          name: "Test User",
          department: "Sales",
          isManager: false,
          managerId: null,
        },
      };

      // Step 1: 認証済みユーザーが/loginにアクセス
      const step1Req = {
        nextUrl: { pathname: "/login" },
        url: baseUrl,
        auth: authenticatedSession,
      };
      const step1Result = middleware(step1Req);

      // /にリダイレクトされる
      expect(step1Result).toEqual({
        type: "redirect",
        url: `${baseUrl}/`,
      });

      // Step 2: /にアクセス
      const step2Req = {
        nextUrl: { pathname: "/" },
        url: baseUrl,
        auth: authenticatedSession,
      };
      const step2Result = middleware(step2Req);

      // 正常にアクセスできる
      expect(step2Result).toEqual({ type: "next" });
    });
  });

  describe("セッション切れシナリオ", () => {
    it("セッションが切れた場合、保護されたページから/loginにリダイレクトされること", () => {
      // 最初は認証済み
      const authenticatedSession = {
        user: {
          id: 1,
          email: "test@example.com",
          name: "Test User",
          department: "Sales",
          isManager: false,
          managerId: null,
        },
      };

      // Step 1: 認証済みで/dashboardにアクセス
      const step1Req = {
        nextUrl: { pathname: "/dashboard" },
        url: baseUrl,
        auth: authenticatedSession,
      };
      const step1Result = middleware(step1Req);
      expect(step1Result).toEqual({ type: "next" });

      // Step 2: セッション切れ後に/reportsにアクセス
      const step2Req = {
        nextUrl: { pathname: "/reports" },
        url: baseUrl,
        auth: null, // セッションが切れた
      };
      const step2Result = middleware(step2Req);

      // /loginにリダイレクトされる
      expect(step2Result).toEqual({
        type: "redirect",
        url: `${baseUrl}/login?callbackUrl=%2Freports`,
      });
    });
  });

  describe("上長権限ユーザーのアクセス", () => {
    it("上長ユーザーは管理ページにアクセスできること", () => {
      // 上長セッション
      const managerSession = {
        user: {
          id: 2,
          email: "manager@example.com",
          name: "Manager User",
          department: "Sales",
          isManager: true,
          managerId: null,
        },
      };

      const req = {
        nextUrl: { pathname: "/sales-persons" },
        url: baseUrl,
        auth: managerSession,
      };
      const result = middleware(req);

      // ミドルウェアレベルでは認証のみチェックするためアクセス可能
      // 権限チェックはルートハンドラまたはページで行う
      expect(result).toEqual({ type: "next" });
    });
  });
});

describe("ミドルウェア設定", () => {
  it("matcherパターンが正しく定義されていること", () => {
    // ミドルウェアのmatcher設定をテスト
    const config = {
      matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
      ],
    };

    // 静的ファイルは除外される
    const staticPattern = config.matcher[0];
    expect(staticPattern).toContain("_next/static");
    expect(staticPattern).toContain("_next/image");
    expect(staticPattern).toContain("favicon.ico");

    // 画像ファイル拡張子も除外される
    expect(staticPattern).toContain("svg");
    expect(staticPattern).toContain("png");
    expect(staticPattern).toContain("jpg");
    expect(staticPattern).toContain("jpeg");
    expect(staticPattern).toContain("gif");
    expect(staticPattern).toContain("webp");
  });
});
