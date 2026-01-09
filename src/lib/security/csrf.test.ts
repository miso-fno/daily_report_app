/**
 * CSRFトークン テスト
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  generateRandomToken,
  generateCsrfToken,
  timingSafeEqual,
  verifyCsrfToken,
  CsrfTokenManager,
  DEFAULT_CSRF_CONFIG,
  withCsrfProtection,
} from "./csrf";

describe("generateRandomToken", () => {
  it("指定した長さの16進数文字列を生成する", () => {
    const token = generateRandomToken(16);

    // 16バイト = 32文字の16進数
    expect(token).toHaveLength(32);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it("デフォルトで32バイトのトークンを生成する", () => {
    const token = generateRandomToken();

    // 32バイト = 64文字の16進数
    expect(token).toHaveLength(64);
  });

  it("毎回異なるトークンを生成する", () => {
    const token1 = generateRandomToken();
    const token2 = generateRandomToken();

    expect(token1).not.toBe(token2);
  });
});

describe("generateCsrfToken", () => {
  it("64文字のトークンを生成する", () => {
    const token = generateCsrfToken();

    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });
});

describe("timingSafeEqual", () => {
  it("同じ文字列でtrueを返す", () => {
    expect(timingSafeEqual("token123", "token123")).toBe(true);
  });

  it("異なる文字列でfalseを返す", () => {
    expect(timingSafeEqual("token123", "token456")).toBe(false);
  });

  it("長さが異なる文字列でfalseを返す", () => {
    expect(timingSafeEqual("short", "muchlongerstring")).toBe(false);
  });

  it("空文字列同士でtrueを返す", () => {
    expect(timingSafeEqual("", "")).toBe(true);
  });

  it("非文字列入力でfalseを返す", () => {
    expect(timingSafeEqual(null as unknown as string, "token")).toBe(false);
    expect(timingSafeEqual("token", undefined as unknown as string)).toBe(
      false
    );
    expect(timingSafeEqual(123 as unknown as string, "123")).toBe(false);
  });
});

describe("verifyCsrfToken", () => {
  it("一致するトークンでtrueを返す", () => {
    const token = "valid-csrf-token";

    expect(verifyCsrfToken(token, token)).toBe(true);
  });

  it("一致しないトークンでfalseを返す", () => {
    expect(verifyCsrfToken("token1", "token2")).toBe(false);
  });

  it("nullトークンでfalseを返す", () => {
    expect(verifyCsrfToken(null, "token")).toBe(false);
    expect(verifyCsrfToken("token", null)).toBe(false);
    expect(verifyCsrfToken(null, null)).toBe(false);
  });

  it("undefinedトークンでfalseを返す", () => {
    expect(verifyCsrfToken(undefined, "token")).toBe(false);
    expect(verifyCsrfToken("token", undefined)).toBe(false);
  });
});

describe("DEFAULT_CSRF_CONFIG", () => {
  it("適切なデフォルト値を持つ", () => {
    expect(DEFAULT_CSRF_CONFIG.cookieName).toBe("__csrf_token");
    expect(DEFAULT_CSRF_CONFIG.headerName).toBe("X-CSRF-Token");
    expect(DEFAULT_CSRF_CONFIG.maxAge).toBe(3600);
    expect(DEFAULT_CSRF_CONFIG.path).toBe("/");
    expect(DEFAULT_CSRF_CONFIG.sameSite).toBe("strict");
    expect(DEFAULT_CSRF_CONFIG.httpOnly).toBe(true);
  });
});

describe("CsrfTokenManager", () => {
  let manager: CsrfTokenManager;

  beforeEach(() => {
    manager = new CsrfTokenManager();
  });

  describe("getConfig", () => {
    it("設定を取得できる", () => {
      const config = manager.getConfig();

      expect(config.cookieName).toBe(DEFAULT_CSRF_CONFIG.cookieName);
      expect(config.headerName).toBe(DEFAULT_CSRF_CONFIG.headerName);
    });

    it("カスタム設定を反映する", () => {
      const customManager = new CsrfTokenManager({
        cookieName: "custom_csrf",
        maxAge: 7200,
      });

      const config = customManager.getConfig();

      expect(config.cookieName).toBe("custom_csrf");
      expect(config.maxAge).toBe(7200);
    });
  });

  describe("getTokenFromHeader", () => {
    it("ヘッダーからトークンを取得する", () => {
      const request = new Request("https://example.com", {
        headers: {
          "X-CSRF-Token": "test-token",
        },
      });

      const token = manager.getTokenFromHeader(request);

      expect(token).toBe("test-token");
    });

    it("ヘッダーがない場合はnullを返す", () => {
      const request = new Request("https://example.com");

      const token = manager.getTokenFromHeader(request);

      expect(token).toBeNull();
    });
  });

  describe("getTokenFromBody", () => {
    it("ボディからトークンを取得する", () => {
      const body = { _csrf: "test-token", data: "value" };

      const token = manager.getTokenFromBody(body);

      expect(token).toBe("test-token");
    });

    it("カスタムフィールド名を使用できる", () => {
      const body = { csrfToken: "test-token", data: "value" };

      const token = manager.getTokenFromBody(body, "csrfToken");

      expect(token).toBe("test-token");
    });

    it("フィールドがない場合はnullを返す", () => {
      const body = { data: "value" };

      const token = manager.getTokenFromBody(body);

      expect(token).toBeNull();
    });

    it("非文字列フィールドはnullを返す", () => {
      const body = { _csrf: 123, data: "value" };

      const token = manager.getTokenFromBody(body);

      expect(token).toBeNull();
    });
  });
});

describe("withCsrfProtection", () => {
  const mockHandler = vi.fn(async () => {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });

  beforeEach(() => {
    mockHandler.mockClear();
  });

  it("GETリクエストはCSRF検証をスキップする", async () => {
    const protectedHandler = withCsrfProtection(mockHandler);
    const request = new Request("https://example.com", { method: "GET" });

    await protectedHandler(request);

    expect(mockHandler).toHaveBeenCalled();
  });

  it("HEADリクエストはCSRF検証をスキップする", async () => {
    const protectedHandler = withCsrfProtection(mockHandler);
    const request = new Request("https://example.com", { method: "HEAD" });

    await protectedHandler(request);

    expect(mockHandler).toHaveBeenCalled();
  });

  it("OPTIONSリクエストはCSRF検証をスキップする", async () => {
    const protectedHandler = withCsrfProtection(mockHandler);
    const request = new Request("https://example.com", { method: "OPTIONS" });

    await protectedHandler(request);

    expect(mockHandler).toHaveBeenCalled();
  });

  // 注意: 以下のテストはNext.jsのリクエストスコープ外でcookies()を呼び出すため
  // 統合テスト環境でのみ実行可能です。
  // withCsrfProtectionの状態変更メソッド(POST/PUT/DELETE)のテストは
  // E2Eテストまたは統合テストで行う必要があります。

  it("POST/PUT/DELETEリクエストは検証が必要（統合テスト向け）", () => {
    // このテストはwithCsrfProtectionの設計意図を文書化します
    // 実際の検証テストはNext.jsのリクエストコンテキスト内で行う必要があります
    const handler = withCsrfProtection(mockHandler);

    // ハンドラーが関数として返されることを確認
    expect(typeof handler).toBe("function");
  });
});
