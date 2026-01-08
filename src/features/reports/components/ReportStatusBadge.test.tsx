/**
 * ReportStatusBadgeコンポーネントのユニットテスト
 *
 * テスト対象:
 * - ステータスに応じたラベル表示
 * - ステータスに応じたスタイル適用
 */

import { describe, it, expect } from "vitest";

import { render, screen, mockMemberUser } from "@/test/test-utils";

import { ReportStatusBadge } from "./ReportStatusBadge";

describe("ReportStatusBadge", () => {
  describe("ステータスラベルの表示", () => {
    it("下書き（draft）ステータスが正しく表示されること", () => {
      render(<ReportStatusBadge status="draft" />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("下書き")).toBeInTheDocument();
    });

    it("提出済（submitted）ステータスが正しく表示されること", () => {
      render(<ReportStatusBadge status="submitted" />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("提出済")).toBeInTheDocument();
    });

    it("確認済（confirmed）ステータスが正しく表示されること", () => {
      render(<ReportStatusBadge status="confirmed" />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("確認済")).toBeInTheDocument();
    });
  });

  describe("スタイル適用", () => {
    it("下書き（draft）ステータスにグレーのスタイルが適用されること", () => {
      render(<ReportStatusBadge status="draft" />, {
        user: mockMemberUser,
      });

      const badge = screen.getByText("下書き");
      expect(badge).toHaveClass("bg-gray-100");
      expect(badge).toHaveClass("text-gray-800");
    });

    it("提出済（submitted）ステータスに青のスタイルが適用されること", () => {
      render(<ReportStatusBadge status="submitted" />, {
        user: mockMemberUser,
      });

      const badge = screen.getByText("提出済");
      expect(badge).toHaveClass("bg-blue-100");
      expect(badge).toHaveClass("text-blue-800");
    });

    it("確認済（confirmed）ステータスに緑のスタイルが適用されること", () => {
      render(<ReportStatusBadge status="confirmed" />, {
        user: mockMemberUser,
      });

      const badge = screen.getByText("確認済");
      expect(badge).toHaveClass("bg-green-100");
      expect(badge).toHaveClass("text-green-800");
    });
  });

  describe("カスタムクラス", () => {
    it("classNameプロパティで追加のクラスを適用できること", () => {
      render(<ReportStatusBadge status="draft" className="custom-class" />, {
        user: mockMemberUser,
      });

      const badge = screen.getByText("下書き");
      expect(badge).toHaveClass("custom-class");
    });

    it("classNameが未指定でもエラーにならないこと", () => {
      render(<ReportStatusBadge status="submitted" />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("提出済")).toBeInTheDocument();
    });
  });

  describe("アクセシビリティ", () => {
    it("バッジがインラインで表示されること", () => {
      render(<ReportStatusBadge status="confirmed" />, {
        user: mockMemberUser,
      });

      // Badgeコンポーネントはinline-flexなのでvisibleであることを確認
      const badge = screen.getByText("確認済");
      expect(badge).toBeVisible();
    });
  });
});
