/**
 * パスワードポリシー
 *
 * セキュアなパスワード要件の検証機能を提供します。
 */

import { z } from "zod";

/**
 * パスワード検証結果
 */
export interface PasswordValidationResult {
  /** パスワードが有効かどうか */
  isValid: boolean;
  /** 検証エラーのリスト */
  errors: string[];
  /** パスワード強度スコア (0-100) */
  strength: number;
  /** 強度レベル */
  strengthLevel: "weak" | "fair" | "good" | "strong";
}

/**
 * パスワードポリシー設定
 */
export interface PasswordPolicyConfig {
  /** 最小文字数 */
  minLength: number;
  /** 最大文字数 */
  maxLength: number;
  /** 大文字必須 */
  requireUppercase: boolean;
  /** 小文字必須 */
  requireLowercase: boolean;
  /** 数字必須 */
  requireNumber: boolean;
  /** 特殊文字必須 */
  requireSpecialChar: boolean;
  /** 禁止する一般的なパスワード */
  forbidCommonPasswords: boolean;
  /** ユーザー情報との類似性チェック */
  checkUserInfoSimilarity: boolean;
}

/**
 * デフォルトのパスワードポリシー
 */
export const DEFAULT_PASSWORD_POLICY: PasswordPolicyConfig = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: false, // 推奨だが必須ではない
  forbidCommonPasswords: true,
  checkUserInfoSimilarity: true,
};

/**
 * 一般的な脆弱なパスワードリスト
 */
const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "123456",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty",
  "qwerty123",
  "abc123",
  "admin",
  "admin123",
  "letmein",
  "welcome",
  "welcome1",
  "monkey",
  "dragon",
  "master",
  "login",
  "passw0rd",
  "iloveyou",
  "trustno1",
  "sunshine",
  "princess",
  "football",
  "baseball",
  "soccer",
  "hockey",
  "batman",
  "superman",
]);

/**
 * 特殊文字のパターン
 */
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/;

/**
 * 大文字のパターン
 */
const UPPERCASE_REGEX = /[A-Z]/;

/**
 * 小文字のパターン
 */
const LOWERCASE_REGEX = /[a-z]/;

/**
 * 数字のパターン
 */
const NUMBER_REGEX = /[0-9]/;

/**
 * 連続した文字のパターン（例: abc, 123, aaa）
 */
const SEQUENTIAL_PATTERN =
  /(.)\1{2,}|(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i;

/**
 * パスワードを検証
 *
 * @param password 検証するパスワード
 * @param config パスワードポリシー設定
 * @param userInfo ユーザー情報（類似性チェック用）
 * @returns 検証結果
 *
 * @example
 * const result = validatePassword('MyP@ssw0rd123');
 * if (!result.isValid) {
 *   console.log(result.errors);
 * }
 */
export function validatePassword(
  password: string,
  config: PasswordPolicyConfig = DEFAULT_PASSWORD_POLICY,
  userInfo?: { email?: string; name?: string }
): PasswordValidationResult {
  const errors: string[] = [];
  let strengthScore = 0;

  // 型チェック
  if (typeof password !== "string") {
    return {
      isValid: false,
      errors: ["パスワードは文字列である必要があります"],
      strength: 0,
      strengthLevel: "weak",
    };
  }

  // 長さチェック
  if (password.length < config.minLength) {
    errors.push(`パスワードは${config.minLength}文字以上である必要があります`);
  } else {
    strengthScore += 20;
  }

  if (password.length > config.maxLength) {
    errors.push(`パスワードは${config.maxLength}文字以下である必要があります`);
  }

  // 長さボーナス
  if (password.length >= 12) {
    strengthScore += 10;
  }
  if (password.length >= 16) {
    strengthScore += 10;
  }

  // 大文字チェック
  const hasUppercase = UPPERCASE_REGEX.test(password);
  if (config.requireUppercase && !hasUppercase) {
    errors.push("大文字を1文字以上含める必要があります");
  }
  if (hasUppercase) {
    strengthScore += 15;
  }

  // 小文字チェック
  const hasLowercase = LOWERCASE_REGEX.test(password);
  if (config.requireLowercase && !hasLowercase) {
    errors.push("小文字を1文字以上含める必要があります");
  }
  if (hasLowercase) {
    strengthScore += 15;
  }

  // 数字チェック
  const hasNumber = NUMBER_REGEX.test(password);
  if (config.requireNumber && !hasNumber) {
    errors.push("数字を1文字以上含める必要があります");
  }
  if (hasNumber) {
    strengthScore += 15;
  }

  // 特殊文字チェック
  const hasSpecialChar = SPECIAL_CHAR_REGEX.test(password);
  if (config.requireSpecialChar && !hasSpecialChar) {
    errors.push("特殊文字を1文字以上含める必要があります");
  }
  if (hasSpecialChar) {
    strengthScore += 15;
  }

  // 一般的なパスワードチェック
  if (config.forbidCommonPasswords) {
    const loweredPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.has(loweredPassword)) {
      errors.push("一般的すぎるパスワードは使用できません");
      strengthScore = Math.max(0, strengthScore - 30);
    }
  }

  // 連続した文字のチェック
  if (SEQUENTIAL_PATTERN.test(password)) {
    strengthScore = Math.max(0, strengthScore - 10);
  }

  // ユーザー情報との類似性チェック
  if (config.checkUserInfoSimilarity && userInfo) {
    const loweredPassword = password.toLowerCase();

    if (userInfo.email) {
      const emailLocal = userInfo.email.split("@")[0]?.toLowerCase();
      if (emailLocal && loweredPassword.includes(emailLocal)) {
        errors.push("パスワードにメールアドレスを含めることはできません");
        strengthScore = Math.max(0, strengthScore - 20);
      }
    }

    if (userInfo.name) {
      const nameLower = userInfo.name.toLowerCase().replace(/\s+/g, "");
      if (nameLower && loweredPassword.includes(nameLower)) {
        errors.push("パスワードに名前を含めることはできません");
        strengthScore = Math.max(0, strengthScore - 20);
      }
    }
  }

  // 強度スコアを0-100に正規化
  strengthScore = Math.min(100, Math.max(0, strengthScore));

  // 強度レベルを判定
  let strengthLevel: "weak" | "fair" | "good" | "strong";
  if (strengthScore < 40) {
    strengthLevel = "weak";
  } else if (strengthScore < 60) {
    strengthLevel = "fair";
  } else if (strengthScore < 80) {
    strengthLevel = "good";
  } else {
    strengthLevel = "strong";
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: strengthScore,
    strengthLevel,
  };
}

/**
 * パスワードが有効かどうかをチェック（シンプルなboolean版）
 *
 * @param password 検証するパスワード
 * @param config パスワードポリシー設定
 * @returns 有効かどうか
 */
export function isValidPassword(
  password: string,
  config: PasswordPolicyConfig = DEFAULT_PASSWORD_POLICY
): boolean {
  return validatePassword(password, config).isValid;
}

/**
 * パスワード強度を計算
 *
 * @param password パスワード
 * @returns 強度スコア (0-100)
 */
export function getPasswordStrength(password: string): number {
  return validatePassword(password, {
    ...DEFAULT_PASSWORD_POLICY,
    requireSpecialChar: false,
  }).strength;
}

/**
 * パスワード用のZodスキーマ（基本版）
 */
export const passwordSchema = z
  .string()
  .min(
    DEFAULT_PASSWORD_POLICY.minLength,
    `パスワードは${DEFAULT_PASSWORD_POLICY.minLength}文字以上である必要があります`
  )
  .max(
    DEFAULT_PASSWORD_POLICY.maxLength,
    `パスワードは${DEFAULT_PASSWORD_POLICY.maxLength}文字以下である必要があります`
  )
  .refine((password) => UPPERCASE_REGEX.test(password), {
    message: "大文字を1文字以上含める必要があります",
  })
  .refine((password) => LOWERCASE_REGEX.test(password), {
    message: "小文字を1文字以上含める必要があります",
  })
  .refine((password) => NUMBER_REGEX.test(password), {
    message: "数字を1文字以上含める必要があります",
  });

/**
 * パスワード用のZodスキーマ（特殊文字必須版）
 */
export const strictPasswordSchema = passwordSchema.refine(
  (password) => SPECIAL_CHAR_REGEX.test(password),
  {
    message: "特殊文字を1文字以上含める必要があります",
  }
);

/**
 * パスワード確認用のZodスキーマを作成
 *
 * @example
 * const schema = z.object({
 *   password: passwordSchema,
 *   confirmPassword: z.string(),
 * }).refine(
 *   (data) => data.password === data.confirmPassword,
 *   { message: "パスワードが一致しません", path: ["confirmPassword"] }
 * );
 */
export const passwordConfirmSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

/**
 * カスタムポリシーでパスワードスキーマを作成
 *
 * @param config パスワードポリシー設定
 * @returns Zodスキーマ
 */
export function createPasswordSchema(
  config: Partial<PasswordPolicyConfig> = {}
): z.ZodString {
  const mergedConfig = { ...DEFAULT_PASSWORD_POLICY, ...config };

  const schema = z
    .string()
    .min(
      mergedConfig.minLength,
      `パスワードは${mergedConfig.minLength}文字以上である必要があります`
    )
    .max(
      mergedConfig.maxLength,
      `パスワードは${mergedConfig.maxLength}文字以下である必要があります`
    );

  return schema;
}

/**
 * カスタムポリシーでパスワードを検証するZodスキーマを作成
 *
 * @param config パスワードポリシー設定
 * @param userInfo ユーザー情報
 * @returns Zodスキーマ
 */
export function createPasswordValidationSchema(
  config: Partial<PasswordPolicyConfig> = {},
  userInfo?: { email?: string; name?: string }
): z.ZodEffects<z.ZodString, string, string> {
  const mergedConfig = { ...DEFAULT_PASSWORD_POLICY, ...config };

  return z.string().superRefine((password, ctx) => {
    const result = validatePassword(password, mergedConfig, userInfo);
    if (!result.isValid) {
      for (const error of result.errors) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: error,
        });
      }
    }
  });
}
