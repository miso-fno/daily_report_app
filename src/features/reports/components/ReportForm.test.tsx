import { describe, it, expect, vi, beforeEach } from "vitest";

import { render, screen, mockMemberUser, waitFor } from "@/test/test-utils";

import { ReportForm } from "./ReportForm";

import type { ReportDetail } from "../types";

// next/navigation のモック
vi.mock("next/navigation", () => ({
  usePathname: () => "/reports/new",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// API モック
const mockFetchCustomersForSelect = vi.fn();
const mockCreateReport = vi.fn();
const mockUpdateReport = vi.fn();

vi.mock("../api", () => ({
  fetchCustomersForSelect: () => mockFetchCustomersForSelect(),
  createReport: (data: unknown) => mockCreateReport(data),
  updateReport: (id: number, data: unknown) => mockUpdateReport(id, data),
}));

const mockCustomers = [
  { customer_id: 1, customer_name: "株式会社テスト" },
  { customer_id: 2, customer_name: "サンプル商事" },
];

describe("ReportForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchCustomersForSelect.mockResolvedValue({
      success: true,
      data: {
        items: mockCustomers,
        pagination: { total: 2, per_page: 100, current_page: 1, last_page: 1 },
      },
    });
    mockCreateReport.mockResolvedValue({
      success: true,
      data: { report_id: 1 },
    });
    mockUpdateReport.mockResolvedValue({
      success: true,
      data: { report_id: 1 },
    });
  });

  describe("rendering - create mode", () => {
    it("should render all form fields", async () => {
      render(<ReportForm />, { user: mockMemberUser });

      await waitFor(() => {
        expect(screen.getByLabelText(/報告日/)).toBeInTheDocument();
      });

      expect(screen.getByText("訪問記録")).toBeInTheDocument();
      expect(screen.getByLabelText(/課題・相談/)).toBeInTheDocument();
      expect(screen.getByLabelText(/明日の予定/)).toBeInTheDocument();
    });

    it("should show title for create mode", async () => {
      render(<ReportForm />, { user: mockMemberUser });

      await waitFor(() => {
        expect(screen.getByText("日報作成")).toBeInTheDocument();
      });
    });

    it("should show action buttons", async () => {
      render(<ReportForm />, { user: mockMemberUser });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "下書き保存" })
        ).toBeInTheDocument();
      });

      expect(screen.getByRole("button", { name: "提出" })).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "キャンセル" })
      ).toBeInTheDocument();
    });

    it("should show add visit button", async () => {
      render(<ReportForm />, { user: mockMemberUser });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /訪問を追加/ })
        ).toBeInTheDocument();
      });
    });

    it("should show empty visits message initially", async () => {
      render(<ReportForm />, { user: mockMemberUser });

      await waitFor(() => {
        expect(screen.getByText("訪問記録がありません")).toBeInTheDocument();
      });
    });

    it("should set today's date as default", async () => {
      render(<ReportForm />, { user: mockMemberUser });

      await waitFor(() => {
        const dateInput = screen.getByLabelText(/報告日/) as HTMLInputElement;
        expect(dateInput.value).toBeTruthy();
      });
    });
  });

  describe("rendering - edit mode", () => {
    const mockReport: ReportDetail = {
      report_id: 1,
      report_date: "2024-01-15",
      sales_person_id: 1,
      sales_person_name: "テスト太郎",
      status: "draft",
      status_label: "下書き",
      problem: "課題テスト",
      plan: "予定テスト",
      visits: [
        {
          visit_id: 1,
          customer_id: 1,
          customer_name: "株式会社テスト",
          visit_time: "10:00",
          visit_purpose: "商談",
          visit_content: "新規提案を行いました",
          visit_result: "次回アポイント取得",
        },
      ],
      comments: [],
      created_at: "2024-01-15T00:00:00Z",
      updated_at: "2024-01-15T00:00:00Z",
    };

    it("should show title for edit mode", async () => {
      render(<ReportForm report={mockReport} isEdit />, {
        user: mockMemberUser,
      });

      await waitFor(() => {
        expect(screen.getByText("日報編集")).toBeInTheDocument();
      });
    });

    it("should populate form with existing data", async () => {
      render(<ReportForm report={mockReport} isEdit />, {
        user: mockMemberUser,
      });

      await waitFor(() => {
        const dateInput = screen.getByLabelText(/報告日/) as HTMLInputElement;
        expect(dateInput.value).toBe("2024-01-15");
      });

      expect(screen.getByLabelText(/課題・相談/)).toHaveValue("課題テスト");
      expect(screen.getByLabelText(/明日の予定/)).toHaveValue("予定テスト");
    });

    it("should show existing visit records", async () => {
      render(<ReportForm report={mockReport} isEdit />, {
        user: mockMemberUser,
      });

      await waitFor(() => {
        // 既存の訪問記録がフォームに表示されていることを確認
        expect(
          screen.getByRole("group", { name: "訪問記録 1" })
        ).toBeInTheDocument();
      });
    });
  });

  describe("add visit functionality", () => {
    it("should add visit record when clicking add button", async () => {
      const { user } = render(<ReportForm />, { user: mockMemberUser });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /訪問を追加/ })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /訪問を追加/ }));

      await waitFor(() => {
        expect(
          screen.getByRole("group", { name: "訪問記録 1" })
        ).toBeInTheDocument();
      });

      expect(
        screen.queryByText("訪問記録がありません")
      ).not.toBeInTheDocument();
    });

    it("should be able to add multiple visit records", async () => {
      const { user } = render(<ReportForm />, { user: mockMemberUser });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /訪問を追加/ })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /訪問を追加/ }));
      await user.click(screen.getByRole("button", { name: /訪問を追加/ }));

      await waitFor(() => {
        expect(
          screen.getByRole("group", { name: "訪問記録 1" })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("group", { name: "訪問記録 2" })
        ).toBeInTheDocument();
      });
    });
  });

  describe("remove visit functionality", () => {
    it("should remove visit record when clicking delete button", async () => {
      const { user } = render(<ReportForm />, { user: mockMemberUser });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /訪問を追加/ })
        ).toBeInTheDocument();
      });

      // 訪問記録を追加
      await user.click(screen.getByRole("button", { name: /訪問を追加/ }));

      await waitFor(() => {
        expect(
          screen.getByRole("group", { name: "訪問記録 1" })
        ).toBeInTheDocument();
      });

      // 削除ボタンをクリック
      await user.click(
        screen.getByRole("button", { name: "訪問記録 1 を削除" })
      );

      await waitFor(() => {
        expect(
          screen.queryByRole("group", { name: "訪問記録 1" })
        ).not.toBeInTheDocument();
      });

      expect(screen.getByText("訪問記録がありません")).toBeInTheDocument();
    });
  });

  describe("customers loading", () => {
    it("should load customers on mount", async () => {
      render(<ReportForm />, { user: mockMemberUser });

      await waitFor(() => {
        expect(mockFetchCustomersForSelect).toHaveBeenCalledTimes(1);
      });
    });

    it("should show loading state while loading customers", async () => {
      // 遅延を追加
      mockFetchCustomersForSelect.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  data: { items: mockCustomers, pagination: {} },
                }),
              100
            )
          )
      );

      render(<ReportForm />, { user: mockMemberUser });

      expect(screen.getByText("顧客データを読み込み中...")).toBeInTheDocument();

      await waitFor(() => {
        expect(
          screen.queryByText("顧客データを読み込み中...")
        ).not.toBeInTheDocument();
      });
    });

    it("should show error when customers loading fails", async () => {
      mockFetchCustomersForSelect.mockRejectedValue(
        new Error("ネットワークエラー")
      );

      render(<ReportForm />, { user: mockMemberUser });

      await waitFor(() => {
        expect(
          screen.getByText("顧客一覧の取得に失敗しました")
        ).toBeInTheDocument();
      });
    });
  });

  describe("form validation", () => {
    it("should show validation error when submitting without visits", async () => {
      const { user } = render(<ReportForm />, { user: mockMemberUser });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "提出" })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "提出" }));

      await waitFor(() => {
        expect(
          screen.getByText(/提出時は訪問記録を1件以上登録してください/)
        ).toBeInTheDocument();
      });
    });
  });
});
