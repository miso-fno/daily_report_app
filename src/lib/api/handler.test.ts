/**
 * APIルートハンドラーラッパーのテスト
 */

import { z } from "zod";

import { ApiError, ErrorCode } from "./errors";
import { createHandlers, withAuthHandler, withHandler } from "./handler";
import { successResponse } from "./response";

import type { RouteContext } from "./handler";
import type { NextRequest } from "next/server";

// モック用のNextRequestを作成
function createMockRequest(
  url = "http://localhost/api/test",
  options: RequestInit = {}
): NextRequest {
  return new Request(url, options) as NextRequest;
}

// モック用のRouteContextを作成
function createMockContext<T = Record<string, string>>(
  params: T = {} as T
): RouteContext<T> {
  return {
    params: Promise.resolve(params),
  };
}

describe("withHandler", () => {
  it("正常なレスポンスをそのまま返す", async () => {
    const handler = withHandler(async () => {
      return successResponse({ message: "success" });
    });

    const response = await handler(createMockRequest(), createMockContext());

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: { message: "success" },
    });
  });

  it("ApiErrorをキャッチしてエラーレスポンスに変換する", async () => {
    const handler = withHandler(async () => {
      throw new ApiError(
        ErrorCode.RESOURCE_NOT_FOUND,
        "ユーザーが見つかりません"
      );
    });

    const response = await handler(createMockRequest(), createMockContext());

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

  it("ZodErrorをキャッチしてバリデーションエラーレスポンスに変換する", async () => {
    const schema = z.object({
      name: z.string(),
    });

    const handler = withHandler(async () => {
      schema.parse({ name: 123 });
      return successResponse({});
    });

    const response = await handler(createMockRequest(), createMockContext());

    expect(response.status).toBe(422);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details).toBeDefined();
    expect(body.error.details.length).toBeGreaterThan(0);
  });

  it("JSONパースエラーをキャッチしてバリデーションエラーに変換する", async () => {
    const handler = withHandler(async () => {
      throw new SyntaxError("Unexpected token in JSON");
    });

    const response = await handler(createMockRequest(), createMockContext());

    expect(response.status).toBe(422);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toBe("リクエスト形式が不正です");
  });

  it("未知のエラーは内部エラーレスポンスに変換する", async () => {
    const originalEnv = process.env.NODE_ENV;

    // production モードでテスト
    vi.stubEnv("NODE_ENV", "production");

    const handler = withHandler(
      async () => {
        throw new Error("予期しないエラー");
      },
      { logErrors: false }
    );

    const response = await handler(createMockRequest(), createMockContext());

    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body).toEqual({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "サーバー内部エラーが発生しました",
      },
    });

    vi.stubEnv("NODE_ENV", originalEnv);
  });

  it("開発環境では未知のエラーの詳細メッセージを表示する", async () => {
    vi.stubEnv("NODE_ENV", "development");

    const handler = withHandler(
      async () => {
        throw new Error("詳細なエラーメッセージ");
      },
      { logErrors: false }
    );

    const response = await handler(createMockRequest(), createMockContext());

    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.error.message).toBe("詳細なエラーメッセージ");

    vi.stubEnv("NODE_ENV", "test");
  });

  it("リクエストとコンテキストをハンドラーに渡す", async () => {
    let receivedRequest: NextRequest | undefined;
    let receivedContext: RouteContext | undefined;

    const handler = withHandler(async (req, ctx) => {
      receivedRequest = req;
      receivedContext = ctx;
      return successResponse({});
    });

    const mockRequest = createMockRequest("http://localhost/api/test?id=123");
    const mockContext = createMockContext({ userId: "abc" });

    await handler(mockRequest, mockContext);

    expect(receivedRequest).toBe(mockRequest);
    expect(receivedContext).toBe(mockContext);
  });

  it("パスパラメータを正しく受け取る", async () => {
    const handler = withHandler<{ id: string }>(async (_req, ctx) => {
      const params = await ctx.params;
      return successResponse({ id: params.id });
    });

    const response = await handler(
      createMockRequest(),
      createMockContext({ id: "123" })
    );

    const body = await response.json();
    expect(body.data.id).toBe("123");
  });

  it("詳細情報付きApiErrorを正しく処理する", async () => {
    const details = [
      { field: "email", message: "メールアドレスが無効です" },
      { field: "password", message: "パスワードが短すぎます" },
    ];

    const handler = withHandler(async () => {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        "入力内容に誤りがあります",
        details
      );
    });

    const response = await handler(createMockRequest(), createMockContext());

    const body = await response.json();
    expect(body.error.details).toEqual(details);
  });
});

describe("withAuthHandler", () => {
  it("基本的なラッピングが機能する", async () => {
    const handler = withAuthHandler(async () => {
      return successResponse({ authenticated: true });
    });

    const response = await handler(createMockRequest(), createMockContext());

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.authenticated).toBe(true);
  });

  it("エラーハンドリングが機能する", async () => {
    const handler = withAuthHandler(async () => {
      throw new ApiError(ErrorCode.AUTH_UNAUTHORIZED);
    });

    const response = await handler(createMockRequest(), createMockContext());

    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error.code).toBe("AUTH_UNAUTHORIZED");
  });
});

describe("createHandlers", () => {
  it("GETハンドラーを作成できる", async () => {
    const handlers = createHandlers({
      GET: async () => successResponse({ method: "GET" }),
    });

    expect(handlers.GET).toBeDefined();
    expect(handlers.POST).toBeUndefined();

    const response = await handlers.GET!(
      createMockRequest(),
      createMockContext()
    );

    const body = await response.json();
    expect(body.data.method).toBe("GET");
  });

  it("POSTハンドラーを作成できる", async () => {
    const handlers = createHandlers({
      POST: async () => successResponse({ method: "POST" }),
    });

    expect(handlers.POST).toBeDefined();

    const response = await handlers.POST!(
      createMockRequest(),
      createMockContext()
    );

    const body = await response.json();
    expect(body.data.method).toBe("POST");
  });

  it("複数のハンドラーを作成できる", async () => {
    const handlers = createHandlers({
      GET: async () => successResponse({ method: "GET" }),
      POST: async () => successResponse({ method: "POST" }),
      PUT: async () => successResponse({ method: "PUT" }),
      PATCH: async () => successResponse({ method: "PATCH" }),
      DELETE: async () => successResponse({ method: "DELETE" }),
    });

    expect(handlers.GET).toBeDefined();
    expect(handlers.POST).toBeDefined();
    expect(handlers.PUT).toBeDefined();
    expect(handlers.PATCH).toBeDefined();
    expect(handlers.DELETE).toBeDefined();
  });

  it("すべてのハンドラーがエラーハンドリングを持つ", async () => {
    const handlers = createHandlers({
      GET: async () => {
        throw new ApiError(ErrorCode.RESOURCE_NOT_FOUND);
      },
      POST: async () => {
        throw new ApiError(ErrorCode.VALIDATION_ERROR);
      },
    });

    const getResponse = await handlers.GET!(
      createMockRequest(),
      createMockContext()
    );
    expect(getResponse.status).toBe(404);

    const postResponse = await handlers.POST!(
      createMockRequest(),
      createMockContext()
    );
    expect(postResponse.status).toBe(422);
  });

  it("パスパラメータの型を正しく扱える", async () => {
    const handlers = createHandlers<{ userId: string; postId: string }>({
      GET: async (_req, ctx) => {
        const params = await ctx.params;
        return successResponse({
          userId: params.userId,
          postId: params.postId,
        });
      },
    });

    const response = await handlers.GET!(
      createMockRequest(),
      createMockContext({ userId: "user-1", postId: "post-1" })
    );

    const body = await response.json();
    expect(body.data).toEqual({
      userId: "user-1",
      postId: "post-1",
    });
  });

  it("オプションを渡せる", async () => {
    // logErrors オプションが渡されることを確認（コンソール出力なし）
    const handlers = createHandlers(
      {
        GET: async () => {
          throw new Error("テストエラー");
        },
      },
      { logErrors: false }
    );

    const response = await handlers.GET!(
      createMockRequest(),
      createMockContext()
    );

    expect(response.status).toBe(500);
  });
});

describe("エラーハンドリングの統合テスト", () => {
  it("ネストしたエラーも正しく処理される", async () => {
    const handler = withHandler(async () => {
      async function innerFunction() {
        throw new ApiError(ErrorCode.FORBIDDEN_ACCESS, "アクセス禁止");
      }

      await innerFunction();
      return successResponse({});
    });

    const response = await handler(createMockRequest(), createMockContext());

    expect(response.status).toBe(403);

    const body = await response.json();
    expect(body.error.code).toBe("FORBIDDEN_ACCESS");
  });

  it("非Errorオブジェクトのスローも処理される", async () => {
    const handler = withHandler(
      async () => {
        throw "string error";
      },
      { logErrors: false }
    );

    const response = await handler(createMockRequest(), createMockContext());

    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });
});
