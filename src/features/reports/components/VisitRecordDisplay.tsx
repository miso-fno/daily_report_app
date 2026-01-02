"use client";

import { Building2, Clock, FileText, Target, CheckCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { VisitRecord } from "../types";

interface VisitRecordDisplayProps {
  visits: VisitRecord[];
}

/**
 * 訪問記録表示コンポーネント
 * 訪問記録一覧を表示
 */
export function VisitRecordDisplay({ visits }: VisitRecordDisplayProps) {
  if (visits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">訪問記録</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            訪問記録はありません。
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">訪問記録</CardTitle>
        <CardDescription>{visits.length}件の訪問</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {visits.map((visit, index) => (
            <div
              key={visit.visit_id}
              className="rounded-lg border p-4"
              role="article"
              aria-label={`訪問記録 ${index + 1}: ${visit.customer_name}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="font-medium">{visit.customer_name}</span>
                </div>
                {visit.visit_time && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <span>{visit.visit_time}</span>
                  </div>
                )}
              </div>

              <dl className="grid gap-3 text-sm">
                {visit.visit_purpose && (
                  <div>
                    <dt className="flex items-center gap-1 font-medium text-muted-foreground">
                      <Target className="h-3 w-3" aria-hidden="true" />
                      訪問目的
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap">
                      {visit.visit_purpose}
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="flex items-center gap-1 font-medium text-muted-foreground">
                    <FileText className="h-3 w-3" aria-hidden="true" />
                    訪問内容
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap">
                    {visit.visit_content}
                  </dd>
                </div>

                {visit.visit_result && (
                  <div>
                    <dt className="flex items-center gap-1 font-medium text-muted-foreground">
                      <CheckCircle className="h-3 w-3" aria-hidden="true" />
                      訪問結果
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap">
                      {visit.visit_result}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
