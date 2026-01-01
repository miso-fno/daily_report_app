/**
 * 訪問記録API - 更新・削除
 *
 * PUT /api/v1/visits/{id} - 更新
 * DELETE /api/v1/visits/{id} - 削除
 */

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
import { UpdateVisitSchema, VisitIdParamSchema } from "@/lib/api/schemas/visit";
import { parseAndValidateBody, validatePathParams } from "@/lib/api/validation";
import { prisma } from "@/lib/prisma";

import type { UpdateVisitResponse } from "@/lib/api/schemas/visit";

/**
 * 訪問時間文字列をDate型に変換
 * HH:MM形式の文字列を1970-01-01の時間として変換
 */
function parseVisitTime(timeStr: string | null | undefined): Date | null {
  if (!timeStr) {
    return null;
  }

  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date(1970, 0, 1, hours, minutes, 0);
  return date;
}

const handlers = createHandlers<{ id: string }>({
  /**
   * PUT /api/v1/visits/{id}
   * 訪問記録を更新
   */
  PUT: async (request, context) => {
    // 認証チェック
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // パスパラメータのバリデーション
    const params = await context.params;
    const { id: visitId } = validatePathParams(params, VisitIdParamSchema);

    // リクエストボディのバリデーション
    const body = await parseAndValidateBody(request, UpdateVisitSchema);

    // 訪問記録の存在チェック（日報情報も取得）
    const visitRecord = await prisma.visitRecord.findUnique({
      where: { id: visitId },
      include: {
        dailyReport: {
          select: { salesPersonId: true, status: true },
        },
      },
    });

    if (!visitRecord) {
      return notFoundResponse("指定された訪問記録が見つかりません");
    }

    // 本人のみ編集可能
    if (visitRecord.dailyReport.salesPersonId !== session.user.id) {
      return forbiddenResponse("この訪問記録を編集する権限がありません");
    }

    // 確認済の日報は編集不可
    if (visitRecord.dailyReport.status === "confirmed") {
      return errorResponse(
        ErrorCode.FORBIDDEN_EDIT,
        "確認済の日報の訪問記録は編集できません"
      );
    }

    // 顧客の存在チェック
    const customer = await prisma.customer.findUnique({
      where: { id: body.customer_id },
      select: { id: true, customerName: true },
    });

    if (!customer) {
      throw createApiError.validationError("指定された顧客が存在しません", [
        {
          field: "customer_id",
          message: `顧客ID ${body.customer_id} が存在しません`,
        },
      ]);
    }

    // 訪問記録を更新
    const updatedVisitRecord = await prisma.visitRecord.update({
      where: { id: visitId },
      data: {
        customerId: body.customer_id,
        visitTime: parseVisitTime(body.visit_time),
        visitPurpose: body.visit_purpose ?? null,
        visitContent: body.visit_content,
        visitResult: body.visit_result ?? null,
      },
    });

    const response: UpdateVisitResponse = {
      visit_id: updatedVisitRecord.id,
      report_id: updatedVisitRecord.reportId,
      customer_id: updatedVisitRecord.customerId,
      customer_name: customer.customerName,
      updated_at: updatedVisitRecord.updatedAt.toISOString(),
    };

    return successResponse(response, { message: "訪問記録を更新しました" });
  },

  /**
   * DELETE /api/v1/visits/{id}
   * 訪問記録を削除
   */
  DELETE: async (request, context) => {
    // 認証チェック
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // パスパラメータのバリデーション
    const params = await context.params;
    const { id: visitId } = validatePathParams(params, VisitIdParamSchema);

    // 訪問記録の存在チェック（日報情報も取得）
    const visitRecord = await prisma.visitRecord.findUnique({
      where: { id: visitId },
      include: {
        dailyReport: {
          select: { salesPersonId: true, status: true },
        },
      },
    });

    if (!visitRecord) {
      return notFoundResponse("指定された訪問記録が見つかりません");
    }

    // 本人のみ削除可能
    if (visitRecord.dailyReport.salesPersonId !== session.user.id) {
      return forbiddenResponse("この訪問記録を削除する権限がありません");
    }

    // 確認済の日報は編集不可
    if (visitRecord.dailyReport.status === "confirmed") {
      return errorResponse(
        ErrorCode.FORBIDDEN_DELETE,
        "確認済の日報の訪問記録は削除できません"
      );
    }

    // 訪問記録を削除
    await prisma.visitRecord.delete({
      where: { id: visitId },
    });

    return successResponse(
      { visit_id: visitId },
      { message: "訪問記録を削除しました" }
    );
  },
});

export const PUT = handlers.PUT!;
export const DELETE = handlers.DELETE!;
