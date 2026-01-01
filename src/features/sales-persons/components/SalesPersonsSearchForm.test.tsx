import { describe, it, expect, vi } from "vitest";

import { render, screen, mockAdminUser, waitFor } from "@/test/test-utils";

import { SalesPersonsSearchForm } from "./SalesPersonsSearchForm";

describe("SalesPersonsSearchForm", () => {
  const defaultProps = {
    onSearch: vi.fn(),
    onClear: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render search form fields", () => {
      render(<SalesPersonsSearchForm {...defaultProps} />, {
        user: mockAdminUser,
      });

      expect(screen.getByLabelText("氏名")).toBeInTheDocument();
      expect(screen.getByLabelText("部署")).toBeInTheDocument();
    });

    it("should render search and clear buttons", () => {
      render(<SalesPersonsSearchForm {...defaultProps} />, {
        user: mockAdminUser,
      });

      expect(screen.getByRole("button", { name: /検索/ })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /クリア/ })
      ).toBeInTheDocument();
    });
  });

  describe("default values", () => {
    it("should populate form with default values", () => {
      render(
        <SalesPersonsSearchForm
          {...defaultProps}
          defaultValues={{ name: "山田", department: "営業1課" }}
        />,
        { user: mockAdminUser }
      );

      expect(screen.getByLabelText("氏名")).toHaveValue("山田");
    });
  });

  describe("search submission", () => {
    it("should call onSearch with form values when submitted", async () => {
      const onSearch = vi.fn();
      const { user } = render(
        <SalesPersonsSearchForm {...defaultProps} onSearch={onSearch} />,
        { user: mockAdminUser }
      );

      await user.type(screen.getByLabelText("氏名"), "山田");
      await user.click(screen.getByRole("button", { name: /検索/ }));

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalled();
        expect(onSearch.mock.calls[0]?.[0]).toEqual({
          name: "山田",
          department: "_all",
        });
      });
    });
  });

  describe("clear functionality", () => {
    it("should call onClear when clear button is clicked", async () => {
      const onClear = vi.fn();
      const { user } = render(
        <SalesPersonsSearchForm
          {...defaultProps}
          onClear={onClear}
          defaultValues={{ name: "山田", department: "営業1課" }}
        />,
        { user: mockAdminUser }
      );

      await user.click(screen.getByRole("button", { name: /クリア/ }));

      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it("should reset form fields when clear button is clicked", async () => {
      const { user } = render(
        <SalesPersonsSearchForm
          {...defaultProps}
          defaultValues={{ name: "山田", department: "_all" }}
        />,
        { user: mockAdminUser }
      );

      await user.type(screen.getByLabelText("氏名"), "追加テキスト");
      await user.click(screen.getByRole("button", { name: /クリア/ }));

      await waitFor(() => {
        expect(screen.getByLabelText("氏名")).toHaveValue("");
      });
    });
  });

  describe("loading state", () => {
    it("should disable inputs when loading", () => {
      render(<SalesPersonsSearchForm {...defaultProps} isLoading={true} />, {
        user: mockAdminUser,
      });

      expect(screen.getByLabelText("氏名")).toBeDisabled();
    });

    it("should disable buttons when loading", () => {
      render(<SalesPersonsSearchForm {...defaultProps} isLoading={true} />, {
        user: mockAdminUser,
      });

      expect(screen.getByRole("button", { name: /検索/ })).toBeDisabled();
      expect(screen.getByRole("button", { name: /クリア/ })).toBeDisabled();
    });
  });
});
