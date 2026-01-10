import { test, expect } from "@playwright/test";

import { TEST_SALES_MEMBER } from "../utils/test-data";

/**
 * UAT-001: 営業担当者の1日の業務フロー（スモークテスト）
 *
 * E2Eテストセットアップのための基本的なテスト
 */
test.describe("UAT-001: 営業担当者の業務フロー", () => {
  test("営業担当者がログインして日報作成画面にアクセスできる", async ({
    page,
  }) => {
    // Step 1: ログイン
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.getByLabel("メールアドレス").fill(TEST_SALES_MEMBER.email);
    await page.getByLabel("パスワード").fill(TEST_SALES_MEMBER.password);
    await page.getByRole("button", { name: "ログイン" }).click();

    // ダッシュボードにリダイレクトされる
    await page.waitForURL(/\/(dashboard)?$/, { timeout: 30000 });

    // Step 2: ユーザー名が表示されていることを確認（認証済みの証拠）
    await expect(page.locator("body")).toContainText(TEST_SALES_MEMBER.name);

    // Step 3: 日報作成画面に移動
    await page.goto("/reports/new", { waitUntil: "networkidle" });

    // 日報作成ページが表示されることを確認
    await expect(page).toHaveURL(/\/reports\/new/);
  });
});
