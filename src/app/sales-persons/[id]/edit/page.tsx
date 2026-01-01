import { notFound } from "next/navigation";

import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { SalesPersonEditContainer } from "@/features/sales-persons/components/SalesPersonEditContainer";

export const metadata = {
  title: "営業担当者編集 | 営業日報システム",
  description: "営業担当者情報を編集します",
};

// 動的レンダリングを強制（認証が必要なページ）
export const dynamic = "force-dynamic";

interface EditSalesPersonPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditSalesPersonPage({
  params,
}: EditSalesPersonPageProps) {
  const { id } = await params;
  const salesPersonId = parseInt(id, 10);

  if (isNaN(salesPersonId) || salesPersonId <= 0) {
    notFound();
  }

  return (
    <AuthenticatedLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">営業担当者マスタ 編集</h1>
        <SalesPersonEditContainer salesPersonId={salesPersonId} />
      </div>
    </AuthenticatedLayout>
  );
}
