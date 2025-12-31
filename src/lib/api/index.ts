/**
 * API共通基盤
 *
 * 統一されたAPIレスポンス形式、エラーハンドリング、バリデーション機能を提供します
 */

// エラー関連
export {
  ErrorCode,
  ErrorCodeToHttpStatus,
  ErrorCodeDefaultMessage,
  ApiError,
  createApiError,
  type ErrorCodeType,
} from "./errors";

// レスポンス関連
export {
  successResponse,
  createdResponse,
  paginatedResponse,
  errorResponse,
  apiErrorResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  internalErrorResponse,
  HttpStatus,
  type SuccessResponse,
  type PaginationInfo,
  type PaginatedData,
  type PaginatedSuccessResponse,
  type ErrorDetail,
  type ErrorResponse,
  type ApiResponse,
  type HttpStatusType,
} from "./response";

// バリデーション関連
export {
  zodErrorToDetails,
  validateWithSchema,
  parseAndValidateBody,
  searchParamsToObject,
  validateQueryParams,
  validatePathParams,
  CommonSchemas,
  PaginationQuerySchema,
  type PaginationQuery,
} from "./validation";

// ページネーション関連
export {
  calculatePagination,
  calculateOffset,
  getPaginationParams,
  normalizePaginationParams,
  DEFAULT_PAGINATION,
  type PaginationOptions,
} from "./pagination";

// ハンドラー関連
export {
  withHandler,
  withAuthHandler,
  createHandlers,
  type RouteContext,
  type RouteHandler,
  type HandlerOptions,
} from "./handler";
