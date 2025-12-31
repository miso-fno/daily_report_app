/**
 * APIレスポンスヘルパー
 *
 * 統一されたAPIレスポンス形式を提供します
 */

import { NextResponse } from "next/server";

import { ErrorCode, ErrorCodeToHttpStatus } from "./errors";

import type { ApiError, ErrorCodeType } from "./errors";

/**
 * 成功レスポンスの型定義
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

/**
 * ページネーション情報の型定義
 */
export interface PaginationInfo {
  /** 総アイテム数 */
  total: number;
  /** 1ページあたりのアイテム数 */
  per_page: number;
  /** 現在のページ番号 (1始まり) */
  current_page: number;
  /** 最後のページ番号 */
  last_page: number;
  /** 現在のページの開始位置 (1始まり) */
  from: number;
  /** 現在のページの終了位置 */
  to: number;
}

/**
 * ページネーション付きレスポンスデータの型定義
 */
export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationInfo;
}

/**
 * ページネーション付き成功レスポンスの型定義
 */
export interface PaginatedSuccessResponse<T> {
  success: true;
  data: PaginatedData<T>;
}

/**
 * エラーレスポンスの詳細情報
 */
export interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

/**
 * エラーレスポンスの型定義
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCodeType;
    message: string;
    details?: ErrorDetail[];
  };
}

/**
 * APIレスポンスの統一型
 */
export type ApiResponse<T> =
  | SuccessResponse<T>
  | PaginatedSuccessResponse<T>
  | ErrorResponse;

/**
 * HTTPステータスコード定義
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatusType = (typeof HttpStatus)[keyof typeof HttpStatus];

/**
 * 成功レスポンスを生成
 *
 * @param data レスポンスデータ
 * @param options オプション（message, status）
 * @returns NextResponse
 */
export function successResponse<T>(
  data: T,
  options?: {
    message?: string;
    status?: number;
  }
): NextResponse<SuccessResponse<T>> {
  const { message, status = HttpStatus.OK } = options ?? {};

  const responseBody: SuccessResponse<T> = {
    success: true,
    data,
  };

  if (message) {
    responseBody.message = message;
  }

  return NextResponse.json(responseBody, { status });
}

/**
 * 作成成功レスポンスを生成（201 Created）
 *
 * @param data 作成されたリソースデータ
 * @param message オプションのメッセージ
 * @returns NextResponse
 */
export function createdResponse<T>(
  data: T,
  message?: string
): NextResponse<SuccessResponse<T>> {
  const options: { message?: string; status: number } = {
    status: HttpStatus.CREATED,
  };
  if (message !== undefined) {
    options.message = message;
  }
  return successResponse(data, options);
}

/**
 * ページネーション付き成功レスポンスを生成
 *
 * @param items アイテムの配列
 * @param pagination ページネーション情報
 * @returns NextResponse
 */
export function paginatedResponse<T>(
  items: T[],
  pagination: PaginationInfo
): NextResponse<PaginatedSuccessResponse<T>> {
  const responseBody: PaginatedSuccessResponse<T> = {
    success: true,
    data: {
      items,
      pagination,
    },
  };

  return NextResponse.json(responseBody, { status: HttpStatus.OK });
}

/**
 * エラーレスポンスを生成
 *
 * @param code エラーコード
 * @param message エラーメッセージ
 * @param details エラー詳細
 * @param status HTTPステータスコード（省略時はエラーコードから自動決定）
 * @returns NextResponse
 */
export function errorResponse(
  code: ErrorCodeType,
  message: string,
  details?: ErrorDetail[],
  status?: number
): NextResponse<ErrorResponse> {
  const responseBody: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details && details.length > 0) {
    responseBody.error.details = details;
  }

  const httpStatus = status ?? ErrorCodeToHttpStatus[code];

  return NextResponse.json(responseBody, { status: httpStatus });
}

/**
 * ApiErrorからエラーレスポンスを生成
 *
 * @param error ApiErrorインスタンス
 * @returns NextResponse
 */
export function apiErrorResponse(error: ApiError): NextResponse<ErrorResponse> {
  const details: ErrorDetail[] | undefined = error.details?.map((detail) => {
    if (typeof detail === "string") {
      return { message: detail };
    }
    if (typeof detail === "object" && detail !== null) {
      const obj = detail as Record<string, unknown>;
      const result: ErrorDetail = {
        message: typeof obj.message === "string" ? obj.message : String(detail),
      };
      if (typeof obj.field === "string") {
        result.field = obj.field;
      }
      if (typeof obj.code === "string") {
        result.code = obj.code;
      }
      return result;
    }
    return { message: String(detail) };
  });

  return errorResponse(error.code, error.message, details, error.statusCode);
}

/**
 * バリデーションエラーレスポンスを生成
 *
 * @param details バリデーションエラーの詳細
 * @param message オプションのエラーメッセージ
 * @returns NextResponse
 */
export function validationErrorResponse(
  details: ErrorDetail[],
  message = "入力内容に誤りがあります"
): NextResponse<ErrorResponse> {
  return errorResponse(
    ErrorCode.VALIDATION_ERROR,
    message,
    details,
    HttpStatus.UNPROCESSABLE_ENTITY
  );
}

/**
 * 認証エラーレスポンスを生成
 *
 * @param message オプションのエラーメッセージ
 * @returns NextResponse
 */
export function unauthorizedResponse(
  message = "認証が必要です"
): NextResponse<ErrorResponse> {
  return errorResponse(
    ErrorCode.AUTH_UNAUTHORIZED,
    message,
    undefined,
    HttpStatus.UNAUTHORIZED
  );
}

/**
 * 権限エラーレスポンスを生成
 *
 * @param message オプションのエラーメッセージ
 * @returns NextResponse
 */
export function forbiddenResponse(
  message = "このリソースへのアクセス権限がありません"
): NextResponse<ErrorResponse> {
  return errorResponse(
    ErrorCode.FORBIDDEN_ACCESS,
    message,
    undefined,
    HttpStatus.FORBIDDEN
  );
}

/**
 * リソース未検出エラーレスポンスを生成
 *
 * @param message オプションのエラーメッセージ
 * @returns NextResponse
 */
export function notFoundResponse(
  message = "指定されたリソースが見つかりません"
): NextResponse<ErrorResponse> {
  return errorResponse(
    ErrorCode.RESOURCE_NOT_FOUND,
    message,
    undefined,
    HttpStatus.NOT_FOUND
  );
}

/**
 * 内部エラーレスポンスを生成
 *
 * @param message オプションのエラーメッセージ
 * @returns NextResponse
 */
export function internalErrorResponse(
  message = "サーバー内部エラーが発生しました"
): NextResponse<ErrorResponse> {
  return errorResponse(
    ErrorCode.INTERNAL_ERROR,
    message,
    undefined,
    HttpStatus.INTERNAL_SERVER_ERROR
  );
}
