import { test, expect } from "@playwright/test";

import { TEST_MANAGER } from "../utils/test-data";

/**
 * UAT-002: 上長の日報確認業務フロー（スモークテスト）
 *
 * E2Eテストセットアップのための基本的なテスト
 */
test.describe("UAT-002: 上長の業務フロー", () => {
  test("上長がログインして日報一覧にアクセスできる", async ({ page }) => {
    // Step 1: ログイン
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.getByLabel("メールアドレス").fill(TEST_MANAGER.email);
    await page.getByLabel("パスワード").fill(TEST_MANAGER.password);
    await page.getByRole("button", { name: "ログイン" }).click();

    // ダッシュボードにリダイレクトされる
    await page.waitForURL(/\/(dashboard)?$/, { timeout: 30000 });

    // Step 2: ユーザー名が表示されていることを確認（認証済みの証拠）
    await expect(page.locator("body")).toContainText(TEST_MANAGER.name);

    // Step 3: 日報一覧画面に移動
    await page.goto("/reports", { waitUntil: "networkidle" });

    // 日報一覧ページが表示されることを確認
    await expect(page).toHaveURL(/\/reports/);
  });
});
