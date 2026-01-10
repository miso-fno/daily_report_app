import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2Eテスト設定
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // テストディレクトリ
  testDir: "./e2e/tests",

  // テストファイルのパターン
  testMatch: "**/*.spec.ts",

  // テストの並列実行を有効化
  fullyParallel: true,

  // CI環境でのリトライ回数（ローカルではリトライしない）
  retries: process.env.CI ? 2 : 0,

  // 並列ワーカー数（CI環境では制限）
  workers: process.env.CI ? 1 : 4,

  // レポーター設定
  reporter: process.env.CI
    ? [["html", { outputFolder: "playwright-report" }], ["list"], ["github"]]
    : [["html", { outputFolder: "playwright-report" }], ["list"]],

  // 全テスト共通の設定
  use: {
    // ベースURL
    baseURL: "http://localhost:3000",

    // 失敗時のみスクリーンショットを取得
    screenshot: "only-on-failure",

    // 最初のリトライ時にトレースを記録
    trace: "on-first-retry",

    // 最初のリトライ時に動画を記録
    video: "on-first-retry",

    // タイムアウト設定（CI環境では余裕を持たせる）
    actionTimeout: 30000,
    navigationTimeout: 60000,

    // ロケール設定
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
  },

  // グローバルタイムアウト
  timeout: 60000,

  // expect のタイムアウト
  expect: {
    timeout: 15000,
  },

  // ブラウザ別プロジェクト設定
  projects: [
    // セットアップ（認証状態の保存）
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },

    // Chrome（認証済みテスト - 認証状態を使用）
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
      // 認証なしテストとシナリオテスト（ログイン〜ログアウトを含む完全フロー）は除外
      testIgnore: [/.*\.noauth\.spec\.ts/, /.*-workflow\.spec\.ts/],
    },

    // Firefox（認証済みテスト - 認証状態を使用）
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
      testIgnore: [/.*\.noauth\.spec\.ts/, /.*-workflow\.spec\.ts/],
    },

    // Safari（認証済みテスト - 認証状態を使用）
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
      testIgnore: [/.*\.noauth\.spec\.ts/, /.*-workflow\.spec\.ts/],
    },

    // 認証なしのテスト用プロジェクト（Chromiumのみ）
    // auth.noauth.spec.ts と シナリオテスト（完全な業務フロー）を実行
    {
      name: "chromium-no-auth",
      use: {
        ...devices["Desktop Chrome"],
      },
      testMatch: [/.*\.noauth\.spec\.ts/, /.*-workflow\.spec\.ts/],
    },
  ],

  // Webサーバーの設定
  webServer: {
    // CI環境ではビルド済みアプリを使用、ローカルでは開発サーバー
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  // 出力ディレクトリ
  outputDir: "test-results",
});
