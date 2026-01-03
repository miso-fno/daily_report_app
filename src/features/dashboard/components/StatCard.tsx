"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { StatCardProps } from "../types";

/**
 * 統計カードコンポーネント
 * ダッシュボードに表示する統計情報を表示するカード
 */
export function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
