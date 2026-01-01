import { describe, it, expect, vi, beforeEach } from "vitest";

import { render, screen, mockAdminUser, waitFor } from "@/test/test-utils";

import { SalesPersonForm } from "./SalesPersonForm";

import type { SalesPersonResponse, SalesPersonListItem } from "../types";

// next/navigation のモック
vi.mock("next/navigation", () => ({
  usePathname: () => "/sales-persons/new",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// API モック
const mockFetchManagers = vi.fn();
vi.mock("../api", () => ({
  fetchManagers: () => mockFetchManagers(),
  createSalesPerson: vi.fn().mockResolvedValue({ success: true }),
  updateSalesPerson: vi.fn().mockResolvedValue({ success: true }),
}));

const mockManagers: SalesPersonListItem[] = [
  {
    sales_person_id: 10,
    name: "管理者一郎",
    email: "admin@example.com",
    department: "営業1課",
    manager_id: null,
    manager_name: null,
    is_manager: true,
  },
];

describe("SalesPersonForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchManagers.mockResolvedValue({
      success: true,
      data: { items: mockManagers },
    });
  });

  describe("rendering - create mode", () => {
    it("should render all form fields", async () => {
      render(<SalesPersonForm />, { user: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByLabelText(/氏名/)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/メールアドレス/)).toBeInTheDocument();
      expect(screen.getByLabelText(/パスワード/)).toBeInTheDocument();
      expect(screen.getByText("部署")).toBeInTheDocument();
      // "上長" is used both as form label and radio option, so check for at least one
      expect(screen.getAllByText("上長").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("権限")).toBeInTheDocument();
    });

    it("should show required indicators", async () => {
      render(<SalesPersonForm />, { user: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByLabelText(/氏名/)).toBeInTheDocument();
      });

      // 氏名、メールアドレス、パスワード、部署、権限に * がある
      const requiredIndicators = screen.getAllByText("*");
      expect(requiredIndicators.length).toBe(5);
    });

    it("should show title for create mode", async () => {
      render(<SalesPersonForm />, { user: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByText("営業担当者マスタ 登録")).toBeInTheDocument();
      });
    });

    it("should show role options", async () => {
      render(<SalesPersonForm />, { user: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByLabelText("一般")).toBeInTheDocument();
      });
      // "上長" radio button can be found by its input element
      expect(screen.getByRole("radio", { name: "上長" })).toBeInTheDocument();
    });

    it("should show save and cancel buttons", async () => {
      render(<SalesPersonForm />, { user: mockAdminUser });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "保存" })
        ).toBeInTheDocument();
      });
      expect(
        screen.getByRole("button", { name: "キャンセル" })
      ).toBeInTheDocument();
    });
  });

  describe("rendering - edit mode", () => {
    const mockSalesPerson: SalesPersonResponse = {
      sales_person_id: 1,
      name: "山田太郎",
      email: "yamada@example.com",
      department: "営業1課",
      manager_id: 10,
      manager_name: "管理者一郎",
      is_manager: false,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    it("should show title for edit mode", async () => {
      render(<SalesPersonForm salesPerson={mockSalesPerson} isEdit />, {
        user: mockAdminUser,
      });

      await waitFor(() => {
        expect(screen.getByText("営業担当者マスタ 編集")).toBeInTheDocument();
      });
    });

    it("should populate form with existing data", async () => {
      render(<SalesPersonForm salesPerson={mockSalesPerson} isEdit />, {
        user: mockAdminUser,
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/氏名/)).toHaveValue("山田太郎");
      });
      expect(screen.getByLabelText(/メールアドレス/)).toHaveValue(
        "yamada@example.com"
      );
      expect(screen.getByLabelText(/パスワード/)).toHaveValue("");
    });

    it("should show password description in edit mode", async () => {
      render(<SalesPersonForm salesPerson={mockSalesPerson} isEdit />, {
        user: mockAdminUser,
      });

      await waitFor(() => {
        expect(
          screen.getByText("空欄の場合、パスワードは変更されません")
        ).toBeInTheDocument();
      });
    });

    it("should not show required indicator for password in edit mode", async () => {
      render(<SalesPersonForm salesPerson={mockSalesPerson} isEdit />, {
        user: mockAdminUser,
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/氏名/)).toBeInTheDocument();
      });

      // 編集モードでは氏名、メールアドレス、部署、権限に * がある（パスワードは不要）
      const requiredIndicators = screen.getAllByText("*");
      expect(requiredIndicators.length).toBe(4);
    });
  });

  describe("validation - create mode", () => {
    it("should show validation errors when submitting empty form", async () => {
      const { user } = render(<SalesPersonForm />, { user: mockAdminUser });

      // マネージャー読み込み待ち
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "保存" })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "保存" }));

      // 空のフォーム送信時にバリデーションエラーが表示される
      await waitFor(() => {
        expect(screen.getByText("氏名を入力してください")).toBeInTheDocument();
      });
    });

    it("should show email validation error", async () => {
      const { user } = render(<SalesPersonForm />, { user: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByLabelText(/氏名/)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/氏名/), "テスト");
      await user.click(screen.getByRole("button", { name: "保存" }));

      await waitFor(() => {
        expect(
          screen.getByText("メールアドレスを入力してください")
        ).toBeInTheDocument();
      });
    });

    it("should show password validation error", async () => {
      const { user } = render(<SalesPersonForm />, { user: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByLabelText(/氏名/)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/氏名/), "テスト");
      await user.type(
        screen.getByLabelText(/メールアドレス/),
        "test@example.com"
      );
      await user.click(screen.getByRole("button", { name: "保存" }));

      await waitFor(() => {
        expect(
          screen.getByText("パスワードは8文字以上で入力してください")
        ).toBeInTheDocument();
      });
    });

    it("should show department validation error", async () => {
      const { user } = render(<SalesPersonForm />, { user: mockAdminUser });

      await waitFor(() => {
        expect(screen.getByLabelText(/氏名/)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/氏名/), "テスト");
      await user.type(
        screen.getByLabelText(/メールアドレス/),
        "test@example.com"
      );
      await user.type(screen.getByLabelText(/パスワード/), "12345678");
      await user.click(screen.getByRole("button", { name: "保存" }));

      // エラーメッセージを特定のクラスで検索
      await waitFor(() => {
        const errorMessages = screen.getAllByText("部署を選択してください");
        const errorElement = errorMessages.find((el) =>
          el.classList.contains("text-destructive")
        );
        expect(errorElement).toBeInTheDocument();
      });
    });
  });

  describe("managers loading", () => {
    it("should load managers on mount", async () => {
      render(<SalesPersonForm />, { user: mockAdminUser });

      await waitFor(() => {
        expect(mockFetchManagers).toHaveBeenCalledTimes(1);
      });
    });
  });
});
