import { Suspense } from "react";

import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import {
  SalesPersonsList,
  SalesPersonsListSkeleton,
} from "@/features/sales-persons/components";

export const metadata = {
  title: "営業担当者マスタ | 営業日報システム",
  description: "営業担当者の一覧を表示します",
};

// 動的レンダリングを強制（認証が必要なページ）
export const dynamic = "force-dynamic";

export default function SalesPersonsPage() {
  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">営業担当者マスタ</h1>
        <Suspense fallback={<SalesPersonsListSkeleton />}>
          <SalesPersonsList />
        </Suspense>
      </div>
    </AuthenticatedLayout>
  );
}
