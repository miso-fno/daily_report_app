"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

/**
 * 日本の電話番号形式の正規表現
 */
const PHONE_REGEX = /^(0[0-9]{1,4}-?[0-9]{1,4}-?[0-9]{4}|0[0-9]{9,10})$/;

/**
 * 顧客フォームのバリデーションスキーマ
 */
const customerFormSchema = z.object({
  customer_name: z
    .string()
    .min(1, "顧客名は必須です")
    .max(100, "顧客名は100文字以内で入力してください"),
  address: z.string().max(200, "住所は200文字以内で入力してください"),
  phone: z.string().refine((val) => !val || PHONE_REGEX.test(val), {
    message:
      "電話番号の形式が正しくありません（例: 03-1234-5678, 090-1234-5678）",
  }),
  contact_person: z.string().max(50, "担当者名は50文字以内で入力してください"),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

export interface CustomerFormData {
  customer_name: string;
  address: string | null;
  phone: string | null;
  contact_person: string | null;
}

interface CustomerFormProps {
  mode: "create" | "edit";
  initialData?: CustomerFormData;
  onSubmit: (data: CustomerFormValues) => Promise<void>;
  onDelete?: () => void;
  isSubmitting?: boolean;
  isDeleting?: boolean;
  error?: string | null;
}

export function CustomerForm({
  mode,
  initialData,
  onSubmit,
  onDelete,
  isSubmitting = false,
  isDeleting = false,
  error,
}: CustomerFormProps) {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      customer_name: initialData?.customer_name ?? "",
      address: initialData?.address ?? "",
      phone: initialData?.phone ?? "",
      contact_person: initialData?.contact_person ?? "",
    },
  });

  const isProcessing = isSubmitting || isDeleting;

  const handleFormSubmit = async (data: CustomerFormValues) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="customer_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                顧客名 <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="例: 株式会社サンプル"
                  disabled={isProcessing}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>住所</FormLabel>
              <FormControl>
                <Input
                  placeholder="例: 東京都千代田区丸の内1-1-1"
                  disabled={isProcessing}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>電話番号</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="例: 03-1234-5678"
                  disabled={isProcessing}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact_person"
          render={({ field }) => (
            <FormItem>
              <FormLabel>担当者名</FormLabel>
              <FormControl>
                <Input
                  placeholder="例: 山田 太郎"
                  disabled={isProcessing}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-between pt-4">
          <div>
            {mode === "edit" && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                disabled={isProcessing}
              >
                {isDeleting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                削除
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              asChild
              disabled={isProcessing}
            >
              <Link href="/customers">キャンセル</Link>
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {mode === "create" ? "登録" : "更新"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
