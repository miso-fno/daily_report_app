"use client";

import { AlertCircle, CalendarDays, ClipboardList, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

import { fetchDashboardData } from "../api";
import { RecentCommentsList } from "./RecentCommentsList";
import { RecentReportsList } from "./RecentReportsList";
import { StatCard } from "./StatCard";

import type { DashboardData } from "../types";

/**
 * ダッシュボードスケルトンコンポーネント
 * データ読み込み中の表示
 */
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* ウェルカムメッセージスケルトン */}
      <Skeleton className="h-8 w-64" />

      {/* 統計カードスケルトン */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>

      {/* ボタンスケルトン */}
      <Skeleton className="h-10 w-48" />

      {/* コンテンツスケルトン */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

/**
 * ダッシュボードメインコンポーネント
 * ログインユーザーのダッシュボードを表示
 */
export function Dashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ユーザーが上長かどうか
  const isManager = user?.role === "manager" || user?.role === "admin";

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchDashboardData();
        setDashboardData(response.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "データの取得に失敗しました"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!dashboardData) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>データを取得できませんでした</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* ウェルカムメッセージ */}
      <h1 className="text-2xl font-bold">ようこそ、{user?.name || ""}さん</h1>

      {/* 統計カード */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          title="今月の訪問件数"
          value={`${dashboardData.monthly_visit_count}件`}
          description="当月の訪問記録件数"
          icon={<CalendarDays className="h-5 w-5" />}
        />
        {isManager && dashboardData.unconfirmed_report_count !== null && (
          <StatCard
            title="未確認の日報"
            value={`${dashboardData.unconfirmed_report_count}件`}
            description="部下の未確認日報件数"
            icon={<ClipboardList className="h-5 w-5" />}
          />
        )}
      </div>

      {/* 本日の日報を作成ボタン */}
      <div>
        <Button asChild size="lg">
          <Link href="/reports/new">
            <Plus className="mr-2 h-5 w-5" />
            本日の日報を作成
          </Link>
        </Button>
      </div>

      {/* 最近の日報・新着コメント */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentReportsList reports={dashboardData.recent_reports} />
        <RecentCommentsList comments={dashboardData.recent_comments} />
      </div>
    </div>
  );
}
