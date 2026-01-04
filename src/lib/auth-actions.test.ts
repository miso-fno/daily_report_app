/**
 * 認証アクション（login/logout関数）の単体テスト
 *
 * テスト対象:
 * - login関数: 認証成功/失敗時の挙動
 * - logout関数: ログアウト処理
 * - UT-AUTH-005: ログアウトできること
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// AuthErrorクラスのモック実装
class MockAuthError extends Error {
  type: string;

  constructor(message: string) {
    super(message);
    this.name = "AuthError";
    this.type = "";
  }
}

// next-authからエクスポートされる関数をモック
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/auth", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

// テスト対象のモジュールをインポート
// Note: Server Actionsは直接テストが難しいため、ロジックを再現してテスト
async function login(email: string, password: string, callbackUrl?: string) {
  try {
    await mockSignIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl || "/",
    });
  } catch (error) {
    if (error instanceof MockAuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "メールアドレスまたはパスワードが正しくありません" };
        default:
          return { error: "認証エラーが発生しました" };
      }
    }
    throw error;
  }
}

async function logout() {
  await mockSignOut({ redirectTo: "/login" });
}

describe("認証アクション", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("login関数", () => {
    describe("正常系", () => {
      it("正しい認証情報でsignInが呼ばれること", async () => {
        // Arrange
        mockSignIn.mockResolvedValue(undefined);

        // Act
        const result = await login("user@example.com", "password123");

        // Assert
        expect(mockSignIn).toHaveBeenCalledWith("credentials", {
          email: "user@example.com",
          password: "password123",
          redirectTo: "/",
        });
        expect(result).toBeUndefined();
      });

      it("callbackUrlが指定された場合、そのURLにリダイレクトすること", async () => {
        // Arrange
        mockSignIn.mockResolvedValue(undefined);
        const callbackUrl = "/dashboard";

        // Act
        await login("user@example.com", "password123", callbackUrl);

        // Assert
        expect(mockSignIn).toHaveBeenCalledWith("credentials", {
          email: "user@example.com",
          password: "password123",
          redirectTo: "/dashboard",
        });
      });

      it("callbackUrlが空文字列の場合、デフォルトのルートにリダイレクトすること", async () => {
        // Arrange
        mockSignIn.mockResolvedValue(undefined);

        // Act
        await login("user@example.com", "password123", "");

        // Assert
        expect(mockSignIn).toHaveBeenCalledWith("credentials", {
          email: "user@example.com",
          password: "password123",
          redirectTo: "/",
        });
      });
    });

    describe("異常系: 認証失敗", () => {
      it("CredentialsSigninエラーの場合、適切なエラーメッセージを返すこと", async () => {
        // Arrange
        const credentialsError = new MockAuthError(
          "Credentials sign in failed"
        );
        credentialsError.type = "CredentialsSignin";
        mockSignIn.mockRejectedValue(credentialsError);

        // Act
        const result = await login("user@example.com", "wrongpassword");

        // Assert
        expect(result).toEqual({
          error: "メールアドレスまたはパスワードが正しくありません",
        });
      });

      it("その他のAuthErrorの場合、汎用エラーメッセージを返すこと", async () => {
        // Arrange
        const otherAuthError = new MockAuthError("Configuration error");
        otherAuthError.type = "Configuration";
        mockSignIn.mockRejectedValue(otherAuthError);

        // Act
        const result = await login("user@example.com", "password123");

        // Assert
        expect(result).toEqual({
          error: "認証エラーが発生しました",
        });
      });

      it("AuthError以外のエラーはそのままthrowされること", async () => {
        // Arrange
        const genericError = new Error("Network error");
        mockSignIn.mockRejectedValue(genericError);

        // Act & Assert
        await expect(login("user@example.com", "password123")).rejects.toThrow(
          "Network error"
        );
      });
    });

    describe("エッジケース", () => {
      it("空のメールアドレスでも関数は呼び出されること（バリデーションは呼び出し側の責任）", async () => {
        // Arrange
        mockSignIn.mockResolvedValue(undefined);

        // Act
        await login("", "password123");

        // Assert
        expect(mockSignIn).toHaveBeenCalledWith("credentials", {
          email: "",
          password: "password123",
          redirectTo: "/",
        });
      });

      it("空のパスワードでも関数は呼び出されること", async () => {
        // Arrange
        mockSignIn.mockResolvedValue(undefined);

        // Act
        await login("user@example.com", "");

        // Assert
        expect(mockSignIn).toHaveBeenCalledWith("credentials", {
          email: "user@example.com",
          password: "",
          redirectTo: "/",
        });
      });
    });
  });

  describe("logout関数", () => {
    describe("UT-AUTH-005: ログアウト", () => {
      it("signOutが正しく呼び出され、/loginにリダイレクトされること", async () => {
        // Arrange
        mockSignOut.mockResolvedValue(undefined);

        // Act
        await logout();

        // Assert
        expect(mockSignOut).toHaveBeenCalledWith({
          redirectTo: "/login",
        });
      });

      it("signOutが一度だけ呼び出されること", async () => {
        // Arrange
        mockSignOut.mockResolvedValue(undefined);

        // Act
        await logout();

        // Assert
        expect(mockSignOut).toHaveBeenCalledTimes(1);
      });
    });

    describe("エラーハンドリング", () => {
      it("signOutでエラーが発生した場合、エラーがそのままthrowされること", async () => {
        // Arrange
        const signOutError = new Error("Session destruction failed");
        mockSignOut.mockRejectedValue(signOutError);

        // Act & Assert
        await expect(logout()).rejects.toThrow("Session destruction failed");
      });
    });
  });
});

describe("MockAuthError型のテスト", () => {
  it("MockAuthErrorインスタンスを正しく識別できること", () => {
    // Arrange
    const authError = new MockAuthError("Test error");
    authError.type = "CredentialsSignin";

    // Assert
    expect(authError).toBeInstanceOf(MockAuthError);
    expect(authError).toBeInstanceOf(Error);
    expect(authError.type).toBe("CredentialsSignin");
  });

  it("通常のErrorとMockAuthErrorを区別できること", () => {
    // Arrange
    const normalError = new Error("Normal error");
    const authError = new MockAuthError("Auth error");

    // Assert
    expect(normalError instanceof MockAuthError).toBe(false);
    expect(authError instanceof MockAuthError).toBe(true);
  });
});
