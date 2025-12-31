/**
 * APIレスポンスヘルパーのテスト
 */

import { ApiError, ErrorCode } from "./errors";
import {
  apiErrorResponse,
  createdResponse,
  errorResponse,
  forbiddenResponse,
  HttpStatus,
  internalErrorResponse,
  notFoundResponse,
  paginatedResponse,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "./response";

import type { ErrorDetail, PaginationInfo } from "./response";

describe("HttpStatus", () => {
  it("すべてのHTTPステータスコードが正しく定義されている", () => {
    expect(HttpStatus.OK).toBe(200);
    expect(HttpStatus.CREATED).toBe(201);
    expect(HttpStatus.BAD_REQUEST).toBe(400);
    expect(HttpStatus.UNAUTHORIZED).toBe(401);
    expect(HttpStatus.FORBIDDEN).toBe(403);
    expect(HttpStatus.NOT_FOUND).toBe(404);
    expect(HttpStatus.UNPROCESSABLE_ENTITY).toBe(422);
    expect(HttpStatus.INTERNAL_SERVER_ERROR).toBe(500);
    expect(HttpStatus.SERVICE_UNAVAILABLE).toBe(503);
  });
});

describe("successResponse", () => {
  it("成功レスポンスを正しい形式で生成する", async () => {
    const data = { id: 1, name: "テスト" };
    const response = successResponse(data);

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: { id: 1, name: "テスト" },
    });
  });

  it("メッセージ付きで成功レスポンスを生成できる", async () => {
    const data = { id: 1 };
    const response = successResponse(data, { message: "取得に成功しました" });

    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: { id: 1 },
      message: "取得に成功しました",
    });
  });

  it("カスタムステータスコードを指定できる", async () => {
    const data = { result: "ok" };
    const response = successResponse(data, { status: 202 });

    expect(response.status).toBe(202);
  });

  it("空のデータでも正しくレスポンスを生成できる", async () => {
    const response = successResponse(null);

    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: null,
    });
  });

  it("配列データを正しく処理できる", async () => {
    const data = [{ id: 1 }, { id: 2 }];
    const response = successResponse(data);

    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: [{ id: 1 }, { id: 2 }],
    });
  });
});

describe("createdResponse", () => {
  it("201ステータスで作成成功レスポンスを生成する", async () => {
    const data = { id: 1, name: "新規ユーザー" };
    const response = createdResponse(data);

    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: { id: 1, name: "新規ユーザー" },
    });
  });

  it("メッセージ付きで作成成功レスポンスを生成できる", async () => {
    const data = { id: 1 };
    const response = createdResponse(data, "ユーザーを作成しました");

    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: { id: 1 },
      message: "ユーザーを作成しました",
    });
  });
});

describe("paginatedResponse", () => {
  it("ページネーション付きレスポンスを正しい形式で生成する", async () => {
    const items = [{ id: 1 }, { id: 2 }];
    const pagination: PaginationInfo = {
      total: 100,
      per_page: 20,
      current_page: 1,
      last_page: 5,
      from: 1,
      to: 20,
    };
    const response = paginatedResponse(items, pagination);

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: {
        items: [{ id: 1 }, { id: 2 }],
        pagination: {
          total: 100,
          per_page: 20,
          current_page: 1,
          last_page: 5,
          from: 1,
          to: 20,
        },
      },
    });
  });

  it("空の配列でもページネーション情報を正しく返す", async () => {
    const items: unknown[] = [];
    const pagination: PaginationInfo = {
      total: 0,
      per_page: 20,
      current_page: 1,
      last_page: 1,
      from: 0,
      to: 0,
    };
    const response = paginatedResponse(items, pagination);

    const body = await response.json();
    expect(body.data.items).toEqual([]);
    expect(body.data.pagination.total).toBe(0);
  });
});

describe("errorResponse", () => {
  it("エラーレスポンスを正しい形式で生成する", async () => {
    const response = errorResponse(
      ErrorCode.RESOURCE_NOT_FOUND,
      "ユーザーが見つかりません"
    );

    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: "ユーザーが見つかりません",
      },
    });
  });

  it("詳細情報付きでエラーレスポンスを生成できる", async () => {
    const details: ErrorDetail[] = [
      { field: "email", message: "メールアドレスが無効です" },
      {
        field: "password",
        message: "パスワードは8文字以上必要です",
        code: "min_length",
      },
    ];
    const response = errorResponse(
      ErrorCode.VALIDATION_ERROR,
      "入力内容に誤りがあります",
      details
    );

    expect(response.status).toBe(422);

    const body = await response.json();
    expect(body.error.details).toEqual(details);
  });

  it("カスタムステータスコードを指定できる", async () => {
    const response = errorResponse(
      ErrorCode.INTERNAL_ERROR,
      "エラー",
      undefined,
      502
    );

    expect(response.status).toBe(502);
  });

  it("空のdetails配列はレスポンスに含まれない", async () => {
    const response = errorResponse(ErrorCode.VALIDATION_ERROR, "エラー", []);

    const body = await response.json();
    expect(body.error.details).toBeUndefined();
  });
});

describe("apiErrorResponse", () => {
  it("ApiErrorからエラーレスポンスを生成する", async () => {
    const error = new ApiError(
      ErrorCode.RESOURCE_NOT_FOUND,
      "ユーザーが見つかりません"
    );
    const response = apiErrorResponse(error);

    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: "ユーザーが見つかりません",
      },
    });
  });

  it("詳細情報付きApiErrorを正しく処理する", async () => {
    const details = [
      {
        field: "email",
        message: "メールアドレスが無効です",
        code: "invalid_email",
      },
    ];
    const error = new ApiError(
      ErrorCode.VALIDATION_ERROR,
      "入力エラー",
      details
    );
    const response = apiErrorResponse(error);

    const body = await response.json();
    expect(body.error.details).toEqual(details);
  });

  it("文字列の詳細情報を正しく変換する", async () => {
    const error = new ApiError(ErrorCode.VALIDATION_ERROR, "エラー", [
      "エラー詳細1",
      "エラー詳細2",
    ]);
    const response = apiErrorResponse(error);

    const body = await response.json();
    expect(body.error.details).toEqual([
      { message: "エラー詳細1" },
      { message: "エラー詳細2" },
    ]);
  });
});

describe("validationErrorResponse", () => {
  it("バリデーションエラーレスポンスを生成する", async () => {
    const details: ErrorDetail[] = [
      { field: "email", message: "メールアドレスが無効です" },
    ];
    const response = validationErrorResponse(details);

    expect(response.status).toBe(422);

    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "入力内容に誤りがあります",
        details,
      },
    });
  });

  it("カスタムメッセージを指定できる", async () => {
    const details: ErrorDetail[] = [
      { field: "name", message: "名前は必須です" },
    ];
    const response = validationErrorResponse(
      details,
      "フォームにエラーがあります"
    );

    const body = await response.json();
    expect(body.error.message).toBe("フォームにエラーがあります");
  });
});

describe("unauthorizedResponse", () => {
  it("認証エラーレスポンスを生成する", async () => {
    const response = unauthorizedResponse();

    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: {
        code: "AUTH_UNAUTHORIZED",
        message: "認証が必要です",
      },
    });
  });

  it("カスタムメッセージを指定できる", async () => {
    const response = unauthorizedResponse("ログインが必要です");

    const body = await response.json();
    expect(body.error.message).toBe("ログインが必要です");
  });
});

describe("forbiddenResponse", () => {
  it("権限エラーレスポンスを生成する", async () => {
    const response = forbiddenResponse();

    expect(response.status).toBe(403);

    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: {
        code: "FORBIDDEN_ACCESS",
        message: "このリソースへのアクセス権限がありません",
      },
    });
  });

  it("カスタムメッセージを指定できる", async () => {
    const response = forbiddenResponse("管理者権限が必要です");

    const body = await response.json();
    expect(body.error.message).toBe("管理者権限が必要です");
  });
});

describe("notFoundResponse", () => {
  it("リソース未検出エラーレスポンスを生成する", async () => {
    const response = notFoundResponse();

    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: "指定されたリソースが見つかりません",
      },
    });
  });

  it("カスタムメッセージを指定できる", async () => {
    const response = notFoundResponse("ユーザーが見つかりません");

    const body = await response.json();
    expect(body.error.message).toBe("ユーザーが見つかりません");
  });
});

describe("internalErrorResponse", () => {
  it("内部エラーレスポンスを生成する", async () => {
    const response = internalErrorResponse();

    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "サーバー内部エラーが発生しました",
      },
    });
  });

  it("カスタムメッセージを指定できる", async () => {
    const response = internalErrorResponse("データベース接続エラー");

    const body = await response.json();
    expect(body.error.message).toBe("データベース接続エラー");
  });
});
