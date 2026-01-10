/**
 * E2Eテスト用データヘルパー
 * Seedデータと同期したテスト用の固定データを定義
 */

/**
 * テストユーザー: 営業担当者（一般メンバー）
 * Seedデータの田中次郎に対応
 */
export const TEST_SALES_MEMBER = {
  email: "tanaka@example.com",
  password: "password123",
  name: "田中 次郎",
  department: "営業部 第一課",
  isManager: false,
} as const;

/**
 * テストユーザー: 上長（マネージャー）
 * Seedデータの鈴木一郎に対応
 */
export const TEST_MANAGER = {
  email: "suzuki@example.com",
  password: "password123",
  name: "鈴木 一郎",
  department: "営業部 第一課",
  isManager: true,
} as const;

/**
 * テストユーザー: 管理者
 * Seedデータの山田太郎に対応
 */
export const TEST_ADMIN = {
  email: "yamada@example.com",
  password: "password123",
  name: "山田 太郎",
  department: "営業部",
  isManager: true,
} as const;

/**
 * テストユーザー: 第二課メンバー
 * Seedデータの伊藤美咲に対応
 */
export const TEST_SALES_MEMBER_2 = {
  email: "ito@example.com",
  password: "password123",
  name: "伊藤 美咲",
  department: "営業部 第二課",
  isManager: false,
} as const;

/**
 * テスト顧客データ
 * Seedデータの顧客マスタに対応
 */
export const TEST_CUSTOMERS = {
  ABC: {
    name: "株式会社ABC",
    address: "東京都渋谷区渋谷1-1-1",
    phone: "03-1234-5678",
    contactPerson: "中村 担当",
  },
  XYZ: {
    name: "XYZ株式会社",
    address: "東京都新宿区新宿2-2-2",
    phone: "03-2345-6789",
    contactPerson: "小林 部長",
  },
  DEF: {
    name: "DEF Industries",
    address: "大阪府大阪市北区梅田3-3-3",
    phone: "06-3456-7890",
    contactPerson: "加藤 課長",
  },
  GHI: {
    name: "GHI商事",
    address: "愛知県名古屋市中区栄4-4-4",
    phone: "052-4567-8901",
    contactPerson: "渡辺 主任",
  },
  JKL: {
    name: "JKLソリューションズ",
    address: "福岡県福岡市博多区博多5-5-5",
    phone: "092-5678-9012",
    contactPerson: "山本 マネージャー",
  },
} as const;

/**
 * 日報ステータス
 */
export const REPORT_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  CONFIRMED: "confirmed",
} as const;

/**
 * 訪問目的の選択肢
 */
export const VISIT_PURPOSES = [
  "定期訪問",
  "新規提案",
  "契約更新",
  "クレーム対応",
  "商談",
  "フォローアップ",
  "情報収集",
] as const;

/**
 * テスト用の日報データを生成
 */
export function generateTestReportData() {
  const today = new Date();
  const formattedDate = today.toISOString().split("T")[0];

  return {
    reportDate: formattedDate,
    problem:
      "テスト用の課題・相談内容です。新規顧客開拓において、競合他社との差別化が課題となっています。",
    plan: "テスト用の明日の予定です。既存顧客へのフォローアップと新規提案資料の作成を予定しています。",
    visitRecords: [
      {
        customerName: TEST_CUSTOMERS.ABC.name,
        visitTime: "10:00",
        visitPurpose: "定期訪問",
        visitContent:
          "月次の定例ミーティングを実施。製品の稼働状況を確認し、追加発注の可能性についてヒアリングした。",
        visitResult: "来月に追加発注を検討中とのこと",
      },
      {
        customerName: TEST_CUSTOMERS.XYZ.name,
        visitTime: "14:00",
        visitPurpose: "新規提案",
        visitContent:
          "新サービスの提案資料を持参して説明。デモンストレーションを実施し、具体的な導入効果について説明した。",
        visitResult: "興味あり。見積もり依頼を受けた",
      },
      {
        customerName: TEST_CUSTOMERS.DEF.name,
        visitTime: "16:30",
        visitPurpose: "フォローアップ",
        visitContent:
          "前回提案した内容についてのフォローアップ。社内での検討状況を確認した。",
        visitResult: "来週中に結論を出すとのこと",
      },
    ],
  };
}

/**
 * テスト用のコメントデータ
 */
export const TEST_COMMENTS = {
  FEEDBACK:
    "お疲れ様です。新規提案の進捗、良いですね。XYZ株式会社への見積もり提出、早めにお願いします。",
  QUESTION: "DEF Industriesの検討状況について、詳しく教えてください。",
  APPROVAL: "内容を確認しました。引き続き頑張ってください。",
} as const;

/**
 * 無効な認証情報
 */
export const INVALID_CREDENTIALS = {
  wrongEmail: "invalid@example.com",
  wrongPassword: "wrongpassword",
  emptyEmail: "",
  emptyPassword: "",
  invalidEmailFormat: "invalid-email",
} as const;

/**
 * 日付ヘルパー関数
 */
export function getDateString(daysOffset: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split("T")[0]!;
}

/**
 * 昨日の日付を取得
 */
export function getYesterday(): string {
  return getDateString(-1);
}

/**
 * 明日の日付を取得
 */
export function getTomorrow(): string {
  return getDateString(1);
}

/**
 * 今日の日付を取得
 */
export function getToday(): string {
  return getDateString(0);
}
