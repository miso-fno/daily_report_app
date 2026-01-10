"use client";

import dynamic from "next/dynamic";

import { ReportFormSkeleton } from "./ReportFormSkeleton";

import type { ReportDetail } from "@/features/reports/types";

// ReportFormを遅延読み込み（フォームは重いコンポーネント）
const ReportForm = dynamic(
  () =>
    import("@/features/reports/components/ReportForm").then(
      (mod) => mod.ReportForm
    ),
  {
    loading: () => <ReportFormSkeleton />,
    ssr: false, // クライアントサイドでのみレンダリング
  }
);

interface ReportFormWrapperProps {
  /** 編集モードの場合は既存の日報データ */
  report?: ReportDetail;
  /** 編集モードかどうか */
  isEdit?: boolean;
}

/**
 * ReportFormのClient Componentラッパー
 *
 * Server Componentからdynamic importでssr: falseを使用するために必要
 */
export function ReportFormWrapper({ report, isEdit }: ReportFormWrapperProps) {
  // exactOptionalPropertyTypes対応: undefinedを明示的に渡さない
  if (report && isEdit) {
    return <ReportForm report={report} isEdit={isEdit} />;
  }
  if (report) {
    return <ReportForm report={report} />;
  }
  if (isEdit) {
    return <ReportForm isEdit={isEdit} />;
  }
  return <ReportForm />;
}
