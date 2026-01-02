import { describe, it, expect, vi, beforeEach } from "vitest";

import { render, screen, waitFor } from "@/test/test-utils";

import { ConfirmDialog, useUnsavedChangesDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    title: "確認",
    description: "この操作を実行しますか？",
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render dialog when open is true", () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "確認" })).toBeInTheDocument();
      expect(screen.getByText("この操作を実行しますか？")).toBeInTheDocument();
    });

    it("should not render dialog when open is false", () => {
      render(<ConfirmDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should render default button labels", () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByRole("button", { name: "確認" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "キャンセル" })
      ).toBeInTheDocument();
    });

    it("should render custom button labels", () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          confirmLabel="削除する"
          cancelLabel="やめる"
        />
      );

      expect(
        screen.getByRole("button", { name: "削除する" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "やめる" })
      ).toBeInTheDocument();
    });
  });

  describe("variants", () => {
    it("should render destructive variant with destructive button style", () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          variant="destructive"
          confirmLabel="削除"
        />
      );

      const confirmButton = screen.getByRole("button", { name: "削除" });
      // Check if the button has destructive class
      expect(confirmButton).toHaveClass("bg-destructive");
    });

    it("should render default variant with default button style", () => {
      render(<ConfirmDialog {...defaultProps} variant="default" />);

      const confirmButton = screen.getByRole("button", { name: "確認" });
      // Check if the button has primary class
      expect(confirmButton).toHaveClass("bg-primary");
    });
  });

  describe("user interactions", () => {
    it("should call onConfirm and close dialog when confirm button is clicked", async () => {
      const onConfirm = vi.fn();
      const onOpenChange = vi.fn();
      const { user } = render(
        <ConfirmDialog
          {...defaultProps}
          onConfirm={onConfirm}
          onOpenChange={onOpenChange}
        />
      );

      await user.click(screen.getByRole("button", { name: "確認" }));

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledTimes(1);
      });
      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it("should call onCancel and close dialog when cancel button is clicked", async () => {
      const onCancel = vi.fn();
      const onOpenChange = vi.fn();
      const { user } = render(
        <ConfirmDialog
          {...defaultProps}
          onCancel={onCancel}
          onOpenChange={onOpenChange}
        />
      );

      await user.click(screen.getByRole("button", { name: "キャンセル" }));

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("should close dialog when cancel button is clicked without onCancel", async () => {
      const onOpenChange = vi.fn();
      const { user } = render(
        <ConfirmDialog {...defaultProps} onOpenChange={onOpenChange} />
      );

      await user.click(screen.getByRole("button", { name: "キャンセル" }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("async onConfirm", () => {
    it("should show loading state during async onConfirm", async () => {
      const asyncConfirm = vi.fn(
        (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 100))
      );
      const { user } = render(
        <ConfirmDialog {...defaultProps} onConfirm={asyncConfirm} />
      );

      await user.click(screen.getByRole("button", { name: "確認" }));

      expect(screen.getByText("処理中...")).toBeInTheDocument();
    });

    it("should disable buttons during async processing", async () => {
      const asyncConfirm = vi.fn(
        (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 100))
      );
      const { user } = render(
        <ConfirmDialog {...defaultProps} onConfirm={asyncConfirm} />
      );

      await user.click(screen.getByRole("button", { name: "確認" }));

      expect(screen.getByRole("button", { name: "処理中..." })).toBeDisabled();
      expect(screen.getByRole("button", { name: "キャンセル" })).toBeDisabled();
    });
  });

  describe("isLoading prop", () => {
    it("should show loading state when isLoading is true", () => {
      render(<ConfirmDialog {...defaultProps} isLoading={true} />);

      expect(screen.getByText("処理中...")).toBeInTheDocument();
    });

    it("should disable buttons when isLoading is true", () => {
      render(<ConfirmDialog {...defaultProps} isLoading={true} />);

      expect(screen.getByRole("button", { name: "処理中..." })).toBeDisabled();
      expect(screen.getByRole("button", { name: "キャンセル" })).toBeDisabled();
    });
  });
});

describe("useUnsavedChangesDialog", () => {
  function TestComponent({
    onNavigate,
  }: {
    onNavigate: (confirmed: boolean) => void;
  }) {
    const { confirmNavigation, UnsavedDialog } = useUnsavedChangesDialog();

    const handleClick = async () => {
      const confirmed = await confirmNavigation();
      onNavigate(confirmed);
    };

    return (
      <>
        <button onClick={handleClick}>Navigate</button>
        <UnsavedDialog />
      </>
    );
  }

  it("should show unsaved changes dialog when confirmNavigation is called", async () => {
    const onNavigate = vi.fn();
    const { user } = render(<TestComponent onNavigate={onNavigate} />);

    await user.click(screen.getByRole("button", { name: "Navigate" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText("保存されていない変更があります")
    ).toBeInTheDocument();
  });

  it("should resolve true when user confirms navigation", async () => {
    const onNavigate = vi.fn();
    const { user } = render(<TestComponent onNavigate={onNavigate} />);

    await user.click(screen.getByRole("button", { name: "Navigate" }));
    await user.click(
      screen.getByRole("button", { name: "このページを離れる" })
    );

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith(true);
    });
  });

  it("should resolve false when user cancels navigation", async () => {
    const onNavigate = vi.fn();
    const { user } = render(<TestComponent onNavigate={onNavigate} />);

    await user.click(screen.getByRole("button", { name: "Navigate" }));
    await user.click(
      screen.getByRole("button", { name: "このページに留まる" })
    );

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith(false);
    });
  });

  it("should close dialog after confirmation", async () => {
    const onNavigate = vi.fn();
    const { user } = render(<TestComponent onNavigate={onNavigate} />);

    await user.click(screen.getByRole("button", { name: "Navigate" }));
    await user.click(
      screen.getByRole("button", { name: "このページを離れる" })
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
