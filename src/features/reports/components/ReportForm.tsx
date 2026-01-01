"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { createReport, fetchCustomersForSelect, updateReport } from "../api";
import {
  convertFormToApiRequest,
  getDefaultReportFormValues,
  reportFormSchema,
  validateForSubmission,
  validateReportDate,
} from "../schemas";
import { VisitRecordList } from "./VisitRecordList";

import type { ReportFormValues, VisitRecordFormValues } from "../schemas";
import type { CustomerOption, ReportDetail } from "../types";

interface ReportFormProps {
  /** 編集モードの場合は既存の日報データ */
  report?: ReportDetail;
  /** 編集モードかどうか */
  isEdit?: boolean;
}

/**
 * 日報フォームコンポーネント
 * 作成画面・編集画面共通で使用
 */
export function ReportForm({ report, isEdit = false }: ReportFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);

  // 既存データをフォーム形式に変換
  const getInitialValues = (): ReportFormValues => {
    if (!report) {
      return getDefaultReportFormValues();
    }

    return {
      report_date: report.report_date,
      problem: report.problem ?? "",
      plan: report.plan ?? "",
      visits: report.visits.map(
        (visit): VisitRecordFormValues => ({
          customer_id: visit.customer_id.toString(),
          visit_time: visit.visit_time ?? "",
          visit_purpose: visit.visit_purpose ?? "",
          visit_content: visit.visit_content,
          visit_result: visit.visit_result ?? "",
        })
      ),
    };
  };

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: getInitialValues(),
  });

  // 顧客一覧を取得
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const response = await fetchCustomersForSelect();
        setCustomers(
          response.data.items.map((item) => ({
            customer_id: item.customer_id,
            customer_name: item.customer_name,
          }))
        );
      } catch (err) {
        console.error("顧客一覧の取得に失敗しました:", err);
        setError("顧客一覧の取得に失敗しました");
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    loadCustomers();
  }, []);

  // 下書き保存
  const handleSaveDraft = () => {
    setError(null);

    // 報告日のバリデーション
    const reportDate = form.getValues("report_date");
    const dateError = validateReportDate(reportDate);
    if (dateError) {
      setError(dateError);
      return;
    }

    startTransition(async () => {
      try {
        const values = form.getValues();
        const apiData = convertFormToApiRequest(values, "draft");

        if (isEdit && report) {
          await updateReport(report.report_id, apiData);
        } else {
          await createReport(apiData);
        }

        router.push("/reports");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "保存に失敗しました");
      }
    });
  };

  // 提出
  const handleSubmit = form.handleSubmit(async (values) => {
    setError(null);

    // 提出時のバリデーション
    const validationErrors = validateForSubmission(values);
    if (validationErrors.length > 0) {
      setError(validationErrors.join("\n"));
      return;
    }

    startTransition(async () => {
      try {
        const apiData = convertFormToApiRequest(values, "submitted");

        if (isEdit && report) {
          await updateReport(report.report_id, apiData);
        } else {
          await createReport(apiData);
        }

        router.push("/reports");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "提出に失敗しました");
      }
    });
  });

  const handleCancel = () => {
    router.push("/reports");
  };

  // 今日の日付（最大値として使用）
  const today = new Date().toISOString().split("T")[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "日報編集" : "日報作成"}</CardTitle>
      </CardHeader>
      <CardContent>
        <FormProvider {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="whitespace-pre-wrap">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* 報告日 */}
            <FormField
              control={form.control}
              name="report_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    報告日 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      max={today}
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* 訪問記録 */}
            {isLoadingCustomers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">
                  顧客データを読み込み中...
                </span>
              </div>
            ) : (
              <VisitRecordList customers={customers} disabled={isPending} />
            )}

            <Separator />

            {/* 課題・相談 */}
            <FormField
              control={form.control}
              name="problem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>課題・相談</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="課題や相談事項があれば入力してください（最大2000文字）"
                      rows={4}
                      maxLength={2000}
                      disabled={isPending}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 明日の予定 */}
            <FormField
              control={form.control}
              name="plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>明日の予定</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="明日の予定を入力してください（最大2000文字）"
                      rows={4}
                      maxLength={2000}
                      disabled={isPending}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ボタンエリア */}
            <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isPending}
                asChild
              >
                <Link href="/reports">キャンセル</Link>
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleSaveDraft}
                disabled={isPending || isLoadingCustomers}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                下書き保存
              </Button>
              <Button type="submit" disabled={isPending || isLoadingCustomers}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                提出
              </Button>
            </div>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
