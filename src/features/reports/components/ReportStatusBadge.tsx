"use client";

import { Badge } from "@/components/ui/badge";
import { ReportStatus, getStatusLabel } from "@/lib/api/schemas/report";

import { STATUS_BADGE_COLORS } from "../constants";

import type { ReportStatusType } from "@/lib/api/schemas/report";

interface ReportStatusBadgeProps {
  status: ReportStatusType;
  className?: string;
}

/**
 * 日報ステータスバッジコンポーネント
 * - 下書き（draft）: グレー
 * - 提出済（submitted）: 青
 * - 確認済（confirmed）: 緑
 */
export function ReportStatusBadge({
  status,
  className,
}: ReportStatusBadgeProps) {
  const colorClass =
    STATUS_BADGE_COLORS[status] || STATUS_BADGE_COLORS[ReportStatus.DRAFT];
  const label = getStatusLabel(status);

  return (
    <Badge className={`${colorClass} ${className || ""}`} variant="secondary">
      {label}
    </Badge>
  );
}
