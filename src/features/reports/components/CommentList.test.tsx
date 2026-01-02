import { describe, it, expect, vi } from "vitest";

import {
  render,
  screen,
  mockMemberUser,
  mockManagerUser,
  waitFor,
} from "@/test/test-utils";

import { CommentList } from "./CommentList";

import type { Comment } from "../types";

describe("CommentList", () => {
  const mockComments: Comment[] = [
    {
      comment_id: 1,
      sales_person_id: 2,
      sales_person_name: "上長太郎",
      comment_text: "よく頑張っています。引き続きお願いします。",
      created_at: "2024-01-15T18:00:00Z",
    },
    {
      comment_id: 2,
      sales_person_id: 3,
      sales_person_name: "別の上長",
      comment_text: "来週の報告も楽しみにしています。",
      created_at: "2024-01-16T10:00:00Z",
    },
  ];

  describe("rendering", () => {
    it("should render card with title", () => {
      render(<CommentList comments={mockComments} currentUserId={1} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("コメント")).toBeInTheDocument();
    });

    it("should display comment count", () => {
      render(<CommentList comments={mockComments} currentUserId={1} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("(2件)")).toBeInTheDocument();
    });

    it("should display commenter names", () => {
      render(<CommentList comments={mockComments} currentUserId={1} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("上長太郎")).toBeInTheDocument();
      expect(screen.getByText("別の上長")).toBeInTheDocument();
    });

    it("should display comment texts", () => {
      render(<CommentList comments={mockComments} currentUserId={1} />, {
        user: mockMemberUser,
      });

      expect(
        screen.getByText("よく頑張っています。引き続きお願いします。")
      ).toBeInTheDocument();
      expect(
        screen.getByText("来週の報告も楽しみにしています。")
      ).toBeInTheDocument();
    });

    it("should display formatted dates", () => {
      render(<CommentList comments={mockComments} currentUserId={1} />, {
        user: mockMemberUser,
      });

      // 日時がフォーマットされて表示される（複数あるのでgetAllByTextを使用）
      expect(screen.getAllByText(/2024/).length).toBeGreaterThan(0);
    });
  });

  describe("empty state", () => {
    it("should display empty message when no comments", () => {
      render(<CommentList comments={[]} currentUserId={1} />, {
        user: mockMemberUser,
      });

      expect(screen.getByText("コメントはありません。")).toBeInTheDocument();
    });

    it("should not display count when empty", () => {
      render(<CommentList comments={[]} currentUserId={1} />, {
        user: mockMemberUser,
      });

      expect(screen.queryByText(/件/)).not.toBeInTheDocument();
    });
  });

  describe("delete button", () => {
    it("should show delete button for own comments", () => {
      const ownComment: Comment[] = [
        {
          comment_id: 1,
          sales_person_id: 2, // mockManagerUser.id
          sales_person_name: "テスト上長",
          comment_text: "自分のコメント",
          created_at: "2024-01-15T18:00:00Z",
        },
      ];

      render(
        <CommentList
          comments={ownComment}
          currentUserId={2}
          onDelete={vi.fn()}
        />,
        { user: mockManagerUser }
      );

      expect(
        screen.getByRole("button", { name: "コメントを削除" })
      ).toBeInTheDocument();
    });

    it("should not show delete button for other users comments", () => {
      render(
        <CommentList
          comments={mockComments}
          currentUserId={1}
          onDelete={vi.fn()}
        />,
        { user: mockMemberUser }
      );

      expect(
        screen.queryByRole("button", { name: "コメントを削除" })
      ).not.toBeInTheDocument();
    });

    it("should not show delete button when onDelete is not provided", () => {
      const ownComment: Comment[] = [
        {
          comment_id: 1,
          sales_person_id: 2,
          sales_person_name: "テスト上長",
          comment_text: "自分のコメント",
          created_at: "2024-01-15T18:00:00Z",
        },
      ];

      render(<CommentList comments={ownComment} currentUserId={2} />, {
        user: mockManagerUser,
      });

      expect(
        screen.queryByRole("button", { name: "コメントを削除" })
      ).not.toBeInTheDocument();
    });
  });

  describe("delete confirmation dialog", () => {
    it("should open confirmation dialog when delete button is clicked", async () => {
      const ownComment: Comment[] = [
        {
          comment_id: 1,
          sales_person_id: 2,
          sales_person_name: "テスト上長",
          comment_text: "自分のコメント",
          created_at: "2024-01-15T18:00:00Z",
        },
      ];

      const { user } = render(
        <CommentList
          comments={ownComment}
          currentUserId={2}
          onDelete={vi.fn()}
        />,
        { user: mockManagerUser }
      );

      await user.click(screen.getByRole("button", { name: "コメントを削除" }));

      await waitFor(() => {
        expect(
          screen.getByText("コメントを削除しますか？")
        ).toBeInTheDocument();
      });
    });

    it("should call onDelete when confirmed", async () => {
      const ownComment: Comment[] = [
        {
          comment_id: 1,
          sales_person_id: 2,
          sales_person_name: "テスト上長",
          comment_text: "自分のコメント",
          created_at: "2024-01-15T18:00:00Z",
        },
      ];
      const onDelete = vi.fn().mockResolvedValue(undefined);

      const { user } = render(
        <CommentList
          comments={ownComment}
          currentUserId={2}
          onDelete={onDelete}
        />,
        { user: mockManagerUser }
      );

      await user.click(screen.getByRole("button", { name: "コメントを削除" }));

      await waitFor(() => {
        expect(
          screen.getByText("コメントを削除しますか？")
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "削除" }));

      await waitFor(() => {
        expect(onDelete).toHaveBeenCalledWith(1);
      });
    });

    it("should close dialog when cancelled", async () => {
      const ownComment: Comment[] = [
        {
          comment_id: 1,
          sales_person_id: 2,
          sales_person_name: "テスト上長",
          comment_text: "自分のコメント",
          created_at: "2024-01-15T18:00:00Z",
        },
      ];
      const onDelete = vi.fn();

      const { user } = render(
        <CommentList
          comments={ownComment}
          currentUserId={2}
          onDelete={onDelete}
        />,
        { user: mockManagerUser }
      );

      await user.click(screen.getByRole("button", { name: "コメントを削除" }));

      await waitFor(() => {
        expect(
          screen.getByText("コメントを削除しますか？")
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "キャンセル" }));

      await waitFor(() => {
        expect(
          screen.queryByText("コメントを削除しますか？")
        ).not.toBeInTheDocument();
      });

      expect(onDelete).not.toHaveBeenCalled();
    });
  });

  describe("accessibility", () => {
    it("should have list role for comments container", () => {
      render(<CommentList comments={mockComments} currentUserId={1} />, {
        user: mockMemberUser,
      });

      expect(
        screen.getByRole("list", { name: "コメント一覧" })
      ).toBeInTheDocument();
    });

    it("should have listitem role for each comment", () => {
      render(<CommentList comments={mockComments} currentUserId={1} />, {
        user: mockMemberUser,
      });

      expect(screen.getAllByRole("listitem")).toHaveLength(2);
    });
  });
});
