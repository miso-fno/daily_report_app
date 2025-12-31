/**
 * 営業担当者マスタAPI - 詳細取得・更新・削除
 *
 * GET /api/v1/sales-persons/{id} - 詳細取得
 * PUT /api/v1/sales-persons/{id} - 更新
 * DELETE /api/v1/sales-persons/{id} - 削除
 */

import bcrypt from "bcryptjs";

import { auth } from "@/auth";
import { createApiError, ErrorCode } from "@/lib/api/errors";
import { createHandlers } from "@/lib/api/handler";
import {
  errorResponse,
  forbiddenResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api/response";
import {
  SalesPersonIdParamSchema,
  UpdateSalesPersonSchema,
} from "@/lib/api/schemas/sales-person";
import { parseAndValidateBody, validatePathParams } from "@/lib/api/validation";
import { prisma } from "@/lib/prisma";

import type { SalesPersonResponse } from "@/lib/api/schemas/sales-person";

/**
 * Prismaの結果を営業担当者レスポンス形式に変換
 */
function toSalesPersonResponse(salesPerson: {
  id: number;
  name: string;
  email: string;
  department: string;
  managerId: number | null;
  isManager: boolean;
  createdAt: Date;
  updatedAt: Date;
  manager: { name: string } | null;
}): SalesPersonResponse {
  return {
    sales_person_id: salesPerson.id,
    name: salesPerson.name,
    email: salesPerson.email,
    department: salesPerson.department,
    manager_id: salesPerson.managerId,
    manager_name: salesPerson.manager?.name ?? null,
    is_manager: salesPerson.isManager,
    created_at: salesPerson.createdAt.toISOString(),
    updated_at: salesPerson.updatedAt.toISOString(),
  };
}

const handlers = createHandlers<{ id: string }>({
  /**
   * GET /api/v1/sales-persons/{id}
   * 営業担当者の詳細を取得
   */
  GET: async (request, context) => {
    // 認証チェック
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // 管理者権限チェック
    if (!session.user.isManager) {
      return forbiddenResponse("営業担当者マスタへのアクセス権限がありません");
    }

    // パスパラメータのバリデーション
    const params = await context.params;
    const { id } = validatePathParams(params, SalesPersonIdParamSchema);

    // 営業担当者を取得
    const salesPerson = await prisma.salesPerson.findUnique({
      where: { id },
      include: {
        manager: {
          select: { name: true },
        },
      },
    });

    if (!salesPerson) {
      return notFoundResponse("指定された営業担当者が見つかりません");
    }

    return successResponse(toSalesPersonResponse(salesPerson));
  },

  /**
   * PUT /api/v1/sales-persons/{id}
   * 営業担当者を更新
   */
  PUT: async (request, context) => {
    // 認証チェック
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // 管理者権限チェック
    if (!session.user.isManager) {
      return forbiddenResponse("営業担当者の更新権限がありません");
    }

    // パスパラメータのバリデーション
    const params = await context.params;
    const { id } = validatePathParams(params, SalesPersonIdParamSchema);

    // リクエストボディのバリデーション
    const body = await parseAndValidateBody(request, UpdateSalesPersonSchema);

    // 対象の営業担当者が存在するかチェック
    const existingSalesPerson = await prisma.salesPerson.findUnique({
      where: { id },
    });

    if (!existingSalesPerson) {
      return notFoundResponse("指定された営業担当者が見つかりません");
    }

    // メールアドレスの重複チェック（自分以外）
    if (body.email !== existingSalesPerson.email) {
      const duplicateEmail = await prisma.salesPerson.findUnique({
        where: { email: body.email },
      });

      if (duplicateEmail) {
        throw createApiError.duplicateEntry(
          "このメールアドレスは既に登録されています"
        );
      }
    }

    // 上長IDの存在チェック（指定されている場合）
    if (body.manager_id) {
      // 自分自身を上長に設定できない
      if (body.manager_id === id) {
        throw createApiError.validationError(
          "自分自身を上長に設定することはできません",
          [
            {
              field: "manager_id",
              message: "自分自身を上長に設定することはできません",
            },
          ]
        );
      }

      const manager = await prisma.salesPerson.findUnique({
        where: { id: body.manager_id },
      });

      if (!manager) {
        throw createApiError.validationError("指定された上長が存在しません", [
          { field: "manager_id", message: "指定された上長が存在しません" },
        ]);
      }
    }

    // 更新データを構築
    const updateData: {
      name: string;
      email: string;
      password?: string;
      department: string;
      managerId: number | null;
      isManager: boolean;
    } = {
      name: body.name,
      email: body.email,
      department: body.department,
      managerId: body.manager_id ?? null,
      isManager: body.is_manager,
    };

    // パスワードが指定されている場合はハッシュ化
    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    // 営業担当者を更新
    const salesPerson = await prisma.salesPerson.update({
      where: { id },
      data: updateData,
      include: {
        manager: {
          select: { name: true },
        },
      },
    });

    return successResponse(toSalesPersonResponse(salesPerson), {
      message: "営業担当者を更新しました",
    });
  },

  /**
   * DELETE /api/v1/sales-persons/{id}
   * 営業担当者を削除
   */
  DELETE: async (request, context) => {
    // 認証チェック
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // 管理者権限チェック
    if (!session.user.isManager) {
      return forbiddenResponse("営業担当者の削除権限がありません");
    }

    // パスパラメータのバリデーション
    const params = await context.params;
    const { id } = validatePathParams(params, SalesPersonIdParamSchema);

    // 対象の営業担当者が存在するかチェック
    const existingSalesPerson = await prisma.salesPerson.findUnique({
      where: { id },
    });

    if (!existingSalesPerson) {
      return notFoundResponse("指定された営業担当者が見つかりません");
    }

    // 自分自身を削除しようとしていないかチェック
    if (id === session.user.id) {
      return forbiddenResponse("自分自身を削除することはできません");
    }

    // 日報で使用されているかチェック
    const dailyReportCount = await prisma.dailyReport.count({
      where: { salesPersonId: id },
    });

    if (dailyReportCount > 0) {
      return errorResponse(
        ErrorCode.RESOURCE_IN_USE,
        "この営業担当者は日報で使用されているため削除できません"
      );
    }

    // 部下がいるかチェック
    const subordinateCount = await prisma.salesPerson.count({
      where: { managerId: id },
    });

    if (subordinateCount > 0) {
      return errorResponse(
        ErrorCode.RESOURCE_IN_USE,
        "この営業担当者は他の担当者の上長に設定されているため削除できません"
      );
    }

    // 営業担当者を削除
    await prisma.salesPerson.delete({
      where: { id },
    });

    return successResponse(
      { sales_person_id: id },
      { message: "営業担当者を削除しました" }
    );
  },
});

export const GET = handlers.GET!;
export const PUT = handlers.PUT!;
export const DELETE = handlers.DELETE!;
