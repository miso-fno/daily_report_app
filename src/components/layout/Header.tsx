"use client";

import {
  FileText,
  Users,
  Building2,
  User,
  KeyRound,
  LogOut,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { canAccessMenu } from "@/types/auth";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: "reports", label: "日報一覧", href: "/reports", icon: FileText },
  { id: "customers", label: "顧客マスタ", href: "/customers", icon: Building2 },
  { id: "sales-persons", label: "営業マスタ", href: "/sales-persons", icon: Users },
];

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    // TODO: ログイン画面へリダイレクト
  };

  const getInitials = (name: string) => {
    return name
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const visibleNavItems = navItems.filter(
    (item) => user && canAccessMenu(item.id, user.role)
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* モバイルメニューボタン */}
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden"
          onClick={onMenuClick}
          aria-label="メニューを開く"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* ロゴ */}
        <Link
          href="/dashboard"
          className="mr-6 flex items-center space-x-2 font-bold"
        >
          <FileText className="h-5 w-5" />
          <span className="hidden sm:inline-block">営業日報システム</span>
        </Link>

        {/* デスクトップナビゲーション */}
        <nav className="hidden md:flex md:flex-1 md:items-center md:space-x-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ユーザーメニュー */}
        <div className="ml-auto flex items-center">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full"
                  aria-label="ユーザーメニュー"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.department}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>プロフィール</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/password" className="flex items-center">
                    <KeyRound className="mr-2 h-4 w-4" />
                    <span>パスワード変更</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>ログアウト</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
