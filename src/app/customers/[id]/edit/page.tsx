"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  CustomerForm,
  DeleteCustomerDialog,
  type CustomerFormValues,
  type CustomerFormData,
} from "@/components/customers";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { canPerformAction } from "@/types/auth";

interface CustomerDetailResponse {
  success: boolean;
  data?: {
    customer_id: number;
    customer_name: string;
    address: string | null;
    phone: string | null;
    contact_person: string | null;
    created_at: string;
    updated_at: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

interface ApiResponse {
  success: boolean;
  data?: unknown;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field?: string; message: string }>;
  };
}

function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-9 w-full" />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  );
}

export default function CustomerEditPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const { user } = useAuth();
  const canEdit = user ? canPerformAction("customer:edit", user.role) : false;

  const [customer, setCustomer] = useState<CustomerFormData | null>(null);
  const [customerName, setCustomerName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Redirect if not authorized
  useEffect(() => {
    if (user && !canEdit) {
      toast.error("このページにアクセスする権限がありません");
      router.push("/customers");
    }
  }, [user, canEdit, router]);

  // Fetch customer data
  useEffect(() => {
    const fetchCustomer = async () => {
      if (!customerId || !canEdit) {
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/v1/customers/${customerId}`);
        const data: CustomerDetailResponse = await response.json();

        if (data.success && data.data) {
          setCustomer({
            customer_name: data.data.customer_name,
            address: data.data.address,
            phone: data.data.phone,
            contact_person: data.data.contact_person,
          });
          setCustomerName(data.data.customer_name);
        } else if (data.error?.code === "RESOURCE_NOT_FOUND") {
          toast.error("指定された顧客が見つかりません");
          router.push("/customers");
        } else {
          toast.error(data.error?.message || "顧客情報の取得に失敗しました");
          router.push("/customers");
        }
      } catch {
        toast.error("顧客情報の取得に失敗しました");
        router.push("/customers");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId, canEdit, router]);

  const handleSubmit = useCallback(
    async (data: CustomerFormValues) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch(`/api/v1/customers/${customerId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer_name: data.customer_name,
            address: data.address || null,
            phone: data.phone || null,
            contact_person: data.contact_person || null,
          }),
        });

        const result: ApiResponse = await response.json();

        if (result.success) {
          toast.success("顧客情報を更新しました");
          router.push("/customers");
        } else {
          if (result.error?.details && result.error.details.length > 0) {
            const fieldErrors = result.error.details
              .filter((d) => d.field)
              .map((d) => d.message)
              .join("、");
            setError(fieldErrors || result.error.message);
          } else {
            setError(result.error?.message || "顧客情報の更新に失敗しました");
          }
        }
      } catch {
        setError("顧客情報の更新に失敗しました");
      } finally {
        setIsSubmitting(false);
      }
    },
    [customerId, router]
  );

  const handleDelete = useCallback(() => {
    setShowDeleteDialog(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/v1/customers/${customerId}`, {
        method: "DELETE",
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        toast.success("顧客を削除しました");
        router.push("/customers");
      } else {
        setShowDeleteDialog(false);
        setError(result.error?.message || "顧客の削除に失敗しました");
      }
    } catch {
      setShowDeleteDialog(false);
      setError("顧客の削除に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  }, [customerId, router]);

  // Don't render form if not authorized
  if (!canEdit) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">顧客編集</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">顧客情報</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <FormSkeleton />
            ) : customer ? (
              <CustomerForm
                mode="edit"
                initialData={customer}
                onSubmit={handleSubmit}
                onDelete={handleDelete}
                isSubmitting={isSubmitting}
                isDeleting={isDeleting}
                error={error}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>

      <DeleteCustomerDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        customerName={customerName}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </AuthenticatedLayout>
  );
}
