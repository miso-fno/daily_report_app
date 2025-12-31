"use client";

import { FileText, Users, Building2, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  { id: "dashboard", label: "ダッシュボード", href: "/dashboard", icon: Home },
  { id: "reports", label: "日報一覧", href: "/reports", icon: FileText },
  { id: "customers", label: "顧客マスタ", href: "/customers", icon: Building2 },
  {
    id: "sales-persons",
    label: "営業マスタ",
    href: "/sales-persons",
    icon: Users,
  },
];

interface SidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  const visibleNavItems = navItems.filter(
    (item) => user && canAccessMenu(item.id, user.role)
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>営業日報システム</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col p-2">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        {user && (
          <div className="absolute bottom-0 left-0 right-0 border-t p-4">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.department}</p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
