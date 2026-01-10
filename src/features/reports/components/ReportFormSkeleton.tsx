/**
 * 日報フォームスケルトン
 *
 * ReportFormの遅延読み込み中に表示されるプレースホルダー
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export function ReportFormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-7 w-24" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 報告日 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full max-w-xs" />
        </div>

        <Separator />

        {/* 訪問記録 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
          <div className="rounded-lg border p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>

        <Separator />

        {/* 課題・相談 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-24 w-full" />
        </div>

        {/* 明日の予定 */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-24 w-full" />
        </div>

        {/* ボタンエリア */}
        <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:justify-end">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}
