/**
 * 日報ステータス更新API
 *
 * PATCH /api/v1/reports/{id}/status - ステータス更新
 */

import { auth } from "@/auth";
import { createHandlers } from "@/lib/api/handler";
import {
  forbiddenResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api/response";
import {
  getStatusLabel,
  ReportIdParamSchema,
  UpdateStatusSchema,
} from "@/lib/api/schemas/report";
import { parseAndValidateBody, validatePathParams } from "@/lib/api/validation";
import { prisma } from "@/lib/prisma";

import type {
  ReportStatusType,
  UpdateStatusResponse,
} from "@/lib/api/schemas/report";

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
   * PATCH /api/v1/reports/{id}/status
   * 日報のステータスを更新
   */
  PATCH: async (request, context) => {
    // 認証チェック
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // パスパラメータのバリデーション
    const params = await context.params;
    const { id } = validatePathParams(params, ReportIdParamSchema);

    // リクエストボディのバリデーション
    const body = await parseAndValidateBody(request, UpdateStatusSchema);

    // 対象の日報が存在するかチェック
    const existingReport = await prisma.dailyReport.findUnique({
      where: { id },
    });

    if (!existingReport) {
      return notFoundResponse("指定された日報が見つかりません");
    }

    // アクセス権限チェック
    const canAccess = await canAccessReport(
      session.user.id,
      session.user.isManager,
      existingReport.salesPersonId
    );

    if (!canAccess) {
      return forbiddenResponse(
        "この日報のステータスを更新する権限がありません"
      );
    }

    // confirmedへの変更は上長のみ可能
    if (body.status === "confirmed") {
      // 日報の作成者本人がconfirmedにしようとしている場合はエラー
      if (existingReport.salesPersonId === session.user.id) {
        return forbiddenResponse(
          "自分の日報を確認済にすることはできません。上長に確認を依頼してください"
        );
      }

      // 上長でない場合もエラー
      if (!session.user.isManager) {
        return forbiddenResponse("確認済ステータスへの変更は上長のみ可能です");
      }
    }

    // 本人以外はdraft/submittedへの変更不可
    if (
      body.status !== "confirmed" &&
      existingReport.salesPersonId !== session.user.id
    ) {
      return forbiddenResponse(
        "他人の日報のステータスを下書きまたは提出済に変更することはできません"
      );
    }

    // ステータスを更新
    const updatedReport = await prisma.dailyReport.update({
      where: { id },
      data: {
        status: body.status,
      },
    });

    const response: UpdateStatusResponse = {
      report_id: updatedReport.id,
      status: updatedReport.status as ReportStatusType,
      status_label: getStatusLabel(updatedReport.status as ReportStatusType),
      updated_at: updatedReport.updatedAt.toISOString(),
    };

    return successResponse(response, { message: "ステータスを更新しました" });
  },
});

export const PATCH = handlers.PATCH!;
