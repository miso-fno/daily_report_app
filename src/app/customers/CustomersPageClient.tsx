"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  CustomerSearchForm,
  CustomerTable,
  type CustomerSearchFormValues,
  type Customer,
  type PaginationInfo,
  type SortField,
  type SortOrder,
} from "@/components/customers";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { canPerformAction } from "@/types/auth";

import type { Session } from "next-auth";

interface CustomerListResponse {
  success: boolean;
  data?: {
    items: Customer[];
    pagination: PaginationInfo;
  };
  error?: {
    code: string;
    message: string;
  };
}

const DEFAULT_PER_PAGE = 20;

function CustomersPageContent() {
  const { user } = useAuth();
  const canEdit = user ? canPerformAction("customer:edit", user.role) : false;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    per_page: DEFAULT_PER_PAGE,
    current_page: 1,
    last_page: 1,
  });
  const [searchValues, setSearchValues] = useState<CustomerSearchFormValues>({
    customerName: "",
  });
  const [appliedSearch, setAppliedSearch] = useState<string>("");
  const [sort, setSort] = useState<SortField>("created_at");
  const [order, setOrder] = useState<SortOrder>("desc");
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomers = useCallback(
    async (
      page: number,
      customerName: string,
      sortField: SortField,
      sortOrder: SortOrder
    ) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          per_page: String(DEFAULT_PER_PAGE),
          sort: sortField,
          order: sortOrder,
        });

        if (customerName) {
          params.set("customer_name", customerName);
        }

        const response = await fetch(`/api/v1/customers?${params.toString()}`);
        const data: CustomerListResponse = await response.json();

        if (data.success && data.data) {
          setCustomers(data.data.items);
          setPagination(data.data.pagination);
        } else {
          toast.error(data.error?.message || "顧客一覧の取得に失敗しました");
        }
      } catch {
        toast.error("顧客一覧の取得に失敗しました");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Initial fetch
  useEffect(() => {
    fetchCustomers(1, "", sort, order);
  }, [fetchCustomers, sort, order]);

  const handleSearch = useCallback(() => {
    setAppliedSearch(searchValues.customerName);
    fetchCustomers(1, searchValues.customerName, sort, order);
  }, [searchValues.customerName, sort, order, fetchCustomers]);

  const handleClear = useCallback(() => {
    setAppliedSearch("");
    fetchCustomers(1, "", sort, order);
  }, [sort, order, fetchCustomers]);

  const handlePageChange = useCallback(
    (page: number) => {
      fetchCustomers(page, appliedSearch, sort, order);
    },
    [appliedSearch, sort, order, fetchCustomers]
  );

  const handleSortChange = useCallback(
    (newSort: SortField, newOrder: SortOrder) => {
      setSort(newSort);
      setOrder(newOrder);
      fetchCustomers(1, appliedSearch, newSort, newOrder);
    },
    [appliedSearch, fetchCustomers]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">顧客マスタ</h1>
        {canEdit && (
          <Button asChild>
            <Link href="/customers/new">
              <Plus className="h-4 w-4 mr-2" />
              新規登録
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">検索条件</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerSearchForm
            values={searchValues}
            onChange={setSearchValues}
            onSearch={handleSearch}
            onClear={handleClear}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">顧客一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerTable
            customers={customers}
            pagination={pagination}
            sort={sort}
            order={order}
            onPageChange={handlePageChange}
            onSortChange={handleSortChange}
            isLoading={isLoading}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>
    </div>
  );
}

interface CustomersPageClientProps {
  session: Session | null;
}

export default function CustomersPageClient({
  session,
}: CustomersPageClientProps) {
  return (
    <AuthenticatedLayout session={session}>
      <CustomersPageContent />
    </AuthenticatedLayout>
  );
}
