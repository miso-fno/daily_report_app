/**
 * ダッシュボードAPI
 *
 * GET /api/v1/dashboard - ダッシュボード用データを取得
 */

import { auth } from "@/auth";
import { createHandlers } from "@/lib/api/handler";
import { successResponse, unauthorizedResponse } from "@/lib/api/response";
import { getStatusLabel, ReportStatus } from "@/lib/api/schemas/report";
import { prisma } from "@/lib/prisma";

import type { DashboardData } from "@/lib/api/schemas/dashboard";
import type { ReportStatusType } from "@/lib/api/schemas/report";

/**
 * 今月の開始日と終了日を取得
 */
function getMonthRange(): { startOfMonth: Date; endOfMonth: Date } {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  return { startOfMonth, endOfMonth };
}

const handlers = createHandlers({
  /**
   * GET /api/v1/dashboard
   * ダッシュボード用データを取得
   */
  GET: async () => {
    // 認証チェック
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse();
    }

    const userId = session.user.id;
    const isManager = session.user.isManager;
    const { startOfMonth, endOfMonth } = getMonthRange();

    // 並列でデータを取得
    const [
      monthlyVisitCount,
      unconfirmedReportCount,
      recentReports,
      recentComments,
    ] = await Promise.all([
      // 今月の訪問件数（ログインユーザーの訪問記録数）
      prisma.visitRecord.count({
        where: {
          dailyReport: {
            salesPersonId: userId,
            reportDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        },
      }),

      // 未確認日報件数（上長のみ：部下の submitted ステータスの日報数）
      isManager
        ? prisma.dailyReport.count({
            where: {
              salesPerson: {
                managerId: userId,
              },
              status: ReportStatus.SUBMITTED,
            },
          })
        : Promise.resolve(null),

      // 最近の日報（直近5件）
      prisma.dailyReport.findMany({
        where: {
          salesPersonId: userId,
        },
        orderBy: {
          reportDate: "desc",
        },
        take: 5,
        select: {
          id: true,
          reportDate: true,
          status: true,
          _count: {
            select: {
              visitRecords: true,
            },
          },
        },
      }),

      // 新着コメント（自分の日報に対するコメント、直近5件）
      prisma.comment.findMany({
        where: {
          dailyReport: {
            salesPersonId: userId,
          },
          // 自分自身のコメントは除外
          salesPersonId: {
            not: userId,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
        select: {
          id: true,
          reportId: true,
          commentText: true,
          createdAt: true,
          dailyReport: {
            select: {
              reportDate: true,
            },
          },
          salesPerson: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    // レスポンスデータを構築
    const dashboardData: DashboardData = {
      monthly_visit_count: monthlyVisitCount,
      unconfirmed_report_count: unconfirmedReportCount,
      recent_reports: recentReports.map((report) => {
        const status = report.status as ReportStatusType;
        const reportDateStr = report.reportDate.toISOString().split("T")[0];
        return {
          report_id: report.id,
          report_date: reportDateStr ?? "",
          visit_count: report._count.visitRecords,
          status,
          status_label: getStatusLabel(status),
        };
      }),
      recent_comments: recentComments.map((comment) => {
        const reportDateStr = comment.dailyReport.reportDate
          .toISOString()
          .split("T")[0];
        return {
          comment_id: comment.id,
          report_id: comment.reportId,
          report_date: reportDateStr ?? "",
          commenter_name: comment.salesPerson.name,
          comment_text: comment.commentText,
          created_at: comment.createdAt.toISOString(),
        };
      }),
    };

    return successResponse(dashboardData);
  },
});

export const GET = handlers.GET!;
