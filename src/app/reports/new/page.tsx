import { ChevronLeft } from "lucide-react";
import nextDynamic from "next/dynamic";
import Link from "next/link";

import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Button } from "@/components/ui/button";
import { ReportFormSkeleton } from "@/features/reports/components";

// ReportFormを遅延読み込み（フォームは重いコンポーネント）
const ReportForm = nextDynamic(
  () =>
    import("@/features/reports/components/ReportForm").then(
      (mod) => mod.ReportForm
    ),
  {
    loading: () => <ReportFormSkeleton />,
    ssr: false, // クライアントサイドでのみレンダリング
  }
);

export const metadata = {
  title: "日報作成 | 営業日報システム",
  description: "新しい日報を作成します",
};

// 動的レンダリングを強制（認証が必要なページ）
export const dynamic = "force-dynamic";

export default function NewReportPage() {
  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/reports">
              <ChevronLeft className="mr-1 h-4 w-4" />
              日報一覧に戻る
            </Link>
          </Button>
        </div>
        <h1 className="text-2xl font-bold">日報作成</h1>
        <ReportForm />
      </div>
    </AuthenticatedLayout>
  );
}
