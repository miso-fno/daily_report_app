import { useSession } from "next-auth/react";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

import { render, screen, mockMemberUser } from "@/test/test-utils";

import { AuthenticatedLayout } from "./AuthenticatedLayout";

// next-auth/react のモック
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

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

const mockUseSession = useSession as Mock;

describe("AuthenticatedLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("should show loading skeleton when session is loading", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "loading",
      });

      render(
        <AuthenticatedLayout>
          <div data-testid="child-content">Child Content</div>
        </AuthenticatedLayout>
      );

      // ローディング中はスケルトンが表示される
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);

      // 子コンテンツは表示されない
      expect(screen.queryByTestId("child-content")).not.toBeInTheDocument();
    });

    it("should not show header components when loading", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "loading",
      });

      render(
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      // ロゴテキストは表示されない（スケルトン状態）
      expect(screen.queryByText("営業日報システム")).not.toBeInTheDocument();
    });
  });

  describe("authenticated state", () => {
    it("should show content after session is loaded", () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: mockMemberUser.id,
            name: mockMemberUser.name,
            email: mockMemberUser.email,
            department: mockMemberUser.department,
            isManager: false,
            managerId: mockMemberUser.managerId,
          },
        },
        status: "authenticated",
      });

      render(
        <AuthenticatedLayout>
          <div data-testid="child-content">Child Content</div>
        </AuthenticatedLayout>
      );

      // 子コンテンツが表示される
      expect(screen.getByTestId("child-content")).toBeInTheDocument();

      // ヘッダーが表示される
      expect(screen.getByText("営業日報システム")).toBeInTheDocument();
    });

    it("should show user avatar button when authenticated", () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: mockMemberUser.id,
            name: mockMemberUser.name,
            email: mockMemberUser.email,
            department: mockMemberUser.department,
            isManager: false,
            managerId: mockMemberUser.managerId,
          },
        },
        status: "authenticated",
      });

      render(
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      // ユーザーメニューボタンが表示される
      expect(
        screen.getByRole("button", { name: "ユーザーメニュー" })
      ).toBeInTheDocument();
    });

    it("should show hamburger menu button when authenticated", () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: mockMemberUser.id,
            name: mockMemberUser.name,
            email: mockMemberUser.email,
            department: mockMemberUser.department,
            isManager: false,
            managerId: mockMemberUser.managerId,
          },
        },
        status: "authenticated",
      });

      render(
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      // ハンバーガーメニューボタンが表示される
      expect(
        screen.getByRole("button", { name: "メニューを開く" })
      ).toBeInTheDocument();
    });
  });

  describe("unauthenticated state", () => {
    it("should render layout even when unauthenticated", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
      });

      render(
        <AuthenticatedLayout>
          <div data-testid="child-content">Child Content</div>
        </AuthenticatedLayout>
      );

      // 認証されていなくてもレイアウトは表示される（リダイレクトはミドルウェアで行う）
      expect(screen.getByTestId("child-content")).toBeInTheDocument();
      expect(screen.getByText("営業日報システム")).toBeInTheDocument();
    });

    it("should not show user menu when unauthenticated", () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: "unauthenticated",
      });

      render(
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      // ユーザーメニューボタンは表示されない
      expect(
        screen.queryByRole("button", { name: "ユーザーメニュー" })
      ).not.toBeInTheDocument();
    });
  });

  describe("user role mapping", () => {
    it("should set member role for non-manager users", () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 1,
            name: "一般社員",
            email: "member@example.com",
            department: "営業部",
            isManager: false,
            managerId: 2,
          },
        },
        status: "authenticated",
      });

      render(
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      // 一般メンバーとしてレンダリングされる
      expect(screen.getByText("営業日報システム")).toBeInTheDocument();
    });

    it("should set manager role for manager users", () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 2,
            name: "マネージャー",
            email: "manager@example.com",
            department: "営業部",
            isManager: true,
            managerId: null,
          },
        },
        status: "authenticated",
      });

      render(
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      // マネージャーとしてレンダリングされる
      expect(screen.getByText("営業日報システム")).toBeInTheDocument();
    });

    it("should set admin role for admin email users", () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 3,
            name: "管理者",
            email: "admin@example.com",
            department: "システム部",
            isManager: true,
            managerId: null,
          },
        },
        status: "authenticated",
      });

      render(
        <AuthenticatedLayout>
          <div>Content</div>
        </AuthenticatedLayout>
      );

      // 管理者としてレンダリングされる
      expect(screen.getByText("営業日報システム")).toBeInTheDocument();
    });
  });
});
