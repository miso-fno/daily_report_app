/**
 * XSS対策 サニタイズユーティリティ
 *
 * HTMLエスケープと入力値のサニタイズ機能を提供します。
 * Reactは基本的にXSS対策が施されていますが、dangerouslySetInnerHTMLを
 * 使用する場合や、DBに保存する前の追加対策として使用します。
 */

import { z } from "zod";

/**
 * HTMLエスケープが必要な文字のマッピング
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
};

/**
 * HTMLエスケープ用の正規表現
 */
const HTML_ESCAPE_REGEX = /[&<>"'`=/]/g;

/**
 * 危険な文字列パターン（XSS攻撃に使用される可能性のあるもの）
 */
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<link/gi,
  /<style/gi,
  /<meta/gi,
  /expression\s*\(/gi,
  /url\s*\(/gi,
];

/**
 * 文字列をHTMLエスケープ
 *
 * @param input エスケープする文字列
 * @returns エスケープされた文字列
 *
 * @example
 * escapeHtml('<script>alert("XSS")</script>')
 * // => '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
 */
export function escapeHtml(input: string): string {
  if (typeof input !== "string") {
    return "";
  }
  return input.replace(
    HTML_ESCAPE_REGEX,
    (char) => HTML_ESCAPE_MAP[char] || char
  );
}

/**
 * HTMLエスケープを解除（デコード）
 *
 * @param input デコードする文字列
 * @returns デコードされた文字列
 */
export function unescapeHtml(input: string): string {
  if (typeof input !== "string") {
    return "";
  }
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#x60;/g, "`")
    .replace(/&#x3D;/g, "=");
}

/**
 * 入力文字列から危険なHTMLタグとスクリプトを除去
 *
 * @param input サニタイズする文字列
 * @returns サニタイズされた文字列
 *
 * @example
 * stripDangerousTags('<p>Hello</p><script>alert("XSS")</script>')
 * // => '<p>Hello</p>'
 */
export function stripDangerousTags(input: string): string {
  if (typeof input !== "string") {
    return "";
  }

  let result = input;
  for (const pattern of DANGEROUS_PATTERNS) {
    result = result.replace(pattern, "");
  }
  return result;
}

/**
 * 全てのHTMLタグを除去
 *
 * @param input サニタイズする文字列
 * @returns タグが除去された文字列
 *
 * @example
 * stripAllTags('<p>Hello <b>World</b></p>')
 * // => 'Hello World'
 */
export function stripAllTags(input: string): string {
  if (typeof input !== "string") {
    return "";
  }
  return input.replace(/<[^>]*>/g, "");
}

/**
 * 制御文字を除去
 *
 * @param input サニタイズする文字列
 * @returns 制御文字が除去された文字列
 */
export function stripControlCharacters(input: string): string {
  if (typeof input !== "string") {
    return "";
  }
  // 改行とタブは残し、その他の制御文字を除去
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

/**
 * 文字列の前後の空白を正規化
 *
 * @param input 正規化する文字列
 * @returns 正規化された文字列
 */
export function normalizeWhitespace(input: string): string {
  if (typeof input !== "string") {
    return "";
  }
  return input.trim().replace(/\s+/g, " ");
}

/**
 * サニタイズオプション
 */
export interface SanitizeOptions {
  /** HTMLをエスケープするか (default: true) */
  escapeHtml?: boolean;
  /** 危険なタグを除去するか (default: true) */
  stripDangerousTags?: boolean;
  /** 全てのタグを除去するか (default: false) */
  stripAllTags?: boolean;
  /** 制御文字を除去するか (default: true) */
  stripControlCharacters?: boolean;
  /** 空白を正規化するか (default: false) */
  normalizeWhitespace?: boolean;
  /** 最大文字数 (default: undefined) */
  maxLength?: number;
}

/**
 * 包括的な入力サニタイズ
 *
 * @param input サニタイズする文字列
 * @param options サニタイズオプション
 * @returns サニタイズされた文字列
 *
 * @example
 * sanitize('<script>alert("XSS")</script>Hello', {
 *   stripDangerousTags: true,
 *   escapeHtml: true
 * })
 * // => 'Hello'
 */
export function sanitize(input: string, options: SanitizeOptions = {}): string {
  if (typeof input !== "string") {
    return "";
  }

  const {
    escapeHtml: shouldEscapeHtml = true,
    stripDangerousTags: shouldStripDangerous = true,
    stripAllTags: shouldStripAll = false,
    stripControlCharacters: shouldStripControl = true,
    normalizeWhitespace: shouldNormalize = false,
    maxLength,
  } = options;

  let result = input;

  // 制御文字の除去
  if (shouldStripControl) {
    result = stripControlCharacters(result);
  }

  // タグの処理
  if (shouldStripAll) {
    result = stripAllTags(result);
  } else if (shouldStripDangerous) {
    result = stripDangerousTags(result);
  }

  // HTMLエスケープ
  if (shouldEscapeHtml) {
    result = escapeHtml(result);
  }

  // 空白の正規化
  if (shouldNormalize) {
    result = normalizeWhitespace(result);
  }

  // 最大文字数の制限
  if (maxLength !== undefined && result.length > maxLength) {
    result = result.slice(0, maxLength);
  }

  return result;
}

/**
 * オブジェクトの全ての文字列プロパティをサニタイズ
 *
 * @param obj サニタイズするオブジェクト
 * @param options サニタイズオプション
 * @returns サニタイズされたオブジェクト
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: SanitizeOptions = {}
): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitize(value, options);
    } else if (value !== null && typeof value === "object") {
      result[key] = sanitizeObject(value as Record<string, unknown>, options);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * SQLライクなインジェクション文字をエスケープ
 * 注意: Prismaを使用している場合、パラメータ化クエリにより
 * SQLインジェクションは既に防がれています。
 * これは追加の防御層として使用します。
 *
 * @param input エスケープする文字列
 * @returns エスケープされた文字列
 */
export function escapeSqlLike(input: string): string {
  if (typeof input !== "string") {
    return "";
  }
  return input.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

// ============================================
// Zodスキーマとの統合
// ============================================

/**
 * サニタイズ付きの文字列Zodスキーマを作成
 *
 * @param options サニタイズオプション
 * @returns Zodスキーマ
 *
 * @example
 * const schema = z.object({
 *   name: sanitizedString({ maxLength: 100 }),
 *   description: sanitizedString({ stripAllTags: true }),
 * });
 */
export function sanitizedString(
  options: SanitizeOptions = {}
): z.ZodEffects<z.ZodString, string, string> {
  return z.string().transform((val) => sanitize(val, options));
}

/**
 * HTMLエスケープのみを行う文字列Zodスキーマ
 */
export const escapedString = z.string().transform((val) => escapeHtml(val));

/**
 * タグを除去する文字列Zodスキーマ
 */
export const strippedString = z.string().transform((val) => stripAllTags(val));

/**
 * 正規化された文字列Zodスキーマ（空白正規化 + トリム）
 */
export const normalizedString = z
  .string()
  .transform((val) => normalizeWhitespace(val));

/**
 * URL用のサニタイズ付きZodスキーマ
 * javascript:やdata:スキームをブロック
 */
export const safeUrl = z
  .string()
  .url()
  .refine(
    (url) => {
      const lowered = url.toLowerCase();
      return (
        !lowered.startsWith("javascript:") &&
        !lowered.startsWith("data:") &&
        !lowered.startsWith("vbscript:")
      );
    },
    { message: "安全でないURLスキームは許可されていません" }
  );

/**
 * メールアドレス用のサニタイズ付きZodスキーマ
 */
export const safeEmail = z
  .string()
  .email()
  .transform((val) => val.toLowerCase().trim());
