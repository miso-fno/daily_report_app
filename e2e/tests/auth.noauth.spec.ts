import { test, expect } from "@playwright/test";

import { TEST_SALES_MEMBER, INVALID_CREDENTIALS } from "../utils/test-data";

/**
 * 認証関連のE2Eテスト
 * 認証状態を使用しないテスト（.noauth.spec.ts）
 */
test.describe("認証機能", () => {
  test.beforeEach(async ({ page }) => {
    // ログインページに移動し、ページが完全にロードされるまで待機
    await page.goto("/login", { waitUntil: "networkidle" });
  });

  test("ログインページが正しく表示される", async ({ page }) => {
    // ログインフォームが表示されている
    await expect(page.getByLabel("メールアドレス")).toBeVisible();
    await expect(page.getByLabel("パスワード")).toBeVisible();
    await expect(page.getByRole("button", { name: "ログイン" })).toBeVisible();
  });

  test("営業担当者が正しい認証情報でログインできる", async ({ page }) => {
    // ログイン情報を入力して送信
    await page.getByLabel("メールアドレス").fill(TEST_SALES_MEMBER.email);
    await page.getByLabel("パスワード").fill(TEST_SALES_MEMBER.password);
    await page.getByRole("button", { name: "ログイン" }).click();

    // ダッシュボードにリダイレクトされる
    await page.waitForURL(/\/(dashboard)?$/, { timeout: 30000 });
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("間違った認証情報でログインできない", async ({ page }) => {
    // 間違った認証情報を入力
    await page.getByLabel("メールアドレス").fill(TEST_SALES_MEMBER.email);
    await page.getByLabel("パスワード").fill(INVALID_CREDENTIALS.wrongPassword);
    await page.getByRole("button", { name: "ログイン" }).click();

    // エラーメッセージが表示される
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 10000 });
    // ログインページに留まる
    await expect(page).toHaveURL(/\/login/);
  });

  test("未認証でダッシュボードにアクセスするとログインページにリダイレクトされる", async ({
    page,
  }) => {
    // ダッシュボードにアクセス
    await page.goto("/dashboard", { waitUntil: "networkidle" });

    // ログインページにリダイレクトされる
    await expect(page).toHaveURL(/\/login/);
  });
});
