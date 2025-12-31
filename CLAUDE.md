# 営業日報システム 開発ガイド

## プロジェクト概要

営業担当者が日々の活動を報告し、上長がフィードバックを行うための日報管理システム。

## ドキュメント構成

詳細な仕様は `doc/` フォルダ配下を参照：

- `rdd.md` - 要件定義書
- `erd.md` - ER図（データベース設計）
- `api_specification.md` - API仕様書
- `screen_definition.md` - 画面定義書
- `test_specification.md` - テスト仕様書

---

## 機能要件サマリー

### 1. 日報管理機能

- 営業担当者が日付ごとに日報を作成・編集・削除
- 1つの日報に複数の顧客訪問記録を登録可能
- 課題・相談（Problem）と明日の予定（Plan）を記載
- ステータス管理: 下書き(draft) → 提出済(submitted) → 確認済(confirmed)

### 2. 顧客訪問記録機能

- 顧客マスタから訪問先を選択
- 訪問時間、目的、内容、結果を記録

### 3. コメント機能

- 上長が日報に対してコメントを追加
- コメントは複数件追加可能

### 4. マスタ管理機能

- 顧客マスタのCRUD
- 営業担当者マスタのCRUD（上長フラグ含む）

### 5. 権限管理

- 営業担当者: 自分の日報のみ編集可
- 上長: 部下の日報を閲覧・コメント可、確認済ステータスへの変更可
- 管理者: マスタ管理の全権限

---

## データベース設計

### テーブル一覧

| テーブル名   | 説明             |
| ------------ | ---------------- |
| SALES_PERSON | 営業担当者マスタ |
| CUSTOMER     | 顧客マスタ       |
| DAILY_REPORT | 日報             |
| VISIT_RECORD | 訪問記録         |
| COMMENT      | コメント         |

### 主要エンティティ

#### SALES_PERSON（営業担当者）

| カラム          | 型       | 説明                 |
| --------------- | -------- | -------------------- |
| sales_person_id | int      | PK                   |
| name            | string   | 氏名                 |
| email           | string   | メールアドレス       |
| department      | string   | 部署                 |
| manager_id      | int      | 上長ID（自己参照FK） |
| is_manager      | boolean  | 上長フラグ           |
| created_at      | datetime | 作成日時             |
| updated_at      | datetime | 更新日時             |

#### CUSTOMER（顧客）

| カラム         | 型       | 説明     |
| -------------- | -------- | -------- |
| customer_id    | int      | PK       |
| customer_name  | string   | 顧客名   |
| address        | string   | 住所     |
| phone          | string   | 電話番号 |
| contact_person | string   | 担当者名 |
| created_at     | datetime | 作成日時 |
| updated_at     | datetime | 更新日時 |

#### DAILY_REPORT（日報）

| カラム          | 型       | 説明                      |
| --------------- | -------- | ------------------------- |
| report_id       | int      | PK                        |
| sales_person_id | int      | FK（営業担当者）          |
| report_date     | date     | 報告日                    |
| problem         | text     | 課題・相談                |
| plan            | text     | 明日の予定                |
| status          | string   | draft/submitted/confirmed |
| created_at      | datetime | 作成日時                  |
| updated_at      | datetime | 更新日時                  |

#### VISIT_RECORD（訪問記録）

| カラム        | 型       | 説明       |
| ------------- | -------- | ---------- |
| visit_id      | int      | PK         |
| report_id     | int      | FK（日報） |
| customer_id   | int      | FK（顧客） |
| visit_time    | time     | 訪問時間   |
| visit_purpose | text     | 訪問目的   |
| visit_content | text     | 訪問内容   |
| visit_result  | text     | 訪問結果   |
| created_at    | datetime | 作成日時   |
| updated_at    | datetime | 更新日時   |

#### COMMENT（コメント）

| カラム          | 型       | 説明             |
| --------------- | -------- | ---------------- |
| comment_id      | int      | PK               |
| report_id       | int      | FK（日報）       |
| sales_person_id | int      | FK（コメント者） |
| comment_text    | text     | コメント内容     |
| created_at      | datetime | 作成日時         |
| updated_at      | datetime | 更新日時         |

---

## API設計

### ベースURL

`/api/v1`

### エンドポイント一覧

#### 認証

| メソッド | パス         | 概要                     |
| -------- | ------------ | ------------------------ |
| POST     | /auth/login  | ログイン                 |
| POST     | /auth/logout | ログアウト               |
| GET      | /auth/me     | ログインユーザー情報取得 |

#### 日報

| メソッド | パス                 | 概要           |
| -------- | -------------------- | -------------- |
| GET      | /reports             | 日報一覧取得   |
| GET      | /reports/{id}        | 日報詳細取得   |
| POST     | /reports             | 日報作成       |
| PUT      | /reports/{id}        | 日報更新       |
| DELETE   | /reports/{id}        | 日報削除       |
| PATCH    | /reports/{id}/status | ステータス更新 |

#### 訪問記録

| メソッド | パス                       | 概要     |
| -------- | -------------------------- | -------- |
| GET      | /reports/{reportId}/visits | 一覧取得 |
| POST     | /reports/{reportId}/visits | 作成     |
| PUT      | /visits/{id}               | 更新     |
| DELETE   | /visits/{id}               | 削除     |

#### コメント

| メソッド | パス                         | 概要     |
| -------- | ---------------------------- | -------- |
| GET      | /reports/{reportId}/comments | 一覧取得 |
| POST     | /reports/{reportId}/comments | 作成     |
| DELETE   | /comments/{id}               | 削除     |

#### 顧客マスタ

| メソッド | パス            | 概要     |
| -------- | --------------- | -------- |
| GET      | /customers      | 一覧取得 |
| GET      | /customers/{id} | 詳細取得 |
| POST     | /customers      | 作成     |
| PUT      | /customers/{id} | 更新     |
| DELETE   | /customers/{id} | 削除     |

#### 営業担当者マスタ

| メソッド | パス                | 概要     |
| -------- | ------------------- | -------- |
| GET      | /sales-persons      | 一覧取得 |
| GET      | /sales-persons/{id} | 詳細取得 |
| POST     | /sales-persons      | 作成     |
| PUT      | /sales-persons/{id} | 更新     |
| DELETE   | /sales-persons/{id} | 削除     |

### レスポンス形式

```json
// 成功時
{
  "success": true,
  "data": { ... },
  "message": "処理が完了しました"
}

// 一覧取得時（ページネーション）
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "total": 100,
      "per_page": 20,
      "current_page": 1,
      "last_page": 5
    }
  }
}

// エラー時
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": [ ... ]
  }
}
```

### 主要エラーコード

| コード                   | HTTPステータス | 説明                 |
| ------------------------ | -------------- | -------------------- |
| AUTH_INVALID_CREDENTIALS | 401            | 認証情報不正         |
| AUTH_TOKEN_EXPIRED       | 401            | トークン期限切れ     |
| FORBIDDEN_ACCESS         | 403            | アクセス権限なし     |
| VALIDATION_ERROR         | 422            | バリデーションエラー |
| RESOURCE_NOT_FOUND       | 404            | リソース未検出       |
| RESOURCE_IN_USE          | 400            | 使用中のため操作不可 |

---

## 画面一覧

| 画面ID  | 画面名                         | 概要                           |
| ------- | ------------------------------ | ------------------------------ |
| SCR-001 | ログイン画面                   | システムへのログイン           |
| SCR-002 | ダッシュボード                 | ホーム画面、日報一覧・通知表示 |
| SCR-010 | 日報一覧画面                   | 日報の検索・一覧表示           |
| SCR-011 | 日報作成画面                   | 新規日報の作成                 |
| SCR-012 | 日報編集画面                   | 既存日報の編集                 |
| SCR-013 | 日報詳細画面                   | 日報の詳細表示・コメント機能   |
| SCR-020 | 顧客マスタ一覧画面             | 顧客の検索・一覧表示           |
| SCR-021 | 顧客マスタ登録・編集画面       | 顧客情報の登録・編集           |
| SCR-030 | 営業担当者マスタ一覧画面       | 営業担当者の検索・一覧表示     |
| SCR-031 | 営業担当者マスタ登録・編集画面 | 営業担当者情報の登録・編集     |

---

## バリデーションルール

### 日報作成・編集

| 項目       | ルール              |
| ---------- | ------------------- |
| 報告日     | 必須、未来日不可    |
| 訪問記録   | 提出時は1件以上必須 |
| 課題・相談 | 最大2000文字        |
| 明日の予定 | 最大2000文字        |

### 訪問記録

| 項目     | ルール             |
| -------- | ------------------ |
| 顧客     | 必須               |
| 訪問時間 | HH:MM形式          |
| 訪問目的 | 最大100文字        |
| 訪問内容 | 必須、最大1000文字 |
| 訪問結果 | 最大200文字        |

### 顧客マスタ

| 項目     | ルール                      |
| -------- | --------------------------- |
| 顧客名   | 必須、最大100文字、重複不可 |
| 住所     | 最大200文字                 |
| 電話番号 | 電話番号形式                |
| 担当者名 | 最大50文字                  |

### 営業担当者マスタ

| 項目           | ルール                     |
| -------------- | -------------------------- |
| 氏名           | 必須、最大50文字           |
| メールアドレス | 必須、メール形式、重複不可 |
| パスワード     | 新規時必須、8文字以上      |
| 部署           | 必須                       |

---

## テストコード作成時の厳守事項

### テストコードの品質

- テストは必ず実際の機能を検証すること
- `expect(true).toBe(true)` のような意味のないアサーションは絶対に書かない
- 各テストケースは具体的な入力と期待される出力を検証すること
- モックは必要最小限に留め、実際の動作に近い形でテストすること

### ハードコーディングの禁止

- テストを通すためだけのハードコードは絶対に禁止
- 本番コードに `if (testMode)` のような条件分岐を入れない
- テスト用の特別な値（マジックナンバー）を本番コードに埋め込まない

### テスト実装の原則

- テストが失敗する状態から始めること（Red-Green-Refactor）
- 境界値、異常系、エラーケースも必ずテストすること
- カバレッジだけでなく、実際の品質を重視すること

---

## 日時形式

| 種類 | 形式                 | 例                   |
| ---- | -------------------- | -------------------- |
| 日付 | YYYY-MM-DD           | 2024-01-15           |
| 時間 | HH:MM                | 10:30                |
| 日時 | YYYY-MM-DDTHH:MM:SSZ | 2024-01-15T18:00:00Z |

---

## 非機能要件

- Webブラウザからアクセス可能
- 日報の検索・一覧表示が可能
- 権限管理を実装
- 画面表示: 3秒以内
- 検索処理: 5秒以内
- 登録/更新処理: 3秒以内
- 同時接続: 50ユーザー対応
- HTTPS通信
- SQLインジェクション/XSS/CSRF対策必須

# 使用技術

**言語:** TypeScript
**フレームワーク** Next.js(App Router)
**UIコンポーネント** shadcn/ui + Tailwind CSS
**APIスキーマ定義** OpenAPI(Zodによる検証)
**DBスキーマ定義** Prisma.js
**テスト** Vitest
**デプロイ** Google Cloud Run
