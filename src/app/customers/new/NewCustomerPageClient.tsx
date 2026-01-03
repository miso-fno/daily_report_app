"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { CustomerForm, type CustomerFormValues } from "@/components/customers";
import { AuthenticatedLayout } from "@/components/layout/AuthenticatedLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { canPerformAction } from "@/types/auth";

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

function NewCustomerPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const canEdit = user ? canPerformAction("customer:edit", user.role) : false;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authorized
  useEffect(() => {
    if (user && !canEdit) {
      toast.error("このページにアクセスする権限がありません");
      router.push("/customers");
    }
  }, [user, canEdit, router]);

  const handleSubmit = useCallback(
    async (data: CustomerFormValues) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch("/api/v1/customers", {
          method: "POST",
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
          toast.success("顧客を登録しました");
          router.push("/customers");
        } else {
          // Handle validation errors or other errors
          if (result.error?.details && result.error.details.length > 0) {
            const fieldErrors = result.error.details
              .filter((d) => d.field)
              .map((d) => d.message)
              .join("、");
            setError(fieldErrors || result.error.message);
          } else {
            setError(result.error?.message || "顧客の登録に失敗しました");
          }
        }
      } catch {
        setError("顧客の登録に失敗しました");
      } finally {
        setIsSubmitting(false);
      }
    },
    [router]
  );

  // Don't render form if not authorized
  if (!canEdit) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">顧客登録</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">顧客情報</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm
            mode="create"
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            error={error}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewCustomerPageClient() {
  return (
    <AuthenticatedLayout>
      <NewCustomerPageContent />
    </AuthenticatedLayout>
  );
}
