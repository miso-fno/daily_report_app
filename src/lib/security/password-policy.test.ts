/**
 * パスワードポリシー テスト
 */

import { describe, it, expect } from "vitest";

import {
  validatePassword,
  isValidPassword,
  getPasswordStrength,
  DEFAULT_PASSWORD_POLICY,
  passwordSchema,
  strictPasswordSchema,
  passwordConfirmSchema,
  createPasswordSchema,
  createPasswordValidationSchema,
} from "./password-policy";

describe("validatePassword", () => {
  describe("基本的なバリデーション", () => {
    it("有効なパスワードを受け入れる", () => {
      const result = validatePassword("SecureP@ss123");

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("最小文字数未満のパスワードを拒否する", () => {
      const result = validatePassword("Short1!");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `パスワードは${DEFAULT_PASSWORD_POLICY.minLength}文字以上である必要があります`
      );
    });

    it("大文字がないパスワードを拒否する", () => {
      const result = validatePassword("lowercase123");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("大文字を1文字以上含める必要があります");
    });

    it("小文字がないパスワードを拒否する", () => {
      const result = validatePassword("UPPERCASE123");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("小文字を1文字以上含める必要があります");
    });

    it("数字がないパスワードを拒否する", () => {
      const result = validatePassword("NoNumbersHere");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("数字を1文字以上含める必要があります");
    });

    it("特殊文字必須の場合、特殊文字がないパスワードを拒否する", () => {
      const result = validatePassword("NoSpecial123", {
        ...DEFAULT_PASSWORD_POLICY,
        requireSpecialChar: true,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "特殊文字を1文字以上含める必要があります"
      );
    });
  });

  describe("一般的なパスワードのチェック", () => {
    it("一般的なパスワードを拒否する", () => {
      const commonPasswords = [
        "password",
        "password123",
        "123456",
        "qwerty123",
        "admin123",
      ];

      for (const pwd of commonPasswords) {
        const result = validatePassword(pwd);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "一般的すぎるパスワードは使用できません"
        );
      }
    });

    it("一般的なパスワードチェックを無効化できる", () => {
      const result = validatePassword("Password1", {
        ...DEFAULT_PASSWORD_POLICY,
        forbidCommonPasswords: false,
      });

      expect(result.errors).not.toContain(
        "一般的すぎるパスワードは使用できません"
      );
    });
  });

  describe("ユーザー情報との類似性チェック", () => {
    it("メールアドレスを含むパスワードを拒否する", () => {
      const result = validatePassword("Testuser123!", DEFAULT_PASSWORD_POLICY, {
        email: "testuser@example.com",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "パスワードにメールアドレスを含めることはできません"
      );
    });

    it("名前を含むパスワードを拒否する", () => {
      const result = validatePassword("JohnDoe123!", DEFAULT_PASSWORD_POLICY, {
        name: "John Doe",
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "パスワードに名前を含めることはできません"
      );
    });

    it("類似性チェックを無効化できる", () => {
      const result = validatePassword(
        "Testuser123!",
        {
          ...DEFAULT_PASSWORD_POLICY,
          checkUserInfoSimilarity: false,
        },
        { email: "testuser@example.com" }
      );

      expect(result.errors).not.toContain(
        "パスワードにメールアドレスを含めることはできません"
      );
    });
  });

  describe("パスワード強度", () => {
    it("基本的な要件のみ満たすパスワードは中程度の強度", () => {
      // 8文字、大文字、小文字、数字、特殊文字を含む最小限のパスワード
      const result = validatePassword("Aa1!aaaa");

      // 基本要件は満たしているが、長さが短いため"good"程度
      expect(["fair", "good"]).toContain(result.strengthLevel);
    });

    it("長く複雑なパスワードは強いと判定される", () => {
      const result = validatePassword("SecureP@ssw0rd!123");

      expect(result.strengthLevel).toBe("strong");
    });

    it("強度スコアは0-100の範囲", () => {
      const weak = validatePassword("weak");
      const strong = validatePassword("VerySecureP@ssw0rd!123456");

      expect(weak.strength).toBeGreaterThanOrEqual(0);
      expect(weak.strength).toBeLessThanOrEqual(100);
      expect(strong.strength).toBeGreaterThanOrEqual(0);
      expect(strong.strength).toBeLessThanOrEqual(100);
    });
  });

  describe("エッジケース", () => {
    it("非文字列入力を拒否する", () => {
      const result = validatePassword(123 as unknown as string);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("パスワードは文字列である必要があります");
    });

    it("空文字列を拒否する", () => {
      const result = validatePassword("");

      expect(result.isValid).toBe(false);
    });

    it("最大文字数を超えるパスワードを拒否する", () => {
      const longPassword = "A".repeat(129) + "a1";
      const result = validatePassword(longPassword);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        `パスワードは${DEFAULT_PASSWORD_POLICY.maxLength}文字以下である必要があります`
      );
    });
  });
});

describe("isValidPassword", () => {
  it("有効なパスワードでtrueを返す", () => {
    expect(isValidPassword("SecureP@ss123")).toBe(true);
  });

  it("無効なパスワードでfalseを返す", () => {
    expect(isValidPassword("weak")).toBe(false);
  });
});

describe("getPasswordStrength", () => {
  it("パスワード強度を0-100で返す", () => {
    const strength = getPasswordStrength("SecureP@ss123");

    expect(strength).toBeGreaterThanOrEqual(0);
    expect(strength).toBeLessThanOrEqual(100);
  });

  it("弱いパスワードは低いスコア", () => {
    const weakStrength = getPasswordStrength("abc");
    const strongStrength = getPasswordStrength("SecureP@ssw0rd!123");

    expect(weakStrength).toBeLessThan(strongStrength);
  });
});

describe("Zodスキーマ", () => {
  describe("passwordSchema", () => {
    it("有効なパスワードを受け入れる", () => {
      const result = passwordSchema.safeParse("SecurePass123");

      expect(result.success).toBe(true);
    });

    it("短いパスワードを拒否する", () => {
      const result = passwordSchema.safeParse("Short1");

      expect(result.success).toBe(false);
    });

    it("大文字がないパスワードを拒否する", () => {
      const result = passwordSchema.safeParse("lowercase123");

      expect(result.success).toBe(false);
    });

    it("小文字がないパスワードを拒否する", () => {
      const result = passwordSchema.safeParse("UPPERCASE123");

      expect(result.success).toBe(false);
    });

    it("数字がないパスワードを拒否する", () => {
      const result = passwordSchema.safeParse("NoNumbers");

      expect(result.success).toBe(false);
    });
  });

  describe("strictPasswordSchema", () => {
    it("特殊文字を含むパスワードを受け入れる", () => {
      const result = strictPasswordSchema.safeParse("SecureP@ss123");

      expect(result.success).toBe(true);
    });

    it("特殊文字がないパスワードを拒否する", () => {
      const result = strictPasswordSchema.safeParse("SecurePass123");

      expect(result.success).toBe(false);
    });
  });

  describe("passwordConfirmSchema", () => {
    it("一致するパスワードを受け入れる", () => {
      const result = passwordConfirmSchema.safeParse({
        password: "SecurePass123",
        confirmPassword: "SecurePass123",
      });

      expect(result.success).toBe(true);
    });

    it("一致しないパスワードを拒否する", () => {
      const result = passwordConfirmSchema.safeParse({
        password: "SecurePass123",
        confirmPassword: "DifferentPass123",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const firstIssue = result.error.issues[0];
        expect(firstIssue?.message).toBe("パスワードが一致しません");
      }
    });
  });

  describe("createPasswordSchema", () => {
    it("カスタム最小文字数でスキーマを作成できる", () => {
      const schema = createPasswordSchema({ minLength: 12 });
      const result = schema.safeParse("Short1Aa");

      expect(result.success).toBe(false);
    });
  });

  describe("createPasswordValidationSchema", () => {
    it("完全な検証を行うスキーマを作成できる", () => {
      const schema = createPasswordValidationSchema(
        { requireSpecialChar: true },
        { email: "test@example.com" }
      );

      // 特殊文字なし
      const result1 = schema.safeParse("SecurePass123");
      expect(result1.success).toBe(false);

      // メールアドレスを含む
      const result2 = schema.safeParse("Test@123!");
      expect(result2.success).toBe(false);

      // 有効なパスワード
      const result3 = schema.safeParse("Secure@Pass123");
      expect(result3.success).toBe(true);
    });
  });
});
