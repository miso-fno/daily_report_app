import { describe, it, expect, vi } from "vitest";

import { render, screen, mockAdminUser, waitFor } from "@/test/test-utils";

import { CustomerForm } from "./CustomerForm";

// next/navigation のモック
vi.mock("next/navigation", () => ({
  usePathname: () => "/customers/new",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe("CustomerForm", () => {
  const defaultProps = {
    mode: "create" as const,
    onSubmit: vi.fn(),
    isSubmitting: false,
    isDeleting: false,
    error: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render all form fields", () => {
      render(<CustomerForm {...defaultProps} />, { user: mockAdminUser });

      expect(screen.getByLabelText(/顧客名/)).toBeInTheDocument();
      expect(screen.getByLabelText(/住所/)).toBeInTheDocument();
      expect(screen.getByLabelText(/電話番号/)).toBeInTheDocument();
      expect(screen.getByLabelText(/担当者名/)).toBeInTheDocument();
    });

    it("should show required indicator for customer_name", () => {
      render(<CustomerForm {...defaultProps} />, { user: mockAdminUser });

      // 顧客名の横に * があることを確認
      const label = screen.getByText(/顧客名/);
      expect(label.parentElement).toHaveTextContent("*");
    });

    it("should show '登録' button in create mode", () => {
      render(<CustomerForm {...defaultProps} mode="create" />, {
        user: mockAdminUser,
      });

      expect(screen.getByRole("button", { name: "登録" })).toBeInTheDocument();
    });

    it("should show '更新' button in edit mode", () => {
      render(<CustomerForm {...defaultProps} mode="edit" />, {
        user: mockAdminUser,
      });

      expect(screen.getByRole("button", { name: "更新" })).toBeInTheDocument();
    });

    it("should show delete button in edit mode with onDelete", () => {
      render(
        <CustomerForm {...defaultProps} mode="edit" onDelete={vi.fn()} />,
        { user: mockAdminUser }
      );

      expect(screen.getByRole("button", { name: "削除" })).toBeInTheDocument();
    });

    it("should not show delete button in create mode", () => {
      render(<CustomerForm {...defaultProps} mode="create" />, {
        user: mockAdminUser,
      });

      expect(
        screen.queryByRole("button", { name: "削除" })
      ).not.toBeInTheDocument();
    });

    it("should show cancel button with link to customers list", () => {
      render(<CustomerForm {...defaultProps} />, { user: mockAdminUser });

      const cancelButton = screen.getByRole("link", { name: "キャンセル" });
      expect(cancelButton).toHaveAttribute("href", "/customers");
    });
  });

  describe("initial data", () => {
    it("should populate form with initial data in edit mode", () => {
      const initialData = {
        customer_name: "株式会社サンプル",
        address: "東京都渋谷区1-2-3",
        phone: "03-1234-5678",
        contact_person: "鈴木太郎",
      };

      render(
        <CustomerForm
          {...defaultProps}
          mode="edit"
          initialData={initialData}
        />,
        { user: mockAdminUser }
      );

      expect(screen.getByLabelText(/顧客名/)).toHaveValue("株式会社サンプル");
      expect(screen.getByLabelText(/住所/)).toHaveValue("東京都渋谷区1-2-3");
      expect(screen.getByLabelText(/電話番号/)).toHaveValue("03-1234-5678");
      expect(screen.getByLabelText(/担当者名/)).toHaveValue("鈴木太郎");
    });

    it("should handle null values in initial data", () => {
      const initialData = {
        customer_name: "株式会社テスト",
        address: null,
        phone: null,
        contact_person: null,
      };

      render(
        <CustomerForm
          {...defaultProps}
          mode="edit"
          initialData={initialData}
        />,
        { user: mockAdminUser }
      );

      expect(screen.getByLabelText(/顧客名/)).toHaveValue("株式会社テスト");
      expect(screen.getByLabelText(/住所/)).toHaveValue("");
      expect(screen.getByLabelText(/電話番号/)).toHaveValue("");
      expect(screen.getByLabelText(/担当者名/)).toHaveValue("");
    });
  });

  describe("validation", () => {
    it("should show error when customer_name is empty on submit", async () => {
      const onSubmit = vi.fn();
      const { user } = render(
        <CustomerForm {...defaultProps} onSubmit={onSubmit} />,
        { user: mockAdminUser }
      );

      await user.click(screen.getByRole("button", { name: "登録" }));

      await waitFor(() => {
        expect(screen.getByText("顧客名は必須です")).toBeInTheDocument();
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("should show error when customer_name exceeds 100 characters", async () => {
      const { user } = render(<CustomerForm {...defaultProps} />, {
        user: mockAdminUser,
      });

      const longName = "a".repeat(101);
      await user.type(screen.getByLabelText(/顧客名/), longName);
      await user.click(screen.getByRole("button", { name: "登録" }));

      await waitFor(() => {
        expect(
          screen.getByText("顧客名は100文字以内で入力してください")
        ).toBeInTheDocument();
      });
    });

    it("should show error when address exceeds 200 characters", async () => {
      const { user } = render(<CustomerForm {...defaultProps} />, {
        user: mockAdminUser,
      });

      await user.type(screen.getByLabelText(/顧客名/), "テスト会社");
      const longAddress = "a".repeat(201);
      await user.type(screen.getByLabelText(/住所/), longAddress);
      await user.click(screen.getByRole("button", { name: "登録" }));

      await waitFor(() => {
        expect(
          screen.getByText("住所は200文字以内で入力してください")
        ).toBeInTheDocument();
      });
    });

    it("should show error for invalid phone format", async () => {
      const { user } = render(<CustomerForm {...defaultProps} />, {
        user: mockAdminUser,
      });

      await user.type(screen.getByLabelText(/顧客名/), "テスト会社");
      await user.type(screen.getByLabelText(/電話番号/), "invalid-phone");
      await user.click(screen.getByRole("button", { name: "登録" }));

      await waitFor(() => {
        expect(
          screen.getByText(
            "電話番号の形式が正しくありません（例: 03-1234-5678, 090-1234-5678）"
          )
        ).toBeInTheDocument();
      });
    });

    it("should accept valid phone formats", async () => {
      const onSubmit = vi.fn();
      const { user } = render(
        <CustomerForm {...defaultProps} onSubmit={onSubmit} />,
        { user: mockAdminUser }
      );

      await user.type(screen.getByLabelText(/顧客名/), "テスト会社");
      await user.type(screen.getByLabelText(/電話番号/), "03-1234-5678");
      await user.click(screen.getByRole("button", { name: "登録" }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });

    it("should show error when contact_person exceeds 50 characters", async () => {
      const { user } = render(<CustomerForm {...defaultProps} />, {
        user: mockAdminUser,
      });

      await user.type(screen.getByLabelText(/顧客名/), "テスト会社");
      const longName = "a".repeat(51);
      await user.type(screen.getByLabelText(/担当者名/), longName);
      await user.click(screen.getByRole("button", { name: "登録" }));

      await waitFor(() => {
        expect(
          screen.getByText("担当者名は50文字以内で入力してください")
        ).toBeInTheDocument();
      });
    });
  });

  describe("form submission", () => {
    it("should call onSubmit with form data when valid", async () => {
      const onSubmit = vi.fn();
      const { user } = render(
        <CustomerForm {...defaultProps} onSubmit={onSubmit} />,
        { user: mockAdminUser }
      );

      await user.type(screen.getByLabelText(/顧客名/), "新規顧客株式会社");
      await user.type(screen.getByLabelText(/住所/), "東京都中央区");
      await user.type(screen.getByLabelText(/電話番号/), "03-5555-1234");
      await user.type(screen.getByLabelText(/担当者名/), "佐藤一郎");
      await user.click(screen.getByRole("button", { name: "登録" }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          customer_name: "新規顧客株式会社",
          address: "東京都中央区",
          phone: "03-5555-1234",
          contact_person: "佐藤一郎",
        });
      });
    });

    it("should call onSubmit with empty optional fields", async () => {
      const onSubmit = vi.fn();
      const { user } = render(
        <CustomerForm {...defaultProps} onSubmit={onSubmit} />,
        { user: mockAdminUser }
      );

      await user.type(screen.getByLabelText(/顧客名/), "最小限の顧客");
      await user.click(screen.getByRole("button", { name: "登録" }));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          customer_name: "最小限の顧客",
          address: "",
          phone: "",
          contact_person: "",
        });
      });
    });
  });

  describe("loading states", () => {
    it("should disable all inputs when submitting", () => {
      render(<CustomerForm {...defaultProps} isSubmitting={true} />, {
        user: mockAdminUser,
      });

      expect(screen.getByLabelText(/顧客名/)).toBeDisabled();
      expect(screen.getByLabelText(/住所/)).toBeDisabled();
      expect(screen.getByLabelText(/電話番号/)).toBeDisabled();
      expect(screen.getByLabelText(/担当者名/)).toBeDisabled();
    });

    it("should disable submit button when submitting", () => {
      render(<CustomerForm {...defaultProps} isSubmitting={true} />, {
        user: mockAdminUser,
      });

      expect(screen.getByRole("button", { name: "登録" })).toBeDisabled();
    });

    it("should disable delete button when deleting", () => {
      render(
        <CustomerForm
          {...defaultProps}
          mode="edit"
          onDelete={vi.fn()}
          isDeleting={true}
        />,
        { user: mockAdminUser }
      );

      expect(screen.getByRole("button", { name: "削除" })).toBeDisabled();
    });
  });

  describe("error display", () => {
    it("should display error message when error prop is set", () => {
      render(
        <CustomerForm
          {...defaultProps}
          error="この顧客名は既に登録されています"
        />,
        { user: mockAdminUser }
      );

      expect(
        screen.getByText("この顧客名は既に登録されています")
      ).toBeInTheDocument();
    });
  });

  describe("delete button", () => {
    it("should call onDelete when delete button is clicked", async () => {
      const onDelete = vi.fn();
      const { user } = render(
        <CustomerForm {...defaultProps} mode="edit" onDelete={onDelete} />,
        { user: mockAdminUser }
      );

      await user.click(screen.getByRole("button", { name: "削除" }));

      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });
});
