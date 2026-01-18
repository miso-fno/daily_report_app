import { auth } from "@/auth";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Dashboard } from "@/features/dashboard/components";

export const metadata = {
  title: "ダッシュボード | 営業日報システム",
  description: "営業日報システムのダッシュボード",
};

// 動的レンダリングを強制（認証が必要なページ）
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <AuthenticatedLayout session={session}>
      <Dashboard />
    </AuthenticatedLayout>
  );
}
