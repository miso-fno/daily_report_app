import { auth } from "@/auth";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { SalesPersonForm } from "@/features/sales-persons/components/SalesPersonForm";

export const metadata = {
  title: "営業担当者登録 | 営業日報システム",
  description: "新規営業担当者を登録します",
};

// 動的レンダリングを強制（認証が必要なページ）
export const dynamic = "force-dynamic";

export default async function NewSalesPersonPage() {
  const session = await auth();

  return (
    <AuthenticatedLayout session={session}>
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold">営業担当者マスタ 登録</h1>
        <SalesPersonForm />
      </div>
    </AuthenticatedLayout>
  );
}
