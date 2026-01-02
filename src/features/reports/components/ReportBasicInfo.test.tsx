import { describe, it, expect } from "vitest";

import { render, screen, mockMemberUser } from "@/test/test-utils";

import { ReportBasicInfo } from "./ReportBasicInfo";

describe("ReportBasicInfo", () => {
  const defaultProps = {
    reportDate: "2024-01-15",
    salesPersonName: "山田太郎",
    status: "submitted" as const,
  };

  describe("rendering", () => {
    it("should render basic info card with title", () => {
      render(<ReportBasicInfo {...defaultProps} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("基本情報")).toBeInTheDocument();
    });

    it("should display report date formatted in Japanese", () => {
      render(<ReportBasicInfo {...defaultProps} />, {
        user: mockMemberUser,
      });

      // 日付がフォーマットされて表示される（例: 2024年1月15日(月)）
      expect(screen.getByText(/2024年1月15日/)).toBeInTheDocument();
    });

    it("should display sales person name", () => {
      render(<ReportBasicInfo {...defaultProps} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("山田太郎")).toBeInTheDocument();
    });

    it("should display labels for each field", () => {
      render(<ReportBasicInfo {...defaultProps} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("報告日")).toBeInTheDocument();
      expect(screen.getByText("担当者")).toBeInTheDocument();
      expect(screen.getByText("ステータス")).toBeInTheDocument();
    });
  });

  describe("status badge", () => {
    it("should display draft status", () => {
      render(<ReportBasicInfo {...defaultProps} status="draft" />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("下書き")).toBeInTheDocument();
    });

    it("should display submitted status", () => {
      render(<ReportBasicInfo {...defaultProps} status="submitted" />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("提出済")).toBeInTheDocument();
    });

    it("should display confirmed status", () => {
      render(<ReportBasicInfo {...defaultProps} status="confirmed" />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("確認済")).toBeInTheDocument();
    });
  });

  describe("date formatting", () => {
    it("should format different dates correctly", () => {
      render(<ReportBasicInfo {...defaultProps} reportDate="2024-12-25" />, {
        user: mockMemberUser,
      });

      expect(screen.getByText(/2024年12月25日/)).toBeInTheDocument();
    });
  });
});
