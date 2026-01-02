import { describe, it, expect, vi } from "vitest";

import { render, screen, mockManagerUser, waitFor } from "@/test/test-utils";

import { CommentForm } from "./CommentForm";

describe("CommentForm", () => {
  describe("rendering", () => {
    it("should render card with title", () => {
      render(<CommentForm onSubmit={vi.fn()} />, {
        user: mockManagerUser,
      });

      expect(screen.getByText("コメントを投稿")).toBeInTheDocument();
    });

    it("should render textarea", () => {
      render(<CommentForm onSubmit={vi.fn()} />, {
        user: mockManagerUser,
      });

      expect(
        screen.getByPlaceholderText("コメントを入力してください...")
      ).toBeInTheDocument();
    });

    it("should render submit button", () => {
      render(<CommentForm onSubmit={vi.fn()} />, {
        user: mockManagerUser,
      });

      expect(
        screen.getByRole("button", { name: /コメントを送信/ })
      ).toBeInTheDocument();
    });
  });

  describe("validation", () => {
    it("should show error when submitting empty comment", async () => {
      const onSubmit = vi.fn();

      const { user } = render(<CommentForm onSubmit={onSubmit} />, {
        user: mockManagerUser,
      });

      await user.click(screen.getByRole("button", { name: /コメントを送信/ }));

      await waitFor(() => {
        expect(
          screen.getByText("コメントを入力してください")
        ).toBeInTheDocument();
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("should show error when comment exceeds 500 characters", async () => {
      const onSubmit = vi.fn();
      const longText = "あ".repeat(501);

      const { user } = render(<CommentForm onSubmit={onSubmit} />, {
        user: mockManagerUser,
      });

      await user.type(
        screen.getByPlaceholderText("コメントを入力してください..."),
        longText
      );

      await user.click(screen.getByRole("button", { name: /コメントを送信/ }));

      await waitFor(() => {
        expect(
          screen.getByText("コメントは500文字以内で入力してください")
        ).toBeInTheDocument();
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("submission", () => {
    it("should call onSubmit with comment text when valid", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      const { user } = render(<CommentForm onSubmit={onSubmit} />, {
        user: mockManagerUser,
      });

      await user.type(
        screen.getByPlaceholderText("コメントを入力してください..."),
        "テストコメントです"
      );

      await user.click(screen.getByRole("button", { name: /コメントを送信/ }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith("テストコメントです");
      });
    });

    it("should clear textarea after successful submission", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      const { user } = render(<CommentForm onSubmit={onSubmit} />, {
        user: mockManagerUser,
      });

      const textarea =
        screen.getByPlaceholderText("コメントを入力してください...");

      await user.type(textarea, "テストコメントです");
      await user.click(screen.getByRole("button", { name: /コメントを送信/ }));

      await waitFor(() => {
        expect(textarea).toHaveValue("");
      });
    });

    it("should show loading state during submission", async () => {
      const onSubmit = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100))
        );

      const { user } = render(<CommentForm onSubmit={onSubmit} />, {
        user: mockManagerUser,
      });

      await user.type(
        screen.getByPlaceholderText("コメントを入力してください..."),
        "テストコメントです"
      );

      await user.click(screen.getByRole("button", { name: /コメントを送信/ }));

      await waitFor(() => {
        expect(screen.getByText("送信中...")).toBeInTheDocument();
      });
    });

    it("should disable button during submission", async () => {
      const onSubmit = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100))
        );

      const { user } = render(<CommentForm onSubmit={onSubmit} />, {
        user: mockManagerUser,
      });

      await user.type(
        screen.getByPlaceholderText("コメントを入力してください..."),
        "テストコメントです"
      );

      await user.click(screen.getByRole("button", { name: /コメントを送信/ }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /送信中/ })).toBeDisabled();
      });
    });
  });

  describe("accessibility", () => {
    it("should have accessible textarea", () => {
      render(<CommentForm onSubmit={vi.fn()} />, {
        user: mockManagerUser,
      });

      // テキストエリアの存在確認
      const textarea = screen.getByRole("textbox", { name: /コメント内容/i });
      expect(textarea).toBeInTheDocument();
    });

    it("should have visible placeholder text", () => {
      render(<CommentForm onSubmit={vi.fn()} />, {
        user: mockManagerUser,
      });

      expect(
        screen.getByPlaceholderText("コメントを入力してください...")
      ).toBeVisible();
    });
  });
});
