import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { auth } from "@/auth";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Button } from "@/components/ui/button";
import { ReportFormWrapper } from "@/features/reports/components";

export const metadata = {
  title: "日報作成 | 営業日報システム",
  description: "新しい日報を作成します",
};

// 動的レンダリングを強制（認証が必要なページ）
export const dynamic = "force-dynamic";

export default async function NewReportPage() {
  const session = await auth();

  return (
    <AuthenticatedLayout session={session}>
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
        <ReportFormWrapper />
      </div>
    </AuthenticatedLayout>
  );
}
