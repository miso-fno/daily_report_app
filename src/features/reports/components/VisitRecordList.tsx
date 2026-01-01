"use client";

import { Plus } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";

import { getDefaultVisitRecordValues } from "../schemas";
import { VisitRecordItem } from "./VisitRecordItem";

import type { ReportFormValues } from "../schemas";
import type { CustomerOption } from "../types";

interface VisitRecordListProps {
  /** 顧客選択肢 */
  customers: CustomerOption[];
  /** フォームが無効かどうか */
  disabled?: boolean;
}

/**
 * 訪問記録リストコンポーネント
 * useFieldArrayを使用して動的に訪問記録を追加・削除する
 */
export function VisitRecordList({
  customers,
  disabled = false,
}: VisitRecordListProps) {
  const { control, formState } = useFormContext<ReportFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "visits",
  });

  const handleAddVisit = () => {
    append(getDefaultVisitRecordValues());
  };

  // visitsフィールドのエラーを取得
  const visitsError = formState.errors.visits;
  const hasArrayError =
    visitsError && !Array.isArray(visitsError) && visitsError.message;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">訪問記録</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddVisit}
          disabled={disabled}
        >
          <Plus className="mr-1 h-4 w-4" />
          訪問を追加
        </Button>
      </div>

      {/* 訪問記録が0件の場合のメッセージ */}
      {fields.length === 0 && (
        <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
          <p>訪問記録がありません</p>
          <p className="text-sm">
            「訪問を追加」ボタンをクリックして訪問記録を追加してください
          </p>
        </div>
      )}

      {/* 配列レベルのエラー表示 */}
      {hasArrayError && (
        <p className="text-sm text-destructive" role="alert">
          {visitsError.message}
        </p>
      )}

      {/* 訪問記録リスト */}
      <div className="space-y-4">
        {fields.map((field, index) => (
          <VisitRecordItem
            key={field.id}
            index={index}
            customers={customers}
            onRemove={() => remove(index)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
