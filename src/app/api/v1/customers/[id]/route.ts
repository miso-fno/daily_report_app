/**
 * 顧客マスタAPI - 詳細取得・更新・削除
 *
 * GET /api/v1/customers/{id} - 顧客詳細取得
 * PUT /api/v1/customers/{id} - 顧客更新
 * DELETE /api/v1/customers/{id} - 顧客削除
 */

import { ErrorCode } from "@/lib/api/errors";
import {
  successResponse,
  errorResponse,
  notFoundResponse,
  validationErrorResponse,
  internalErrorResponse,
} from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import {
  customerIdSchema,
  updateCustomerSchema,
} from "@/lib/validations/customer";

import type { ErrorDetail } from "@/lib/api/response";
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
 * パスパラメータからIDを取得・検証
 */
function parseCustomerId(params: {
  id: string;
}):
  | { success: true; id: number }
  | { success: false; error: ReturnType<typeof validationErrorResponse> } {
  const result = customerIdSchema.safeParse({ id: params.id });
  if (!result.success) {
    const details: ErrorDetail[] = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return {
      success: false,
      error: validationErrorResponse(details, "顧客IDが不正です"),
    };
  }
  return { success: true, id: result.data.id };
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/customers/{id}
 * 顧客詳細取得
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const parseResult = parseCustomerId(resolvedParams);
    if (!parseResult.success) {
      return parseResult.error;
    }

    const customer = await prisma.customer.findUnique({
      where: { id: parseResult.id },
    });

    if (!customer) {
      return notFoundResponse("指定された顧客が見つかりません");
    }

    return successResponse(toCustomerResponse(customer));
  } catch (error) {
    console.error("顧客詳細取得エラー:", error);
    return internalErrorResponse("顧客情報の取得に失敗しました");
  }
}

/**
 * PUT /api/v1/customers/{id}
 * 顧客更新
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const parseResult = parseCustomerId(resolvedParams);
    if (!parseResult.success) {
      return parseResult.error;
    }

    const customerId = parseResult.id;

    // 顧客の存在確認
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!existingCustomer) {
      return notFoundResponse("指定された顧客が見つかりません");
    }

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
    const validationResult = updateCustomerSchema.safeParse(body);

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

    // 顧客名の重複チェック（自分自身を除く）
    const duplicateCustomer = await prisma.customer.findFirst({
      where: {
        customerName: customer_name,
        id: { not: customerId },
      },
    });

    if (duplicateCustomer) {
      return errorResponse(
        ErrorCode.DUPLICATE_ENTRY,
        "この顧客名は既に登録されています"
      );
    }

    // 顧客を更新
    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: {
        customerName: customer_name,
        address,
        phone,
        contactPerson: contact_person,
      },
    });

    return successResponse(toCustomerResponse(customer), {
      message: "顧客情報を更新しました",
    });
  } catch (error) {
    console.error("顧客更新エラー:", error);
    return internalErrorResponse("顧客情報の更新に失敗しました");
  }
}

/**
 * DELETE /api/v1/customers/{id}
 * 顧客削除
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const parseResult = parseCustomerId(resolvedParams);
    if (!parseResult.success) {
      return parseResult.error;
    }

    const customerId = parseResult.id;

    // 顧客の存在確認
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!existingCustomer) {
      return notFoundResponse("指定された顧客が見つかりません");
    }

    // 訪問記録で使用されているか確認
    const visitRecordCount = await prisma.visitRecord.count({
      where: { customerId: customerId },
    });

    if (visitRecordCount > 0) {
      return errorResponse(
        ErrorCode.RESOURCE_IN_USE,
        "この顧客は訪問記録で使用されているため削除できません"
      );
    }

    // 顧客を削除
    await prisma.customer.delete({
      where: { id: customerId },
    });

    return successResponse(null, { message: "顧客を削除しました" });
  } catch (error) {
    console.error("顧客削除エラー:", error);
    return internalErrorResponse("顧客の削除に失敗しました");
  }
}
