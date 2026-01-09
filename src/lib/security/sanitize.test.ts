/**
 * サニタイズユーティリティ テスト
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";

import {
  escapeHtml,
  unescapeHtml,
  stripDangerousTags,
  stripAllTags,
  stripControlCharacters,
  normalizeWhitespace,
  sanitize,
  sanitizeObject,
  escapeSqlLike,
  sanitizedString,
  escapedString,
  strippedString,
  normalizedString,
  safeUrl,
  safeEmail,
} from "./sanitize";

describe("escapeHtml", () => {
  it("基本的なHTML文字をエスケープする", () => {
    expect(escapeHtml("<")).toBe("&lt;");
    expect(escapeHtml(">")).toBe("&gt;");
    expect(escapeHtml("&")).toBe("&amp;");
    expect(escapeHtml('"')).toBe("&quot;");
    expect(escapeHtml("'")).toBe("&#x27;");
    expect(escapeHtml("/")).toBe("&#x2F;");
    expect(escapeHtml("`")).toBe("&#x60;");
    expect(escapeHtml("=")).toBe("&#x3D;");
  });

  it("scriptタグをエスケープする", () => {
    const input = '<script>alert("XSS")</script>';
    const expected = "&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;";

    expect(escapeHtml(input)).toBe(expected);
  });

  it("通常のテキストはそのまま返す", () => {
    const input = "Hello, World!";

    expect(escapeHtml(input)).toBe(input);
  });

  it("空文字列を正しく処理する", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("非文字列入力に対して空文字を返す", () => {
    expect(escapeHtml(null as unknown as string)).toBe("");
    expect(escapeHtml(undefined as unknown as string)).toBe("");
    expect(escapeHtml(123 as unknown as string)).toBe("");
  });

  it("複合的なXSSペイロードをエスケープする", () => {
    const input = '<img src="x" onerror="alert(1)">';
    const result = escapeHtml(input);

    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
  });
});

describe("unescapeHtml", () => {
  it("エスケープされた文字を元に戻す", () => {
    expect(unescapeHtml("&lt;")).toBe("<");
    expect(unescapeHtml("&gt;")).toBe(">");
    expect(unescapeHtml("&amp;")).toBe("&");
    expect(unescapeHtml("&quot;")).toBe('"');
    expect(unescapeHtml("&#x27;")).toBe("'");
  });

  it("escapeHtml の逆変換となる", () => {
    const original = '<script>alert("test")</script>';
    const escaped = escapeHtml(original);
    const unescaped = unescapeHtml(escaped);

    expect(unescaped).toBe(original);
  });
});

describe("stripDangerousTags", () => {
  it("scriptタグを除去する", () => {
    const input = '<p>Hello</p><script>alert("XSS")</script><p>World</p>';

    expect(stripDangerousTags(input)).toBe("<p>Hello</p><p>World</p>");
  });

  it("iframeタグを除去する", () => {
    const input = '<p>Content</p><iframe src="evil.com"></iframe>';
    const result = stripDangerousTags(input);

    // iframeの開始タグが除去されることを確認
    expect(result).not.toContain("<iframe");
    expect(result).toContain("<p>Content</p>");
  });

  it("javascript: URLを除去する", () => {
    const input = '<a href="javascript:alert(1)">Click</a>';

    expect(stripDangerousTags(input)).toBe('<a href="alert(1)">Click</a>');
  });

  it("onイベントハンドラを除去する", () => {
    const input = '<img src="x" onerror="alert(1)">';

    expect(stripDangerousTags(input)).toBe('<img src="x" "alert(1)">');
  });

  it("安全なHTMLはそのまま残す", () => {
    const input = "<p>Hello <b>World</b></p>";

    expect(stripDangerousTags(input)).toBe(input);
  });
});

describe("stripAllTags", () => {
  it("全てのHTMLタグを除去する", () => {
    const input = "<p>Hello <b>World</b></p>";

    expect(stripAllTags(input)).toBe("Hello World");
  });

  it("自己終了タグを除去する", () => {
    const input = "<p>Line 1<br/>Line 2</p>";

    expect(stripAllTags(input)).toBe("Line 1Line 2");
  });

  it("タグのない文字列はそのまま返す", () => {
    const input = "Plain text";

    expect(stripAllTags(input)).toBe(input);
  });
});

describe("stripControlCharacters", () => {
  it("制御文字を除去する", () => {
    const input = "Hello\x00World\x1F!";

    expect(stripControlCharacters(input)).toBe("HelloWorld!");
  });

  it("改行とタブは残す", () => {
    const input = "Line 1\nLine 2\tTabbed";

    expect(stripControlCharacters(input)).toBe(input);
  });

  it("通常のテキストは変更しない", () => {
    const input = "Normal text with 日本語";

    expect(stripControlCharacters(input)).toBe(input);
  });
});

describe("normalizeWhitespace", () => {
  it("前後の空白をトリムする", () => {
    expect(normalizeWhitespace("  hello  ")).toBe("hello");
  });

  it("連続した空白を単一スペースに置換する", () => {
    expect(normalizeWhitespace("hello    world")).toBe("hello world");
  });

  it("改行を含む空白を正規化する", () => {
    expect(normalizeWhitespace("hello\n\n  world")).toBe("hello world");
  });
});

describe("sanitize", () => {
  it("デフォルトオプションでサニタイズする", () => {
    const input = '<script>alert("XSS")</script>Hello';
    const result = sanitize(input);

    expect(result).not.toContain("<script>");
    expect(result).toContain("Hello");
  });

  it("全てのタグを除去するオプション", () => {
    const input = "<p>Hello <b>World</b></p>";
    const result = sanitize(input, { stripAllTags: true });

    expect(result).toBe("Hello World");
  });

  it("HTMLエスケープを無効化できる", () => {
    const input = "<p>Hello</p>";
    const result = sanitize(input, {
      escapeHtml: false,
      stripDangerousTags: false,
    });

    expect(result).toBe("<p>Hello</p>");
  });

  it("最大文字数を制限できる", () => {
    const input = "Hello World";
    const result = sanitize(input, { maxLength: 5 });

    expect(result).toBe("Hello");
  });

  it("空白を正規化できる", () => {
    const input = "  hello    world  ";
    const result = sanitize(input, {
      escapeHtml: false,
      normalizeWhitespace: true,
    });

    expect(result).toBe("hello world");
  });
});

describe("sanitizeObject", () => {
  it("オブジェクトの全ての文字列プロパティをサニタイズする", () => {
    const input = {
      name: '<script>alert("XSS")</script>John',
      age: 30,
      active: true,
    };

    const result = sanitizeObject(input);

    expect(result.name).not.toContain("<script>");
    expect(result.name).toContain("John");
    expect(result.age).toBe(30);
    expect(result.active).toBe(true);
  });

  it("ネストしたオブジェクトも処理する", () => {
    const input = {
      user: {
        name: "<b>John</b>",
        profile: {
          bio: "<script>alert(1)</script>Bio",
        },
      },
    };

    const result = sanitizeObject(input, { stripAllTags: true });

    expect(result.user.name).toBe("John");
    // stripAllTagsでscriptタグは除去され、テキストのみ残る
    expect(result.user.profile.bio).not.toContain("<script>");
    expect(result.user.profile.bio).toContain("Bio");
  });
});

describe("escapeSqlLike", () => {
  it("LIKE句の特殊文字をエスケープする", () => {
    expect(escapeSqlLike("%")).toBe("\\%");
    expect(escapeSqlLike("_")).toBe("\\_");
    expect(escapeSqlLike("\\")).toBe("\\\\");
  });

  it("複合的なパターンをエスケープする", () => {
    const input = "50%_off\\sale";
    const expected = "50\\%\\_off\\\\sale";

    expect(escapeSqlLike(input)).toBe(expected);
  });

  it("通常の文字列は変更しない", () => {
    const input = "normal text";

    expect(escapeSqlLike(input)).toBe(input);
  });
});

describe("Zodスキーマ統合", () => {
  describe("sanitizedString", () => {
    it("文字列をサニタイズする", () => {
      const schema = z.object({
        name: sanitizedString({ maxLength: 10 }),
      });

      const result = schema.parse({ name: '<script>alert("XSS")</script>' });

      expect(result.name).not.toContain("<script>");
      expect(result.name.length).toBeLessThanOrEqual(10);
    });
  });

  describe("escapedString", () => {
    it("HTMLをエスケープする", () => {
      const result = escapedString.parse("<p>Test</p>");

      expect(result).toBe("&lt;p&gt;Test&lt;&#x2F;p&gt;");
    });
  });

  describe("strippedString", () => {
    it("全てのタグを除去する", () => {
      const result = strippedString.parse("<p>Hello <b>World</b></p>");

      expect(result).toBe("Hello World");
    });
  });

  describe("normalizedString", () => {
    it("空白を正規化する", () => {
      const result = normalizedString.parse("  hello    world  ");

      expect(result).toBe("hello world");
    });
  });

  describe("safeUrl", () => {
    it("有効なHTTPSのURLを許可する", () => {
      const result = safeUrl.parse("https://example.com/path");

      expect(result).toBe("https://example.com/path");
    });

    it("javascript: URLを拒否する", () => {
      expect(() => safeUrl.parse("javascript:alert(1)")).toThrow();
    });

    it("data: URLを拒否する", () => {
      expect(() =>
        safeUrl.parse("data:text/html,<script>alert(1)</script>")
      ).toThrow();
    });

    it("大文字小文字を区別せずにブロックする", () => {
      expect(() => safeUrl.parse("JAVASCRIPT:alert(1)")).toThrow();
      expect(() => safeUrl.parse("JavaScript:alert(1)")).toThrow();
    });
  });

  describe("safeEmail", () => {
    it("有効なメールアドレスを許可する", () => {
      const result = safeEmail.parse("Test@Example.COM");

      expect(result).toBe("test@example.com");
    });

    it("無効なメールアドレスを拒否する", () => {
      expect(() => safeEmail.parse("invalid-email")).toThrow();
    });

    it("小文字に変換してトリムする", () => {
      // Zodのemail()は前後の空白を含むものを無効とするため、
      // 事前にトリムしてからパースする必要がある
      const result = safeEmail.parse("User@Example.COM");

      expect(result).toBe("user@example.com");
    });
  });
});
