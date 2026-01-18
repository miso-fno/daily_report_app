import { describe, it, expect, vi } from "vitest";

import { render, screen, mockMemberUser } from "@/test/test-utils";

import { AuthenticatedLayout } from "./AuthenticatedLayout";

import type { Session } from "next-auth";

// next/navigation のモック
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// next-auth/react のモック (Header で使用する signOut 用)
vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

// テスト用のセッションを作成するヘルパー関数
function createMockSession(user: {
  id: number;
  name: string;
  email: string;
  department: string;
  isManager: boolean;
  managerId: number | null;
}): Session {
  return {
    user,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

describe("AuthenticatedLayout", () => {
  describe("session null state", () => {
    it("should show loading skeleton when session is null", () => {
      render(
        <AuthenticatedLayout session={null}>
          <div data-testid="child-content">Child Content</div>
        </AuthenticatedLayout>
      );

      // セッションがない場合はスケルトンが表示される
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);

      // 子コンテンツは表示されない
      expect(screen.queryByTestId("child-content")).not.toBeInTheDocument();
    });

    it("should not show header components when session is null", () => {
      render(
        <AuthenticatedLayout session={null}>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      // ロゴテキストは表示されない（スケルトン状態）
      expect(screen.queryByText("営業日報システム")).not.toBeInTheDocument();
    });
  });

  describe("authenticated state", () => {
    it("should show content when session exists", () => {
      const session = createMockSession({
        id: mockMemberUser.id,
        name: mockMemberUser.name,
        email: mockMemberUser.email,
        department: mockMemberUser.department,
        isManager: false,
        managerId: mockMemberUser.managerId,
      });

      render(
        <AuthenticatedLayout session={session}>
          <div data-testid="child-content">Child Content</div>
        </AuthenticatedLayout>
      );

      // 子コンテンツが表示される
      expect(screen.getByTestId("child-content")).toBeInTheDocument();

      // ヘッダーが表示される
      expect(screen.getByText("営業日報システム")).toBeInTheDocument();
    });

    it("should show user avatar button when authenticated", () => {
      const session = createMockSession({
        id: mockMemberUser.id,
        name: mockMemberUser.name,
        email: mockMemberUser.email,
        department: mockMemberUser.department,
        isManager: false,
        managerId: mockMemberUser.managerId,
      });

      render(
        <AuthenticatedLayout session={session}>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      // ユーザーメニューボタンが表示される
      expect(
        screen.getByRole("button", { name: "ユーザーメニュー" })
      ).toBeInTheDocument();
    });

    it("should show hamburger menu button when authenticated", () => {
      const session = createMockSession({
        id: mockMemberUser.id,
        name: mockMemberUser.name,
        email: mockMemberUser.email,
        department: mockMemberUser.department,
        isManager: false,
        managerId: mockMemberUser.managerId,
      });

      render(
        <AuthenticatedLayout session={session}>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      // ハンバーガーメニューボタンが表示される
      expect(
        screen.getByRole("button", { name: "メニューを開く" })
      ).toBeInTheDocument();
    });
  });

  describe("user role mapping", () => {
    it("should set member role for non-manager users", () => {
      const session = createMockSession({
        id: 1,
        name: "一般社員",
        email: "member@example.com",
        department: "営業部",
        isManager: false,
        managerId: 2,
      });

      render(
        <AuthenticatedLayout session={session}>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      // 一般メンバーとしてレンダリングされる
      expect(screen.getByText("営業日報システム")).toBeInTheDocument();
    });

    it("should set manager role for manager users", () => {
      const session = createMockSession({
        id: 2,
        name: "マネージャー",
        email: "manager@example.com",
        department: "営業部",
        isManager: true,
        managerId: null,
      });

      render(
        <AuthenticatedLayout session={session}>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      // マネージャーとしてレンダリングされる
      expect(screen.getByText("営業日報システム")).toBeInTheDocument();
    });

    it("should set admin role for admin email users", () => {
      const session = createMockSession({
        id: 3,
        name: "管理者",
        email: "admin@example.com",
        department: "システム部",
        isManager: true,
        managerId: null,
      });

      render(
        <AuthenticatedLayout session={session}>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      // 管理者としてレンダリングされる
      expect(screen.getByText("営業日報システム")).toBeInTheDocument();
    });
  });
});
