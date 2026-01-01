import { describe, it, expect } from "vitest";

import { render, screen, mockMemberUser } from "@/test/test-utils";

import { ReportsTable } from "./ReportsTable";

import type { ReportListItem } from "../types";

describe("ReportsTable", () => {
  const mockReports: ReportListItem[] = [
    {
      report_id: 1,
      report_date: "2024-01-15",
      sales_person_id: 1,
      sales_person_name: "山田太郎",
      status: "confirmed",
      status_label: "確認済",
      visit_count: 3,
      comment_count: 1,
      created_at: "2024-01-15T10:00:00Z",
      updated_at: "2024-01-15T18:00:00Z",
    },
    {
      report_id: 2,
      report_date: "2024-01-14",
      sales_person_id: 1,
      sales_person_name: "山田太郎",
      status: "submitted",
      status_label: "提出済",
      visit_count: 2,
      comment_count: 0,
      created_at: "2024-01-14T10:00:00Z",
      updated_at: "2024-01-14T17:00:00Z",
    },
    {
      report_id: 3,
      report_date: "2024-01-13",
      sales_person_id: 2,
      sales_person_name: "鈴木一郎",
      status: "draft",
      status_label: "下書き",
      visit_count: 0,
      comment_count: 0,
      created_at: "2024-01-13T10:00:00Z",
      updated_at: "2024-01-13T12:00:00Z",
    },
  ];

  describe("rendering", () => {
    it("should render table headers", () => {
      render(<ReportsTable reports={mockReports} startIndex={0} />, {
        user: mockMemberUser,
      });

      expect(
        screen.getByRole("columnheader", { name: "No" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "報告日" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "担当者" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "訪問件数" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "ステータス" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "操作" })
      ).toBeInTheDocument();
    });

    it("should render report data in rows", () => {
      render(<ReportsTable reports={mockReports} startIndex={0} />, {
        user: mockMemberUser,
      });

      // 報告日がフォーマットされて表示される
      expect(screen.getByText("2024/01/15")).toBeInTheDocument();
      expect(screen.getByText("2024/01/14")).toBeInTheDocument();
      expect(screen.getByText("2024/01/13")).toBeInTheDocument();

      // 担当者名
      expect(screen.getAllByText("山田太郎").length).toBe(2);
      expect(screen.getByText("鈴木一郎")).toBeInTheDocument();

      // 訪問件数
      expect(screen.getByText("3件")).toBeInTheDocument();
      expect(screen.getByText("2件")).toBeInTheDocument();
      expect(screen.getByText("0件")).toBeInTheDocument();
    });

    it("should render correct row numbers", () => {
      render(<ReportsTable reports={mockReports} startIndex={0} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("should render correct row numbers with startIndex", () => {
      render(<ReportsTable reports={mockReports} startIndex={20} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("21")).toBeInTheDocument();
      expect(screen.getByText("22")).toBeInTheDocument();
      expect(screen.getByText("23")).toBeInTheDocument();
    });

    it("should display status badges correctly", () => {
      render(<ReportsTable reports={mockReports} startIndex={0} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("確認済")).toBeInTheDocument();
      expect(screen.getByText("提出済")).toBeInTheDocument();
      expect(screen.getByText("下書き")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("should show empty message when no reports", () => {
      render(<ReportsTable reports={[]} startIndex={0} />, {
        user: mockMemberUser,
      });

      expect(
        screen.getByText("該当する日報が見つかりませんでした")
      ).toBeInTheDocument();
    });

    it("should not render table when empty", () => {
      render(<ReportsTable reports={[]} startIndex={0} />, {
        user: mockMemberUser,
      });

      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
  });

  describe("detail links", () => {
    it("should render detail buttons for each row", () => {
      render(<ReportsTable reports={mockReports} startIndex={0} />, {
        user: mockMemberUser,
      });

      const detailLinks = screen.getAllByRole("link", { name: /詳細/ });
      expect(detailLinks.length).toBe(3);
    });

    it("should have correct detail link href", () => {
      render(<ReportsTable reports={mockReports} startIndex={0} />, {
        user: mockMemberUser,
      });

      const detailLinks = screen.getAllByRole("link", { name: /詳細/ });
      expect(detailLinks[0]).toHaveAttribute("href", "/reports/1");
      expect(detailLinks[1]).toHaveAttribute("href", "/reports/2");
      expect(detailLinks[2]).toHaveAttribute("href", "/reports/3");
    });
  });

  describe("date formatting", () => {
    it("should format dates as YYYY/MM/DD", () => {
      const singleReport: ReportListItem[] = [
        {
          report_id: 1,
          report_date: "2024-12-25",
          sales_person_id: 1,
          sales_person_name: "テスト太郎",
          status: "draft",
          status_label: "下書き",
          visit_count: 1,
          comment_count: 0,
          created_at: "2024-12-25T10:00:00Z",
          updated_at: "2024-12-25T10:00:00Z",
        },
      ];

      render(<ReportsTable reports={singleReport} startIndex={0} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("2024/12/25")).toBeInTheDocument();
    });
  });
});
