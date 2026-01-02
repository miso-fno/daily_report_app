"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PaginationProps {
  /** 現在のページ番号（1始まり） */
  currentPage: number;
  /** 最終ページ番号 */
  lastPage: number;
  /** 総件数 */
  total: number;
  /** 1ページあたりの表示件数 */
  perPage: number;
  /** ページ変更時のコールバック */
  onPageChange: (page: number) => void;
  /** 表示件数変更時のコールバック */
  onPerPageChange?: (perPage: number) => void;
  /** 表示件数のオプション */
  perPageOptions?: number[];
  /** ページ番号直接入力を許可するかどうか */
  allowDirectInput?: boolean;
}

const DEFAULT_PER_PAGE_OPTIONS = [10, 20, 50];

export function Pagination({
  currentPage,
  lastPage,
  total,
  perPage,
  onPageChange,
  onPerPageChange,
  perPageOptions = DEFAULT_PER_PAGE_OPTIONS,
  allowDirectInput = true,
}: PaginationProps) {
  const [inputPage, setInputPage] = React.useState<string>(
    currentPage.toString()
  );
  const [isInputFocused, setIsInputFocused] = React.useState(false);

  // currentPageが外部から変更された場合にinputPageを同期
  React.useEffect(() => {
    if (!isInputFocused) {
      setInputPage(currentPage.toString());
    }
  }, [currentPage, isInputFocused]);

  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < lastPage;

  // 表示範囲の計算
  const startItem = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, total);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 数字のみ許可
    if (value === "" || /^\d+$/.test(value)) {
      setInputPage(value);
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      submitPageInput();
    }
  };

  const handlePageInputBlur = () => {
    setIsInputFocused(false);
    submitPageInput();
  };

  const submitPageInput = () => {
    const pageNum = parseInt(inputPage, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= lastPage) {
      if (pageNum !== currentPage) {
        onPageChange(pageNum);
      }
    } else {
      // 無効な値の場合は現在のページに戻す
      setInputPage(currentPage.toString());
    }
  };

  const handlePerPageChange = (value: string) => {
    const newPerPage = parseInt(value, 10);
    if (onPerPageChange) {
      onPerPageChange(newPerPage);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* 件数表示 */}
      <p className="text-sm text-muted-foreground" aria-live="polite">
        全{total.toLocaleString()}件中 {startItem.toLocaleString()}〜
        {endItem.toLocaleString()}件を表示
      </p>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* 表示件数切り替え */}
        {onPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">表示件数:</span>
            <Select
              value={perPage.toString()}
              onValueChange={handlePerPageChange}
            >
              <SelectTrigger
                className="w-20"
                aria-label="1ページあたりの表示件数"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {perPageOptions.map((option) => (
                  <SelectItem key={option} value={option.toString()}>
                    {option}件
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* ページ移動 */}
        <div className="flex items-center gap-1">
          {/* 先頭ページへ */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            disabled={!hasPrevPage}
            aria-label="最初のページへ"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          {/* 前ページへ */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPrevPage}
            aria-label="前のページへ"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* ページ番号直接入力 */}
          {allowDirectInput ? (
            <div className="flex items-center gap-1 px-2">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={inputPage}
                onChange={handlePageInputChange}
                onKeyDown={handlePageInputKeyDown}
                onFocus={() => setIsInputFocused(true)}
                onBlur={handlePageInputBlur}
                className="h-9 w-14 text-center"
                aria-label="ページ番号を入力"
              />
              <span className="text-sm text-muted-foreground">
                / {lastPage.toLocaleString()}
              </span>
            </div>
          ) : (
            <span className="px-2 text-sm">
              {currentPage} / {lastPage}
            </span>
          )}

          {/* 次ページへ */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNextPage}
            aria-label="次のページへ"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* 最終ページへ */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(lastPage)}
            disabled={!hasNextPage}
            aria-label="最後のページへ"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
