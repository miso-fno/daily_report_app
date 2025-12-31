/**
 * エラー定義のテスト
 */

import {
  ApiError,
  createApiError,
  ErrorCode,
  ErrorCodeDefaultMessage,
  ErrorCodeToHttpStatus,
} from "./errors";

import type { ErrorCodeType } from "./errors";

describe("ErrorCode", () => {
  it("認証関連エラーコードが定義されている", () => {
    expect(ErrorCode.AUTH_INVALID_CREDENTIALS).toBe("AUTH_INVALID_CREDENTIALS");
    expect(ErrorCode.AUTH_TOKEN_EXPIRED).toBe("AUTH_TOKEN_EXPIRED");
    expect(ErrorCode.AUTH_UNAUTHORIZED).toBe("AUTH_UNAUTHORIZED");
  });

  it("権限関連エラーコードが定義されている", () => {
    expect(ErrorCode.FORBIDDEN_ACCESS).toBe("FORBIDDEN_ACCESS");
    expect(ErrorCode.FORBIDDEN_EDIT).toBe("FORBIDDEN_EDIT");
    expect(ErrorCode.FORBIDDEN_DELETE).toBe("FORBIDDEN_DELETE");
  });

  it("バリデーション関連エラーコードが定義されている", () => {
    expect(ErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(ErrorCode.DUPLICATE_ENTRY).toBe("DUPLICATE_ENTRY");
  });

  it("リソース関連エラーコードが定義されている", () => {
    expect(ErrorCode.RESOURCE_NOT_FOUND).toBe("RESOURCE_NOT_FOUND");
    expect(ErrorCode.RESOURCE_IN_USE).toBe("RESOURCE_IN_USE");
  });

  it("内部エラーコードが定義されている", () => {
    expect(ErrorCode.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
    expect(ErrorCode.SERVICE_UNAVAILABLE).toBe("SERVICE_UNAVAILABLE");
  });
});

describe("ErrorCodeToHttpStatus", () => {
  it("認証エラーは401を返す", () => {
    expect(ErrorCodeToHttpStatus[ErrorCode.AUTH_INVALID_CREDENTIALS]).toBe(401);
    expect(ErrorCodeToHttpStatus[ErrorCode.AUTH_TOKEN_EXPIRED]).toBe(401);
    expect(ErrorCodeToHttpStatus[ErrorCode.AUTH_UNAUTHORIZED]).toBe(401);
  });

  it("権限エラーは403を返す", () => {
    expect(ErrorCodeToHttpStatus[ErrorCode.FORBIDDEN_ACCESS]).toBe(403);
    expect(ErrorCodeToHttpStatus[ErrorCode.FORBIDDEN_EDIT]).toBe(403);
    expect(ErrorCodeToHttpStatus[ErrorCode.FORBIDDEN_DELETE]).toBe(403);
  });

  it("バリデーションエラーは422、重複エラーは400を返す", () => {
    expect(ErrorCodeToHttpStatus[ErrorCode.VALIDATION_ERROR]).toBe(422);
    expect(ErrorCodeToHttpStatus[ErrorCode.DUPLICATE_ENTRY]).toBe(400);
  });

  it("リソースエラーは404または409を返す", () => {
    expect(ErrorCodeToHttpStatus[ErrorCode.RESOURCE_NOT_FOUND]).toBe(404);
    expect(ErrorCodeToHttpStatus[ErrorCode.RESOURCE_IN_USE]).toBe(409);
  });

  it("内部エラーは500または503を返す", () => {
    expect(ErrorCodeToHttpStatus[ErrorCode.INTERNAL_ERROR]).toBe(500);
    expect(ErrorCodeToHttpStatus[ErrorCode.SERVICE_UNAVAILABLE]).toBe(503);
  });

  it("すべてのエラーコードに対してHTTPステータスが定義されている", () => {
    const allErrorCodes = Object.values(ErrorCode) as ErrorCodeType[];
    allErrorCodes.forEach((code) => {
      expect(ErrorCodeToHttpStatus[code]).toBeDefined();
      expect(typeof ErrorCodeToHttpStatus[code]).toBe("number");
    });
  });
});

describe("ErrorCodeDefaultMessage", () => {
  it("すべてのエラーコードに対してデフォルトメッセージが定義されている", () => {
    const allErrorCodes = Object.values(ErrorCode) as ErrorCodeType[];
    allErrorCodes.forEach((code) => {
      expect(ErrorCodeDefaultMessage[code]).toBeDefined();
      expect(typeof ErrorCodeDefaultMessage[code]).toBe("string");
      expect(ErrorCodeDefaultMessage[code].length).toBeGreaterThan(0);
    });
  });

  it("認証エラーのメッセージが適切である", () => {
    expect(ErrorCodeDefaultMessage[ErrorCode.AUTH_INVALID_CREDENTIALS]).toBe(
      "認証情報が無効です"
    );
    expect(ErrorCodeDefaultMessage[ErrorCode.AUTH_TOKEN_EXPIRED]).toBe(
      "認証トークンの有効期限が切れています"
    );
    expect(ErrorCodeDefaultMessage[ErrorCode.AUTH_UNAUTHORIZED]).toBe(
      "認証が必要です"
    );
  });
});

describe("ApiError", () => {
  it("エラーコードとデフォルトメッセージでインスタンスを作成できる", () => {
    const error = new ApiError(ErrorCode.RESOURCE_NOT_FOUND);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
    expect(error.message).toBe(
      ErrorCodeDefaultMessage[ErrorCode.RESOURCE_NOT_FOUND]
    );
    expect(error.statusCode).toBe(404);
    expect(error.details).toBeUndefined();
  });

  it("カスタムメッセージを指定できる", () => {
    const customMessage = "ユーザーが見つかりません";
    const error = new ApiError(ErrorCode.RESOURCE_NOT_FOUND, customMessage);

    expect(error.message).toBe(customMessage);
    expect(error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
  });

  it("詳細情報を指定できる", () => {
    const details = [
      { field: "email", message: "メールアドレスが無効です" },
      { field: "password", message: "パスワードが短すぎます" },
    ];
    const error = new ApiError(
      ErrorCode.VALIDATION_ERROR,
      "バリデーションエラー",
      details
    );

    expect(error.details).toEqual(details);
  });

  it("toJSONメソッドで正しくシリアライズできる", () => {
    const details = [{ field: "name", message: "名前は必須です" }];
    const error = new ApiError(
      ErrorCode.VALIDATION_ERROR,
      "バリデーションエラー",
      details
    );

    const json = error.toJSON();

    expect(json).toEqual({
      code: ErrorCode.VALIDATION_ERROR,
      message: "バリデーションエラー",
      details,
    });
  });

  it("詳細がない場合toJSONにはdetailsがundefinedで含まれる", () => {
    const error = new ApiError(ErrorCode.INTERNAL_ERROR);
    const json = error.toJSON();

    expect(json).toEqual({
      code: ErrorCode.INTERNAL_ERROR,
      message: ErrorCodeDefaultMessage[ErrorCode.INTERNAL_ERROR],
      details: undefined,
    });
  });

  it("Errorのプロトタイプチェーンが正しく設定されている", () => {
    const error = new ApiError(ErrorCode.INTERNAL_ERROR);

    expect(error instanceof Error).toBe(true);
    expect(error instanceof ApiError).toBe(true);
    expect(error.name).toBe("ApiError");
  });
});

describe("createApiError", () => {
  it("invalidCredentialsでAUTH_INVALID_CREDENTIALSエラーを作成できる", () => {
    const error = createApiError.invalidCredentials();

    expect(error.code).toBe(ErrorCode.AUTH_INVALID_CREDENTIALS);
    expect(error.statusCode).toBe(401);
  });

  it("invalidCredentialsでカスタムメッセージを指定できる", () => {
    const customMessage = "パスワードが間違っています";
    const error = createApiError.invalidCredentials(customMessage);

    expect(error.message).toBe(customMessage);
  });

  it("tokenExpiredでAUTH_TOKEN_EXPIREDエラーを作成できる", () => {
    const error = createApiError.tokenExpired();

    expect(error.code).toBe(ErrorCode.AUTH_TOKEN_EXPIRED);
    expect(error.statusCode).toBe(401);
  });

  it("unauthorizedでAUTH_UNAUTHORIZEDエラーを作成できる", () => {
    const error = createApiError.unauthorized();

    expect(error.code).toBe(ErrorCode.AUTH_UNAUTHORIZED);
    expect(error.statusCode).toBe(401);
  });

  it("forbiddenAccessでFORBIDDEN_ACCESSエラーを作成できる", () => {
    const error = createApiError.forbiddenAccess();

    expect(error.code).toBe(ErrorCode.FORBIDDEN_ACCESS);
    expect(error.statusCode).toBe(403);
  });

  it("forbiddenEditでFORBIDDEN_EDITエラーを作成できる", () => {
    const error = createApiError.forbiddenEdit();

    expect(error.code).toBe(ErrorCode.FORBIDDEN_EDIT);
    expect(error.statusCode).toBe(403);
  });

  it("forbiddenDeleteでFORBIDDEN_DELETEエラーを作成できる", () => {
    const error = createApiError.forbiddenDelete();

    expect(error.code).toBe(ErrorCode.FORBIDDEN_DELETE);
    expect(error.statusCode).toBe(403);
  });

  it("validationErrorでVALIDATION_ERRORエラーを作成できる", () => {
    const details = [{ field: "email", message: "無効なメールアドレス" }];
    const error = createApiError.validationError("入力エラー", details);

    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.statusCode).toBe(422);
    expect(error.details).toEqual(details);
  });

  it("duplicateEntryでDUPLICATE_ENTRYエラーを作成できる", () => {
    const error = createApiError.duplicateEntry();

    expect(error.code).toBe(ErrorCode.DUPLICATE_ENTRY);
    expect(error.statusCode).toBe(400);
  });

  it("notFoundでRESOURCE_NOT_FOUNDエラーを作成できる", () => {
    const error = createApiError.notFound();

    expect(error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
    expect(error.statusCode).toBe(404);
  });

  it("resourceInUseでRESOURCE_IN_USEエラーを作成できる", () => {
    const error = createApiError.resourceInUse();

    expect(error.code).toBe(ErrorCode.RESOURCE_IN_USE);
    expect(error.statusCode).toBe(409);
  });

  it("internalErrorでINTERNAL_ERRORエラーを作成できる", () => {
    const error = createApiError.internalError();

    expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(error.statusCode).toBe(500);
  });

  it("serviceUnavailableでSERVICE_UNAVAILABLEエラーを作成できる", () => {
    const error = createApiError.serviceUnavailable();

    expect(error.code).toBe(ErrorCode.SERVICE_UNAVAILABLE);
    expect(error.statusCode).toBe(503);
  });
});
