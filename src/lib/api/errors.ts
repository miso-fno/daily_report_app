/**
 * API共通エラーコード定義
 *
 * エラーコードは以下のカテゴリに分類されます:
 * - AUTH_*: 認証関連エラー
 * - FORBIDDEN_*: 権限関連エラー
 * - VALIDATION_*: バリデーション関連エラー
 * - RESOURCE_*: リソース関連エラー
 * - INTERNAL_*: 内部エラー
 */

/**
 * エラーコードの定義
 */
export const ErrorCode = {
  // 認証関連エラー (401)
  AUTH_INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS",
  AUTH_TOKEN_EXPIRED: "AUTH_TOKEN_EXPIRED",
  AUTH_UNAUTHORIZED: "AUTH_UNAUTHORIZED",

  // 権限関連エラー (403)
  FORBIDDEN_ACCESS: "FORBIDDEN_ACCESS",
  FORBIDDEN_EDIT: "FORBIDDEN_EDIT",
  FORBIDDEN_DELETE: "FORBIDDEN_DELETE",

  // バリデーション関連エラー (400, 422)
  VALIDATION_ERROR: "VALIDATION_ERROR",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",

  // リソース関連エラー (404, 409)
  RESOURCE_NOT_FOUND: "RESOURCE_NOT_FOUND",
  RESOURCE_IN_USE: "RESOURCE_IN_USE",

  // 内部エラー (500, 503)
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * エラーコードとHTTPステータスコードのマッピング
 */
export const ErrorCodeToHttpStatus: Record<ErrorCodeType, number> = {
  // 認証関連エラー
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 401,
  [ErrorCode.AUTH_TOKEN_EXPIRED]: 401,
  [ErrorCode.AUTH_UNAUTHORIZED]: 401,

  // 権限関連エラー
  [ErrorCode.FORBIDDEN_ACCESS]: 403,
  [ErrorCode.FORBIDDEN_EDIT]: 403,
  [ErrorCode.FORBIDDEN_DELETE]: 403,

  // バリデーション関連エラー
  [ErrorCode.VALIDATION_ERROR]: 422,
  [ErrorCode.DUPLICATE_ENTRY]: 400,

  // リソース関連エラー
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_IN_USE]: 409,

  // 内部エラー
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
};

/**
 * エラーコードのデフォルトメッセージ
 */
export const ErrorCodeDefaultMessage: Record<ErrorCodeType, string> = {
  // 認証関連エラー
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: "認証情報が無効です",
  [ErrorCode.AUTH_TOKEN_EXPIRED]: "認証トークンの有効期限が切れています",
  [ErrorCode.AUTH_UNAUTHORIZED]: "認証が必要です",

  // 権限関連エラー
  [ErrorCode.FORBIDDEN_ACCESS]: "このリソースへのアクセス権限がありません",
  [ErrorCode.FORBIDDEN_EDIT]: "このリソースの編集権限がありません",
  [ErrorCode.FORBIDDEN_DELETE]: "このリソースの削除権限がありません",

  // バリデーション関連エラー
  [ErrorCode.VALIDATION_ERROR]: "入力内容に誤りがあります",
  [ErrorCode.DUPLICATE_ENTRY]: "既に登録されているデータです",

  // リソース関連エラー
  [ErrorCode.RESOURCE_NOT_FOUND]: "指定されたリソースが見つかりません",
  [ErrorCode.RESOURCE_IN_USE]: "このリソースは使用中のため操作できません",

  // 内部エラー
  [ErrorCode.INTERNAL_ERROR]: "サーバー内部エラーが発生しました",
  [ErrorCode.SERVICE_UNAVAILABLE]: "サービスが一時的に利用できません",
};

/**
 * APIエラークラス
 *
 * API内で発生するエラーを統一的に扱うためのカスタムエラークラス
 */
export class ApiError extends Error {
  public readonly code: ErrorCodeType;
  public readonly statusCode: number;
  public readonly details: unknown[] | undefined;

  constructor(code: ErrorCodeType, message?: string, details?: unknown[]) {
    super(message ?? ErrorCodeDefaultMessage[code]);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = ErrorCodeToHttpStatus[code];
    this.details = details ?? undefined;

    // Error クラスを継承する際の prototype chain を正しく設定
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * JSONシリアライズ用のオブジェクトを生成
   */
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * 便利なエラー生成関数
 */
export const createApiError = {
  /** 認証エラー: 無効な認証情報 */
  invalidCredentials: (message?: string) =>
    new ApiError(ErrorCode.AUTH_INVALID_CREDENTIALS, message),

  /** 認証エラー: トークン期限切れ */
  tokenExpired: (message?: string) =>
    new ApiError(ErrorCode.AUTH_TOKEN_EXPIRED, message),

  /** 認証エラー: 未認証 */
  unauthorized: (message?: string) =>
    new ApiError(ErrorCode.AUTH_UNAUTHORIZED, message),

  /** 権限エラー: アクセス禁止 */
  forbiddenAccess: (message?: string) =>
    new ApiError(ErrorCode.FORBIDDEN_ACCESS, message),

  /** 権限エラー: 編集禁止 */
  forbiddenEdit: (message?: string) =>
    new ApiError(ErrorCode.FORBIDDEN_EDIT, message),

  /** 権限エラー: 削除禁止 */
  forbiddenDelete: (message?: string) =>
    new ApiError(ErrorCode.FORBIDDEN_DELETE, message),

  /** バリデーションエラー */
  validationError: (message?: string, details?: unknown[]) =>
    new ApiError(ErrorCode.VALIDATION_ERROR, message, details),

  /** 重複エラー */
  duplicateEntry: (message?: string) =>
    new ApiError(ErrorCode.DUPLICATE_ENTRY, message),

  /** リソース未検出エラー */
  notFound: (message?: string) =>
    new ApiError(ErrorCode.RESOURCE_NOT_FOUND, message),

  /** リソース使用中エラー */
  resourceInUse: (message?: string) =>
    new ApiError(ErrorCode.RESOURCE_IN_USE, message),

  /** 内部エラー */
  internalError: (message?: string) =>
    new ApiError(ErrorCode.INTERNAL_ERROR, message),

  /** サービス利用不可エラー */
  serviceUnavailable: (message?: string) =>
    new ApiError(ErrorCode.SERVICE_UNAVAILABLE, message),
};
