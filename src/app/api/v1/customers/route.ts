/**
 * 顧客マスタAPI - 一覧取得・新規作成
 *
 * GET /api/v1/customers - 顧客一覧取得（ページネーション対応）
 * POST /api/v1/customers - 顧客新規作成
 */

import { ErrorCode } from "@/lib/api/errors";
import {
  paginatedResponse,
  createdResponse,
  errorResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import {
  customerListQuerySchema,
  createCustomerSchema,
} from "@/lib/validations/customer";

import type { PaginationInfo, ErrorDetail } from "@/lib/api/response";
import type { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";

/**
 * Prisma CustomerモデルをAPIレスポンス形式に変換
 */
interface CustomerResponse {
  customer_id: number;
  customer_name: string;
  address: string | null;
  phone: string | null;
  contact_person: string | null;
  created_at: string;
  updated_at: string;
}

function toCustomerResponse(customer: {
  id: number;
  customerName: string;
  address: string | null;
  phone: string | null;
  contactPerson: string | null;
  createdAt: Date;
  updatedAt: Date;
}): CustomerResponse {
  return {
    customer_id: customer.id,
    customer_name: customer.customerName,
    address: customer.address,
    phone: customer.phone,
    contact_person: customer.contactPerson,
    created_at: customer.createdAt.toISOString(),
    updated_at: customer.updatedAt.toISOString(),
  };
}

/**
 * GET /api/v1/customers
 * 顧客一覧取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // クエリパラメータのパース・バリデーション
    const queryResult = customerListQuerySchema.safeParse({
      customer_name: searchParams.get("customer_name") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      per_page: searchParams.get("per_page") ?? undefined,
      sort: searchParams.get("sort") ?? undefined,
      order: searchParams.get("order") ?? undefined,
    });

    if (!queryResult.success) {
      const details: ErrorDetail[] = queryResult.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return validationErrorResponse(details, "クエリパラメータが不正です");
    }

    const { customer_name, page, per_page, sort, order } = queryResult.data;

    // 検索条件の構築
    const where: Prisma.CustomerWhereInput = {};
    if (customer_name) {
      where.customerName = {
        contains: customer_name,
        mode: "insensitive",
      };
    }

    // ソート条件の構築
    const orderBy: Prisma.CustomerOrderByWithRelationInput = {};
    if (sort === "customer_name") {
      orderBy.customerName = order;
    } else {
      orderBy.createdAt = order;
    }

    // 総件数を取得
    const total = await prisma.customer.count({ where });

    // ページネーション計算
    const skip = (page - 1) * per_page;
    const lastPage = Math.ceil(total / per_page);

    // 顧客データを取得
    const customers = await prisma.customer.findMany({
      where,
      orderBy,
      skip,
      take: per_page,
    });

    // レスポンス形式に変換
    const items = customers.map(toCustomerResponse);

    // ページネーション情報
    const pagination: PaginationInfo = {
      total,
      per_page,
      current_page: page,
      last_page: lastPage,
      from: total > 0 ? skip + 1 : 0,
      to: Math.min(skip + per_page, total),
    };

    return paginatedResponse(items, pagination);
  } catch (error) {
    console.error("顧客一覧取得エラー:", error);
    return internalErrorResponse("顧客一覧の取得に失敗しました");
  }
}

/**
 * POST /api/v1/customers
 * 顧客新規作成
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディのパース
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return validationErrorResponse(
        [{ message: "リクエストボディのJSONが不正です" }],
        "リクエスト形式エラー"
      );
    }

    // バリデーション
    const validationResult = createCustomerSchema.safeParse(body);

    if (!validationResult.success) {
      const details: ErrorDetail[] = validationResult.error.issues.map(
        (issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })
      );
      return validationErrorResponse(details);
    }

    const { customer_name, address, phone, contact_person } =
      validationResult.data;

    // 顧客名の重複チェック
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        customerName: customer_name,
      },
    });

    if (existingCustomer) {
      return errorResponse(
        ErrorCode.DUPLICATE_ENTRY,
        "この顧客名は既に登録されています"
      );
    }

    // 顧客を作成
    const customer = await prisma.customer.create({
      data: {
        customerName: customer_name,
        address,
        phone,
        contactPerson: contact_person,
      },
    });

    return createdResponse(toCustomerResponse(customer), "顧客を作成しました");
  } catch (error) {
    console.error("顧客作成エラー:", error);
    return internalErrorResponse("顧客の作成に失敗しました");
  }
}
