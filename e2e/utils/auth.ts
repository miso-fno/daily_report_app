import { expect } from "@playwright/test";

import { TEST_SALES_MEMBER, TEST_MANAGER } from "./test-data";

import type { Page } from "@playwright/test";

/**
 * 認証ヘルパー関数
 * ログイン・ログアウト処理を提供
 */

/**
 * ログイン処理
 * @param page - Playwrightのページオブジェクト
 * @param email - メールアドレス
 * @param password - パスワード
 */
export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  // ログインページに移動
  await page.goto("/login");

  // ログインフォームが表示されるまで待機
  await expect(
    page.getByRole("heading", { name: "営業日報システム" })
  ).toBeVisible();

  // メールアドレスを入力
  await page.getByLabel("メールアドレス").fill(email);

  // パスワードを入力
  await page.getByLabel("パスワード").fill(password);

  // ログインボタンをクリック
  await page.getByRole("button", { name: "ログイン" }).click();

  // ログイン後のリダイレクトを待機（ダッシュボードまたはホームページ）
  await page.waitForURL(/\/(dashboard)?$/);
}

/**
 * 営業担当者（一般メンバー）としてログイン
 * @param page - Playwrightのページオブジェクト
 */
export async function loginAsSalesMember(page: Page): Promise<void> {
  await login(page, TEST_SALES_MEMBER.email, TEST_SALES_MEMBER.password);
}

/**
 * 上長（マネージャー）としてログイン
 * @param page - Playwrightのページオブジェクト
 */
export async function loginAsManager(page: Page): Promise<void> {
  await login(page, TEST_MANAGER.email, TEST_MANAGER.password);
}

/**
 * ログアウト処理
 * @param page - Playwrightのページオブジェクト
 */
export async function logout(page: Page): Promise<void> {
  // ユーザーメニューを開く（ヘッダーのユーザーアイコンまたはドロップダウン）
  const userMenu = page.getByRole("button", {
    name: /ユーザーメニュー|アカウント/,
  });

  // ユーザーメニューが存在する場合はクリック
  if (await userMenu.isVisible()) {
    await userMenu.click();
    // ログアウトボタンをクリック
    await page.getByRole("menuitem", { name: "ログアウト" }).click();
  } else {
    // 直接ログアウトボタンがある場合
    await page.getByRole("button", { name: "ログアウト" }).click();
  }

  // ログインページにリダイレクトされるまで待機
  await page.waitForURL(/\/login/);

  // ログインページが表示されることを確認
  await expect(
    page.getByRole("heading", { name: "営業日報システム" })
  ).toBeVisible();
}

/**
 * 認証状態を確認
 * @param page - Playwrightのページオブジェクト
 * @returns 認証済みの場合true
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // ダッシュボードにアクセスを試みる
  await page.goto("/dashboard");

  // URLがログインページにリダイレクトされていないか確認
  const currentUrl = page.url();
  return !currentUrl.includes("/login");
}

/**
 * 認証が必要なページにアクセスして、ログインページにリダイレクトされることを確認
 * @param page - Playwrightのページオブジェクト
 * @param targetUrl - アクセスするURL
 */
export async function expectRedirectToLogin(
  page: Page,
  targetUrl: string
): Promise<void> {
  await page.goto(targetUrl);

  // ログインページにリダイレクトされることを確認
  await expect(page).toHaveURL(/\/login/);

  // ログインフォームが表示されることを確認
  await expect(
    page.getByRole("heading", { name: "営業日報システム" })
  ).toBeVisible();
}

/**
 * ログインエラーメッセージが表示されることを確認
 * @param page - Playwrightのページオブジェクト
 * @param errorMessage - 期待するエラーメッセージ（部分一致）
 */
export async function expectLoginError(
  page: Page,
  errorMessage?: string
): Promise<void> {
  // エラーアラートが表示されることを確認
  const errorAlert = page.getByRole("alert");
  await expect(errorAlert).toBeVisible();

  // エラーメッセージが指定されている場合は内容も確認
  if (errorMessage) {
    await expect(errorAlert).toContainText(errorMessage);
  }
}

/**
 * 認証状態をファイルに保存
 * @param page - Playwrightのページオブジェクト
 * @param filePath - 保存先のファイルパス
 */
export async function saveAuthState(
  page: Page,
  filePath: string
): Promise<void> {
  await page.context().storageState({ path: filePath });
}
