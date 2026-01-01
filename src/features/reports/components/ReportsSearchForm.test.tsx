import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  render,
  screen,
  mockManagerUser,
  mockMemberUser,
  waitFor,
} from "@/test/test-utils";

import { ReportsSearchForm } from "./ReportsSearchForm";

import type { SalesPersonOption } from "../types";

describe("ReportsSearchForm", () => {
  const mockSalesPersons: SalesPersonOption[] = [
    { sales_person_id: 1, name: "山田太郎" },
    { sales_person_id: 2, name: "鈴木一郎" },
    { sales_person_id: 3, name: "佐藤花子" },
  ];

  const defaultProps = {
    salesPersons: mockSalesPersons,
    currentUserId: 1,
    isManager: false,
    onSearch: vi.fn(),
    onClear: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render search form fields", () => {
      render(<ReportsSearchForm {...defaultProps} />, {
        user: mockMemberUser,
      });

      expect(screen.getByLabelText("期間（開始）")).toBeInTheDocument();
      expect(screen.getByLabelText("期間（終了）")).toBeInTheDocument();
      expect(screen.getByLabelText("担当者")).toBeInTheDocument();
      expect(screen.getByLabelText("ステータス")).toBeInTheDocument();
    });

    it("should render search and clear buttons", () => {
      render(<ReportsSearchForm {...defaultProps} />, {
        user: mockMemberUser,
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
        <ReportsSearchForm
          {...defaultProps}
          defaultValues={{
            date_from: "2024-01-01",
            date_to: "2024-01-31",
            sales_person_id: "1",
            status: "submitted",
          }}
        />,
        { user: mockMemberUser }
      );

      expect(screen.getByLabelText("期間（開始）")).toHaveValue("2024-01-01");
      expect(screen.getByLabelText("期間（終了）")).toHaveValue("2024-01-31");
    });
  });

  describe("manager vs member permissions", () => {
    it("should disable sales person select for regular members", () => {
      render(<ReportsSearchForm {...defaultProps} isManager={false} />, {
        user: mockMemberUser,
      });

      // 担当者選択はdisabledになっている
      const selectTrigger = screen.getByLabelText("担当者").closest("button");
      expect(selectTrigger).toBeDisabled();
    });

    it("should enable sales person select for managers", () => {
      render(<ReportsSearchForm {...defaultProps} isManager={true} />, {
        user: mockManagerUser,
      });

      // 担当者選択はenabledになっている
      const selectTrigger = screen.getByLabelText("担当者").closest("button");
      expect(selectTrigger).not.toBeDisabled();
    });
  });

  describe("search submission", () => {
    it("should call onSearch with form values when submitted", async () => {
      const onSearch = vi.fn();
      const { user } = render(
        <ReportsSearchForm {...defaultProps} onSearch={onSearch} />,
        { user: mockMemberUser }
      );

      // 日付を入力
      const dateFromInput = screen.getByLabelText("期間（開始）");
      await user.clear(dateFromInput);
      await user.type(dateFromInput, "2024-01-01");

      // 検索ボタンをクリック
      await user.click(screen.getByRole("button", { name: /検索/ }));

      await waitFor(() => {
        expect(onSearch).toHaveBeenCalled();
        expect(onSearch.mock.calls[0]?.[0]).toMatchObject({
          date_from: "2024-01-01",
        });
      });
    });
  });

  describe("clear functionality", () => {
    it("should call onClear when clear button is clicked", async () => {
      const onClear = vi.fn();
      const { user } = render(
        <ReportsSearchForm
          {...defaultProps}
          onClear={onClear}
          defaultValues={{
            date_from: "2024-01-01",
            date_to: "2024-01-31",
            sales_person_id: "_all",
            status: "_all",
          }}
        />,
        { user: mockMemberUser }
      );

      await user.click(screen.getByRole("button", { name: /クリア/ }));

      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it("should reset form fields when clear button is clicked", async () => {
      const { user } = render(
        <ReportsSearchForm
          {...defaultProps}
          defaultValues={{
            date_from: "2024-01-01",
            date_to: "2024-01-31",
            sales_person_id: "_all",
            status: "_all",
          }}
        />,
        { user: mockMemberUser }
      );

      await user.click(screen.getByRole("button", { name: /クリア/ }));

      await waitFor(() => {
        expect(screen.getByLabelText("期間（開始）")).toHaveValue("");
        expect(screen.getByLabelText("期間（終了）")).toHaveValue("");
      });
    });
  });

  describe("loading state", () => {
    it("should disable date inputs when loading", () => {
      render(<ReportsSearchForm {...defaultProps} isLoading={true} />, {
        user: mockMemberUser,
      });

      expect(screen.getByLabelText("期間（開始）")).toBeDisabled();
      expect(screen.getByLabelText("期間（終了）")).toBeDisabled();
    });

    it("should disable buttons when loading", () => {
      render(<ReportsSearchForm {...defaultProps} isLoading={true} />, {
        user: mockMemberUser,
      });

      expect(screen.getByRole("button", { name: /検索/ })).toBeDisabled();
      expect(screen.getByRole("button", { name: /クリア/ })).toBeDisabled();
    });
  });

  describe("status options", () => {
    it("should have status select field rendered", () => {
      render(<ReportsSearchForm {...defaultProps} isManager={true} />, {
        user: mockManagerUser,
      });

      // ステータスフィールドが存在することを確認
      expect(screen.getByLabelText("ステータス")).toBeInTheDocument();

      // ステータスフィールドがdisabledでないことを確認
      const statusTrigger = screen
        .getByLabelText("ステータス")
        .closest("button");
      expect(statusTrigger).not.toBeDisabled();
    });
  });
});
