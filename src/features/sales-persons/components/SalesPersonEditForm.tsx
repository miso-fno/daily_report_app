"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { deleteSalesPerson, fetchManagers, updateSalesPerson } from "../api";
import { DEPARTMENTS, isManagerToRoleValue, ROLES } from "../constants";
import {
  convertFormToApiRequest,
  updateSalesPersonFormSchema,
} from "../schemas";

import type { UpdateSalesPersonFormValues } from "../schemas";
import type { SalesPersonListItem, SalesPersonResponse } from "../types";

interface SalesPersonEditFormProps {
  salesPerson: SalesPersonResponse;
}

export function SalesPersonEditForm({ salesPerson }: SalesPersonEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [managers, setManagers] = useState<SalesPersonListItem[]>([]);
  const [isLoadingManagers, setIsLoadingManagers] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 上長一覧を取得（自分自身を除外）
  useEffect(() => {
    const loadManagers = async () => {
      try {
        const response = await fetchManagers();
        const filteredManagers = response.data.items.filter(
          (m) => m.sales_person_id !== salesPerson.sales_person_id
        );
        setManagers(filteredManagers);
      } catch (err) {
        console.error("上長一覧の取得に失敗しました:", err);
      } finally {
        setIsLoadingManagers(false);
      }
    };

    loadManagers();
  }, [salesPerson.sales_person_id]);

  const form = useForm<UpdateSalesPersonFormValues>({
    resolver: zodResolver(updateSalesPersonFormSchema),
    defaultValues: {
      name: salesPerson.name,
      email: salesPerson.email,
      password: "",
      department: salesPerson.department,
      manager_id: salesPerson.manager_id?.toString() || "",
      role: isManagerToRoleValue(salesPerson.is_manager),
    },
  });

  const onSubmit = async (data: UpdateSalesPersonFormValues) => {
    setError(null);

    startTransition(async () => {
      try {
        const apiData = convertFormToApiRequest(data, true);
        await updateSalesPerson(salesPerson.sales_person_id, apiData);
        router.push("/sales-persons");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "更新に失敗しました");
      }
    });
  };

  const handleDelete = async () => {
    setDeleteError(null);
    setIsDeleting(true);

    try {
      await deleteSalesPerson(salesPerson.sales_person_id);
      setIsDeleteDialogOpen(false);
      router.push("/sales-persons");
      router.refresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    router.push("/sales-persons");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>営業担当者マスタ 編集</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    氏名 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="山田太郎"
                      maxLength={50}
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    メールアドレス <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="example@example.com"
                      autoComplete="email"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>パスワード</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="変更する場合のみ入力"
                      autoComplete="new-password"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    空欄の場合、パスワードは変更されません
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    部署 <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="部署を選択してください" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="manager_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>上長</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isPending || isLoadingManagers}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingManagers
                              ? "読み込み中..."
                              : "上長を選択してください"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">なし</SelectItem>
                      {managers.map((manager) => (
                        <SelectItem
                          key={manager.sales_person_id}
                          value={manager.sales_person_id.toString()}
                        >
                          {manager.name}（{manager.department}）
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    上長権限を持つユーザーから選択できます
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    権限 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex gap-6"
                      disabled={isPending}
                    >
                      {ROLES.map((role) => (
                        <div
                          key={role.value}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem value={role.value} id={role.value} />
                          <Label
                            htmlFor={role.value}
                            className="cursor-pointer"
                          >
                            {role.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between">
              <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    削除
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>営業担当者の削除</DialogTitle>
                    <DialogDescription>
                      「{salesPerson.name}」を削除してもよろしいですか？
                      <br />
                      この操作は取り消すことができません。
                    </DialogDescription>
                  </DialogHeader>
                  {deleteError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{deleteError}</AlertDescription>
                    </Alert>
                  )}
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isDeleting}
                      >
                        キャンセル
                      </Button>
                    </DialogClose>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      削除する
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isPending}
                >
                  キャンセル
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  保存
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
