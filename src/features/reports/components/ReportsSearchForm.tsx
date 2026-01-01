"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Search, X } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { STATUS_OPTIONS } from "../constants";
import { searchFormSchema } from "../schemas";

import type { SearchFormValues } from "../schemas";
import type { SalesPersonOption } from "../types";

interface ReportsSearchFormProps {
  defaultValues?: SearchFormValues;
  salesPersons: SalesPersonOption[];
  currentUserId: number;
  isManager: boolean;
  onSearch: (values: SearchFormValues) => void;
  onClear: () => void;
  isLoading?: boolean;
}

export function ReportsSearchForm({
  defaultValues,
  salesPersons,
  currentUserId,
  isManager,
  onSearch,
  onClear,
  isLoading,
}: ReportsSearchFormProps) {
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      date_from: defaultValues?.date_from || "",
      date_to: defaultValues?.date_to || "",
      sales_person_id: defaultValues?.sales_person_id || "_all",
      status: defaultValues?.status || "_all",
    },
  });

  const handleClear = () => {
    form.reset({
      date_from: "",
      date_to: "",
      sales_person_id: "_all",
      status: "_all",
    });
    onClear();
  };

  // 選択可能な営業担当者を取得
  // 一般ユーザーは自分のみ、上長は全員を選択可能
  const selectableSalesPersons = isManager
    ? salesPersons
    : salesPersons.filter((sp) => sp.sales_person_id === currentUserId);

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSearch)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <FormField
                control={form.control}
                name="date_from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>期間（開始）</FormLabel>
                    <FormControl>
                      <Input type="date" disabled={isLoading} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>期間（終了）</FormLabel>
                    <FormControl>
                      <Input type="date" disabled={isLoading} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sales_person_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>担当者</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? "_all"}
                      disabled={(isLoading ?? false) || !isManager}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="全て" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isManager && (
                          <SelectItem value="_all">全て</SelectItem>
                        )}
                        {selectableSalesPersons.map((person) => (
                          <SelectItem
                            key={person.sales_person_id}
                            value={person.sales_person_id.toString()}
                          >
                            {person.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ステータス</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? "_all"}
                      disabled={isLoading ?? false}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="全て" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_all">全て</SelectItem>
                        {STATUS_OPTIONS.filter((opt) => opt.value !== "").map(
                          (option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                disabled={isLoading}
              >
                <X className="mr-2 h-4 w-4" />
                クリア
              </Button>
              <Button type="submit" disabled={isLoading}>
                <Search className="mr-2 h-4 w-4" />
                検索
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
