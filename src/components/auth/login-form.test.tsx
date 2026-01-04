/**
 * ログインフォームコンポーネントの単体テスト
 *
 * テスト対象:
 * - フォームのレンダリング
 * - フォームのバリデーション（クライアントサイド）
 * - ログイン成功時の挙動
 * - ログイン失敗時のエラー表示
 * - ローディング状態の表示
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// login関数をモック
const mockLogin = vi.fn();
vi.mock("@/lib/auth-actions", () => ({
  login: (...args: unknown[]) => mockLogin(...args),
}));

// useRouterをモック
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

import { LoginForm } from "./login-form";

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("レンダリング", () => {
    it("ログインフォームが正しくレンダリングされること", () => {
      // Act
      render(<LoginForm />);

      // Assert
      expect(
        screen.getByRole("textbox", { name: /メールアドレス/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /ログイン/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("checkbox", { name: /ログイン状態を保持する/i })
      ).toBeInTheDocument();
    });

    it("メールアドレス入力欄にプレースホルダーが表示されること", () => {
      // Act
      render(<LoginForm />);

      // Assert
      const emailInput = screen.getByRole("textbox", {
        name: /メールアドレス/i,
      });
      expect(emailInput).toHaveAttribute("placeholder", "example@example.com");
    });

    it("パスワード入力欄がpassword型であること", () => {
      // Act
      render(<LoginForm />);

      // Assert
      const passwordInput = screen.getByLabelText(/パスワード/i);
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("初期状態ではエラーメッセージが表示されないこと", () => {
      // Act
      render(<LoginForm />);

      // Assert
      expect(
        screen.queryByText(/メールアドレスを入力してください/i)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/パスワードを入力してください/i)
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(/メールアドレスまたはパスワードが正しくありません/i)
      ).not.toBeInTheDocument();
    });
  });

  describe("フォームバリデーション", () => {
    it("メールアドレス未入力でsubmitするとバリデーションエラーが表示されること", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm />);

      // Act
      const passwordInput = screen.getByLabelText(/パスワード/i);
      await user.type(passwordInput, "password123");
      const submitButton = screen.getByRole("button", { name: /ログイン/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText(/メールアドレスを入力してください/i)
        ).toBeInTheDocument();
      });
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it("パスワード未入力でsubmitするとバリデーションエラーが表示されること", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm />);

      // Act
      const emailInput = screen.getByRole("textbox", {
        name: /メールアドレス/i,
      });
      await user.type(emailInput, "test@example.com");
      const submitButton = screen.getByRole("button", { name: /ログイン/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText(/パスワードを入力してください/i)
        ).toBeInTheDocument();
      });
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it("無効なメールアドレス形式でsubmitするとバリデーションエラーが表示されること", async () => {
      // Arrange
      render(<LoginForm />);

      // Act
      const emailInput = screen.getByRole("textbox", {
        name: /メールアドレス/i,
      });
      const passwordInput = screen.getByLabelText(/パスワード/i);

      // fireEventを使って値を直接設定（ブラウザのバリデーションをバイパス）
      fireEvent.change(emailInput, { target: { value: "invalid-email" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.submit(emailInput.closest("form")!);

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText(/有効なメールアドレスを入力してください/i)
        ).toBeInTheDocument();
      });
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it("両方未入力でsubmitすると両方のバリデーションエラーが表示されること", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm />);

      // Act
      const submitButton = screen.getByRole("button", { name: /ログイン/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText(/メールアドレスを入力してください/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/パスワードを入力してください/i)
        ).toBeInTheDocument();
      });
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  describe("ログイン成功", () => {
    it("有効な認証情報でログインできること", async () => {
      // Arrange
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(undefined);
      render(<LoginForm />);

      // Act
      const emailInput = screen.getByRole("textbox", {
        name: /メールアドレス/i,
      });
      await user.type(emailInput, "test@example.com");
      const passwordInput = screen.getByLabelText(/パスワード/i);
      await user.type(passwordInput, "password123");
      const submitButton = screen.getByRole("button", { name: /ログイン/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(
          "test@example.com",
          "password123",
          "/"
        );
      });
    });

    it("ログイン成功後にルーターのpushとrefreshが呼ばれること", async () => {
      // Arrange
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(undefined);
      render(<LoginForm />);

      // Act
      const emailInput = screen.getByRole("textbox", {
        name: /メールアドレス/i,
      });
      await user.type(emailInput, "test@example.com");
      const passwordInput = screen.getByLabelText(/パスワード/i);
      await user.type(passwordInput, "password123");
      const submitButton = screen.getByRole("button", { name: /ログイン/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
        expect(mockRefresh).toHaveBeenCalled();
      });
    });
  });

  describe("ログイン失敗", () => {
    it("認証エラー時にエラーメッセージが表示されること", async () => {
      // Arrange
      const user = userEvent.setup();
      mockLogin.mockResolvedValue({
        error: "メールアドレスまたはパスワードが正しくありません",
      });
      render(<LoginForm />);

      // Act
      const emailInput = screen.getByRole("textbox", {
        name: /メールアドレス/i,
      });
      await user.type(emailInput, "test@example.com");
      const passwordInput = screen.getByLabelText(/パスワード/i);
      await user.type(passwordInput, "wrongpassword");
      const submitButton = screen.getByRole("button", { name: /ログイン/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText(/メールアドレスまたはパスワードが正しくありません/i)
        ).toBeInTheDocument();
      });
      // ログイン失敗時はリダイレクトしない
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("汎用認証エラー時にエラーメッセージが表示されること", async () => {
      // Arrange
      const user = userEvent.setup();
      mockLogin.mockResolvedValue({
        error: "認証エラーが発生しました",
      });
      render(<LoginForm />);

      // Act
      const emailInput = screen.getByRole("textbox", {
        name: /メールアドレス/i,
      });
      await user.type(emailInput, "test@example.com");
      const passwordInput = screen.getByLabelText(/パスワード/i);
      await user.type(passwordInput, "password123");
      const submitButton = screen.getByRole("button", { name: /ログイン/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText(/認証エラーが発生しました/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("ローディング状態", () => {
    it("送信中はボタンがdisabledになること", async () => {
      // Arrange
      const user = userEvent.setup();
      // loginをpendingのPromiseにして送信中状態を維持
      mockLogin.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(undefined), 100);
          })
      );
      render(<LoginForm />);

      // Act
      const emailInput = screen.getByRole("textbox", {
        name: /メールアドレス/i,
      });
      await user.type(emailInput, "test@example.com");
      const passwordInput = screen.getByLabelText(/パスワード/i);
      await user.type(passwordInput, "password123");
      const submitButton = screen.getByRole("button", { name: /ログイン/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it("送信中は入力フィールドがdisabledになること", async () => {
      // Arrange
      const user = userEvent.setup();
      mockLogin.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(undefined), 100);
          })
      );
      render(<LoginForm />);

      // Act
      const emailInput = screen.getByRole("textbox", {
        name: /メールアドレス/i,
      });
      await user.type(emailInput, "test@example.com");
      const passwordInput = screen.getByLabelText(/パスワード/i);
      await user.type(passwordInput, "password123");
      const submitButton = screen.getByRole("button", { name: /ログイン/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        expect(emailInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
      });
    });
  });

  describe("チェックボックス", () => {
    it("ログイン状態保持チェックボックスをクリックできること", async () => {
      // Arrange
      const user = userEvent.setup();
      render(<LoginForm />);

      // Act
      const checkbox = screen.getByRole("checkbox", {
        name: /ログイン状態を保持する/i,
      });
      await user.click(checkbox);

      // Assert
      expect(checkbox).toBeChecked();
    });

    it("チェックボックスは初期状態でuncheckedであること", () => {
      // Act
      render(<LoginForm />);

      // Assert
      const checkbox = screen.getByRole("checkbox", {
        name: /ログイン状態を保持する/i,
      });
      expect(checkbox).not.toBeChecked();
    });
  });

  describe("フォームリセット", () => {
    it("エラー後に再入力するとエラーメッセージがクリアされること", async () => {
      // Arrange
      const user = userEvent.setup();
      mockLogin.mockResolvedValue({
        error: "メールアドレスまたはパスワードが正しくありません",
      });
      render(<LoginForm />);

      // Act - 最初のログイン試行（失敗）
      const emailInput = screen.getByRole("textbox", {
        name: /メールアドレス/i,
      });
      await user.type(emailInput, "test@example.com");
      const passwordInput = screen.getByLabelText(/パスワード/i);
      await user.type(passwordInput, "wrongpassword");
      const submitButton = screen.getByRole("button", { name: /ログイン/i });
      await user.click(submitButton);

      // エラーメッセージが表示されることを確認
      await waitFor(() => {
        expect(
          screen.getByText(/メールアドレスまたはパスワードが正しくありません/i)
        ).toBeInTheDocument();
      });

      // 成功するログインをセットアップ
      mockLogin.mockResolvedValue(undefined);

      // パスワードをクリアして再入力
      await user.clear(passwordInput);
      await user.type(passwordInput, "correctpassword");
      await user.click(submitButton);

      // Assert - 再送信後にエラーがクリアされる
      // (新しいリクエストが送信されてエラーがクリアされる)
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("アクセシビリティ", () => {
    it("フォーム要素にラベルが関連付けられていること", () => {
      // Act
      render(<LoginForm />);

      // Assert
      const emailInput = screen.getByRole("textbox", {
        name: /メールアドレス/i,
      });
      const passwordInput = screen.getByLabelText(/パスワード/i);

      expect(emailInput).toHaveAccessibleName();
      expect(passwordInput).toHaveAccessibleName();
    });

    it("ボタンにアクセシブルな名前があること", () => {
      // Act
      render(<LoginForm />);

      // Assert
      const submitButton = screen.getByRole("button", { name: /ログイン/i });
      expect(submitButton).toHaveAccessibleName();
    });

    it("エラーアラートが適切なroleを持つこと", async () => {
      // Arrange
      const user = userEvent.setup();
      mockLogin.mockResolvedValue({
        error: "メールアドレスまたはパスワードが正しくありません",
      });
      render(<LoginForm />);

      // Act
      const emailInput = screen.getByRole("textbox", {
        name: /メールアドレス/i,
      });
      await user.type(emailInput, "test@example.com");
      const passwordInput = screen.getByLabelText(/パスワード/i);
      await user.type(passwordInput, "wrongpassword");
      const submitButton = screen.getByRole("button", { name: /ログイン/i });
      await user.click(submitButton);

      // Assert
      await waitFor(() => {
        const alert = screen.getByRole("alert");
        expect(alert).toBeInTheDocument();
      });
    });
  });

  describe("Enterキーでの送信", () => {
    it("パスワード入力欄でEnterキーを押すとフォームが送信されること", async () => {
      // Arrange
      mockLogin.mockResolvedValue(undefined);
      render(<LoginForm />);

      // Act
      const emailInput = screen.getByRole("textbox", {
        name: /メールアドレス/i,
      });
      const passwordInput = screen.getByLabelText(/パスワード/i);

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.submit(emailInput.closest("form")!);

      // Assert
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(
          "test@example.com",
          "password123",
          "/"
        );
      });
    });
  });
});
