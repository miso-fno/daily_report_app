"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  lastPage,
  total,
  onPageChange,
}: PaginationProps) {
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < lastPage;

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        全{total}件中 {currentPage}ページ / {lastPage}ページ
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage}
          aria-label="前のページ"
        >
          <ChevronLeft className="h-4 w-4" />
          前へ
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage}
          aria-label="次のページ"
        >
          次へ
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
