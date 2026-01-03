"use client";

import { Eye } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReportStatusBadge } from "@/features/reports/components/ReportStatusBadge";

import type { RecentReportsListProps } from "../types";

/**
 * 日付をフォーマットする
 * @param dateString YYYY-MM-DD形式の日付文字列
 * @returns YYYY/MM/DD形式の日付文字列
 */
function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-");
  return `${year}/${month}/${day}`;
}

/**
 * 最近の日報リストコンポーネント
 * ダッシュボードに表示する直近の日報一覧
 */
export function RecentReportsList({ reports }: RecentReportsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>最近の日報</CardTitle>
        <CardDescription>直近5件の日報</CardDescription>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-muted-foreground">
            日報がありません
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>報告日</TableHead>
                  <TableHead className="text-center">訪問件数</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead className="w-20">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.report_id}>
                    <TableCell>{formatDate(report.report_date)}</TableCell>
                    <TableCell className="text-center">
                      {report.visit_count}件
                    </TableCell>
                    <TableCell>
                      <ReportStatusBadge status={report.status} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/reports/${report.report_id}`}>
                          <Eye className="mr-1 h-4 w-4" />
                          詳細
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
