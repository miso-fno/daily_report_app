"use client";

import { AlertTriangle, CheckCircle2, Edit, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { createComment, deleteComment, updateReportStatus } from "../api";
import { CommentForm } from "./CommentForm";
import { CommentList } from "./CommentList";
import { ReportBasicInfo } from "./ReportBasicInfo";
import { VisitRecordDisplay } from "./VisitRecordDisplay";

import type { ReportDetail as ReportDetailType } from "../types";

interface ReportDetailViewProps {
  report: ReportDetailType;
  currentUser: {
    id: number;
    isManager: boolean;
  };
}

/**
 * 日報詳細表示メインコンポーネント
 * 基本情報、訪問記録、課題・相談、明日の予定、コメントを表示
 */
export function ReportDetailView({
  report,
  currentUser,
}: ReportDetailViewProps) {
  const router = useRouter();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [comments, setComments] = useState(report.comments);
  const [currentStatus, setCurrentStatus] = useState(report.status);

  // 編集ボタン表示条件: 本人かつ未確認（draft/submitted）
  const canEdit =
    report.sales_person_id === currentUser.id && currentStatus !== "confirmed";

  // 確認済ボタン表示条件: 上長かつ提出済（submitted）
  const canConfirm = currentUser.isManager && currentStatus === "submitted";

  // コメント投稿可能条件: 上長のみ
  const canComment = currentUser.isManager;

  /**
   * ステータスを確認済に更新
   */
  const handleConfirm = async () => {
    setIsUpdatingStatus(true);
    try {
      const response = await updateReportStatus(report.report_id, "confirmed");
      setCurrentStatus(response.data.status);
      toast.success("日報を確認済にしました");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "ステータスの更新に失敗しました"
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  /**
   * コメントを投稿
   */
  const handleCommentSubmit = async (commentText: string) => {
    try {
      await createComment(report.report_id, commentText);
      toast.success("コメントを投稿しました");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "コメントの投稿に失敗しました"
      );
      throw error;
    }
  };

  /**
   * コメントを削除
   */
  const handleCommentDelete = async (commentId: number) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.comment_id !== commentId));
      toast.success("コメントを削除しました");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "コメントの削除に失敗しました"
      );
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* アクションボタン */}
      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <Button asChild>
            <Link href={`/reports/${report.report_id}/edit`}>
              <Edit className="mr-2 h-4 w-4" aria-hidden="true" />
              編集
            </Link>
          </Button>
        )}

        {canConfirm && (
          <Button
            onClick={handleConfirm}
            disabled={isUpdatingStatus}
            variant="secondary"
          >
            {isUpdatingStatus ? (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {isUpdatingStatus ? "処理中..." : "確認済にする"}
          </Button>
        )}
      </div>

      {/* 確認済の場合の注意表示 */}
      {currentStatus === "confirmed" && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            この日報は確認済です。編集することはできません。
          </AlertDescription>
        </Alert>
      )}

      {/* 基本情報 */}
      <ReportBasicInfo
        reportDate={report.report_date}
        salesPersonName={report.sales_person_name}
        status={currentStatus}
      />

      {/* 訪問記録 */}
      <VisitRecordDisplay visits={report.visits} />

      {/* 課題・相談 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            課題・相談
          </CardTitle>
        </CardHeader>
        <CardContent>
          {report.problem ? (
            <p className="whitespace-pre-wrap text-sm">{report.problem}</p>
          ) : (
            <p className="text-sm text-muted-foreground">記載なし</p>
          )}
        </CardContent>
      </Card>

      {/* 明日の予定 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">明日の予定</CardTitle>
        </CardHeader>
        <CardContent>
          {report.plan ? (
            <p className="whitespace-pre-wrap text-sm">{report.plan}</p>
          ) : (
            <p className="text-sm text-muted-foreground">記載なし</p>
          )}
        </CardContent>
      </Card>

      {/* コメント一覧 */}
      <CommentList
        comments={comments}
        currentUserId={currentUser.id}
        onDelete={handleCommentDelete}
      />

      {/* コメント入力フォーム（上長のみ） */}
      {canComment && <CommentForm onSubmit={handleCommentSubmit} />}
    </div>
  );
}
