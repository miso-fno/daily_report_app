/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect } from "@playwright/test";

import { TEST_SALES_MEMBER, TEST_MANAGER } from "../utils/test-data";

import type { Page } from "@playwright/test";

/**
 * 認証状態ファイルのパス
 */
export const AUTH_FILE = "e2e/.auth/user.json";
export const MANAGER_AUTH_FILE = "e2e/.auth/manager.json";

/**
 * カスタムフィクスチャの型定義
 */
type CustomFixtures = {
  /** 認証済みのページ（営業担当者） */
  authenticatedPage: Page;
  /** 認証済みのページ（上長） */
  managerPage: Page;
};

/**
 * テスト用の拡張されたtestオブジェクト
 * 認証済みのページフィクスチャを提供
 */
export const test = base.extend<CustomFixtures>({
  // 営業担当者として認証済みのページ
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: AUTH_FILE,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // 上長として認証済みのページ
  managerPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: MANAGER_AUTH_FILE,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };

/**
 * ページオブジェクトの基底クラス
 * 共通のページ操作を提供
 */
export class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * 指定したURLに移動
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * ページタイトルを取得
   */
  async getTitle(): Promise<string> {
    return await this.page.title();
  }

  /**
   * 現在のURLを取得
   */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * ローディングが完了するまで待機
   */
  async waitForLoadingComplete(): Promise<void> {
    // スピナーやローディング表示が消えるまで待機
    await this.page
      .locator('[data-testid="loading"], .loading, [aria-busy="true"]')
      .waitFor({ state: "hidden" })
      .catch(() => {
        // ローディング要素が存在しない場合は無視
      });
  }
}

/**
 * ダッシュボードページのページオブジェクト
 */
export class DashboardPage extends BasePage {
  async navigate(): Promise<void> {
    await this.goto("/dashboard");
  }

  async expectToBeVisible(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: /ダッシュボード/ })
    ).toBeVisible();
  }
}

/**
 * 日報一覧ページのページオブジェクト
 */
export class ReportsListPage extends BasePage {
  async navigate(): Promise<void> {
    await this.goto("/reports");
  }

  async expectToBeVisible(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: /日報一覧/ })
    ).toBeVisible();
  }
}

/**
 * 日報作成ページのページオブジェクト
 */
export class ReportCreatePage extends BasePage {
  async navigate(): Promise<void> {
    await this.goto("/reports/new");
  }

  async expectToBeVisible(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: /日報作成|新規日報/ })
    ).toBeVisible();
  }
}

/**
 * ログインページのページオブジェクト
 */
export class LoginPage extends BasePage {
  async navigate(): Promise<void> {
    await this.goto("/login");
  }

  async expectToBeVisible(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: "営業日報システム" })
    ).toBeVisible();
  }

  async login(email: string, password: string): Promise<void> {
    await this.page.getByLabel("メールアドレス").fill(email);
    await this.page.getByLabel("パスワード").fill(password);
    await this.page.getByRole("button", { name: "ログイン" }).click();
    await this.page.waitForURL(/\/(dashboard)?$/);
  }
}

/**
 * 共通ヘルパー: テストユーザー情報
 */
export const testUsers = {
  salesMember: TEST_SALES_MEMBER,
  manager: TEST_MANAGER,
};
