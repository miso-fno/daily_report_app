import { test as setup, expect } from "@playwright/test";

import { AUTH_FILE, MANAGER_AUTH_FILE } from "../fixtures/base";
import { TEST_SALES_MEMBER, TEST_MANAGER } from "../utils/test-data";

/**
 * 認証セットアップ: 営業担当者（一般メンバー）
 * テスト実行前に一度だけ実行され、認証状態をファイルに保存する
 */
setup("authenticate as sales member", async ({ page }) => {
  // ログインページに移動
  await page.goto("/login");

  // ログインフォームが表示されるまで待機
  await expect(
    page.getByRole("heading", { name: "営業日報システム" })
  ).toBeVisible();

  // メールアドレスを入力
  await page.getByLabel("メールアドレス").fill(TEST_SALES_MEMBER.email);

  // パスワードを入力
  await page.getByLabel("パスワード").fill(TEST_SALES_MEMBER.password);

  // ログインボタンをクリック
  await page.getByRole("button", { name: "ログイン" }).click();

  // ログイン後のリダイレクトを待機
  await page.waitForURL(/\/(dashboard)?$/);

  // ダッシュボードが表示されることを確認（認証成功の証拠）
  await expect(page.locator("body")).not.toContainText("ログイン");

  // 認証状態をファイルに保存
  await page.context().storageState({ path: AUTH_FILE });
});

/**
 * 認証セットアップ: 上長（マネージャー）
 * 上長権限が必要なテスト用の認証状態を保存
 */
setup("authenticate as manager", async ({ page }) => {
  // ログインページに移動
  await page.goto("/login");

  // ログインフォームが表示されるまで待機
  await expect(
    page.getByRole("heading", { name: "営業日報システム" })
  ).toBeVisible();

  // メールアドレスを入力
  await page.getByLabel("メールアドレス").fill(TEST_MANAGER.email);

  // パスワードを入力
  await page.getByLabel("パスワード").fill(TEST_MANAGER.password);

  // ログインボタンをクリック
  await page.getByRole("button", { name: "ログイン" }).click();

  // ログイン後のリダイレクトを待機
  await page.waitForURL(/\/(dashboard)?$/);

  // ダッシュボードが表示されることを確認（認証成功の証拠）
  await expect(page.locator("body")).not.toContainText("ログイン");

  // 認証状態をファイルに保存
  await page.context().storageState({ path: MANAGER_AUTH_FILE });
});
