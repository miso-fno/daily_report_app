# 営業日報システム API仕様書

## 目次

1. [概要](#1-概要)
2. [共通仕様](#2-共通仕様)
3. [認証API](#3-認証api)
4. [日報API](#4-日報api)
5. [訪問記録API](#5-訪問記録api)
6. [コメントAPI](#6-コメントapi)
7. [顧客マスタAPI](#7-顧客マスタapi)
8. [営業担当者マスタAPI](#8-営業担当者マスタapi)
9. [エラーコード一覧](#9-エラーコード一覧)

---

## 1. 概要

### 1.1 基本情報

| 項目          | 内容                             |
| ------------- | -------------------------------- |
| APIバージョン | v1                               |
| ベースURL     | `https://api.example.com/api/v1` |
| プロトコル    | HTTPS                            |
| データ形式    | JSON                             |
| 文字コード    | UTF-8                            |

### 1.2 API一覧

| カテゴリ   | メソッド | エンドポイント               | 概要                     |
| ---------- | -------- | ---------------------------- | ------------------------ |
| 認証       | POST     | /auth/login                  | ログイン                 |
| 認証       | POST     | /auth/logout                 | ログアウト               |
| 認証       | GET      | /auth/me                     | ログインユーザー情報取得 |
| 日報       | GET      | /reports                     | 日報一覧取得             |
| 日報       | GET      | /reports/{id}                | 日報詳細取得             |
| 日報       | POST     | /reports                     | 日報作成                 |
| 日報       | PUT      | /reports/{id}                | 日報更新                 |
| 日報       | DELETE   | /reports/{id}                | 日報削除                 |
| 日報       | PATCH    | /reports/{id}/status         | 日報ステータス更新       |
| 訪問記録   | GET      | /reports/{reportId}/visits   | 訪問記録一覧取得         |
| 訪問記録   | POST     | /reports/{reportId}/visits   | 訪問記録作成             |
| 訪問記録   | PUT      | /visits/{id}                 | 訪問記録更新             |
| 訪問記録   | DELETE   | /visits/{id}                 | 訪問記録削除             |
| コメント   | GET      | /reports/{reportId}/comments | コメント一覧取得         |
| コメント   | POST     | /reports/{reportId}/comments | コメント作成             |
| コメント   | DELETE   | /comments/{id}               | コメント削除             |
| 顧客       | GET      | /customers                   | 顧客一覧取得             |
| 顧客       | GET      | /customers/{id}              | 顧客詳細取得             |
| 顧客       | POST     | /customers                   | 顧客作成                 |
| 顧客       | PUT      | /customers/{id}              | 顧客更新                 |
| 顧客       | DELETE   | /customers/{id}              | 顧客削除                 |
| 営業担当者 | GET      | /sales-persons               | 営業担当者一覧取得       |
| 営業担当者 | GET      | /sales-persons/{id}          | 営業担当者詳細取得       |
| 営業担当者 | POST     | /sales-persons               | 営業担当者作成           |
| 営業担当者 | PUT      | /sales-persons/{id}          | 営業担当者更新           |
| 営業担当者 | DELETE   | /sales-persons/{id}          | 営業担当者削除           |

---

## 2. 共通仕様

### 2.1 リクエストヘッダー

| ヘッダー名    | 必須 | 説明                                     |
| ------------- | ---- | ---------------------------------------- |
| Content-Type  | ○    | `application/json`                       |
| Authorization | ○    | `Bearer {アクセストークン}` ※認証API以外 |
| Accept        | -    | `application/json`                       |

### 2.2 レスポンス形式

#### 成功時

```json
{
  "success": true,
  "data": { ... },
  "message": "処理が完了しました"
}
```

#### 一覧取得時（ページネーション）

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "total": 100,
      "per_page": 20,
      "current_page": 1,
      "last_page": 5,
      "from": 1,
      "to": 20
    }
  }
}
```

#### エラー時

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": [ ... ]
  }
}
```

### 2.3 HTTPステータスコード

| コード | 説明                     |
| ------ | ------------------------ |
| 200    | 成功（取得・更新・削除） |
| 201    | 成功（作成）             |
| 400    | リクエスト不正           |
| 401    | 認証エラー               |
| 403    | 権限エラー               |
| 404    | リソース未検出           |
| 422    | バリデーションエラー     |
| 500    | サーバーエラー           |

### 2.4 日時形式

- 日付：`YYYY-MM-DD`（例：2024-01-15）
- 時間：`HH:MM`（例：10:30）
- 日時：`YYYY-MM-DDTHH:MM:SSZ`（ISO 8601形式）

---

## 3. 認証API

### 3.1 ログイン

ユーザー認証を行い、アクセストークンを発行する。

#### リクエスト

```
POST /auth/login
```

| パラメータ | 型      | 必須 | 説明                                    |
| ---------- | ------- | ---- | --------------------------------------- |
| email      | string  | ○    | メールアドレス                          |
| password   | string  | ○    | パスワード                              |
| remember   | boolean | -    | ログイン状態を保持（デフォルト：false） |

#### リクエスト例

```json
{
  "email": "yamada@example.com",
  "password": "password123",
  "remember": true
}
```

#### レスポンス例（成功）

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "sales_person_id": 1,
      "name": "山田太郎",
      "email": "yamada@example.com",
      "department": "営業1課",
      "is_manager": false
    }
  }
}
```

#### エラー例

```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "メールアドレスまたはパスワードが正しくありません"
  }
}
```

---

### 3.2 ログアウト

現在のセッションを終了する。

#### リクエスト

```
POST /auth/logout
```

#### レスポンス例（成功）

```json
{
  "success": true,
  "message": "ログアウトしました"
}
```

---

### 3.3 ログインユーザー情報取得

現在ログイン中のユーザー情報を取得する。

#### リクエスト

```
GET /auth/me
```

#### レスポンス例（成功）

```json
{
  "success": true,
  "data": {
    "sales_person_id": 1,
    "name": "山田太郎",
    "email": "yamada@example.com",
    "department": "営業1課",
    "manager_id": 10,
    "manager_name": "鈴木一郎",
    "is_manager": false,
    "created_at": "2023-04-01T09:00:00Z"
  }
}
```

---

## 4. 日報API

### 4.1 日報一覧取得

日報の一覧を取得する。

#### リクエスト

```
GET /reports
```

#### クエリパラメータ

| パラメータ      | 型      | 必須 | 説明                                             |
| --------------- | ------- | ---- | ------------------------------------------------ |
| date_from       | string  | -    | 検索期間（開始）YYYY-MM-DD                       |
| date_to         | string  | -    | 検索期間（終了）YYYY-MM-DD                       |
| sales_person_id | integer | -    | 営業担当者ID                                     |
| status          | string  | -    | ステータス（draft/submitted/confirmed）          |
| page            | integer | -    | ページ番号（デフォルト：1）                      |
| per_page        | integer | -    | 1ページあたりの件数（デフォルト：20、最大：100） |
| sort            | string  | -    | ソート項目（report_date, created_at）            |
| order           | string  | -    | ソート順（asc, desc）                            |

#### リクエスト例

```
GET /reports?date_from=2024-01-01&date_to=2024-01-31&status=submitted&page=1&per_page=20
```

#### レスポンス例（成功）

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "report_id": 1,
        "report_date": "2024-01-15",
        "sales_person_id": 1,
        "sales_person_name": "山田太郎",
        "status": "submitted",
        "status_label": "提出済",
        "visit_count": 3,
        "comment_count": 1,
        "created_at": "2024-01-15T18:00:00Z",
        "updated_at": "2024-01-15T18:30:00Z"
      },
      {
        "report_id": 2,
        "report_date": "2024-01-14",
        "sales_person_id": 1,
        "sales_person_name": "山田太郎",
        "status": "confirmed",
        "status_label": "確認済",
        "visit_count": 2,
        "comment_count": 2,
        "created_at": "2024-01-14T17:30:00Z",
        "updated_at": "2024-01-14T19:00:00Z"
      }
    ],
    "pagination": {
      "total": 25,
      "per_page": 20,
      "current_page": 1,
      "last_page": 2,
      "from": 1,
      "to": 20
    }
  }
}
```

---

### 4.2 日報詳細取得

指定した日報の詳細情報を取得する。

#### リクエスト

```
GET /reports/{id}
```

#### パスパラメータ

| パラメータ | 型      | 必須 | 説明   |
| ---------- | ------- | ---- | ------ |
| id         | integer | ○    | 日報ID |

#### レスポンス例（成功）

```json
{
  "success": true,
  "data": {
    "report_id": 1,
    "report_date": "2024-01-15",
    "sales_person_id": 1,
    "sales_person_name": "山田太郎",
    "status": "submitted",
    "status_label": "提出済",
    "problem": "競合他社の価格が当社より10%安いため、価格交渉が難航している。",
    "plan": "午前：株式会社DEFへ訪問（見積提出）\n午後：展示会資料の最終確認",
    "visits": [
      {
        "visit_id": 1,
        "customer_id": 101,
        "customer_name": "株式会社ABC",
        "visit_time": "10:00",
        "visit_purpose": "新製品のご提案",
        "visit_content": "新製品Xについて説明。担当者の佐藤様は興味を示され、次回デモの約束を取り付けた。",
        "visit_result": "次回デモ日程調整中"
      },
      {
        "visit_id": 2,
        "customer_id": 102,
        "customer_name": "株式会社XYZ",
        "visit_time": "14:00",
        "visit_purpose": "定期訪問",
        "visit_content": "現状のヒアリングを実施。特に問題なし。",
        "visit_result": "継続フォロー"
      }
    ],
    "comments": [
      {
        "comment_id": 1,
        "sales_person_id": 10,
        "sales_person_name": "鈴木課長",
        "comment_text": "競合の件、一度価格戦略会議で相談しましょう。",
        "created_at": "2024-01-15T18:30:00Z"
      }
    ],
    "created_at": "2024-01-15T18:00:00Z",
    "updated_at": "2024-01-15T18:30:00Z"
  }
}
```

---

### 4.3 日報作成

新しい日報を作成する。

#### リクエスト

```
POST /reports
```

#### リクエストボディ

| パラメータ  | 型     | 必須 | 説明                          |
| ----------- | ------ | ---- | ----------------------------- |
| report_date | string | ○    | 報告日（YYYY-MM-DD）          |
| problem     | string | -    | 課題・相談（最大2000文字）    |
| plan        | string | -    | 明日の予定（最大2000文字）    |
| status      | string | ○    | ステータス（draft/submitted） |
| visits      | array  | -    | 訪問記録の配列                |

##### visits配列の要素

| パラメータ    | 型      | 必須 | 説明                     |
| ------------- | ------- | ---- | ------------------------ |
| customer_id   | integer | ○    | 顧客ID                   |
| visit_time    | string  | -    | 訪問時間（HH:MM）        |
| visit_purpose | string  | -    | 訪問目的（最大100文字）  |
| visit_content | string  | ○    | 訪問内容（最大1000文字） |
| visit_result  | string  | -    | 訪問結果（最大200文字）  |

#### リクエスト例

```json
{
  "report_date": "2024-01-15",
  "problem": "競合他社の価格が当社より10%安いため、価格交渉が難航している。",
  "plan": "午前：株式会社DEFへ訪問（見積提出）",
  "status": "submitted",
  "visits": [
    {
      "customer_id": 101,
      "visit_time": "10:00",
      "visit_purpose": "新製品のご提案",
      "visit_content": "新製品Xについて説明。担当者の佐藤様は興味を示された。",
      "visit_result": "次回デモ日程調整中"
    },
    {
      "customer_id": 102,
      "visit_time": "14:00",
      "visit_purpose": "定期訪問",
      "visit_content": "現状のヒアリングを実施。特に問題なし。",
      "visit_result": "継続フォロー"
    }
  ]
}
```

#### レスポンス例（成功）

```json
{
  "success": true,
  "data": {
    "report_id": 1,
    "report_date": "2024-01-15",
    "status": "submitted",
    "created_at": "2024-01-15T18:00:00Z"
  },
  "message": "日報を作成しました"
}
```

#### バリデーションエラー例

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力内容に誤りがあります",
    "details": [
      {
        "field": "report_date",
        "message": "報告日は必須です"
      },
      {
        "field": "visits[0].customer_id",
        "message": "顧客を選択してください"
      }
    ]
  }
}
```

---

### 4.4 日報更新

既存の日報を更新する。

#### リクエスト

```
PUT /reports/{id}
```

#### パスパラメータ

| パラメータ | 型      | 必須 | 説明   |
| ---------- | ------- | ---- | ------ |
| id         | integer | ○    | 日報ID |

#### リクエストボディ

POST /reports と同様

#### レスポンス例（成功）

```json
{
  "success": true,
  "data": {
    "report_id": 1,
    "report_date": "2024-01-15",
    "status": "submitted",
    "updated_at": "2024-01-15T19:00:00Z"
  },
  "message": "日報を更新しました"
}
```

---

### 4.5 日報削除

指定した日報を削除する。

#### リクエスト

```
DELETE /reports/{id}
```

#### パスパラメータ

| パラメータ | 型      | 必須 | 説明   |
| ---------- | ------- | ---- | ------ |
| id         | integer | ○    | 日報ID |

#### レスポンス例（成功）

```json
{
  "success": true,
  "message": "日報を削除しました"
}
```

---

### 4.6 日報ステータス更新

日報のステータスのみを更新する（上長による確認処理など）。

#### リクエスト

```
PATCH /reports/{id}/status
```

#### パスパラメータ

| パラメータ | 型      | 必須 | 説明   |
| ---------- | ------- | ---- | ------ |
| id         | integer | ○    | 日報ID |

#### リクエストボディ

| パラメータ | 型     | 必須 | 説明                                    |
| ---------- | ------ | ---- | --------------------------------------- |
| status     | string | ○    | ステータス（draft/submitted/confirmed） |

#### リクエスト例

```json
{
  "status": "confirmed"
}
```

#### レスポンス例（成功）

```json
{
  "success": true,
  "data": {
    "report_id": 1,
    "status": "confirmed",
    "status_label": "確認済",
    "updated_at": "2024-01-15T20:00:00Z"
  },
  "message": "ステータスを更新しました"
}
```

---

## 5. 訪問記録API

### 5.1 訪問記録一覧取得

指定した日報の訪問記録一覧を取得する。

#### リクエスト

```
GET /reports/{reportId}/visits
```

#### パスパラメータ

| パラメータ | 型      | 必須 | 説明   |
| ---------- | ------- | ---- | ------ |
| reportId   | integer | ○    | 日報ID |

#### レスポンス例（成功）

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "visit_id": 1,
        "report_id": 1,
        "customer_id": 101,
        "customer_name": "株式会社ABC",
        "visit_time": "10:00",
        "visit_purpose": "新製品のご提案",
        "visit_content": "新製品Xについて説明。担当者の佐藤様は興味を示された。",
        "visit_result": "次回デモ日程調整中",
        "created_at": "2024-01-15T18:00:00Z",
        "updated_at": "2024-01-15T18:00:00Z"
      }
    ]
  }
}
```

---

### 5.2 訪問記録作成

指定した日報に訪問記録を追加する。

#### リクエスト

```
POST /reports/{reportId}/visits
```

#### パスパラメータ

| パラメータ | 型      | 必須 | 説明   |
| ---------- | ------- | ---- | ------ |
| reportId   | integer | ○    | 日報ID |

#### リクエストボディ

| パラメータ    | 型      | 必須 | 説明                     |
| ------------- | ------- | ---- | ------------------------ |
| customer_id   | integer | ○    | 顧客ID                   |
| visit_time    | string  | -    | 訪問時間（HH:MM）        |
| visit_purpose | string  | -    | 訪問目的（最大100文字）  |
| visit_content | string  | ○    | 訪問内容（最大1000文字） |
| visit_result  | string  | -    | 訪問結果（最大200文字）  |

#### リクエスト例

```json
{
  "customer_id": 103,
  "visit_time": "16:00",
  "visit_purpose": "クレーム対応",
  "visit_content": "納品遅延についてお詫びと状況説明を行った。",
  "visit_result": "ご理解いただけた"
}
```

#### レスポンス例（成功）

```json
{
  "success": true,
  "data": {
    "visit_id": 3,
    "report_id": 1,
    "created_at": "2024-01-15T19:00:00Z"
  },
  "message": "訪問記録を追加しました"
}
```

---

### 5.3 訪問記録更新

訪問記録を更新する。

#### リクエスト

```
PUT /visits/{id}
```

#### パスパラメータ

| パラメータ | 型      | 必須 | 説明       |
| ---------- | ------- | ---- | ---------- |
| id         | integer | ○    | 訪問記録ID |

#### リクエストボディ

POST /reports/{reportId}/visits と同様

#### レスポンス例（成功）

```json
{
  "success": true,
  "data": {
    "visit_id": 1,
    "updated_at": "2024-01-15T19:30:00Z"
  },
  "message": "訪問記録を更新しました"
}
```

---

### 5.4 訪問記録削除

訪問記録を削除する。

#### リクエスト

```
DELETE /visits/{id}
```

#### パスパラメータ

| パラメータ | 型      | 必須 | 説明       |
| ---------- | ------- | ---- | ---------- |
| id         | integer | ○    | 訪問記録ID |

#### レスポンス例（成功）

```json
{
  "success": true,
  "message": "訪問記録を削除しました"
}
```

---

## 6. コメントAPI

### 6.1 コメント一覧取得

指定した日報のコメント一覧を取得する。

#### リクエスト

```
GET /reports/{reportId}/comments
```

#### パスパラメータ

| パラメータ | 型      | 必須 | 説明   |
| ---------- | ------- | ---- | ------ |
| reportId   | integer | ○    | 日報ID |

#### レスポンス例（成功）

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "comment_id": 1,
        "report_id": 1,
        "sales_person_id": 10,
        "sales_person_name": "鈴木課長",
        "comment_text": "競合の件、一度価格戦略会議で相談しましょう。",
        "created_at": "2024-01-15T18:30:00Z",
        "updated_at": "2024-01-15T18:30:00Z"
      },
      {
        "comment_id": 2,
        "report_id": 1,
        "sales_person_id": 10,
        "sales_person_name": "鈴木課長",
        "comment_text": "展示会は私もサポートするので心配しないでください。",
        "created_at": "2024-01-15T18:35:00Z",
        "updated_at": "2024-01-15T18:35:00Z"
      }
    ]
  }
}
```

---

### 6.2 コメント作成

指定した日報にコメントを追加する。

#### リクエスト

```
POST /reports/{reportId}/comments
```

#### パスパラメータ

| パラメータ | 型      | 必須 | 説明   |
| ---------- | ------- | ---- | ------ |
| reportId   | integer | ○    | 日報ID |

#### リクエストボディ

| パラメータ   | 型     | 必須 | 説明                        |
| ------------ | ------ | ---- | --------------------------- |
| comment_text | string | ○    | コメント内容（最大500文字） |

#### リクエスト例

```json
{
  "comment_text": "明日の商談、頑張ってください！"
}
```

#### レスポンス例（成功）

```json
{
  "success": true,
  "data": {
    "comment_id": 3,
    "report_id": 1,
    "created_at": "2024-01-15T19:00:00Z"
  },
  "message": "コメントを投稿しました"
}
```

---

### 6.3 コメント削除

コメントを削除する。

#### リクエスト

```
DELETE /comments/{id}
```

#### パスパラメータ

| パラメータ | 型      | 必須 | 説明       |
| ---------- | ------- | ---- | ---------- |
| id         | integer | ○    | コメントID |

#### レスポンス例（成功）

```json
{
  "success": true,
  "message": "コメントを削除しました"
}
```

---

## 7. 顧客マスタAPI

### 7.1 顧客一覧取得

顧客の一覧を取得する。

#### リクエスト

```
GET /customers
```

#### クエリパラメータ

| パラメータ    | 型      | 必須 | 説明                                    |
| ------------- | ------- | ---- | --------------------------------------- |
| customer_name | string  | -    | 顧客名（部分一致検索）                  |
| page          | integer | -    | ページ番号（デフォルト：1）             |
| per_page      | integer | -    | 1ページあたりの件数（デフォルト：20）   |
| sort          | string  | -    | ソート項目（customer_name, created_at） |
| order         | string  | -    | ソート順（asc, desc）                   |

#### リクエスト例

```
GET /customers?customer_name=株式会社&page=1&per_page=20
```

#### レスポンス例（成功）

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "customer_id": 101,
        "customer_name": "株式会社ABC",
        "address": "東京都港区芝1-1-1",
        "phone": "03-1234-5678",
        "contact_person": "佐藤一郎",
        "created_at": "2023-01-01T00:00:00Z",
        "updated_at": "2023-06-15T10:00:00Z"
      },
      {
        "customer_id": 102,
        "customer_name": "株式会社XYZ",
        "address": "大阪府大阪市北区梅田2-2-2",
        "phone": "06-9876-5432",
        "contact_person": "田中花子",
        "created_at": "2023-02-01T00:00:00Z",
        "updated_at": "2023-07-20T14:00:00Z"
      }
    ],
    "pagination": {
      "total": 50,
      "per_page": 20,
      "current_page": 1,
      "last_page": 3,
      "from": 1,
      "to": 20
    }
  }
}
```

---

### 7.2 顧客詳細取得

指定した顧客の詳細情報を取得する。

#### リクエスト

```
GET /customers/{id}
```

#### パスパラメータ

| パラメータ | 型      | 必須 | 説明   |
| ---------- | ------- | ---- | ------ |
| id         | integer | ○    | 顧客ID |

#### レスポンス例（成功）

```json
{
  "success": true,
  "data": {
    "customer_id": 101,
    "customer_name": "株式会社ABC",
    "address": "東京都港区芝1-1-1",
    "phone": "03-1234-5678",
    "contact_person": "佐藤一郎",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-06-15T10:00:00Z"
  }
}
```

---

### 7.3 顧客作成

新しい顧客を登録する。

#### リクエスト

```
POST /customers
```

#### リクエストボディ

| パラメータ     | 型     | 必須 | 説明                   |
| -------------- | ------ | ---- | ---------------------- |
| customer_name  | string | ○    | 顧客名（最大100文字）  |
| address        | string | -    | 住所（最大200文字）    |
| phone          | string | -    | 電話番号               |
| contact_person | string | -    | 担当者名（最大50文字） |

#### リクエスト例

```json
{
  "customer_name": "株式会社DEF",
  "address": "名古屋市中区栄3-3-3",
  "phone": "052-1111-2222",
  "contact_person": "鈴木次郎"
}
```

#### レスポンス例（成功）

```json
{
  "success": true,
  "data": {
    "customer_id": 103,
    "customer_name": "株式会社DEF",
    "created_at": "2024-01-15T10:00:00Z"
  },
  "message": "顧客を登録しました"
}
```

---

### 7.4 顧客更新

顧客情報を更新する。

#### リクエスト

```
PUT /customers/{id}
```

#### パスパラメータ

| パラメータ | 型      | 必須 | 説明   |
| ---------- | ------- | ---- | ------ |
| id         | integer | ○    | 顧客ID |

#### リクエストボディ

POST /customers と同様

#### レスポンス例（成功）

```json
{
  "success": true,
  "data": {
    "customer_id": 103,
    "updated_at": "2024-01-15T11:00:00Z"
  },
  "message": "顧客情報を更新しました"
}
```

---

### 7.5 顧客削除

顧客を削除する。

#### リクエスト

```
DELETE /customers/{id}
```

#### パスパラメータ

| パラメータ | 型      | 必須 | 説明   |
| ---------- | ------- | ---- | ------ |
| id         | integer | ○    | 顧客ID |

#### レスポンス例（成功）

```json
{
  "success": true,
  "message": "顧客を削除しました"
}
```

#### エラー例（削除不可）

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_IN_USE",
    "message": "この顧客は訪問記録で使用されているため削除できません"
  }
}
```

---

## 8. 営業担当者マスタAPI

### 8.1 営業担当者一覧取得

営業担当者の一覧を取得する。

#### リクエスト

```
GET /sales-persons
```

#### クエリパラメータ

| パラメータ | 型      | 必須 | 説明                                  |
| ---------- | ------- | ---- | ------------------------------------- |
| name       | string  | -    | 氏名（部分一致検索）                  |
| department | string  | -    | 部署                                  |
| is_manager | boolean | -    | 上長フラグ                            |
| page       | integer | -    | ページ番号（デフォルト：1）           |
| per_page   | integer | -    | 1ページあたりの件数（デフォルト：20） |

#### リクエスト例

```
GET /sales-persons?department=営業1課&page=1
```

#### レスポンス例（成功）

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "sales_person_id": 1,
        "name": "山田太郎",
        "email": "yamada@example.com",
        "department": "営業1課",
        "manager_id": 10,
        "manager_name": "鈴木一郎",
        "is_manager": false,
        "created_at": "2023-04-01T09:00:00Z",
        "updated_at": "2023-04-01T09:00:00Z"
      },
      {
        "sales_person_id": 10,
        "name": "鈴木一郎",
        "email": "suzuki@example.com",
        "department": "営業1課",
        "manager_id": null,
        "manager_name": null,
        "is_manager": true,
        "created_at": "2022-04-01T09:00:00Z",
        "updated_at": "2022-04-01T09:00:00Z"
      }
    ],
    "pagination": {
      "total": 20,
      "per_page": 20,
      "current_page": 1,
      "last_page": 1,
      "from": 1,
      "to": 20
    }
  }
}
```

---

### 8.2 営業担当者詳細取得

指定した営業担当者の詳細情報を取得する。

#### リクエスト

```
GET /sales-persons/{id}
```

#### パスパラメータ

| パラメータ | 型      | 必須 | 説明         |
| ---------- | ------- | ---- | ------------ |
| id         | integer | ○    | 営業担当者ID |

#### レスポンス例（成功）

```json
{
  "success": true,
  "data": {
    "sales_person_id": 1,
    "name": "山田太郎",
    "email": "yamada@example.com",
    "department": "営業1課",
    "manager_id": 10,
    "manager_name": "鈴木一郎",
    "is_manager": false,
    "created_at": "2023-04-01T09:00:00Z",
    "updated_at": "2023-04-01T09:00:00Z"
  }
}
```

---

### 8.3 営業担当者作成

新しい営業担当者を登録する。

#### リクエスト

```
POST /sales-persons
```

#### リクエストボディ

| パラメータ | 型      | 必須 | 説明                    |
| ---------- | ------- | ---- | ----------------------- |
| name       | string  | ○    | 氏名（最大50文字）      |
| email      | string  | ○    | メールアドレス          |
| password   | string  | ○    | パスワード（8文字以上） |
| department | string  | ○    | 部署                    |
| manager_id | integer | -    | 上長ID                  |
| is_manager | boolean | ○    | 上長フラグ              |

#### リクエスト例

```json
{
  "name": "佐藤三郎",
  "email": "sato@example.com",
  "password": "password123",
  "department": "営業2課",
  "manager_id": 20,
  "is_manager": false
}
```

#### レスポンス例（成功）

```json
{
  "success": true,
  "data": {
    "sales_person_id": 5,
    "name": "佐藤三郎",
    "created_at": "2024-01-15T10:00:00Z"
  },
  "message": "営業担当者を登録しました"
}
```

---

### 8.4 営業担当者更新

営業担当者情報を更新する。

#### リクエスト

```
PUT /sales-persons/{id}
```

#### パスパラメータ

| パラメータ | 型      | 必須 | 説明         |
| ---------- | ------- | ---- | ------------ |
| id         | integer | ○    | 営業担当者ID |

#### リクエストボディ

| パラメータ | 型      | 必須 | 説明                                |
| ---------- | ------- | ---- | ----------------------------------- |
| name       | string  | ○    | 氏名（最大50文字）                  |
| email      | string  | ○    | メールアドレス                      |
| password   | string  | -    | パスワード（変更時のみ、8文字以上） |
| department | string  | ○    | 部署                                |
| manager_id | integer | -    | 上長ID                              |
| is_manager | boolean | ○    | 上長フラグ                          |

#### レスポンス例（成功）

```json
{
  "success": true,
  "data": {
    "sales_person_id": 5,
    "updated_at": "2024-01-15T11:00:00Z"
  },
  "message": "営業担当者情報を更新しました"
}
```

---

### 8.5 営業担当者削除

営業担当者を削除する。

#### リクエスト

```
DELETE /sales-persons/{id}
```

#### パスパラメータ

| パラメータ | 型      | 必須 | 説明         |
| ---------- | ------- | ---- | ------------ |
| id         | integer | ○    | 営業担当者ID |

#### レスポンス例（成功）

```json
{
  "success": true,
  "message": "営業担当者を削除しました"
}
```

#### エラー例（削除不可）

```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_IN_USE",
    "message": "この営業担当者は日報で使用されているため削除できません"
  }
}
```

---

## 9. エラーコード一覧

### 9.1 認証エラー

| コード                   | HTTPステータス | 説明                                 |
| ------------------------ | -------------- | ------------------------------------ |
| AUTH_INVALID_CREDENTIALS | 401            | メールアドレスまたはパスワードが不正 |
| AUTH_TOKEN_EXPIRED       | 401            | トークンの有効期限切れ               |
| AUTH_TOKEN_INVALID       | 401            | 不正なトークン                       |
| AUTH_UNAUTHORIZED        | 401            | 認証が必要                           |

### 9.2 権限エラー

| コード           | HTTPステータス | 説明               |
| ---------------- | -------------- | ------------------ |
| FORBIDDEN_ACCESS | 403            | アクセス権限がない |
| FORBIDDEN_EDIT   | 403            | 編集権限がない     |
| FORBIDDEN_DELETE | 403            | 削除権限がない     |

### 9.3 バリデーションエラー

| コード           | HTTPステータス | 説明                         |
| ---------------- | -------------- | ---------------------------- |
| VALIDATION_ERROR | 422            | 入力値のバリデーションエラー |
| DUPLICATE_ENTRY  | 422            | 重複データが存在する         |

### 9.4 リソースエラー

| コード             | HTTPステータス | 説明                               |
| ------------------ | -------------- | ---------------------------------- |
| RESOURCE_NOT_FOUND | 404            | リソースが見つからない             |
| RESOURCE_IN_USE    | 400            | リソースが使用中のため操作できない |

### 9.5 サーバーエラー

| コード              | HTTPステータス | 説明               |
| ------------------- | -------------- | ------------------ |
| INTERNAL_ERROR      | 500            | サーバー内部エラー |
| SERVICE_UNAVAILABLE | 503            | サービス一時停止中 |

---

## 10. 改訂履歴

| 版  | 日付       | 内容     | 担当 |
| --- | ---------- | -------- | ---- |
| 1.0 | 2024/01/15 | 初版作成 | -    |
