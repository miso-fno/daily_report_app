"use client";

import { MessageSquare } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { RecentCommentsListProps } from "../types";

/**
 * 日時をフォーマットする
 * @param dateTimeString ISO8601形式の日時文字列
 * @returns YYYY/MM/DD HH:MM形式の日時文字列
 */
function formatDateTime(dateTimeString: string): string {
  const date = new Date(dateTimeString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

/**
 * コメントテキストを省略する
 * @param text コメントテキスト
 * @param maxLength 最大文字数
 * @returns 省略されたテキスト
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + "...";
}

/**
 * 新着コメントリストコンポーネント
 * ダッシュボードに表示する新着コメント一覧
 */
export function RecentCommentsList({ comments }: RecentCommentsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>新着コメント</CardTitle>
        <CardDescription>あなたの日報へのコメント</CardDescription>
      </CardHeader>
      <CardContent>
        {comments.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-muted-foreground">
            新着コメントはありません
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Link
                key={comment.comment_id}
                href={`/reports/${comment.report_id}`}
                className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {comment.commenter_name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(comment.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {truncateText(comment.comment_text, 100)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      日報: {comment.report_date}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
