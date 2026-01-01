import { Suspense } from "react";

import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import {
  ReportsList,
  ReportsListSkeleton,
} from "@/features/reports/components";

export const metadata = {
  title: "日報一覧 | 営業日報システム",
  description: "日報の一覧を表示します",
};

// 動的レンダリングを強制（認証が必要なページ）
export const dynamic = "force-dynamic";

export default function ReportsPage() {
  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">日報一覧</h1>
        <Suspense fallback={<ReportsListSkeleton />}>
          <ReportsList />
        </Suspense>
      </div>
    </AuthenticatedLayout>
  );
}
