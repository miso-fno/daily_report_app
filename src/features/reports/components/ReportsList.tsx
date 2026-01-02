"use client";

import { AlertCircle, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Pagination } from "@/components/common/Pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

import { fetchReports, fetchSelectableSalesPersons } from "../api";
import { DEFAULT_PER_PAGE } from "../constants";
import { convertSearchFormToParams } from "../schemas";
import { ReportsListSkeleton } from "./ReportsListSkeleton";
import { ReportsSearchForm } from "./ReportsSearchForm";
import { ReportsTable } from "./ReportsTable";

import type { SearchFormValues } from "../schemas";
import type {
  Pagination as PaginationType,
  ReportListItem,
  SalesPersonOption,
} from "../types";

export function ReportsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [salesPersons, setSalesPersons] = useState<SalesPersonOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URLパラメータから初期値を取得
  const initialDateFrom = searchParams.get("date_from") || "";
  const initialDateTo = searchParams.get("date_to") || "";
  const initialSalesPersonId = searchParams.get("sales_person_id") || "";
  const initialStatus = searchParams.get("status") || "";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  // ユーザーが上長かどうか
  const isManager = user?.role === "manager" || user?.role === "admin";
  const currentUserId = user?.id || 0;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 営業担当者一覧を取得
      const salesPersonsResponse = await fetchSelectableSalesPersons();
      setSalesPersons(salesPersonsResponse.data.items);

      // 検索パラメータを構築
      const dateFrom = searchParams.get("date_from");
      const dateTo = searchParams.get("date_to");
      const salesPersonId = searchParams.get("sales_person_id");
      const status = searchParams.get("status");
      const page = parseInt(searchParams.get("page") || "1", 10);
      const sort =
        (searchParams.get("sort") as "report_date" | "created_at") ||
        "report_date";
      const order = (searchParams.get("order") as "asc" | "desc") || "desc";

      const response = await fetchReports({
        ...(dateFrom ? { date_from: dateFrom } : {}),
        ...(dateTo ? { date_to: dateTo } : {}),
        ...(salesPersonId && salesPersonId !== "_all"
          ? { sales_person_id: parseInt(salesPersonId, 10) }
          : {}),
        ...(status && status !== "_all"
          ? { status: status as "draft" | "submitted" | "confirmed" }
          : {}),
        page,
        per_page: DEFAULT_PER_PAGE,
        sort,
        order,
      });

      setReports(response.data.items);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "データの取得に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateSearchParams = useCallback(
    (params: Record<string, string | undefined>) => {
      const newParams = new URLSearchParams(searchParams.toString());

      Object.entries(params).forEach(([key, value]) => {
        if (value) {
          newParams.set(key, value);
        } else {
          newParams.delete(key);
        }
      });

      router.push(`/reports?${newParams.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = useCallback(
    (values: SearchFormValues) => {
      const params = convertSearchFormToParams(values);
      updateSearchParams({
        date_from: params.date_from,
        date_to: params.date_to,
        sales_person_id: params.sales_person_id?.toString(),
        status: params.status,
        page: "1", // 検索時は1ページ目に戻る
      });
    },
    [updateSearchParams]
  );

  const handleClear = useCallback(() => {
    router.push("/reports");
  }, [router]);

  const handlePageChange = useCallback(
    (page: number) => {
      updateSearchParams({ page: page.toString() });
    },
    [updateSearchParams]
  );

  if (isLoading) {
    return <ReportsListSkeleton />;
  }

  return (
    <div className="space-y-4">
      <ReportsSearchForm
        defaultValues={{
          date_from: initialDateFrom,
          date_to: initialDateTo,
          sales_person_id: initialSalesPersonId || "_all",
          status: initialStatus || "_all",
        }}
        salesPersons={salesPersons}
        currentUserId={currentUserId}
        isManager={isManager}
        onSearch={handleSearch}
        onClear={handleClear}
        isLoading={isLoading}
      />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          検索結果: {pagination?.total || 0}件
        </p>
        <Button asChild>
          <Link href="/reports/new">
            <Plus className="mr-2 h-4 w-4" />
            新規作成
          </Link>
        </Button>
      </div>

      <ReportsTable
        reports={reports}
        startIndex={(initialPage - 1) * DEFAULT_PER_PAGE}
      />

      {pagination && pagination.last_page > 1 && (
        <Pagination
          currentPage={pagination.current_page}
          lastPage={pagination.last_page}
          total={pagination.total}
          perPage={pagination.per_page}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
