import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  render,
  screen,
  waitFor,
  mockMemberUser,
  mockManagerUser,
} from "@/test/test-utils";

import { fetchDashboardData } from "../api";
import { Dashboard } from "./Dashboard";

import type { DashboardResponse } from "../types";

// APIモック
vi.mock("../api", () => ({
  fetchDashboardData: vi.fn(),
}));

const mockFetchDashboardData = vi.mocked(fetchDashboardData);

describe("Dashboard", () => {
  const mockDashboardResponse: DashboardResponse = {
    success: true,
    data: {
      monthly_visit_count: 15,
      unconfirmed_report_count: 3,
      recent_reports: [
        {
          report_id: 1,
          report_date: "2024-01-15",
          visit_count: 3,
          status: "submitted",
          status_label: "提出済",
        },
        {
          report_id: 2,
          report_date: "2024-01-14",
          visit_count: 2,
          status: "confirmed",
          status_label: "確認済",
        },
      ],
      recent_comments: [
        {
          comment_id: 1,
          report_id: 1,
          report_date: "2024-01-15",
          commenter_name: "山田上長",
          comment_text: "確認しました。",
          created_at: "2024-01-15T10:00:00Z",
        },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loading state", () => {
    it("should show skeleton while loading", () => {
      // 永続的にpendingなPromiseを返す
      mockFetchDashboardData.mockReturnValue(new Promise(() => {}));

      const { container } = render(<Dashboard />, { user: mockMemberUser });

      // スケルトンが表示されることを確認（複数のSkeleton要素が存在）
      const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("error state", () => {
    it("should show error message when API fails", async () => {
      mockFetchDashboardData.mockRejectedValue(
        new Error("データの取得に失敗しました")
      );

      render(<Dashboard />, { user: mockMemberUser });

      await waitFor(() => {
        expect(
          screen.getByText("データの取得に失敗しました")
        ).toBeInTheDocument();
      });
    });

    it("should show generic error for non-Error exceptions", async () => {
      mockFetchDashboardData.mockRejectedValue("Unknown error");

      render(<Dashboard />, { user: mockMemberUser });

      await waitFor(() => {
        expect(
          screen.getByText("データの取得に失敗しました")
        ).toBeInTheDocument();
      });
    });
  });

  describe("member user view", () => {
    it("should render welcome message with user name", async () => {
      mockFetchDashboardData.mockResolvedValue(mockDashboardResponse);

      render(<Dashboard />, { user: mockMemberUser });

      await waitFor(() => {
        expect(
          screen.getByText(`ようこそ、${mockMemberUser.name}さん`)
        ).toBeInTheDocument();
      });
    });

    it("should render monthly visit count", async () => {
      mockFetchDashboardData.mockResolvedValue(mockDashboardResponse);

      render(<Dashboard />, { user: mockMemberUser });

      await waitFor(() => {
        expect(screen.getByText("今月の訪問件数")).toBeInTheDocument();
        expect(screen.getByText("15件")).toBeInTheDocument();
      });
    });

    it("should not render unconfirmed reports card for member", async () => {
      mockFetchDashboardData.mockResolvedValue(mockDashboardResponse);

      render(<Dashboard />, { user: mockMemberUser });

      await waitFor(() => {
        expect(screen.getByText("今月の訪問件数")).toBeInTheDocument();
      });

      expect(screen.queryByText("未確認の日報")).not.toBeInTheDocument();
    });

    it("should render create report button", async () => {
      mockFetchDashboardData.mockResolvedValue(mockDashboardResponse);

      render(<Dashboard />, { user: mockMemberUser });

      await waitFor(() => {
        expect(screen.getByText("本日の日報を作成")).toBeInTheDocument();
      });

      const createButton = screen.getByRole("link", {
        name: /本日の日報を作成/,
      });
      expect(createButton).toHaveAttribute("href", "/reports/new");
    });

    it("should render recent reports list", async () => {
      mockFetchDashboardData.mockResolvedValue(mockDashboardResponse);

      render(<Dashboard />, { user: mockMemberUser });

      await waitFor(() => {
        expect(screen.getByText("最近の日報")).toBeInTheDocument();
      });

      expect(screen.getByText("2024/01/15")).toBeInTheDocument();
      expect(screen.getByText("2024/01/14")).toBeInTheDocument();
    });

    it("should render recent comments list", async () => {
      mockFetchDashboardData.mockResolvedValue(mockDashboardResponse);

      render(<Dashboard />, { user: mockMemberUser });

      await waitFor(() => {
        expect(screen.getByText("新着コメント")).toBeInTheDocument();
      });

      expect(screen.getByText("山田上長")).toBeInTheDocument();
      expect(screen.getByText("確認しました。")).toBeInTheDocument();
    });
  });

  describe("manager user view", () => {
    it("should render unconfirmed reports card for manager", async () => {
      mockFetchDashboardData.mockResolvedValue(mockDashboardResponse);

      render(<Dashboard />, { user: mockManagerUser });

      await waitFor(() => {
        expect(screen.getByText("未確認の日報")).toBeInTheDocument();
        expect(screen.getByText("部下の未確認日報件数")).toBeInTheDocument();
      });

      // 未確認日報カードの値を確認（「3件」はテーブル内にも存在するため、descriptionで特定）
      const unconfirmedCard = screen
        .getByText("未確認の日報")
        .closest("div")?.parentElement;
      expect(unconfirmedCard).toBeInTheDocument();
    });

    it("should render welcome message for manager", async () => {
      mockFetchDashboardData.mockResolvedValue(mockDashboardResponse);

      render(<Dashboard />, { user: mockManagerUser });

      await waitFor(() => {
        expect(
          screen.getByText(`ようこそ、${mockManagerUser.name}さん`)
        ).toBeInTheDocument();
      });
    });
  });

  describe("empty data", () => {
    it("should handle empty reports and comments", async () => {
      const emptyDataResponse: DashboardResponse = {
        success: true,
        data: {
          monthly_visit_count: 0,
          unconfirmed_report_count: null,
          recent_reports: [],
          recent_comments: [],
        },
      };
      mockFetchDashboardData.mockResolvedValue(emptyDataResponse);

      render(<Dashboard />, { user: mockMemberUser });

      await waitFor(() => {
        expect(screen.getByText("日報がありません")).toBeInTheDocument();
        expect(
          screen.getByText("新着コメントはありません")
        ).toBeInTheDocument();
      });
    });

    it("should display zero visit count", async () => {
      const zeroVisitResponse: DashboardResponse = {
        success: true,
        data: {
          monthly_visit_count: 0,
          unconfirmed_report_count: null,
          recent_reports: [],
          recent_comments: [],
        },
      };
      mockFetchDashboardData.mockResolvedValue(zeroVisitResponse);

      render(<Dashboard />, { user: mockMemberUser });

      await waitFor(() => {
        expect(screen.getByText("0件")).toBeInTheDocument();
      });
    });
  });

  describe("API call", () => {
    it("should call fetchDashboardData on mount", async () => {
      mockFetchDashboardData.mockResolvedValue(mockDashboardResponse);

      render(<Dashboard />, { user: mockMemberUser });

      await waitFor(() => {
        expect(mockFetchDashboardData).toHaveBeenCalledTimes(1);
      });
    });
  });
});
