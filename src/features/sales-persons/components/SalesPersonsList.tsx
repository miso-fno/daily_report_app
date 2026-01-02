"use client";

import { AlertCircle, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Pagination } from "@/components/common/Pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { fetchSalesPersons } from "../api";
import { DEFAULT_PER_PAGE } from "../constants";
import { SalesPersonsListSkeleton } from "./SalesPersonsListSkeleton";
import { SalesPersonsSearchForm } from "./SalesPersonsSearchForm";
import { SalesPersonsTable } from "./SalesPersonsTable";

import type { SearchFormValues } from "../schemas";
import type {
  Pagination as PaginationType,
  SalesPersonListItem,
} from "../types";

export function SalesPersonsList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [salesPersons, setSalesPersons] = useState<SalesPersonListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URLパラメータから初期値を取得
  const initialName = searchParams.get("name") || "";
  const initialDepartment = searchParams.get("department") || "";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const name = searchParams.get("name");
      const department = searchParams.get("department");
      const page = parseInt(searchParams.get("page") || "1", 10);

      const response = await fetchSalesPersons({
        ...(name ? { name } : {}),
        ...(department ? { department } : {}),
        page,
        per_page: DEFAULT_PER_PAGE,
      });

      setSalesPersons(response.data.items);
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

      router.push(`/sales-persons?${newParams.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = useCallback(
    (values: SearchFormValues) => {
      // "_all" は「全て」を表す特殊値なので、空文字列として扱う
      const department =
        values.department && values.department !== "_all"
          ? values.department
          : undefined;
      updateSearchParams({
        name: values.name || undefined,
        department,
        page: "1", // 検索時は1ページ目に戻る
      });
    },
    [updateSearchParams]
  );

  const handleClear = useCallback(() => {
    router.push("/sales-persons");
  }, [router]);

  const handlePageChange = useCallback(
    (page: number) => {
      updateSearchParams({ page: page.toString() });
    },
    [updateSearchParams]
  );

  if (isLoading) {
    return <SalesPersonsListSkeleton />;
  }

  return (
    <div className="space-y-4">
      <SalesPersonsSearchForm
        defaultValues={{
          name: initialName,
          department: initialDepartment,
        }}
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
          <Link href="/sales-persons/new">
            <Plus className="mr-2 h-4 w-4" />
            新規登録
          </Link>
        </Button>
      </div>

      <SalesPersonsTable
        salesPersons={salesPersons}
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
