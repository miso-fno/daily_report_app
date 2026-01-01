/**
 * 訪問記録API - 一覧取得・新規作成
 *
 * GET /api/v1/reports/{reportId}/visits - 一覧取得
 * POST /api/v1/reports/{reportId}/visits - 新規作成
 */

import { auth } from "@/auth";
import { createApiError, ErrorCode } from "@/lib/api/errors";
import { createHandlers } from "@/lib/api/handler";
import {
  createdResponse,
  errorResponse,
  forbiddenResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api/response";
import {
  CreateVisitSchema,
  ReportIdParamSchema,
} from "@/lib/api/schemas/visit";
import { parseAndValidateBody, validatePathParams } from "@/lib/api/validation";
import { prisma } from "@/lib/prisma";

import type {
  CreateVisitResponse,
  VisitRecordResponse,
} from "@/lib/api/schemas/visit";

/**
 * 訪問時間をHH:MM形式に変換
 */
function formatVisitTime(date: Date | null): string | null {
  if (!date) {
    return null;
  }
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

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

/**
 * ログインユーザーが日報にアクセス可能かチェック
 * @returns true: アクセス可能, false: アクセス不可
 */
async function canAccessReport(
  userId: number,
  isManager: boolean,
  reportOwnerId: number
): Promise<boolean> {
  // 自分の日報なら常にアクセス可能
  if (userId === reportOwnerId) {
    return true;
  }

  // 上長でない場合はアクセス不可
  if (!isManager) {
    return false;
  }

  // 上長の場合、部下の日報かどうかチェック
  const subordinate = await prisma.salesPerson.findFirst({
    where: {
      id: reportOwnerId,
      managerId: userId,
    },
  });

  return subordinate !== null;
}

const handlers = createHandlers<{ id: string }>({
  /**
   * GET /api/v1/reports/{reportId}/visits
   * 指定した日報の訪問記録一覧を取得
   */
  GET: async (request, context) => {
    // 認証チェック
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // パスパラメータのバリデーション
    const params = await context.params;
    const { id: reportId } = validatePathParams(params, ReportIdParamSchema);

    // 日報の存在チェック
    const report = await prisma.dailyReport.findUnique({
      where: { id: reportId },
      select: { salesPersonId: true },
    });

    if (!report) {
      return notFoundResponse("指定された日報が見つかりません");
    }

    // アクセス権限チェック
    const canAccess = await canAccessReport(
      session.user.id,
      session.user.isManager,
      report.salesPersonId
    );

    if (!canAccess) {
      return forbiddenResponse("この日報の訪問記録を閲覧する権限がありません");
    }

    // 訪問記録を取得
    const visitRecords = await prisma.visitRecord.findMany({
      where: { reportId },
      include: {
        customer: {
          select: { customerName: true },
        },
      },
      orderBy: { visitTime: "asc" },
    });

    const items: VisitRecordResponse[] = visitRecords.map((v) => ({
      visit_id: v.id,
      customer_id: v.customerId,
      customer_name: v.customer.customerName,
      visit_time: formatVisitTime(v.visitTime),
      visit_purpose: v.visitPurpose,
      visit_content: v.visitContent,
      visit_result: v.visitResult,
      created_at: v.createdAt.toISOString(),
      updated_at: v.updatedAt.toISOString(),
    }));

    return successResponse({ items });
  },

  /**
   * POST /api/v1/reports/{reportId}/visits
   * 訪問記録を新規作成
   */
  POST: async (request, context) => {
    // 認証チェック
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // パスパラメータのバリデーション
    const params = await context.params;
    const { id: reportId } = validatePathParams(params, ReportIdParamSchema);

    // リクエストボディのバリデーション
    const body = await parseAndValidateBody(request, CreateVisitSchema);

    // 日報の存在チェック
    const report = await prisma.dailyReport.findUnique({
      where: { id: reportId },
      select: { salesPersonId: true, status: true },
    });

    if (!report) {
      return notFoundResponse("指定された日報が見つかりません");
    }

    // 本人のみ編集可能
    if (report.salesPersonId !== session.user.id) {
      return forbiddenResponse("この日報に訪問記録を追加する権限がありません");
    }

    // 確認済の日報は編集不可
    if (report.status === "confirmed") {
      return errorResponse(
        ErrorCode.FORBIDDEN_EDIT,
        "確認済の日報には訪問記録を追加できません"
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

    // 訪問記録を作成
    const visitRecord = await prisma.visitRecord.create({
      data: {
        reportId,
        customerId: body.customer_id,
        visitTime: parseVisitTime(body.visit_time),
        visitPurpose: body.visit_purpose ?? null,
        visitContent: body.visit_content,
        visitResult: body.visit_result ?? null,
      },
    });

    const response: CreateVisitResponse = {
      visit_id: visitRecord.id,
      report_id: reportId,
      customer_id: visitRecord.customerId,
      customer_name: customer.customerName,
      created_at: visitRecord.createdAt.toISOString(),
    };

    return createdResponse(response, "訪問記録を作成しました");
  },
});

export const GET = handlers.GET!;
export const POST = handlers.POST!;
