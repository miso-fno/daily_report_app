/**
 * 日報API - 詳細取得・更新・削除
 *
 * GET /api/v1/reports/{id} - 詳細取得
 * PUT /api/v1/reports/{id} - 更新
 * DELETE /api/v1/reports/{id} - 削除
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
import {
  getStatusLabel,
  ReportIdParamSchema,
  UpdateReportSchema,
} from "@/lib/api/schemas/report";
import { parseAndValidateBody, validatePathParams } from "@/lib/api/validation";
import { prisma } from "@/lib/prisma";

import type {
  CommentResponse,
  ReportDetailResponse,
  ReportStatusType,
  UpdateReportResponse,
  VisitRecordResponse,
} from "@/lib/api/schemas/report";

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

/**
 * Prismaの結果を日報詳細レスポンス形式に変換
 */
function toReportDetailResponse(report: {
  id: number;
  reportDate: Date;
  salesPersonId: number;
  status: string;
  problem: string | null;
  plan: string | null;
  createdAt: Date;
  updatedAt: Date;
  salesPerson: { name: string };
  visitRecords: Array<{
    id: number;
    customerId: number;
    visitTime: Date | null;
    visitPurpose: string | null;
    visitContent: string;
    visitResult: string | null;
    customer: { customerName: string };
  }>;
  comments: Array<{
    id: number;
    salesPersonId: number;
    commentText: string;
    createdAt: Date;
    salesPerson: { name: string };
  }>;
}): ReportDetailResponse {
  const status = report.status as ReportStatusType;
  const dateStr = report.reportDate.toISOString().split("T")[0];

  const visits: VisitRecordResponse[] = report.visitRecords.map((v) => ({
    visit_id: v.id,
    customer_id: v.customerId,
    customer_name: v.customer.customerName,
    visit_time: formatVisitTime(v.visitTime),
    visit_purpose: v.visitPurpose,
    visit_content: v.visitContent,
    visit_result: v.visitResult,
  }));

  const comments: CommentResponse[] = report.comments.map((c) => ({
    comment_id: c.id,
    sales_person_id: c.salesPersonId,
    sales_person_name: c.salesPerson.name,
    comment_text: c.commentText,
    created_at: c.createdAt.toISOString(),
  }));

  return {
    report_id: report.id,
    report_date: dateStr ?? "",
    sales_person_id: report.salesPersonId,
    sales_person_name: report.salesPerson.name,
    status,
    status_label: getStatusLabel(status),
    problem: report.problem,
    plan: report.plan,
    visits,
    comments,
    created_at: report.createdAt.toISOString(),
    updated_at: report.updatedAt.toISOString(),
  };
}

const handlers = createHandlers<{ id: string }>({
  /**
   * GET /api/v1/reports/{id}
   * 日報の詳細を取得
   */
  GET: async (request, context) => {
    // 認証チェック
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // パスパラメータのバリデーション
    const params = await context.params;
    const { id } = validatePathParams(params, ReportIdParamSchema);

    // 日報を取得
    const report = await prisma.dailyReport.findUnique({
      where: { id },
      include: {
        salesPerson: {
          select: { name: true },
        },
        visitRecords: {
          include: {
            customer: {
              select: { customerName: true },
            },
          },
          orderBy: { visitTime: "asc" },
        },
        comments: {
          include: {
            salesPerson: {
              select: { name: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
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
      return forbiddenResponse("この日報を閲覧する権限がありません");
    }

    return successResponse(toReportDetailResponse(report));
  },

  /**
   * PUT /api/v1/reports/{id}
   * 日報を更新
   */
  PUT: async (request, context) => {
    // 認証チェック
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // パスパラメータのバリデーション
    const params = await context.params;
    const { id } = validatePathParams(params, ReportIdParamSchema);

    // リクエストボディのバリデーション
    const body = await parseAndValidateBody(request, UpdateReportSchema);

    // 対象の日報が存在するかチェック
    const existingReport = await prisma.dailyReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return notFoundResponse("指定された日報が見つかりません");
    }

    // 本人のみ編集可能
    if (existingReport.salesPersonId !== session.user.id) {
      return forbiddenResponse("この日報を編集する権限がありません");
    }

    // 確認済の日報は編集不可
    if (existingReport.status === "confirmed") {
      return errorResponse(
        ErrorCode.FORBIDDEN_EDIT,
        "確認済の日報は編集できません"
      );
    }

    // 日付変更時、同一日の日報が既に存在するかチェック
    const newReportDate = new Date(body.report_date);
    const existingReportDate = existingReport.reportDate;

    if (newReportDate.getTime() !== existingReportDate.getTime()) {
      const duplicateReport = await prisma.dailyReport.findUnique({
        where: {
          salesPersonId_reportDate: {
            salesPersonId: session.user.id,
            reportDate: newReportDate,
          },
        },
      });

      if (duplicateReport) {
        throw createApiError.duplicateEntry(
          "この日付の日報は既に作成されています"
        );
      }
    }

    // 訪問記録の顧客IDが存在するかチェック
    if (body.visits && body.visits.length > 0) {
      const customerIds = body.visits.map((v) => v.customer_id);
      const existingCustomers = await prisma.customer.findMany({
        where: { id: { in: customerIds } },
        select: { id: true },
      });
      const existingCustomerIds = new Set(existingCustomers.map((c) => c.id));

      for (const visit of body.visits) {
        if (!existingCustomerIds.has(visit.customer_id)) {
          throw createApiError.validationError("指定された顧客が存在しません", [
            {
              field: "visits",
              message: `顧客ID ${visit.customer_id} が存在しません`,
            },
          ]);
        }
      }
    }

    // トランザクションで日報と訪問記録を更新
    const updatedReport = await prisma.$transaction(async (tx) => {
      // 既存の訪問記録を削除
      await tx.visitRecord.deleteMany({
        where: { reportId: id },
      });

      // 日報を更新
      const report = await tx.dailyReport.update({
        where: { id },
        data: {
          reportDate: newReportDate,
          problem: body.problem ?? null,
          plan: body.plan ?? null,
          status: body.status,
        },
      });

      // 訪問記録を再作成
      if (body.visits && body.visits.length > 0) {
        await tx.visitRecord.createMany({
          data: body.visits.map((visit) => ({
            reportId: id,
            customerId: visit.customer_id,
            visitTime: parseVisitTime(visit.visit_time),
            visitPurpose: visit.visit_purpose ?? null,
            visitContent: visit.visit_content,
            visitResult: visit.visit_result ?? null,
          })),
        });
      }

      return report;
    });

    const updatedDateStr = updatedReport.reportDate.toISOString().split("T")[0];
    const response: UpdateReportResponse = {
      report_id: updatedReport.id,
      report_date: updatedDateStr ?? "",
      status: updatedReport.status as ReportStatusType,
      updated_at: updatedReport.updatedAt.toISOString(),
    };

    return successResponse(response, { message: "日報を更新しました" });
  },

  /**
   * DELETE /api/v1/reports/{id}
   * 日報を削除
   */
  DELETE: async (request, context) => {
    // 認証チェック
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // パスパラメータのバリデーション
    const params = await context.params;
    const { id } = validatePathParams(params, ReportIdParamSchema);

    // 対象の日報が存在するかチェック
    const existingReport = await prisma.dailyReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return notFoundResponse("指定された日報が見つかりません");
    }

    // 本人のみ削除可能
    if (existingReport.salesPersonId !== session.user.id) {
      return forbiddenResponse("この日報を削除する権限がありません");
    }

    // 下書きのみ削除可能
    if (existingReport.status !== "draft") {
      return errorResponse(
        ErrorCode.FORBIDDEN_DELETE,
        "下書き以外の日報は削除できません"
      );
    }

    // 日報を削除（訪問記録、コメントはCascadeで自動削除）
    await prisma.dailyReport.delete({
      where: { id },
    });

    return successResponse(
      { report_id: id },
      { message: "日報を削除しました" }
    );
  },
});

export const GET = handlers.GET!;
export const PUT = handlers.PUT!;
export const DELETE = handlers.DELETE!;
