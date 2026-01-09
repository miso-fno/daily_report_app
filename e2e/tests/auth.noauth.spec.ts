import { test, expect } from "@playwright/test";

import {
  TEST_SALES_MEMBER,
  TEST_MANAGER,
  INVALID_CREDENTIALS,
} from "../utils/test-data";

/**
 * 認証関連のE2Eテスト
 * 認証状態を使用しないテスト（.noauth.spec.ts）
 */
test.describe("認証機能", () => {
  test.describe("ログイン成功", () => {
    test("営業担当者が正しい認証情報でログインできる", async ({ page }) => {
      // Arrange: ログインページに移動
      await page.goto("/login");

      // Assert: ログインフォームが表示されている
      await expect(
        page.getByRole("heading", { name: "営業日報システム" })
      ).toBeVisible();
      await expect(page.getByLabel("メールアドレス")).toBeVisible();
      await expect(page.getByLabel("パスワード")).toBeVisible();

      // Act: ログイン情報を入力して送信
      await page.getByLabel("メールアドレス").fill(TEST_SALES_MEMBER.email);
      await page.getByLabel("パスワード").fill(TEST_SALES_MEMBER.password);
      await page.getByRole("button", { name: "ログイン" }).click();

      // Assert: ダッシュボードにリダイレクトされる
      await page.waitForURL(/\/(dashboard)?$/);
      await expect(page).not.toHaveURL(/\/login/);
    });

    test("上長が正しい認証情報でログインできる", async ({ page }) => {
      // Arrange
      await page.goto("/login");

      // Act
      await page.getByLabel("メールアドレス").fill(TEST_MANAGER.email);
      await page.getByLabel("パスワード").fill(TEST_MANAGER.password);
      await page.getByRole("button", { name: "ログイン" }).click();

      // Assert
      await page.waitForURL(/\/(dashboard)?$/);
      await expect(page).not.toHaveURL(/\/login/);
    });
  });

  test.describe("ログイン失敗", () => {
    test("存在しないメールアドレスでログインできない", async ({ page }) => {
      // Arrange
      await page.goto("/login");

      // Act
      await page
        .getByLabel("メールアドレス")
        .fill(INVALID_CREDENTIALS.wrongEmail);
      await page.getByLabel("パスワード").fill(TEST_SALES_MEMBER.password);
      await page.getByRole("button", { name: "ログイン" }).click();

      // Assert: エラーメッセージが表示される
      await expect(page.getByRole("alert")).toBeVisible();
      // ログインページに留まる
      await expect(page).toHaveURL(/\/login/);
    });

    test("間違ったパスワードでログインできない", async ({ page }) => {
      // Arrange
      await page.goto("/login");

      // Act
      await page.getByLabel("メールアドレス").fill(TEST_SALES_MEMBER.email);
      await page
        .getByLabel("パスワード")
        .fill(INVALID_CREDENTIALS.wrongPassword);
      await page.getByRole("button", { name: "ログイン" }).click();

      // Assert
      await expect(page.getByRole("alert")).toBeVisible();
      await expect(page).toHaveURL(/\/login/);
    });

    test("メールアドレスが空の場合、バリデーションエラーが表示される", async ({
      page,
    }) => {
      // Arrange
      await page.goto("/login");

      // Act: パスワードのみ入力
      await page.getByLabel("パスワード").fill(TEST_SALES_MEMBER.password);
      await page.getByRole("button", { name: "ログイン" }).click();

      // Assert: バリデーションエラーが表示される
      await expect(
        page.getByText(/メールアドレスを入力してください/)
      ).toBeVisible();
    });

    test("パスワードが空の場合、バリデーションエラーが表示される", async ({
      page,
    }) => {
      // Arrange
      await page.goto("/login");

      // Act: メールアドレスのみ入力
      await page.getByLabel("メールアドレス").fill(TEST_SALES_MEMBER.email);
      await page.getByRole("button", { name: "ログイン" }).click();

      // Assert
      await expect(
        page.getByText(/パスワードを入力してください/)
      ).toBeVisible();
    });

    test("無効なメールアドレス形式の場合、バリデーションエラーが表示される", async ({
      page,
    }) => {
      // Arrange
      await page.goto("/login");

      // Act
      await page
        .getByLabel("メールアドレス")
        .fill(INVALID_CREDENTIALS.invalidEmailFormat);
      await page.getByLabel("パスワード").fill(TEST_SALES_MEMBER.password);
      await page.getByRole("button", { name: "ログイン" }).click();

      // Assert
      await expect(
        page.getByText(/有効なメールアドレスを入力してください/)
      ).toBeVisible();
    });
  });

  test.describe("未認証時のリダイレクト", () => {
    test("未認証でダッシュボードにアクセスするとログインページにリダイレクトされる", async ({
      page,
    }) => {
      // Act
      await page.goto("/dashboard");

      // Assert
      await expect(page).toHaveURL(/\/login/);
      await expect(
        page.getByRole("heading", { name: "営業日報システム" })
      ).toBeVisible();
    });

    test("未認証で日報一覧にアクセスするとログインページにリダイレクトされる", async ({
      page,
    }) => {
      // Act
      await page.goto("/reports");

      // Assert
      await expect(page).toHaveURL(/\/login/);
    });

    test("未認証で日報作成ページにアクセスするとログインページにリダイレクトされる", async ({
      page,
    }) => {
      // Act
      await page.goto("/reports/new");

      // Assert
      await expect(page).toHaveURL(/\/login/);
    });

    test("未認証で顧客一覧にアクセスするとログインページにリダイレクトされる", async ({
      page,
    }) => {
      // Act
      await page.goto("/customers");

      // Assert
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe("ログアウト", () => {
    test("ログイン後にログアウトできる", async ({ page }) => {
      // Arrange: まずログイン
      await page.goto("/login");
      await page.getByLabel("メールアドレス").fill(TEST_SALES_MEMBER.email);
      await page.getByLabel("パスワード").fill(TEST_SALES_MEMBER.password);
      await page.getByRole("button", { name: "ログイン" }).click();
      await page.waitForURL(/\/(dashboard)?$/);

      // Act: ログアウト
      // ユーザーメニューを開く（実装によって異なる可能性あり）
      const userMenuButton = page.getByRole("button", {
        name: /ユーザーメニュー|アカウント|プロフィール/i,
      });

      if (await userMenuButton.isVisible()) {
        await userMenuButton.click();
        await page.getByRole("menuitem", { name: /ログアウト/i }).click();
      } else {
        // 直接ログアウトボタンがある場合
        const logoutButton = page.getByRole("button", { name: /ログアウト/i });
        if (await logoutButton.isVisible()) {
          await logoutButton.click();
        } else {
          // リンクとして存在する場合
          await page.getByRole("link", { name: /ログアウト/i }).click();
        }
      }

      // Assert: ログインページにリダイレクトされる
      await expect(page).toHaveURL(/\/login/);
    });

    test("ログアウト後に保護されたページにアクセスできない", async ({
      page,
    }) => {
      // Arrange: ログイン
      await page.goto("/login");
      await page.getByLabel("メールアドレス").fill(TEST_SALES_MEMBER.email);
      await page.getByLabel("パスワード").fill(TEST_SALES_MEMBER.password);
      await page.getByRole("button", { name: "ログイン" }).click();
      await page.waitForURL(/\/(dashboard)?$/);

      // Act: ログアウト
      const userMenuButton = page.getByRole("button", {
        name: /ユーザーメニュー|アカウント|プロフィール/i,
      });

      if (await userMenuButton.isVisible()) {
        await userMenuButton.click();
        await page.getByRole("menuitem", { name: /ログアウト/i }).click();
      } else {
        const logoutButton = page.getByRole("button", { name: /ログアウト/i });
        if (await logoutButton.isVisible()) {
          await logoutButton.click();
        } else {
          await page.getByRole("link", { name: /ログアウト/i }).click();
        }
      }

      await page.waitForURL(/\/login/);

      // Act: ダッシュボードにアクセスを試みる
      await page.goto("/dashboard");

      // Assert: ログインページにリダイレクトされる
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
