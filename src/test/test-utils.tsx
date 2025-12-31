import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuthProvider } from "@/contexts/AuthContext";

import type { User } from "@/types/auth";
import type { RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

// テスト用のモックユーザー
export const mockMemberUser: User = {
  id: 1,
  name: "テスト太郎",
  email: "member@example.com",
  department: "営業1課",
  role: "member",
  managerId: 2,
};

export const mockManagerUser: User = {
  id: 2,
  name: "テスト上長",
  email: "manager@example.com",
  department: "営業1課",
  role: "manager",
  managerId: null,
};

export const mockAdminUser: User = {
  id: 3,
  name: "テスト管理者",
  email: "admin@example.com",
  department: "システム部",
  role: "admin",
  managerId: null,
};

interface AllProvidersProps {
  children: ReactNode;
  user?: User | null | undefined;
}

// プロバイダーのラッパー（必要に応じて拡張）
function AllProviders({ children, user = null }: AllProvidersProps) {
  return <AuthProvider initialUser={user}>{children}</AuthProvider>;
}

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  user?: User | null;
}

// カスタムrender関数
function customRender(ui: ReactElement, options?: CustomRenderOptions) {
  const { user: testUser, ...renderOptions } = options ?? {};
  return {
    user: userEvent.setup(),
    ...render(ui, {
      wrapper: ({ children }) => (
        <AllProviders user={testUser}>{children}</AllProviders>
      ),
      ...renderOptions,
    }),
  };
}

// re-export everything
export * from "@testing-library/react";

// override render method
export { customRender as render };
