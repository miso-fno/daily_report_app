"use client";

import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { fetchSalesPerson } from "../api";
import { SalesPersonEditForm } from "./SalesPersonEditForm";

import type { SalesPersonResponse } from "../types";

interface SalesPersonEditContainerProps {
  salesPersonId: number;
}

export function SalesPersonEditContainer({
  salesPersonId,
}: SalesPersonEditContainerProps) {
  const router = useRouter();
  const [salesPerson, setSalesPerson] = useState<SalesPersonResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSalesPerson = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchSalesPerson(salesPersonId);
        setSalesPerson(response.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "営業担当者の取得に失敗しました"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadSalesPerson();
  }, [salesPersonId]);

  if (isLoading) {
    return <SalesPersonEditSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.push("/sales-persons")}>
          一覧に戻る
        </Button>
      </div>
    );
  }

  if (!salesPerson) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>営業担当者が見つかりませんでした</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.push("/sales-persons")}>
          一覧に戻る
        </Button>
      </div>
    );
  }

  return <SalesPersonEditForm salesPerson={salesPerson} />;
}

function SalesPersonEditSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-6 shadow">
      <Skeleton className="mb-6 h-6 w-48" />
      <div className="space-y-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <div className="flex justify-between">
          <Skeleton className="h-9 w-20" />
          <div className="flex gap-4">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}
