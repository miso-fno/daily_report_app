import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  render,
  screen,
  mockMemberUser,
  mockManagerUser,
  waitFor,
} from "@/test/test-utils";

import { ReportDetailView } from "./ReportDetail";

import type { ReportDetail as ReportDetailType } from "../types";

// router.refreshのモック
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

// API関数のモック
vi.mock("../api", () => ({
  updateReportStatus: vi.fn(),
  createComment: vi.fn(),
  deleteComment: vi.fn(),
}));

// toast のモック
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ReportDetailView", () => {
  const mockReport: ReportDetailType = {
    report_id: 1,
    report_date: "2024-01-15",
    sales_person_id: 1,
    sales_person_name: "山田太郎",
    status: "submitted",
    status_label: "提出済",
    problem: "課題テスト",
    plan: "予定テスト",
    visits: [
      {
        visit_id: 1,
        customer_id: 1,
        customer_name: "株式会社ABC",
        visit_time: "10:00",
        visit_purpose: "商品説明",
        visit_content: "商品の説明を行いました",
        visit_result: "継続検討",
      },
    ],
    comments: [
      {
        comment_id: 1,
        sales_person_id: 2,
        sales_person_name: "上長太郎",
        comment_text: "確認しました",
        created_at: "2024-01-15T18:00:00Z",
      },
    ],
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T17:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic rendering", () => {
    it("should render basic info section", () => {
      render(
        <ReportDetailView
          report={mockReport}
          currentUser={{ id: 1, isManager: false }}
        />,
        { user: mockMemberUser }
      );

      expect(screen.getByText("基本情報")).toBeInTheDocument();
      expect(screen.getByText("山田太郎")).toBeInTheDocument();
    });

    it("should render visit records section", () => {
      render(
        <ReportDetailView
          report={mockReport}
          currentUser={{ id: 1, isManager: false }}
        />,
        { user: mockMemberUser }
      );

      expect(screen.getByText("訪問記録")).toBeInTheDocument();
      expect(screen.getByText("株式会社ABC")).toBeInTheDocument();
    });

    it("should render problem section", () => {
      render(
        <ReportDetailView
          report={mockReport}
          currentUser={{ id: 1, isManager: false }}
        />,
        { user: mockMemberUser }
      );

      expect(screen.getByText("課題・相談")).toBeInTheDocument();
      expect(screen.getByText("課題テスト")).toBeInTheDocument();
    });

    it("should render plan section", () => {
      render(
        <ReportDetailView
          report={mockReport}
          currentUser={{ id: 1, isManager: false }}
        />,
        { user: mockMemberUser }
      );

      expect(screen.getByText("明日の予定")).toBeInTheDocument();
      expect(screen.getByText("予定テスト")).toBeInTheDocument();
    });

    it("should render comments section", () => {
      render(
        <ReportDetailView
          report={mockReport}
          currentUser={{ id: 1, isManager: false }}
        />,
        { user: mockMemberUser }
      );

      expect(screen.getByText("コメント")).toBeInTheDocument();
      expect(screen.getByText("確認しました")).toBeInTheDocument();
    });

    it("should show empty message for null problem", () => {
      const reportWithoutProblem = {
        ...mockReport,
        problem: null,
      };

      render(
        <ReportDetailView
          report={reportWithoutProblem}
          currentUser={{ id: 1, isManager: false }}
        />,
        { user: mockMemberUser }
      );

      expect(screen.getAllByText("記載なし")).toHaveLength(1);
    });

    it("should show empty message for null plan", () => {
      const reportWithoutPlan = {
        ...mockReport,
        plan: null,
      };

      render(
        <ReportDetailView
          report={reportWithoutPlan}
          currentUser={{ id: 1, isManager: false }}
        />,
        { user: mockMemberUser }
      );

      expect(screen.getAllByText("記載なし")).toHaveLength(1);
    });
  });

  describe("edit button visibility", () => {
    it("should show edit button for own draft report", () => {
      const draftReport = { ...mockReport, status: "draft" as const };

      render(
        <ReportDetailView
          report={draftReport}
          currentUser={{ id: 1, isManager: false }}
        />,
        { user: mockMemberUser }
      );

      expect(screen.getByRole("link", { name: /編集/ })).toBeInTheDocument();
    });

    it("should show edit button for own submitted report", () => {
      render(
        <ReportDetailView
          report={mockReport}
          currentUser={{ id: 1, isManager: false }}
        />,
        { user: mockMemberUser }
      );

      expect(screen.getByRole("link", { name: /編集/ })).toBeInTheDocument();
    });

    it("should not show edit button for confirmed report", () => {
      const confirmedReport = {
        ...mockReport,
        status: "confirmed" as const,
      };

      render(
        <ReportDetailView
          report={confirmedReport}
          currentUser={{ id: 1, isManager: false }}
        />,
        { user: mockMemberUser }
      );

      expect(
        screen.queryByRole("link", { name: /編集/ })
      ).not.toBeInTheDocument();
    });

    it("should not show edit button for other users report", () => {
      render(
        <ReportDetailView
          report={mockReport}
          currentUser={{ id: 99, isManager: true }}
        />,
        { user: mockManagerUser }
      );

      expect(
        screen.queryByRole("link", { name: /編集/ })
      ).not.toBeInTheDocument();
    });

    it("should have correct edit link href", () => {
      render(
        <ReportDetailView
          report={mockReport}
          currentUser={{ id: 1, isManager: false }}
        />,
        { user: mockMemberUser }
      );

      expect(screen.getByRole("link", { name: /編集/ })).toHaveAttribute(
        "href",
        "/reports/1/edit"
      );
    });
  });

  describe("confirm button visibility", () => {
    it("should show confirm button for manager viewing submitted report", () => {
      render(
        <ReportDetailView
          report={mockReport}
          currentUser={{ id: 2, isManager: true }}
        />,
        { user: mockManagerUser }
      );

      expect(
        screen.getByRole("button", { name: /確認済にする/ })
      ).toBeInTheDocument();
    });

    it("should not show confirm button for draft report", () => {
      const draftReport = { ...mockReport, status: "draft" as const };

      render(
        <ReportDetailView
          report={draftReport}
          currentUser={{ id: 2, isManager: true }}
        />,
        { user: mockManagerUser }
      );

      expect(
        screen.queryByRole("button", { name: /確認済にする/ })
      ).not.toBeInTheDocument();
    });

    it("should not show confirm button for confirmed report", () => {
      const confirmedReport = {
        ...mockReport,
        status: "confirmed" as const,
      };

      render(
        <ReportDetailView
          report={confirmedReport}
          currentUser={{ id: 2, isManager: true }}
        />,
        { user: mockManagerUser }
      );

      expect(
        screen.queryByRole("button", { name: /確認済にする/ })
      ).not.toBeInTheDocument();
    });

    it("should not show confirm button for non-manager", () => {
      render(
        <ReportDetailView
          report={mockReport}
          currentUser={{ id: 1, isManager: false }}
        />,
        { user: mockMemberUser }
      );

      expect(
        screen.queryByRole("button", { name: /確認済にする/ })
      ).not.toBeInTheDocument();
    });
  });

  describe("comment form visibility", () => {
    it("should show comment form for manager", () => {
      render(
        <ReportDetailView
          report={mockReport}
          currentUser={{ id: 2, isManager: true }}
        />,
        { user: mockManagerUser }
      );

      expect(screen.getByText("コメントを投稿")).toBeInTheDocument();
    });

    it("should not show comment form for non-manager", () => {
      render(
        <ReportDetailView
          report={mockReport}
          currentUser={{ id: 1, isManager: false }}
        />,
        { user: mockMemberUser }
      );

      expect(screen.queryByText("コメントを投稿")).not.toBeInTheDocument();
    });
  });

  describe("confirmed status alert", () => {
    it("should show alert for confirmed report", () => {
      const confirmedReport = {
        ...mockReport,
        status: "confirmed" as const,
      };

      render(
        <ReportDetailView
          report={confirmedReport}
          currentUser={{ id: 1, isManager: false }}
        />,
        { user: mockMemberUser }
      );

      expect(
        screen.getByText("この日報は確認済です。編集することはできません。")
      ).toBeInTheDocument();
    });

    it("should not show alert for non-confirmed report", () => {
      render(
        <ReportDetailView
          report={mockReport}
          currentUser={{ id: 1, isManager: false }}
        />,
        { user: mockMemberUser }
      );

      expect(
        screen.queryByText("この日報は確認済です。編集することはできません。")
      ).not.toBeInTheDocument();
    });
  });

  describe("confirm action", () => {
    it("should call updateReportStatus when confirm button is clicked", async () => {
      const { updateReportStatus } = await import("../api");
      (updateReportStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { status: "confirmed" },
      });

      const { user } = render(
        <ReportDetailView
          report={mockReport}
          currentUser={{ id: 2, isManager: true }}
        />,
        { user: mockManagerUser }
      );

      await user.click(screen.getByRole("button", { name: /確認済にする/ }));

      await waitFor(() => {
        expect(updateReportStatus).toHaveBeenCalledWith(1, "confirmed");
      });
    });

    it("should show loading state during confirm", async () => {
      const { updateReportStatus } = await import("../api");
      (updateReportStatus as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { user } = render(
        <ReportDetailView
          report={mockReport}
          currentUser={{ id: 2, isManager: true }}
        />,
        { user: mockManagerUser }
      );

      await user.click(screen.getByRole("button", { name: /確認済にする/ }));

      await waitFor(() => {
        expect(screen.getByText("処理中...")).toBeInTheDocument();
      });
    });
  });
});
