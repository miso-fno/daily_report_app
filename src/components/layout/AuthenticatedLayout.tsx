"use client";

import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";

import { AuthProvider } from "@/contexts/AuthContext";

import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

import type { User, UserRole } from "@/types/auth";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();

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
