import { describe, it, expect, vi } from "vitest";

import { render, screen, mockMemberUser } from "@/test/test-utils";

import { CustomerSearchForm } from "./CustomerSearchForm";

describe("CustomerSearchForm", () => {
  const defaultProps = {
    values: { customerName: "" },
    onChange: vi.fn(),
    onSearch: vi.fn(),
    onClear: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render customer name input field", () => {
      render(<CustomerSearchForm {...defaultProps} />, {
        user: mockMemberUser,
      });

      expect(screen.getByLabelText("顧客名")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("顧客名で検索（部分一致）")
      ).toBeInTheDocument();
    });

    it("should render search and clear buttons", () => {
      render(<CustomerSearchForm {...defaultProps} />, {
        user: mockMemberUser,
      });

      expect(screen.getByRole("button", { name: "検索" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "クリア" })
      ).toBeInTheDocument();
    });

    it("should display current search value", () => {
      render(
        <CustomerSearchForm
          {...defaultProps}
          values={{ customerName: "テスト顧客" }}
        />,
        { user: mockMemberUser }
      );

      expect(screen.getByLabelText("顧客名")).toHaveValue("テスト顧客");
    });
  });

  describe("user interactions", () => {
    it("should call onChange when input value changes", async () => {
      const onChange = vi.fn();
      const { user } = render(
        <CustomerSearchForm {...defaultProps} onChange={onChange} />,
        { user: mockMemberUser }
      );

      const input = screen.getByLabelText("顧客名");
      await user.type(input, "株式会社");

      expect(onChange).toHaveBeenCalled();
    });

    it("should call onSearch when search button is clicked", async () => {
      const onSearch = vi.fn();
      const { user } = render(
        <CustomerSearchForm {...defaultProps} onSearch={onSearch} />,
        { user: mockMemberUser }
      );

      await user.click(screen.getByRole("button", { name: "検索" }));

      expect(onSearch).toHaveBeenCalledTimes(1);
    });

    it("should call onSearch when Enter key is pressed in input", async () => {
      const onSearch = vi.fn();
      const { user } = render(
        <CustomerSearchForm {...defaultProps} onSearch={onSearch} />,
        { user: mockMemberUser }
      );

      const input = screen.getByLabelText("顧客名");
      await user.type(input, "{Enter}");

      expect(onSearch).toHaveBeenCalledTimes(1);
    });

    it("should call onChange with empty string and onClear when clear button is clicked", async () => {
      const onChange = vi.fn();
      const onClear = vi.fn();
      const { user } = render(
        <CustomerSearchForm
          {...defaultProps}
          values={{ customerName: "テスト" }}
          onChange={onChange}
          onClear={onClear}
        />,
        { user: mockMemberUser }
      );

      await user.click(screen.getByRole("button", { name: "クリア" }));

      expect(onChange).toHaveBeenCalledWith({ customerName: "" });
      expect(onClear).toHaveBeenCalledTimes(1);
    });
  });

  describe("loading state", () => {
    it("should disable input when loading", () => {
      render(<CustomerSearchForm {...defaultProps} isLoading={true} />, {
        user: mockMemberUser,
      });

      expect(screen.getByLabelText("顧客名")).toBeDisabled();
    });

    it("should disable search button when loading", () => {
      render(<CustomerSearchForm {...defaultProps} isLoading={true} />, {
        user: mockMemberUser,
      });

      expect(screen.getByRole("button", { name: "検索" })).toBeDisabled();
    });

    it("should disable clear button when loading", () => {
      render(<CustomerSearchForm {...defaultProps} isLoading={true} />, {
        user: mockMemberUser,
      });

      expect(screen.getByRole("button", { name: "クリア" })).toBeDisabled();
    });
  });
});
