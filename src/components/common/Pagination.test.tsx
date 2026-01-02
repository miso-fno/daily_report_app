import { describe, it, expect, vi, beforeEach } from "vitest";

import { render, screen, waitFor } from "@/test/test-utils";

import { Pagination } from "./Pagination";

describe("Pagination", () => {
  const defaultProps = {
    currentPage: 1,
    lastPage: 5,
    total: 100,
    perPage: 20,
    onPageChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render pagination info correctly", () => {
      render(<Pagination {...defaultProps} />);

      expect(screen.getByText(/全100件中/)).toBeInTheDocument();
      expect(screen.getByText(/1〜20件を表示/)).toBeInTheDocument();
    });

    it("should format large numbers with locale separator", () => {
      render(<Pagination {...defaultProps} total={1234567} currentPage={1} />);

      expect(screen.getByText(/全1,234,567件中/)).toBeInTheDocument();
    });

    it("should show correct range for middle page", () => {
      render(<Pagination {...defaultProps} currentPage={3} />);

      expect(screen.getByText(/41〜60件を表示/)).toBeInTheDocument();
    });

    it("should show correct range for last page with partial items", () => {
      render(
        <Pagination
          {...defaultProps}
          currentPage={5}
          lastPage={5}
          total={95}
          perPage={20}
        />
      );

      expect(screen.getByText(/81〜95件を表示/)).toBeInTheDocument();
    });

    it("should show 0 items when total is 0", () => {
      render(
        <Pagination
          {...defaultProps}
          currentPage={1}
          lastPage={0}
          total={0}
          perPage={20}
        />
      );

      expect(screen.getByText(/全0件中/)).toBeInTheDocument();
      expect(screen.getByText(/0〜0件を表示/)).toBeInTheDocument();
    });
  });

  describe("navigation buttons", () => {
    it("should disable first and prev buttons on first page", () => {
      render(<Pagination {...defaultProps} currentPage={1} />);

      expect(
        screen.getByRole("button", { name: "最初のページへ" })
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "前のページへ" })
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "次のページへ" })
      ).not.toBeDisabled();
      expect(
        screen.getByRole("button", { name: "最後のページへ" })
      ).not.toBeDisabled();
    });

    it("should disable next and last buttons on last page", () => {
      render(<Pagination {...defaultProps} currentPage={5} lastPage={5} />);

      expect(
        screen.getByRole("button", { name: "最初のページへ" })
      ).not.toBeDisabled();
      expect(
        screen.getByRole("button", { name: "前のページへ" })
      ).not.toBeDisabled();
      expect(
        screen.getByRole("button", { name: "次のページへ" })
      ).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "最後のページへ" })
      ).toBeDisabled();
    });

    it("should enable all buttons on middle page", () => {
      render(<Pagination {...defaultProps} currentPage={3} />);

      expect(
        screen.getByRole("button", { name: "最初のページへ" })
      ).not.toBeDisabled();
      expect(
        screen.getByRole("button", { name: "前のページへ" })
      ).not.toBeDisabled();
      expect(
        screen.getByRole("button", { name: "次のページへ" })
      ).not.toBeDisabled();
      expect(
        screen.getByRole("button", { name: "最後のページへ" })
      ).not.toBeDisabled();
    });

    it("should call onPageChange with 1 when clicking first button", async () => {
      const onPageChange = vi.fn();
      const { user } = render(
        <Pagination
          {...defaultProps}
          currentPage={3}
          onPageChange={onPageChange}
        />
      );

      await user.click(screen.getByRole("button", { name: "最初のページへ" }));

      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it("should call onPageChange with previous page when clicking prev button", async () => {
      const onPageChange = vi.fn();
      const { user } = render(
        <Pagination
          {...defaultProps}
          currentPage={3}
          onPageChange={onPageChange}
        />
      );

      await user.click(screen.getByRole("button", { name: "前のページへ" }));

      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it("should call onPageChange with next page when clicking next button", async () => {
      const onPageChange = vi.fn();
      const { user } = render(
        <Pagination
          {...defaultProps}
          currentPage={3}
          onPageChange={onPageChange}
        />
      );

      await user.click(screen.getByRole("button", { name: "次のページへ" }));

      expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it("should call onPageChange with last page when clicking last button", async () => {
      const onPageChange = vi.fn();
      const { user } = render(
        <Pagination
          {...defaultProps}
          currentPage={3}
          onPageChange={onPageChange}
        />
      );

      await user.click(screen.getByRole("button", { name: "最後のページへ" }));

      expect(onPageChange).toHaveBeenCalledWith(5);
    });
  });

  describe("direct page input", () => {
    it("should render page input field when allowDirectInput is true", () => {
      render(<Pagination {...defaultProps} allowDirectInput={true} />);

      expect(
        screen.getByRole("textbox", { name: "ページ番号を入力" })
      ).toBeInTheDocument();
    });

    it("should not render page input field when allowDirectInput is false", () => {
      render(<Pagination {...defaultProps} allowDirectInput={false} />);

      expect(
        screen.queryByRole("textbox", { name: "ページ番号を入力" })
      ).not.toBeInTheDocument();
      expect(screen.getByText("1 / 5")).toBeInTheDocument();
    });

    it("should show current page in input field", () => {
      render(<Pagination {...defaultProps} currentPage={3} />);

      const input = screen.getByRole("textbox", { name: "ページ番号を入力" });
      expect(input).toHaveValue("3");
    });

    it("should call onPageChange when entering valid page number and pressing Enter", async () => {
      const onPageChange = vi.fn();
      const { user } = render(
        <Pagination
          {...defaultProps}
          currentPage={1}
          onPageChange={onPageChange}
        />
      );

      const input = screen.getByRole("textbox", { name: "ページ番号を入力" });
      await user.clear(input);
      await user.type(input, "3");
      await user.keyboard("{Enter}");

      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it("should call onPageChange when entering valid page number and blurring", async () => {
      const onPageChange = vi.fn();
      const { user } = render(
        <Pagination
          {...defaultProps}
          currentPage={1}
          onPageChange={onPageChange}
        />
      );

      const input = screen.getByRole("textbox", { name: "ページ番号を入力" });
      await user.clear(input);
      await user.type(input, "4");
      await user.tab();

      await waitFor(() => {
        expect(onPageChange).toHaveBeenCalledWith(4);
      });
    });

    it("should revert to current page when entering invalid page number", async () => {
      const onPageChange = vi.fn();
      const { user } = render(
        <Pagination
          {...defaultProps}
          currentPage={2}
          onPageChange={onPageChange}
        />
      );

      const input = screen.getByRole("textbox", { name: "ページ番号を入力" });
      await user.clear(input);
      await user.type(input, "99");
      await user.keyboard("{Enter}");

      expect(onPageChange).not.toHaveBeenCalled();
      expect(input).toHaveValue("2");
    });

    it("should revert to current page when entering zero", async () => {
      const onPageChange = vi.fn();
      const { user } = render(
        <Pagination
          {...defaultProps}
          currentPage={2}
          onPageChange={onPageChange}
        />
      );

      const input = screen.getByRole("textbox", { name: "ページ番号を入力" });
      await user.clear(input);
      await user.type(input, "0");
      await user.keyboard("{Enter}");

      expect(onPageChange).not.toHaveBeenCalled();
      expect(input).toHaveValue("2");
    });

    it("should not call onPageChange when entering same page number", async () => {
      const onPageChange = vi.fn();
      const { user } = render(
        <Pagination
          {...defaultProps}
          currentPage={3}
          onPageChange={onPageChange}
        />
      );

      const input = screen.getByRole("textbox", { name: "ページ番号を入力" });
      await user.clear(input);
      await user.type(input, "3");
      await user.keyboard("{Enter}");

      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("should only accept numeric input", async () => {
      const { user } = render(<Pagination {...defaultProps} currentPage={1} />);

      const input = screen.getByRole("textbox", { name: "ページ番号を入力" });
      await user.clear(input);
      await user.type(input, "abc");

      expect(input).toHaveValue("");
    });
  });

  describe("per page selector", () => {
    it("should not render per page selector when onPerPageChange is not provided", () => {
      render(<Pagination {...defaultProps} />);

      expect(screen.queryByText("表示件数:")).not.toBeInTheDocument();
    });

    it("should render per page selector when onPerPageChange is provided", () => {
      const onPerPageChange = vi.fn();
      render(
        <Pagination {...defaultProps} onPerPageChange={onPerPageChange} />
      );

      expect(screen.getByText("表示件数:")).toBeInTheDocument();
    });

    it("should show current per page value", () => {
      const onPerPageChange = vi.fn();
      render(
        <Pagination
          {...defaultProps}
          perPage={20}
          onPerPageChange={onPerPageChange}
        />
      );

      expect(
        screen.getByRole("combobox", { name: "1ページあたりの表示件数" })
      ).toHaveTextContent("20件");
    });

    it("should call onPerPageChange when selecting new value", async () => {
      const onPerPageChange = vi.fn();
      const { user } = render(
        <Pagination
          {...defaultProps}
          perPage={20}
          onPerPageChange={onPerPageChange}
        />
      );

      await user.click(
        screen.getByRole("combobox", { name: "1ページあたりの表示件数" })
      );
      await user.click(screen.getByRole("option", { name: "50件" }));

      expect(onPerPageChange).toHaveBeenCalledWith(50);
    });

    it("should render custom per page options", async () => {
      const onPerPageChange = vi.fn();
      const { user } = render(
        <Pagination
          {...defaultProps}
          perPage={25}
          onPerPageChange={onPerPageChange}
          perPageOptions={[25, 50, 100]}
        />
      );

      await user.click(
        screen.getByRole("combobox", { name: "1ページあたりの表示件数" })
      );

      expect(screen.getByRole("option", { name: "25件" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "50件" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "100件" })).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("should have aria-live on pagination info", () => {
      render(<Pagination {...defaultProps} />);

      const info = screen.getByText(/全100件中/);
      expect(info).toHaveAttribute("aria-live", "polite");
    });

    it("should have proper aria-labels on all buttons", () => {
      render(<Pagination {...defaultProps} currentPage={3} />);

      expect(
        screen.getByRole("button", { name: "最初のページへ" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "前のページへ" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "次のページへ" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "最後のページへ" })
      ).toBeInTheDocument();
    });
  });
});
