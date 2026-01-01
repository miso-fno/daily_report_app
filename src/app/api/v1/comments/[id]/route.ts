/**
 * コメントAPI - 削除
 *
 * DELETE /api/v1/comments/{id} - 削除
 */

import { auth } from "@/auth";
import { createHandlers } from "@/lib/api/handler";
import {
  forbiddenResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
} from "@/lib/api/response";
import { CommentIdParamSchema } from "@/lib/api/schemas/comment";
import { validatePathParams } from "@/lib/api/validation";
import { prisma } from "@/lib/prisma";

import type { DeleteCommentResponse } from "@/lib/api/schemas/comment";

const handlers = createHandlers<{ id: string }>({
  /**
   * DELETE /api/v1/comments/{id}
   * コメントを削除
   *
   * 権限: 投稿者本人のみ削除可能
   */
  DELETE: async (request, context) => {
    // 認証チェック
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // パスパラメータのバリデーション
    const params = await context.params;
    const { id: commentId } = validatePathParams(params, CommentIdParamSchema);

    // コメントの存在チェック
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        salesPersonId: true,
      },
    });

    if (!comment) {
      return notFoundResponse("指定されたコメントが見つかりません");
    }

    // 投稿者本人のみ削除可能
    if (comment.salesPersonId !== session.user.id) {
      return forbiddenResponse("自分が投稿したコメントのみ削除できます");
    }

    // コメントを削除
    await prisma.comment.delete({
      where: { id: commentId },
    });

    const response: DeleteCommentResponse = {
      comment_id: commentId,
    };

    return successResponse(response, { message: "コメントを削除しました" });
  },
});

export const DELETE = handlers.DELETE!;
