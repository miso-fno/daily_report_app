import { describe, it, expect } from "vitest";

import { render, screen, mockMemberUser } from "@/test/test-utils";

import { StatCard } from "./StatCard";

describe("StatCard", () => {
  describe("rendering", () => {
    it("should render title and value", () => {
      render(<StatCard title="今月の訪問件数" value="15件" />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("今月の訪問件数")).toBeInTheDocument();
      expect(screen.getByText("15件")).toBeInTheDocument();
    });

    it("should render numeric value correctly", () => {
      render(<StatCard title="未確認の日報" value={5} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("未確認の日報")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("should render description when provided", () => {
      render(
        <StatCard
          title="今月の訪問件数"
          value="20件"
          description="当月の訪問記録件数"
        />,
        { user: mockMemberUser }
      );

      expect(screen.getByText("当月の訪問記録件数")).toBeInTheDocument();
    });

    it("should not render description when not provided", () => {
      render(<StatCard title="今月の訪問件数" value="10件" />, {
        user: mockMemberUser,
      });

      expect(screen.queryByText("当月の訪問記録件数")).not.toBeInTheDocument();
    });

    it("should render icon when provided", () => {
      const testIcon = <span data-testid="test-icon">Icon</span>;
      render(<StatCard title="テスト" value="0件" icon={testIcon} />, {
        user: mockMemberUser,
      });

      expect(screen.getByTestId("test-icon")).toBeInTheDocument();
    });

    it("should not render icon container when icon is not provided", () => {
      const { container } = render(<StatCard title="テスト" value="0件" />, {
        user: mockMemberUser,
      });

      // iconが渡されない場合は、アイコンのdivは描画されない
      expect(
        container.querySelector(".text-muted-foreground")
      ).not.toBeInTheDocument();
    });
  });

  describe("value display", () => {
    it("should display zero value correctly", () => {
      render(<StatCard title="未確認の日報" value="0件" />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("0件")).toBeInTheDocument();
    });

    it("should display large numbers correctly", () => {
      render(<StatCard title="今月の訪問件数" value="1000件" />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("1000件")).toBeInTheDocument();
    });
  });
});
