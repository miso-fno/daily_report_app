"use client";

import { Eye } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ReportStatusBadge } from "./ReportStatusBadge";

import type { ReportListItem } from "../types";

interface ReportsTableProps {
  reports: ReportListItem[];
  startIndex: number;
}

/**
 * 日付をフォーマットする
 * @param dateString YYYY-MM-DD形式の日付文字列
 * @returns YYYY/MM/DD形式の日付文字列
 */
function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-");
  return `${year}/${month}/${day}`;
}

export function ReportsTable({ reports, startIndex }: ReportsTableProps) {
  if (reports.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-md border text-muted-foreground">
        該当する日報が見つかりませんでした
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">No</TableHead>
            <TableHead className="w-32">報告日</TableHead>
            <TableHead>担当者</TableHead>
            <TableHead className="w-24 text-center">訪問件数</TableHead>
            <TableHead className="w-28">ステータス</TableHead>
            <TableHead className="w-24">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report, index) => (
            <TableRow key={report.report_id}>
              <TableCell className="font-medium">
                {startIndex + index + 1}
              </TableCell>
              <TableCell>{formatDate(report.report_date)}</TableCell>
              <TableCell>{report.sales_person_name}</TableCell>
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
  );
}
