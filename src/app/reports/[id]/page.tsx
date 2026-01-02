import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Button } from "@/components/ui/button";
import { ReportDetailView } from "@/features/reports/components";
import { prisma } from "@/lib/prisma";

import type {
  ReportDetail as ReportDetailType,
  VisitRecord,
  Comment,
} from "@/features/reports/types";
import type { ReportStatusType } from "@/lib/api/schemas/report";

interface ReportDetailPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "日報詳細 | 営業日報システム",
  description: "日報の詳細を表示します",
};

// 動的レンダリングを強制（認証が必要なページ）
export const dynamic = "force-dynamic";

/**
 * 訪問時間をHH:MM形式に変換
 */
function formatVisitTime(date: Date | null): string | null {
  if (!date) {
    return null;
  }
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * ログインユーザーが日報にアクセス可能かチェック
 */
async function canAccessReport(
  userId: number,
  isManager: boolean,
  reportOwnerId: number
): Promise<boolean> {
  // 自分の日報なら常にアクセス可能
  if (userId === reportOwnerId) {
    return true;
  }

  // 上長でない場合はアクセス不可
  if (!isManager) {
    return false;
  }

  // 上長の場合、部下の日報かどうかチェック
  const subordinate = await prisma.salesPerson.findFirst({
    where: {
      id: reportOwnerId,
      managerId: userId,
    },
  });

  return subordinate !== null;
}

/**
 * 日報データを取得
 */
async function getReport(
  reportId: number,
  userId: number,
  isManager: boolean
): Promise<ReportDetailType | null> {
  const report = await prisma.dailyReport.findUnique({
    where: { id: reportId },
    include: {
      salesPerson: {
        select: { name: true },
      },
      visitRecords: {
        include: {
          customer: {
            select: { customerName: true },
          },
        },
        orderBy: { visitTime: "asc" },
      },
      comments: {
        include: {
          salesPerson: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!report) {
    return null;
  }

  // アクセス権限チェック
  const canAccess = await canAccessReport(
    userId,
    isManager,
    report.salesPersonId
  );

  if (!canAccess) {
    return null;
  }

  const status = report.status as ReportStatusType;
  const dateStr = report.reportDate.toISOString().split("T")[0];

  const visits: VisitRecord[] = report.visitRecords.map((v) => ({
    visit_id: v.id,
    customer_id: v.customerId,
    customer_name: v.customer.customerName,
    visit_time: formatVisitTime(v.visitTime),
    visit_purpose: v.visitPurpose,
    visit_content: v.visitContent,
    visit_result: v.visitResult,
  }));

  const comments: Comment[] = report.comments.map((c) => ({
    comment_id: c.id,
    sales_person_id: c.salesPersonId,
    sales_person_name: c.salesPerson.name,
    comment_text: c.commentText,
    created_at: c.createdAt.toISOString(),
  }));

  const statusLabels: Record<ReportStatusType, string> = {
    draft: "下書き",
    submitted: "提出済",
    confirmed: "確認済",
  };

  return {
    report_id: report.id,
    report_date: dateStr ?? "",
    sales_person_id: report.salesPersonId,
    sales_person_name: report.salesPerson.name,
    status,
    status_label: statusLabels[status],
    problem: report.problem,
    plan: report.plan,
    visits,
    comments,
    created_at: report.createdAt.toISOString(),
    updated_at: report.updatedAt.toISOString(),
  };
}

export default async function ReportDetailPage({
  params,
}: ReportDetailPageProps) {
  // 認証チェック
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // パラメータを取得
  const { id } = await params;
  const reportId = parseInt(id, 10);

  if (isNaN(reportId)) {
    notFound();
  }

  // 日報データを取得
  const report = await getReport(
    reportId,
    session.user.id,
    session.user.isManager
  );

  if (!report) {
    notFound();
  }

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
        <h1 className="text-2xl font-bold">日報詳細</h1>
        <ReportDetailView
          report={report}
          currentUser={{
            id: session.user.id,
            isManager: session.user.isManager,
          }}
        />
      </div>
    </AuthenticatedLayout>
  );
}
