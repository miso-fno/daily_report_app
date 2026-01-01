/**
 * 営業担当者マスタAPI関数
 */

import { SALES_PERSONS_API_BASE } from "./constants";

import type {
  ApiErrorResponse,
  SalesPersonDeleteResponse,
  SalesPersonDetailResponse,
  SalesPersonMutationResponse,
  SalesPersonsListResponse,
  SearchParams,
} from "./types";

/**
 * 営業担当者一覧を取得
 */
export async function fetchSalesPersons(
  params: SearchParams = {}
): Promise<SalesPersonsListResponse> {
  const searchParams = new URLSearchParams();

  if (params.name) {
    searchParams.set("name", params.name);
  }
  if (params.department) {
    searchParams.set("department", params.department);
  }
  if (params.page) {
    searchParams.set("page", params.page.toString());
  }
  if (params.per_page) {
    searchParams.set("per_page", params.per_page.toString());
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `${SALES_PERSONS_API_BASE}?${queryString}`
    : SALES_PERSONS_API_BASE;

  const response = await fetch(url, {
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

  return response.json();
}

/**
 * 上長一覧を取得（is_manager=trueのユーザー）
 */
export async function fetchManagers(): Promise<SalesPersonsListResponse> {
  const response = await fetch(
    `${SALES_PERSONS_API_BASE}?is_manager=true&per_page=100`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = (await response.json()) as ApiErrorResponse;
    throw new Error(errorData.error?.message || "上長一覧の取得に失敗しました");
  }

  return response.json();
}

/**
 * 営業担当者詳細を取得
 */
export async function fetchSalesPerson(
  id: number
): Promise<SalesPersonDetailResponse> {
  const response = await fetch(`${SALES_PERSONS_API_BASE}/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = (await response.json()) as ApiErrorResponse;
    throw new Error(
      errorData.error?.message || "営業担当者の取得に失敗しました"
    );
  }

  return response.json();
}

/**
 * 営業担当者を作成
 */
export async function createSalesPerson(data: {
  name: string;
  email: string;
  password: string;
  department: string;
  manager_id: number | null;
  is_manager: boolean;
}): Promise<SalesPersonMutationResponse> {
  const response = await fetch(SALES_PERSONS_API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as ApiErrorResponse;
    throw new Error(
      errorData.error?.message || "営業担当者の作成に失敗しました"
    );
  }

  return response.json();
}

/**
 * 営業担当者を更新
 */
export async function updateSalesPerson(
  id: number,
  data: {
    name: string;
    email: string;
    password?: string;
    department: string;
    manager_id: number | null;
    is_manager: boolean;
  }
): Promise<SalesPersonMutationResponse> {
  const response = await fetch(`${SALES_PERSONS_API_BASE}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as ApiErrorResponse;
    throw new Error(
      errorData.error?.message || "営業担当者の更新に失敗しました"
    );
  }

  return response.json();
}

/**
 * 営業担当者を削除
 */
export async function deleteSalesPerson(
  id: number
): Promise<SalesPersonDeleteResponse> {
  const response = await fetch(`${SALES_PERSONS_API_BASE}/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = (await response.json()) as ApiErrorResponse;
    throw new Error(
      errorData.error?.message || "営業担当者の削除に失敗しました"
    );
  }

  return response.json();
}
