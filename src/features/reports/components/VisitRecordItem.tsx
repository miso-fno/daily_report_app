"use client";

import { X } from "lucide-react";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { ReportFormValues } from "../schemas";
import type { CustomerOption } from "../types";

interface VisitRecordItemProps {
  /** 配列内のインデックス */
  index: number;
  /** 顧客選択肢 */
  customers: CustomerOption[];
  /** 削除コールバック */
  onRemove: () => void;
  /** フォームが無効かどうか */
  disabled?: boolean;
}

/**
 * 訪問記録入力項目コンポーネント
 */
export function VisitRecordItem({
  index,
  customers,
  onRemove,
  disabled = false,
}: VisitRecordItemProps) {
  const { control } = useFormContext<ReportFormValues>();

  return (
    <div
      className="relative rounded-lg border bg-muted/30 p-4"
      role="group"
      aria-label={`訪問記録 ${index + 1}`}
    >
      {/* 削除ボタン */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`訪問記録 ${index + 1} を削除`}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="grid gap-4">
        {/* 1行目: 顧客名、訪問時間 */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={control}
            name={`visits.${index}.customer_id`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  顧客名 <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="顧客を選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem
                        key={customer.customer_id}
                        value={customer.customer_id.toString()}
                      >
                        {customer.customer_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name={`visits.${index}.visit_time`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>訪問時間</FormLabel>
                <FormControl>
                  <Input
                    type="time"
                    disabled={disabled}
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 2行目: 訪問目的 */}
        <FormField
          control={control}
          name={`visits.${index}.visit_purpose`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>訪問目的</FormLabel>
              <FormControl>
                <Input
                  placeholder="訪問目的を入力してください（最大100文字）"
                  maxLength={100}
                  disabled={disabled}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 3行目: 訪問内容 */}
        <FormField
          control={control}
          name={`visits.${index}.visit_content`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                訪問内容 <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="訪問内容を入力してください（最大1000文字）"
                  rows={3}
                  maxLength={1000}
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 4行目: 訪問結果 */}
        <FormField
          control={control}
          name={`visits.${index}.visit_result`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>訪問結果</FormLabel>
              <FormControl>
                <Input
                  placeholder="訪問結果を入力してください（最大200文字）"
                  maxLength={200}
                  disabled={disabled}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
