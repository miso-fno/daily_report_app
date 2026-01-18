"use client";

import { useState, useMemo } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { AuthProvider } from "@/contexts/AuthContext";

import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

import type { User, UserRole } from "@/types/auth";
import type { Session } from "next-auth";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  session: Session | null;
}

/**
 * レイアウト用ローディングスケルトン
 * セッション読み込み中に表示
 */
function LayoutSkeleton() {
  return (
    <div className="relative min-h-screen">
      {/* ヘッダースケルトン */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Skeleton className="mr-2 h-9 w-9" />
          <Skeleton className="h-5 w-32" />
          <div className="ml-auto">
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
      </header>
      {/* メインコンテンツスケルトン */}
      <main className="container py-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>
      </main>
    </div>
  );
}

export function AuthenticatedLayout({
  children,
  session,
}: AuthenticatedLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // セッションからAuthContext用のユーザー情報を構築
  const user: User | null = useMemo(() => {
    if (!session?.user) {
      return null;
    }

    // isManagerに基づいてroleを決定
    let role: UserRole = "member";
    if (session.user.isManager) {
      role = "manager";
    }
    // 管理者判定（必要に応じて条件を調整）
    if (session.user.email?.includes("admin")) {
      role = "admin";
    }

    return {
      id: session.user.id,
      name: session.user.name ?? "",
      email: session.user.email ?? "",
      department: session.user.department ?? "",
      role,
      managerId: session.user.managerId ?? null,
    };
  }, [session]);

  // セッションがない場合はスケルトンを表示
  if (!session?.user) {
    return <LayoutSkeleton />;
  }

  return (
    <AuthProvider initialUser={user}>
      <div className="relative min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
        <main className="container py-6">{children}</main>
      </div>
    </AuthProvider>
  );
}
