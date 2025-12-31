module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // 新機能
        "fix", // バグ修正
        "docs", // ドキュメント
        "style", // フォーマット（コードの動作に影響しない変更）
        "refactor", // リファクタリング
        "perf", // パフォーマンス改善
        "test", // テスト
        "build", // ビルド関連
        "ci", // CI関連
        "chore", // その他
        "revert", // コミット取り消し
      ],
    ],
    "subject-case": [0], // 日本語対応のため無効化
    "subject-full-stop": [0], // 日本語対応のため無効化
  },
};
