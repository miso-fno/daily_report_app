/**
 * 日報API関数
 */

import { REPORTS_API_BASE } from "./constants";

import type {
  ApiErrorResponse,
  CreateCommentResponse,
  CreateReportRequest,
  CreateReportResponse,
  CustomersOptionsResponse,
  DeleteCommentResponse,
  ReportDetailResponse,
  ReportsListResponse,
  ReportsSearchParams,
  SalesPersonsOptionsResponse,
  UpdateReportResponse,
  UpdateStatusResponse,
} from "./types";

/**
 * 日報一覧を取得
 */
export async function fetchReports(
  params: ReportsSearchParams = {}
): Promise<ReportsListResponse> {
  const searchParams = new URLSearchParams();

  if (params.date_from) {
    searchParams.set("date_from", params.date_from);
  }
  if (params.date_to) {
    searchParams.set("date_to", params.date_to);
  }
  if (params.sales_person_id) {
    searchParams.set("sales_person_id", params.sales_person_id.toString());
  }
  if (params.status) {
    searchParams.set("status", params.status);
  }
  if (params.page) {
    searchParams.set("page", params.page.toString());
  }
  if (params.per_page) {
    searchParams.set("per_page", params.per_page.toString());
  }
  if (params.sort) {
    searchParams.set("sort", params.sort);
  }
  if (params.order) {
    searchParams.set("order", params.order);
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `${REPORTS_API_BASE}?${queryString}`
    : REPORTS_API_BASE;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = (await response.json()) as ApiErrorResponse;
    throw new Error(errorData.error?.message || "日報一覧の取得に失敗しました");
  }

  return response.json();
}

/**
 * 選択可能な営業担当者一覧を取得
 * 一般ユーザーは自分のみ、上長は自分と部下を取得
 */
export async function fetchSelectableSalesPersons(): Promise<SalesPersonsOptionsResponse> {
  const response = await fetch("/api/v1/sales-persons?per_page=100", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = (await response.json()) as ApiErrorResponse;
    throw new Error(
      errorData.error?.message || "営業担当者一覧の取得に失敗しました"
    );
  }

  const data = await response.json();
  return {
    success: true,
    data: {
      items: data.data.items.map(
        (item: { sales_person_id: number; name: string }) => ({
          sales_person_id: item.sales_person_id,
          name: item.name,
        })
      ),
    },
  };
}

/**
 * 日報詳細を取得
 */
export async function fetchReportById(
  reportId: number
): Promise<ReportDetailResponse> {
  const response = await fetch(`${REPORTS_API_BASE}/${reportId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = (await response.json()) as ApiErrorResponse;
    throw new Error(errorData.error?.message || "日報の取得に失敗しました");
  }

  return response.json();
}

/**
 * 日報を作成
 */
export async function createReport(
  data: CreateReportRequest
): Promise<CreateReportResponse> {
  const response = await fetch(REPORTS_API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as ApiErrorResponse;
    throw new Error(errorData.error?.message || "日報の作成に失敗しました");
  }

  return response.json();
}

/**
 * 日報を更新
 */
export async function updateReport(
  reportId: number,
  data: CreateReportRequest
): Promise<UpdateReportResponse> {
  const response = await fetch(`${REPORTS_API_BASE}/${reportId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as ApiErrorResponse;
    throw new Error(errorData.error?.message || "日報の更新に失敗しました");
  }

  return response.json();
}

/**
 * 顧客一覧を取得（選択肢用）
 */
export async function fetchCustomersForSelect(): Promise<CustomersOptionsResponse> {
  const response = await fetch("/api/v1/customers?per_page=100", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = (await response.json()) as ApiErrorResponse;
    throw new Error(errorData.error?.message || "顧客一覧の取得に失敗しました");
  }

  return response.json();
}

/**
 * 日報のステータスを更新
 */
export async function updateReportStatus(
  reportId: number,
  status: "draft" | "submitted" | "confirmed"
): Promise<UpdateStatusResponse> {
  const response = await fetch(`${REPORTS_API_BASE}/${reportId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as ApiErrorResponse;
    throw new Error(
      errorData.error?.message || "ステータスの更新に失敗しました"
    );
  }

  return response.json();
}

/**
 * コメントを作成
 */
export async function createComment(
  reportId: number,
  commentText: string
): Promise<CreateCommentResponse> {
  const response = await fetch(`${REPORTS_API_BASE}/${reportId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ comment_text: commentText }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as ApiErrorResponse;
    throw new Error(errorData.error?.message || "コメントの投稿に失敗しました");
  }

  return response.json();
}

/**
 * コメントを削除
 */
export async function deleteComment(
  commentId: number
): Promise<DeleteCommentResponse> {
  const response = await fetch(`/api/v1/comments/${commentId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = (await response.json()) as ApiErrorResponse;
    throw new Error(errorData.error?.message || "コメントの削除に失敗しました");
  }

  return response.json();
}
