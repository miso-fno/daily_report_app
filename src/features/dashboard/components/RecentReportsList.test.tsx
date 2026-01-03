import { describe, it, expect } from "vitest";

import { render, screen, mockMemberUser } from "@/test/test-utils";

import { RecentReportsList } from "./RecentReportsList";

import type { RecentReportItem } from "../types";

describe("RecentReportsList", () => {
  const mockReports: RecentReportItem[] = [
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
    {
      report_id: 3,
      report_date: "2024-01-13",
      visit_count: 1,
      status: "draft",
      status_label: "下書き",
    },
  ];

  describe("rendering", () => {
    it("should render card with title and description", () => {
      render(<RecentReportsList reports={mockReports} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("最近の日報")).toBeInTheDocument();
      expect(screen.getByText("直近5件の日報")).toBeInTheDocument();
    });

    it("should render table headers", () => {
      render(<RecentReportsList reports={mockReports} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("報告日")).toBeInTheDocument();
      expect(screen.getByText("訪問件数")).toBeInTheDocument();
      expect(screen.getByText("ステータス")).toBeInTheDocument();
      expect(screen.getByText("操作")).toBeInTheDocument();
    });

    it("should render each report with formatted date", () => {
      render(<RecentReportsList reports={mockReports} />, {
        user: mockMemberUser,
      });

      // 日付がYYYY/MM/DD形式でフォーマットされる
      expect(screen.getByText("2024/01/15")).toBeInTheDocument();
      expect(screen.getByText("2024/01/14")).toBeInTheDocument();
      expect(screen.getByText("2024/01/13")).toBeInTheDocument();
    });

    it("should render visit count with suffix", () => {
      render(<RecentReportsList reports={mockReports} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("3件")).toBeInTheDocument();
      expect(screen.getByText("2件")).toBeInTheDocument();
      expect(screen.getByText("1件")).toBeInTheDocument();
    });

    it("should render status badges", () => {
      render(<RecentReportsList reports={mockReports} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("提出済")).toBeInTheDocument();
      expect(screen.getByText("確認済")).toBeInTheDocument();
      expect(screen.getByText("下書き")).toBeInTheDocument();
    });

    it("should render detail links for each report", () => {
      render(<RecentReportsList reports={mockReports} />, {
        user: mockMemberUser,
      });

      const detailButtons = screen.getAllByText("詳細");
      expect(detailButtons).toHaveLength(3);
    });
  });

  describe("empty state", () => {
    it("should show empty message when no reports", () => {
      render(<RecentReportsList reports={[]} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("日報がありません")).toBeInTheDocument();
    });

    it("should not render table when no reports", () => {
      render(<RecentReportsList reports={[]} />, {
        user: mockMemberUser,
      });

      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
  });

  describe("links", () => {
    it("should have correct href for detail links", () => {
      render(<RecentReportsList reports={mockReports} />, {
        user: mockMemberUser,
      });

      const links = screen.getAllByRole("link");
      expect(links[0]).toHaveAttribute("href", "/reports/1");
      expect(links[1]).toHaveAttribute("href", "/reports/2");
      expect(links[2]).toHaveAttribute("href", "/reports/3");
    });
  });

  describe("visit count edge cases", () => {
    it("should display zero visit count", () => {
      const reportsWithZeroVisits: RecentReportItem[] = [
        {
          report_id: 1,
          report_date: "2024-01-15",
          visit_count: 0,
          status: "draft",
          status_label: "下書き",
        },
      ];

      render(<RecentReportsList reports={reportsWithZeroVisits} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("0件")).toBeInTheDocument();
    });
  });
});
