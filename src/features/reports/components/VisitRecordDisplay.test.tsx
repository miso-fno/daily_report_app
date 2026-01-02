import { describe, it, expect } from "vitest";

import { render, screen, mockMemberUser } from "@/test/test-utils";

import { VisitRecordDisplay } from "./VisitRecordDisplay";

import type { VisitRecord } from "../types";

describe("VisitRecordDisplay", () => {
  const mockVisits: VisitRecord[] = [
    {
      visit_id: 1,
      customer_id: 1,
      customer_name: "株式会社ABC",
      visit_time: "10:00",
      visit_purpose: "商品説明",
      visit_content: "新商品の説明と提案を行いました。",
      visit_result: "次回見積り提出予定",
    },
    {
      visit_id: 2,
      customer_id: 2,
      customer_name: "株式会社XYZ",
      visit_time: "14:30",
      visit_purpose: null,
      visit_content: "定期訪問による状況確認",
      visit_result: null,
    },
  ];

  describe("rendering", () => {
    it("should render card with title", () => {
      render(<VisitRecordDisplay visits={mockVisits} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("訪問記録")).toBeInTheDocument();
    });

    it("should display visit count", () => {
      render(<VisitRecordDisplay visits={mockVisits} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("2件の訪問")).toBeInTheDocument();
    });

    it("should display customer names", () => {
      render(<VisitRecordDisplay visits={mockVisits} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("株式会社ABC")).toBeInTheDocument();
      expect(screen.getByText("株式会社XYZ")).toBeInTheDocument();
    });

    it("should display visit times", () => {
      render(<VisitRecordDisplay visits={mockVisits} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("10:00")).toBeInTheDocument();
      expect(screen.getByText("14:30")).toBeInTheDocument();
    });

    it("should display visit content", () => {
      render(<VisitRecordDisplay visits={mockVisits} />, {
        user: mockMemberUser,
      });

      expect(
        screen.getByText("新商品の説明と提案を行いました。")
      ).toBeInTheDocument();
      expect(screen.getByText("定期訪問による状況確認")).toBeInTheDocument();
    });

    it("should display visit purpose when provided", () => {
      render(<VisitRecordDisplay visits={mockVisits} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("商品説明")).toBeInTheDocument();
    });

    it("should display visit result when provided", () => {
      render(<VisitRecordDisplay visits={mockVisits} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("次回見積り提出予定")).toBeInTheDocument();
    });

    it("should display labels for visit sections", () => {
      render(<VisitRecordDisplay visits={mockVisits} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("訪問目的")).toBeInTheDocument();
      expect(screen.getAllByText("訪問内容")).toHaveLength(2);
      expect(screen.getByText("訪問結果")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("should display empty message when no visits", () => {
      render(<VisitRecordDisplay visits={[]} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("訪問記録はありません。")).toBeInTheDocument();
    });

    it("should not display visit count when empty", () => {
      render(<VisitRecordDisplay visits={[]} />, {
        user: mockMemberUser,
      });

      expect(screen.queryByText(/件の訪問/)).not.toBeInTheDocument();
    });
  });

  describe("optional fields", () => {
    it("should not display purpose section when null", () => {
      const visitWithoutPurpose: VisitRecord[] = [
        {
          visit_id: 1,
          customer_id: 1,
          customer_name: "テスト会社",
          visit_time: null,
          visit_purpose: null,
          visit_content: "テスト内容",
          visit_result: null,
        },
      ];

      render(<VisitRecordDisplay visits={visitWithoutPurpose} />, {
        user: mockMemberUser,
      });

      expect(screen.queryByText("訪問目的")).not.toBeInTheDocument();
    });

    it("should not display result section when null", () => {
      const visitWithoutResult: VisitRecord[] = [
        {
          visit_id: 1,
          customer_id: 1,
          customer_name: "テスト会社",
          visit_time: "10:00",
          visit_purpose: "テスト目的",
          visit_content: "テスト内容",
          visit_result: null,
        },
      ];

      render(<VisitRecordDisplay visits={visitWithoutResult} />, {
        user: mockMemberUser,
      });

      expect(screen.queryByText("訪問結果")).not.toBeInTheDocument();
    });

    it("should not display time when null", () => {
      const visitWithoutTime: VisitRecord[] = [
        {
          visit_id: 1,
          customer_id: 1,
          customer_name: "テスト会社",
          visit_time: null,
          visit_purpose: null,
          visit_content: "テスト内容",
          visit_result: null,
        },
      ];

      render(<VisitRecordDisplay visits={visitWithoutTime} />, {
        user: mockMemberUser,
      });

      // 時間のアイコンを含む要素が存在しないことを確認
      expect(screen.queryByText(/^\d{2}:\d{2}$/)).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have article role for each visit record", () => {
      render(<VisitRecordDisplay visits={mockVisits} />, {
        user: mockMemberUser,
      });

      const articles = screen.getAllByRole("article");
      expect(articles).toHaveLength(2);
    });

    it("should have accessible labels for visit records", () => {
      render(<VisitRecordDisplay visits={mockVisits} />, {
        user: mockMemberUser,
      });

      expect(
        screen.getByRole("article", { name: /訪問記録 1: 株式会社ABC/ })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("article", { name: /訪問記録 2: 株式会社XYZ/ })
      ).toBeInTheDocument();
    });
  });
});
