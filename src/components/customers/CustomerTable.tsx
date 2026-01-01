"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Customer {
  customer_id: number;
  customer_name: string;
  address: string | null;
  contact_person: string | null;
}

export interface PaginationInfo {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export type SortField = "customer_name" | "created_at";
export type SortOrder = "asc" | "desc";

interface CustomerTableProps {
  customers: Customer[];
  pagination: PaginationInfo;
  sort: SortField;
  order: SortOrder;
  onPageChange: (page: number) => void;
  onSortChange: (sort: SortField, order: SortOrder) => void;
  isLoading?: boolean;
  canEdit?: boolean;
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-4 w-8" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-40" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-48" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-16" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

function SortIcon({
  field,
  currentSort,
  currentOrder,
}: {
  field: SortField;
  currentSort: SortField;
  currentOrder: SortOrder;
}) {
  if (field !== currentSort) {
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  }
  return currentOrder === "asc" ? (
    <ArrowUp className="ml-2 h-4 w-4" />
  ) : (
    <ArrowDown className="ml-2 h-4 w-4" />
  );
}

export function CustomerTable({
  customers,
  pagination,
  sort,
  order,
  onPageChange,
  onSortChange,
  isLoading = false,
  canEdit = false,
}: CustomerTableProps) {
  const { total, per_page, current_page, last_page } = pagination;

  const handleSort = useCallback(
    (field: SortField) => {
      if (field === sort) {
        // Toggle order
        onSortChange(field, order === "asc" ? "desc" : "asc");
      } else {
        // New field, default to ascending
        onSortChange(field, "asc");
      }
    },
    [sort, order, onSortChange]
  );

  const startIndex = total > 0 ? (current_page - 1) * per_page + 1 : 0;
  const endIndex = Math.min(current_page * per_page, total);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">No</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("customer_name")}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                  disabled={isLoading}
                >
                  顧客名
                  <SortIcon
                    field="customer_name"
                    currentSort={sort}
                    currentOrder={order}
                  />
                </Button>
              </TableHead>
              <TableHead>住所</TableHead>
              <TableHead>担当者名</TableHead>
              <TableHead className="w-24">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton />
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  顧客データがありません
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer, index) => (
                <TableRow key={customer.customer_id}>
                  <TableCell className="font-medium">
                    {startIndex + index}
                  </TableCell>
                  <TableCell>{customer.customer_name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {customer.address || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {customer.contact_person || "-"}
                  </TableCell>
                  <TableCell>
                    {canEdit && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          href={`/customers/${customer.customer_id}/edit`}
                          aria-label={`${customer.customer_name}を編集`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {total > 0 ? `${startIndex} - ${endIndex} / ${total}件` : "0件"}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            disabled={current_page === 1 || isLoading}
            aria-label="最初のページ"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(current_page - 1)}
            disabled={current_page === 1 || isLoading}
            aria-label="前のページ"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {current_page} / {last_page || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(current_page + 1)}
            disabled={current_page >= last_page || isLoading}
            aria-label="次のページ"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(last_page)}
            disabled={current_page >= last_page || isLoading}
            aria-label="最後のページ"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
