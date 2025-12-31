import { describe, it, expect, vi } from "vitest";

import { render, screen, mockAdminUser } from "@/test/test-utils";

import { DeleteCustomerDialog } from "./DeleteCustomerDialog";

describe("DeleteCustomerDialog", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    customerName: "株式会社テスト",
    onConfirm: vi.fn(),
    isDeleting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render dialog title", () => {
      render(<DeleteCustomerDialog {...defaultProps} />, {
        user: mockAdminUser,
      });

      expect(screen.getByText("顧客の削除確認")).toBeInTheDocument();
    });

    it("should render confirmation message", () => {
      render(<DeleteCustomerDialog {...defaultProps} />, {
        user: mockAdminUser,
      });

      expect(
        screen.getByText(
          "以下の顧客を削除してもよろしいですか？この操作は取り消せません。"
        )
      ).toBeInTheDocument();
    });

    it("should display customer name", () => {
      render(<DeleteCustomerDialog {...defaultProps} />, {
        user: mockAdminUser,
      });

      expect(screen.getByText("株式会社テスト")).toBeInTheDocument();
    });

    it("should render cancel and confirm buttons", () => {
      render(<DeleteCustomerDialog {...defaultProps} />, {
        user: mockAdminUser,
      });

      expect(
        screen.getByRole("button", { name: "キャンセル" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "削除する" })
      ).toBeInTheDocument();
    });
  });

  describe("not rendered when closed", () => {
    it("should not render dialog content when open is false", () => {
      render(<DeleteCustomerDialog {...defaultProps} open={false} />, {
        user: mockAdminUser,
      });

      expect(screen.queryByText("顧客の削除確認")).not.toBeInTheDocument();
    });
  });

  describe("user interactions", () => {
    it("should call onConfirm when delete button is clicked", async () => {
      const onConfirm = vi.fn();
      const { user } = render(
        <DeleteCustomerDialog {...defaultProps} onConfirm={onConfirm} />,
        { user: mockAdminUser }
      );

      await user.click(screen.getByRole("button", { name: "削除する" }));

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("should call onOpenChange with false when cancel button is clicked", async () => {
      const onOpenChange = vi.fn();
      const { user } = render(
        <DeleteCustomerDialog {...defaultProps} onOpenChange={onOpenChange} />,
        { user: mockAdminUser }
      );

      await user.click(screen.getByRole("button", { name: "キャンセル" }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("loading state", () => {
    it("should disable cancel button when deleting", () => {
      render(<DeleteCustomerDialog {...defaultProps} isDeleting={true} />, {
        user: mockAdminUser,
      });

      expect(screen.getByRole("button", { name: "キャンセル" })).toBeDisabled();
    });

    it("should disable delete button when deleting", () => {
      render(<DeleteCustomerDialog {...defaultProps} isDeleting={true} />, {
        user: mockAdminUser,
      });

      expect(screen.getByRole("button", { name: "削除する" })).toBeDisabled();
    });
  });
});
