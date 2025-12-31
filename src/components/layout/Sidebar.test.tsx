import { describe, it, expect, vi } from "vitest";

import {
  render,
  screen,
  mockMemberUser,
  mockAdminUser,
} from "@/test/test-utils";

import { Sidebar } from "./Sidebar";

// next/navigation のモック
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("Sidebar", () => {
  describe("when closed", () => {
    it("should not render content when open is false", () => {
      const onOpenChange = vi.fn();
      render(<Sidebar open={false} onOpenChange={onOpenChange} />, {
        user: mockMemberUser,
      });

      // Sheet content should not be visible when closed
      expect(screen.queryByText("ダッシュボード")).not.toBeInTheDocument();
    });
  });

  describe("when open for member", () => {
    it("should show navigation items", () => {
      const onOpenChange = vi.fn();
      render(<Sidebar open={true} onOpenChange={onOpenChange} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("ダッシュボード")).toBeInTheDocument();
      expect(screen.getByText("日報一覧")).toBeInTheDocument();
      expect(screen.getByText("顧客マスタ")).toBeInTheDocument();
    });

    it("should not show sales-persons menu for member", () => {
      const onOpenChange = vi.fn();
      render(<Sidebar open={true} onOpenChange={onOpenChange} />, {
        user: mockMemberUser,
      });

      expect(screen.queryByText("営業マスタ")).not.toBeInTheDocument();
    });

    it("should show user info at bottom", () => {
      const onOpenChange = vi.fn();
      render(<Sidebar open={true} onOpenChange={onOpenChange} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText(mockMemberUser.name)).toBeInTheDocument();
      expect(screen.getByText(mockMemberUser.department)).toBeInTheDocument();
    });
  });

  describe("when open for admin", () => {
    it("should show all navigation items including sales-persons", () => {
      const onOpenChange = vi.fn();
      render(<Sidebar open={true} onOpenChange={onOpenChange} />, {
        user: mockAdminUser,
      });

      expect(screen.getByText("ダッシュボード")).toBeInTheDocument();
      expect(screen.getByText("日報一覧")).toBeInTheDocument();
      expect(screen.getByText("顧客マスタ")).toBeInTheDocument();
      expect(screen.getByText("営業マスタ")).toBeInTheDocument();
    });
  });

  describe("navigation link clicks", () => {
    it("should call onOpenChange when a link is clicked", async () => {
      const onOpenChange = vi.fn();
      const { user } = render(
        <Sidebar open={true} onOpenChange={onOpenChange} />,
        {
          user: mockMemberUser,
        }
      );

      const dashboardLink = screen.getByText("ダッシュボード");
      await user.click(dashboardLink);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
