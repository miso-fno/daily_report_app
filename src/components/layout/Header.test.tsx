import { describe, it, expect, vi } from "vitest";

import {
  render,
  screen,
  mockMemberUser,
  mockManagerUser,
  mockAdminUser,
} from "@/test/test-utils";

import { Header } from "./Header";

// next/navigation のモック
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("Header", () => {
  describe("rendering", () => {
    it("should render the logo and system name", () => {
      render(<Header />, { user: mockMemberUser });

      expect(screen.getByText("営業日報システム")).toBeInTheDocument();
    });

    it("should render mobile menu button", () => {
      render(<Header />, { user: mockMemberUser });

      expect(
        screen.getByRole("button", { name: "メニューを開く" })
      ).toBeInTheDocument();
    });

    it("should render user avatar button", () => {
      render(<Header />, { user: mockMemberUser });

      expect(
        screen.getByRole("button", { name: "ユーザーメニュー" })
      ).toBeInTheDocument();
    });
  });

  describe("navigation items for member", () => {
    it("should show reports and customers menu but not sales-persons", () => {
      render(<Header />, { user: mockMemberUser });

      expect(screen.getByText("日報一覧")).toBeInTheDocument();
      expect(screen.getByText("顧客マスタ")).toBeInTheDocument();
      expect(screen.queryByText("営業マスタ")).not.toBeInTheDocument();
    });
  });

  describe("navigation items for manager", () => {
    it("should show reports and customers menu but not sales-persons", () => {
      render(<Header />, { user: mockManagerUser });

      expect(screen.getByText("日報一覧")).toBeInTheDocument();
      expect(screen.getByText("顧客マスタ")).toBeInTheDocument();
      expect(screen.queryByText("営業マスタ")).not.toBeInTheDocument();
    });
  });

  describe("navigation items for admin", () => {
    it("should show all menu items including sales-persons", () => {
      render(<Header />, { user: mockAdminUser });

      expect(screen.getByText("日報一覧")).toBeInTheDocument();
      expect(screen.getByText("顧客マスタ")).toBeInTheDocument();
      expect(screen.getByText("営業マスタ")).toBeInTheDocument();
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
    it("should call onMenuClick when mobile menu button is clicked", async () => {
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
