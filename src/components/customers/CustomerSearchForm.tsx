"use client";

import { Search, X } from "lucide-react";
import { useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface CustomerSearchFormValues {
  customerName: string;
}

interface CustomerSearchFormProps {
  values: CustomerSearchFormValues;
  onChange: (values: CustomerSearchFormValues) => void;
  onSearch: () => void;
  onClear: () => void;
  isLoading?: boolean;
}

export function CustomerSearchForm({
  values,
  onChange,
  onSearch,
  onClear,
  isLoading = false,
}: CustomerSearchFormProps) {
  const handleCustomerNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...values, customerName: e.target.value });
    },
    [values, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSearch();
      }
    },
    [onSearch]
  );

  const handleClear = useCallback(() => {
    onChange({ customerName: "" });
    onClear();
  }, [onChange, onClear]);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="customerName">顧客名</Label>
        <Input
          id="customerName"
          type="text"
          placeholder="顧客名で検索（部分一致）"
          value={values.customerName}
          onChange={handleCustomerNameChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          aria-label="顧客名で検索"
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={onSearch}
          disabled={isLoading}
          aria-label="検索"
        >
          <Search className="h-4 w-4 mr-2" />
          検索
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleClear}
          disabled={isLoading}
          aria-label="クリア"
        >
          <X className="h-4 w-4 mr-2" />
          クリア
        </Button>
      </div>
    </div>
  );
}
