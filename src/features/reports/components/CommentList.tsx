"use client";

import { MessageSquare, Trash2, User } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import type { Comment } from "../types";

interface CommentListProps {
  comments: Comment[];
  currentUserId: number;
  onDelete?: (commentId: number) => Promise<void>;
}

/**
 * コメント一覧コンポーネント
 * コメントの一覧表示と削除機能
 */
export function CommentList({
  comments,
  currentUserId,
  onDelete,
}: CommentListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [openDialogId, setOpenDialogId] = useState<number | null>(null);

  const handleDelete = async (commentId: number) => {
    if (!onDelete) {
      return;
    }

    setDeletingId(commentId);
    try {
      await onDelete(commentId);
      setOpenDialogId(null);
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * 日時をフォーマット
   */
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5" aria-hidden="true" />
          コメント
          {comments.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({comments.length}件)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            コメントはありません。
          </p>
        ) : (
          <div className="space-y-4" role="list" aria-label="コメント一覧">
            {comments.map((comment) => (
              <div
                key={comment.comment_id}
                className="rounded-lg border p-4"
                role="listitem"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {comment.sales_person_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(comment.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* 投稿者本人のみ削除可能 */}
                  {comment.sales_person_id === currentUserId && onDelete && (
                    <Dialog
                      open={openDialogId === comment.comment_id}
                      onOpenChange={(open) =>
                        setOpenDialogId(open ? comment.comment_id : null)
                      }
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          disabled={deletingId === comment.comment_id}
                          aria-label="コメントを削除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>コメントを削除しますか？</DialogTitle>
                          <DialogDescription>
                            この操作は取り消せません。コメントは完全に削除されます。
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">キャンセル</Button>
                          </DialogClose>
                          <Button
                            variant="destructive"
                            onClick={() => handleDelete(comment.comment_id)}
                            disabled={deletingId === comment.comment_id}
                          >
                            {deletingId === comment.comment_id
                              ? "削除中..."
                              : "削除"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                <p className="whitespace-pre-wrap text-sm">
                  {comment.comment_text}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
