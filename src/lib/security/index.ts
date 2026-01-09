/**
 * セキュリティユーティリティ
 *
 * このモジュールはアプリケーションのセキュリティ対策に必要な
 * ユーティリティ関数とクラスをエクスポートします。
 */

// Rate Limiting
export {
  RateLimiter,
  RateLimitPresets,
  getRateLimiter,
  getRateLimiterByPreset,
  getClientIp,
  createRateLimitHeaders,
  checkRateLimit,
  type RateLimitConfig,
  type RateLimitResult,
} from "./rate-limit";

// Sanitization (XSS対策)
export {
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
  type SanitizeOptions,
} from "./sanitize";

// Password Policy
export {
  validatePassword,
  isValidPassword,
  getPasswordStrength,
  DEFAULT_PASSWORD_POLICY,
  passwordSchema,
  strictPasswordSchema,
  passwordConfirmSchema,
  createPasswordSchema,
  createPasswordValidationSchema,
  type PasswordValidationResult,
  type PasswordPolicyConfig,
} from "./password-policy";

// CSRF Protection
export {
  generateRandomToken,
  generateCsrfToken,
  timingSafeEqual,
  verifyCsrfToken,
  CsrfTokenManager,
  csrfManager,
  DEFAULT_CSRF_CONFIG,
  withCsrfProtection,
  getCsrfTokenHandler,
  type CsrfConfig,
} from "./csrf";
