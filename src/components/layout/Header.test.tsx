import { describe, it, expect, vi } from "vitest";

import { render, screen, mockMemberUser } from "@/test/test-utils";

import { Header } from "./Header";

// next/navigation のモック（Linkコンポーネント用に残す）
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// auth-actions のモック
vi.mock("@/lib/auth-actions", () => ({
  logout: vi.fn(),
}));

describe("Header", () => {
  describe("rendering", () => {
    it("should render the logo and system name", () => {
      render(<Header />, { user: mockMemberUser });

      expect(screen.getByText("営業日報システム")).toBeInTheDocument();
    });

    it("should have logo link to dashboard (UT-NAV-009)", () => {
      render(<Header />, { user: mockMemberUser });

      const logoLink = screen.getByText("営業日報システム").closest("a");
      expect(logoLink).toHaveAttribute("href", "/dashboard");
    });

    it("should render hamburger menu button on all devices", () => {
      render(<Header />, { user: mockMemberUser });

      const menuButton = screen.getByRole("button", { name: "メニューを開く" });
      expect(menuButton).toBeInTheDocument();
      // md:hidden クラスが削除されていることを確認（全デバイスで表示）
      expect(menuButton).not.toHaveClass("md:hidden");
    });

    it("should render user avatar button", () => {
      render(<Header />, { user: mockMemberUser });

      expect(
        screen.getByRole("button", { name: "ユーザーメニュー" })
      ).toBeInTheDocument();
    });
  });

  describe("user menu", () => {
    it("should show user info when dropdown is opened", async () => {
      const { user } = render(<Header />, { user: mockMemberUser });

      const avatarButton = screen.getByRole("button", {
        name: "ユーザーメニュー",
      });
      await user.click(avatarButton);

      expect(screen.getByText(mockMemberUser.name)).toBeInTheDocument();
      expect(screen.getByText(mockMemberUser.email)).toBeInTheDocument();
      expect(screen.getByText(mockMemberUser.department)).toBeInTheDocument();
    });

    it("should show profile, password change, and logout links", async () => {
      const { user } = render(<Header />, { user: mockMemberUser });

      const avatarButton = screen.getByRole("button", {
        name: "ユーザーメニュー",
      });
      await user.click(avatarButton);

      expect(screen.getByText("プロフィール")).toBeInTheDocument();
      expect(screen.getByText("パスワード変更")).toBeInTheDocument();
      expect(screen.getByText("ログアウト")).toBeInTheDocument();
    });
  });

  describe("menu click callback", () => {
    it("should call onMenuClick when hamburger menu button is clicked", async () => {
      const onMenuClick = vi.fn();
      const { user } = render(<Header onMenuClick={onMenuClick} />, {
        user: mockMemberUser,
      });

      const menuButton = screen.getByRole("button", { name: "メニューを開く" });
      await user.click(menuButton);

      expect(onMenuClick).toHaveBeenCalledTimes(1);
    });
  });
});
