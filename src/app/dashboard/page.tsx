import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Dashboard } from "@/features/dashboard/components";

export const metadata = {
  title: "ダッシュボード | 営業日報システム",
  description: "営業日報システムのダッシュボード",
};

// 動的レンダリングを強制（認証が必要なページ）
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <AuthenticatedLayout>
      <Dashboard />
    </AuthenticatedLayout>
  );
}
