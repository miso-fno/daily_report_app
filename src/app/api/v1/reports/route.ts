/**
 * 日報API - 一覧取得・新規作成
 *
 * GET /api/v1/reports - 一覧取得（ページネーション対応）
 * POST /api/v1/reports - 新規作成
 */

import { auth } from "@/auth";
import { createApiError } from "@/lib/api/errors";
import { createHandlers } from "@/lib/api/handler";
import { calculateOffset, calculatePagination } from "@/lib/api/pagination";
import {
  createdResponse,
  forbiddenResponse,
  paginatedResponse,
  unauthorizedResponse,
} from "@/lib/api/response";
import {
  CreateReportSchema,
  getStatusLabel,
  ReportsQuerySchema,
} from "@/lib/api/schemas/report";
import {
  parseAndValidateBody,
  searchParamsToObject,
} from "@/lib/api/validation";
import { prisma } from "@/lib/prisma";

import type {
  CreateReportResponse,
  ReportListItem,
  ReportStatusType,
} from "@/lib/api/schemas/report";
import type { Prisma } from "@prisma/client";

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
 * Prismaの結果を日報一覧レスポンス形式に変換
 */
function toReportListItem(report: {
  id: number;
  reportDate: Date;
  salesPersonId: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  salesPerson: { name: string };
  _count: {
    visitRecords: number;
    comments: number;
  };
}): ReportListItem {
  const status = report.status as ReportStatusType;
  const dateStr = report.reportDate.toISOString().split("T")[0];
  return {
    report_id: report.id,
    report_date: dateStr ?? "",
    sales_person_id: report.salesPersonId,
    sales_person_name: report.salesPerson.name,
    status,
    status_label: getStatusLabel(status),
    visit_count: report._count.visitRecords,
    comment_count: report._count.comments,
    created_at: report.createdAt.toISOString(),
    updated_at: report.updatedAt.toISOString(),
  };
}

const handlers = createHandlers({
  /**
   * GET /api/v1/reports
   * 日報一覧を取得
   */
  GET: async (request) => {
    // 認証チェック
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // クエリパラメータのバリデーション
    const { searchParams } = new URL(request.url);
    const queryParams = searchParamsToObject(searchParams);
    const query = ReportsQuerySchema.parse(queryParams);

    // 検索条件を構築
    const where: Prisma.DailyReportWhereInput = {};

    // 日付範囲フィルター
    if (query.date_from || query.date_to) {
      where.reportDate = {};
      if (query.date_from) {
        where.reportDate.gte = new Date(query.date_from);
      }
      if (query.date_to) {
        where.reportDate.lte = new Date(query.date_to);
      }
    }

    // ステータスフィルター
    if (query.status) {
      where.status = query.status;
    }

    // 権限チェック: 営業担当者は自分の日報のみ、上長は部下の日報も取得可能
    if (!session.user.isManager) {
      // 一般営業担当者は自分の日報のみ
      where.salesPersonId = session.user.id;
    } else {
      // 上長の場合
      if (query.sales_person_id) {
        // 指定された営業担当者でフィルター
        // 自分または部下の日報のみ取得可能
        const subordinateIds = await prisma.salesPerson.findMany({
          where: { managerId: session.user.id },
          select: { id: true },
        });
        const accessibleIds = [
          session.user.id,
          ...subordinateIds.map((s) => s.id),
        ];

        if (!accessibleIds.includes(query.sales_person_id)) {
          return forbiddenResponse(
            "指定された営業担当者の日報を閲覧する権限がありません"
          );
        }
        where.salesPersonId = query.sales_person_id;
      } else {
        // 全体取得時は自分と部下の日報
        const subordinateIds = await prisma.salesPerson.findMany({
          where: { managerId: session.user.id },
          select: { id: true },
        });
        where.salesPersonId = {
          in: [session.user.id, ...subordinateIds.map((s) => s.id)],
        };
      }
    }

    // 総件数を取得
    const total = await prisma.dailyReport.count({ where });

    // ページネーション計算
    const { skip, take } = calculateOffset(query.page, query.per_page);
    const pagination = calculatePagination({
      page: query.page,
      perPage: query.per_page,
      total,
    });

    // ソート条件を構築
    const orderBy: Prisma.DailyReportOrderByWithRelationInput = {};
    if (query.sort === "report_date") {
      orderBy.reportDate = query.order;
    } else {
      orderBy.createdAt = query.order;
    }

    // データ取得
    const reports = await prisma.dailyReport.findMany({
      where,
      skip,
      take,
      orderBy,
      select: {
        id: true,
        reportDate: true,
        salesPersonId: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        salesPerson: {
          select: { name: true },
        },
        _count: {
          select: {
            visitRecords: true,
            comments: true,
          },
        },
      },
    });

    const items = reports.map(toReportListItem);

    return paginatedResponse(items, pagination);
  },

  /**
   * POST /api/v1/reports
   * 日報を新規作成
   */
  POST: async (request) => {
    // 認証チェック
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // リクエストボディのバリデーション
    const body = await parseAndValidateBody(request, CreateReportSchema);

    // 同一日の日報が既に存在するかチェック
    const existingReport = await prisma.dailyReport.findUnique({
      where: {
        salesPersonId_reportDate: {
          salesPersonId: session.user.id,
          reportDate: new Date(body.report_date),
        },
      },
    });

    if (existingReport) {
      throw createApiError.duplicateEntry(
        "この日付の日報は既に作成されています"
      );
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

    // トランザクションで日報と訪問記録を作成
    const report = await prisma.$transaction(async (tx) => {
      // 日報を作成
      const newReport = await tx.dailyReport.create({
        data: {
          salesPersonId: session.user.id,
          reportDate: new Date(body.report_date),
          problem: body.problem ?? null,
          plan: body.plan ?? null,
          status: body.status,
        },
      });

      // 訪問記録を作成
      if (body.visits && body.visits.length > 0) {
        await tx.visitRecord.createMany({
          data: body.visits.map((visit) => ({
            reportId: newReport.id,
            customerId: visit.customer_id,
            visitTime: parseVisitTime(visit.visit_time),
            visitPurpose: visit.visit_purpose ?? null,
            visitContent: visit.visit_content,
            visitResult: visit.visit_result ?? null,
          })),
        });
      }

      return newReport;
    });

    const reportDateStr = report.reportDate.toISOString().split("T")[0];
    const response: CreateReportResponse = {
      report_id: report.id,
      report_date: reportDateStr ?? "",
      status: report.status as ReportStatusType,
      created_at: report.createdAt.toISOString(),
    };

    return createdResponse(response, "日報を作成しました");
  },
});

export const GET = handlers.GET!;
export const POST = handlers.POST!;
