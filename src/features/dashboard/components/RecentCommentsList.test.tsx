import { describe, it, expect } from "vitest";

import { render, screen, mockMemberUser } from "@/test/test-utils";

import { RecentCommentsList } from "./RecentCommentsList";

import type { RecentCommentItem } from "../types";

describe("RecentCommentsList", () => {
  const mockComments: RecentCommentItem[] = [
    {
      comment_id: 1,
      report_id: 10,
      report_date: "2024-01-15",
      commenter_name: "山田上長",
      comment_text: "よくまとまっています。引き続きよろしくお願いします。",
      created_at: "2024-01-15T10:30:00Z",
    },
    {
      comment_id: 2,
      report_id: 11,
      report_date: "2024-01-14",
      commenter_name: "鈴木マネージャー",
      comment_text: "顧客Aへのフォローをお願いします。",
      created_at: "2024-01-14T15:45:00Z",
    },
  ];

  describe("rendering", () => {
    it("should render card with title and description", () => {
      render(<RecentCommentsList comments={mockComments} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("新着コメント")).toBeInTheDocument();
      expect(screen.getByText("あなたの日報へのコメント")).toBeInTheDocument();
    });

    it("should render commenter names", () => {
      render(<RecentCommentsList comments={mockComments} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("山田上長")).toBeInTheDocument();
      expect(screen.getByText("鈴木マネージャー")).toBeInTheDocument();
    });

    it("should render comment text", () => {
      render(<RecentCommentsList comments={mockComments} />, {
        user: mockMemberUser,
      });

      expect(
        screen.getByText("よくまとまっています。引き続きよろしくお願いします。")
      ).toBeInTheDocument();
      expect(
        screen.getByText("顧客Aへのフォローをお願いします。")
      ).toBeInTheDocument();
    });

    it("should render formatted datetime", () => {
      render(<RecentCommentsList comments={mockComments} />, {
        user: mockMemberUser,
      });

      // 日時がフォーマットされて表示される
      // タイムゾーンによって表示される日付・時刻が異なるため、時刻を含むパターンで検証
      const datetimeElements = screen.getAllByText(
        /\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}/
      );
      expect(datetimeElements.length).toBe(2);
    });

    it("should render report date reference", () => {
      render(<RecentCommentsList comments={mockComments} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("日報: 2024-01-15")).toBeInTheDocument();
      expect(screen.getByText("日報: 2024-01-14")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("should show empty message when no comments", () => {
      render(<RecentCommentsList comments={[]} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("新着コメントはありません")).toBeInTheDocument();
    });
  });

  describe("links", () => {
    it("should have correct href for comment links", () => {
      render(<RecentCommentsList comments={mockComments} />, {
        user: mockMemberUser,
      });

      const links = screen.getAllByRole("link");
      expect(links[0]).toHaveAttribute("href", "/reports/10");
      expect(links[1]).toHaveAttribute("href", "/reports/11");
    });
  });

  describe("text truncation", () => {
    it("should truncate long comment text", () => {
      const longCommentText = "これは非常に長いコメントです。".repeat(10); // 150文字以上
      const commentsWithLongText: RecentCommentItem[] = [
        {
          comment_id: 1,
          report_id: 10,
          report_date: "2024-01-15",
          commenter_name: "テスト上長",
          comment_text: longCommentText,
          created_at: "2024-01-15T10:30:00Z",
        },
      ];

      render(<RecentCommentsList comments={commentsWithLongText} />, {
        user: mockMemberUser,
      });

      // 長いテキストは省略される（100文字 + ...）
      const displayedText = screen.getByText(/これは非常に長いコメントです。/);
      expect(displayedText.textContent).toContain("...");
      expect(displayedText.textContent?.length).toBeLessThan(
        longCommentText.length + 1
      );
    });

    it("should not truncate short comment text", () => {
      const shortComment = "短いコメント";
      const commentsWithShortText: RecentCommentItem[] = [
        {
          comment_id: 1,
          report_id: 10,
          report_date: "2024-01-15",
          commenter_name: "テスト上長",
          comment_text: shortComment,
          created_at: "2024-01-15T10:30:00Z",
        },
      ];

      render(<RecentCommentsList comments={commentsWithShortText} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText(shortComment)).toBeInTheDocument();
      // 省略記号がないことを確認
      expect(screen.queryByText(/\.\.\./)).not.toBeInTheDocument();
    });
  });
});
