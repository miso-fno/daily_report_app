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

import { DEPARTMENTS } from "../constants";
import { searchFormSchema } from "../schemas";

import type { SearchFormValues } from "../schemas";

interface SalesPersonsSearchFormProps {
  defaultValues?: SearchFormValues;
  onSearch: (values: SearchFormValues) => void;
  onClear: () => void;
  isLoading?: boolean;
}

export function SalesPersonsSearchForm({
  defaultValues,
  onSearch,
  onClear,
  isLoading,
}: SalesPersonsSearchFormProps) {
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      department: defaultValues?.department || "_all",
    },
  });

  const handleClear = () => {
    form.reset({ name: "", department: "_all" });
    onClear();
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSearch)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>氏名</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="氏名で検索"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>部署</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                      disabled={isLoading ?? false}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="全て" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_all">全て</SelectItem>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept.value} value={dept.value}>
                            {dept.label}
                          </SelectItem>
                        ))}
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
