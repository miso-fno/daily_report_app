"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function SalesPersonsListSkeleton() {
  return (
    <div className="space-y-4">
      {/* 検索フォームスケルトン */}
      <div className="rounded-xl border p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      {/* テーブルスケルトン */}
      <div className="rounded-md border">
        <div className="p-4">
          <div className="flex h-10 items-center border-b">
            <Skeleton className="h-4 w-8 mr-8" />
            <Skeleton className="h-4 w-24 mr-8" />
            <Skeleton className="h-4 w-20 mr-8" />
            <Skeleton className="h-4 w-24 mr-8" />
            <Skeleton className="h-4 w-16 mr-8" />
            <Skeleton className="h-4 w-16" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex h-14 items-center border-b last:border-b-0"
            >
              <Skeleton className="h-4 w-6 mr-10" />
              <Skeleton className="h-4 w-20 mr-10" />
              <Skeleton className="h-4 w-16 mr-10" />
              <Skeleton className="h-4 w-20 mr-10" />
              <Skeleton className="h-5 w-12 mr-10" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </div>

      {/* ページネーションスケルトン */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </div>
  );
}
