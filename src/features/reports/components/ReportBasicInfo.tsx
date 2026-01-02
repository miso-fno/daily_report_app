"use client";

import { CalendarDays, User } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ReportStatusBadge } from "./ReportStatusBadge";

import type { ReportStatusType } from "@/lib/api/schemas/report";

interface ReportBasicInfoProps {
  reportDate: string;
  salesPersonName: string;
  status: ReportStatusType;
}

/**
 * 日報基本情報表示コンポーネント
 * 報告日、担当者名、ステータスを表示
 */
export function ReportBasicInfo({
  reportDate,
  salesPersonName,
  status,
}: ReportBasicInfoProps) {
  // 日付をフォーマット
  const formattedDate = new Date(reportDate).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">基本情報</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-start gap-2">
            <CalendarDays
              className="mt-0.5 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                報告日
              </dt>
              <dd className="text-sm">{formattedDate}</dd>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <User
              className="mt-0.5 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                担当者
              </dt>
              <dd className="text-sm">{salesPersonName}</dd>
            </div>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">
              ステータス
            </dt>
            <dd className="mt-1">
              <ReportStatusBadge status={status} />
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
