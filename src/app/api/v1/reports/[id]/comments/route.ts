/**
 * コメントAPI - 一覧取得・新規作成
 *
 * GET /api/v1/reports/{reportId}/comments - 一覧取得
 * POST /api/v1/reports/{reportId}/comments - 新規作成
 */

import { auth } from "@/auth";
import { createHandlers } from "@/lib/api/handler";
import {
  createdResponse,
  forbiddenResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api/response";
import {
  CreateCommentSchema,
  ReportIdParamSchema,
} from "@/lib/api/schemas/comment";
import { parseAndValidateBody, validatePathParams } from "@/lib/api/validation";
import { prisma } from "@/lib/prisma";

import type {
  CommentResponse,
  CreateCommentResponse,
} from "@/lib/api/schemas/comment";

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
   * GET /api/v1/reports/{reportId}/comments
   * 指定した日報のコメント一覧を取得
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
      return forbiddenResponse("この日報のコメントを閲覧する権限がありません");
    }

    // コメントを取得
    const comments = await prisma.comment.findMany({
      where: { reportId },
      include: {
        salesPerson: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const items: CommentResponse[] = comments.map((c) => ({
      comment_id: c.id,
      report_id: c.reportId,
      sales_person_id: c.salesPersonId,
      sales_person_name: c.salesPerson.name,
      comment_text: c.commentText,
      created_at: c.createdAt.toISOString(),
      updated_at: c.updatedAt.toISOString(),
    }));

    return successResponse({ items });
  },

  /**
   * POST /api/v1/reports/{reportId}/comments
   * コメントを新規作成
   *
   * 権限: 上長（isManager=true）のみ投稿可能
   */
  POST: async (request, context) => {
    // 認証チェック
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // 上長のみコメント投稿可能
    if (!session.user.isManager) {
      return forbiddenResponse("コメントを投稿できるのは上長のみです");
    }

    // パスパラメータのバリデーション
    const params = await context.params;
    const { id: reportId } = validatePathParams(params, ReportIdParamSchema);

    // リクエストボディのバリデーション
    const body = await parseAndValidateBody(request, CreateCommentSchema);

    // 日報の存在チェック
    const report = await prisma.dailyReport.findUnique({
      where: { id: reportId },
      select: { salesPersonId: true },
    });

    if (!report) {
      return notFoundResponse("指定された日報が見つかりません");
    }

    // アクセス権限チェック（自分または部下の日報のみコメント可能）
    const canAccess = await canAccessReport(
      session.user.id,
      session.user.isManager,
      report.salesPersonId
    );

    if (!canAccess) {
      return forbiddenResponse("この日報にコメントする権限がありません");
    }

    // コメントを作成
    const comment = await prisma.comment.create({
      data: {
        reportId,
        salesPersonId: session.user.id,
        commentText: body.comment_text,
      },
    });

    const response: CreateCommentResponse = {
      comment_id: comment.id,
      report_id: reportId,
      created_at: comment.createdAt.toISOString(),
    };

    return createdResponse(response, "コメントを投稿しました");
  },
});

export const GET = handlers.GET!;
export const POST = handlers.POST!;
