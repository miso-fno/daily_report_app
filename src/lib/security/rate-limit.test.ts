/**
 * Rate Limiting テスト
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import {
  RateLimiter,
  RateLimitPresets,
  getRateLimiter,
  getRateLimiterByPreset,
  getClientIp,
  createRateLimitHeaders,
  checkRateLimit,
} from "./rate-limit";

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({ limit: 5, windowMs: 1000 });
  });

  afterEach(() => {
    limiter.stopCleanup();
    limiter.clear();
  });

  describe("check", () => {
    it("制限内のリクエストを許可する", () => {
      const result = limiter.check("test-key");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("連続リクエストで残り回数が減少する", () => {
      limiter.check("test-key");
      limiter.check("test-key");
      const result = limiter.check("test-key");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it("制限に達したらリクエストを拒否する", () => {
      // 5回のリクエストで制限に達する
      for (let i = 0; i < 5; i++) {
        limiter.check("test-key");
      }

      const result = limiter.check("test-key");

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("異なるキーは独立してカウントされる", () => {
      for (let i = 0; i < 5; i++) {
        limiter.check("key-1");
      }

      const result1 = limiter.check("key-1");
      const result2 = limiter.check("key-2");

      expect(result1.allowed).toBe(false);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(4);
    });

    it("ウィンドウ期限切れ後はカウントがリセットされる", () => {
      vi.useFakeTimers();

      // 制限に達する
      for (let i = 0; i < 5; i++) {
        limiter.check("test-key");
      }

      expect(limiter.check("test-key").allowed).toBe(false);

      // ウィンドウ期限を超える
      vi.advanceTimersByTime(1001);

      const result = limiter.check("test-key");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);

      vi.useRealTimers();
    });

    it("resetIn と resetAt が正しく計算される", () => {
      vi.useFakeTimers();
      const now = Date.now();
      vi.setSystemTime(now);

      const result = limiter.check("test-key");

      expect(result.resetIn).toBe(1000);
      expect(result.resetAt).toBe(now + 1000);

      vi.useRealTimers();
    });
  });

  describe("reset", () => {
    it("特定のキーのエントリをリセットする", () => {
      for (let i = 0; i < 5; i++) {
        limiter.check("test-key");
      }

      expect(limiter.check("test-key").allowed).toBe(false);

      limiter.reset("test-key");

      const result = limiter.check("test-key");
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });

  describe("clear", () => {
    it("全てのエントリをクリアする", () => {
      limiter.check("key-1");
      limiter.check("key-2");
      limiter.check("key-3");

      expect(limiter.getStoreSize()).toBe(3);

      limiter.clear();

      expect(limiter.getStoreSize()).toBe(0);
    });
  });

  describe("cleanup", () => {
    it("期限切れのエントリを削除する", () => {
      vi.useFakeTimers();

      limiter.check("key-1");
      vi.advanceTimersByTime(500);
      limiter.check("key-2");

      expect(limiter.getStoreSize()).toBe(2);

      // key-1のウィンドウが期限切れになるまで進める
      vi.advanceTimersByTime(600);
      limiter.cleanup();

      // key-1は削除され、key-2は残る
      expect(limiter.getStoreSize()).toBe(1);

      vi.useRealTimers();
    });
  });

  describe("getConfig / setConfig", () => {
    it("設定を取得できる", () => {
      const config = limiter.getConfig();

      expect(config.limit).toBe(5);
      expect(config.windowMs).toBe(1000);
    });

    it("設定を更新できる", () => {
      limiter.setConfig({ limit: 10 });

      const config = limiter.getConfig();
      expect(config.limit).toBe(10);
      expect(config.windowMs).toBe(1000);
    });
  });
});

describe("RateLimitPresets", () => {
  it("api プリセットが正しく定義されている", () => {
    expect(RateLimitPresets.api.limit).toBe(60);
    expect(RateLimitPresets.api.windowMs).toBe(60 * 1000);
  });

  it("login プリセットが正しく定義されている", () => {
    expect(RateLimitPresets.login.limit).toBe(5);
    expect(RateLimitPresets.login.windowMs).toBe(15 * 60 * 1000);
  });

  it("passwordReset プリセットが正しく定義されている", () => {
    expect(RateLimitPresets.passwordReset.limit).toBe(3);
    expect(RateLimitPresets.passwordReset.windowMs).toBe(60 * 60 * 1000);
  });
});

describe("getRateLimiter", () => {
  it("同じ名前で同じインスタンスを返す", () => {
    const limiter1 = getRateLimiter("test", { limit: 10, windowMs: 1000 });
    const limiter2 = getRateLimiter("test", { limit: 10, windowMs: 1000 });

    expect(limiter1).toBe(limiter2);
  });

  it("異なる名前で異なるインスタンスを返す", () => {
    const limiter1 = getRateLimiter("test1", { limit: 10, windowMs: 1000 });
    const limiter2 = getRateLimiter("test2", { limit: 10, windowMs: 1000 });

    expect(limiter1).not.toBe(limiter2);
  });
});

describe("getRateLimiterByPreset", () => {
  it("プリセットからレートリミッターを取得できる", () => {
    const limiter = getRateLimiterByPreset("login");

    expect(limiter.getConfig().limit).toBe(5);
    expect(limiter.getConfig().windowMs).toBe(15 * 60 * 1000);
  });
});

describe("getClientIp", () => {
  it("X-Forwarded-For ヘッダーからIPを取得する", () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "192.168.1.1, 10.0.0.1",
      },
    });

    const ip = getClientIp(request);

    expect(ip).toBe("192.168.1.1");
  });

  it("X-Real-IP ヘッダーからIPを取得する", () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-real-ip": "192.168.1.2",
      },
    });

    const ip = getClientIp(request);

    expect(ip).toBe("192.168.1.2");
  });

  it("ヘッダーがない場合は unknown を返す", () => {
    const request = new Request("https://example.com");

    const ip = getClientIp(request);

    expect(ip).toBe("unknown");
  });

  it("X-Forwarded-For が優先される", () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "192.168.1.1",
        "x-real-ip": "192.168.1.2",
      },
    });

    const ip = getClientIp(request);

    expect(ip).toBe("192.168.1.1");
  });
});

describe("createRateLimitHeaders", () => {
  it("正しいヘッダーを生成する", () => {
    const result = {
      allowed: true,
      remaining: 5,
      resetIn: 30000,
      resetAt: 1704067200000,
    };
    const config = { limit: 10, windowMs: 60000 };

    const headers = createRateLimitHeaders(result, config);

    expect(headers["X-RateLimit-Limit"]).toBe("10");
    expect(headers["X-RateLimit-Remaining"]).toBe("5");
    expect(headers["X-RateLimit-Reset"]).toBe("1704067200");
    expect(headers["Retry-After"]).toBe("0");
  });

  it("制限超過時は Retry-After を設定する", () => {
    const result = {
      allowed: false,
      remaining: 0,
      resetIn: 30000,
      resetAt: 1704067200000,
    };
    const config = { limit: 10, windowMs: 60000 };

    const headers = createRateLimitHeaders(result, config);

    expect(headers["Retry-After"]).toBe("30");
  });
});

describe("checkRateLimit", () => {
  it("リクエストをチェックして結果とヘッダーを返す", () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "192.168.1.100",
      },
    });

    const { result, headers } = checkRateLimit(request, "check-test", {
      limit: 10,
      windowMs: 60000,
    });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
    expect(headers["X-RateLimit-Limit"]).toBe("10");
  });

  it("キープレフィックスを使用できる", () => {
    const request = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "192.168.1.101",
      },
    });

    const { result: result1 } = checkRateLimit(
      request,
      "prefix-test",
      { limit: 10, windowMs: 60000 },
      "prefix1"
    );

    const { result: result2 } = checkRateLimit(
      request,
      "prefix-test",
      { limit: 10, windowMs: 60000 },
      "prefix2"
    );

    // 異なるプレフィックスは独立してカウントされる
    expect(result1.remaining).toBe(9);
    expect(result2.remaining).toBe(9);
  });
});
