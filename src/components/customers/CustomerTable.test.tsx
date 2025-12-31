import { describe, it, expect, vi } from "vitest";

import {
  render,
  screen,
  mockAdminUser,
  mockMemberUser,
} from "@/test/test-utils";

import {
  CustomerTable,
  type Customer,
  type PaginationInfo,
} from "./CustomerTable";

describe("CustomerTable", () => {
  const mockCustomers: Customer[] = [
    {
      customer_id: 1,
      customer_name: "株式会社ABC",
      address: "東京都港区1-2-3",
      contact_person: "山田太郎",
    },
    {
      customer_id: 2,
      customer_name: "株式会社XYZ",
      address: "大阪府大阪市4-5-6",
      contact_person: "田中花子",
    },
    {
      customer_id: 3,
      customer_name: "株式会社DEF",
      address: null,
      contact_person: null,
    },
  ];

  const mockPagination: PaginationInfo = {
    total: 25,
    per_page: 20,
    current_page: 1,
    last_page: 2,
  };

  const defaultProps = {
    customers: mockCustomers,
    pagination: mockPagination,
    sort: "created_at" as const,
    order: "desc" as const,
    onPageChange: vi.fn(),
    onSortChange: vi.fn(),
    isLoading: false,
    canEdit: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render table headers", () => {
      render(<CustomerTable {...defaultProps} />, { user: mockAdminUser });

      expect(screen.getByText("No")).toBeInTheDocument();
      expect(screen.getByText("顧客名")).toBeInTheDocument();
      expect(screen.getByText("住所")).toBeInTheDocument();
      expect(screen.getByText("担当者名")).toBeInTheDocument();
      expect(screen.getByText("操作")).toBeInTheDocument();
    });

    it("should render customer data in rows", () => {
      render(<CustomerTable {...defaultProps} />, { user: mockAdminUser });

      expect(screen.getByText("株式会社ABC")).toBeInTheDocument();
      expect(screen.getByText("東京都港区1-2-3")).toBeInTheDocument();
      expect(screen.getByText("山田太郎")).toBeInTheDocument();

      expect(screen.getByText("株式会社XYZ")).toBeInTheDocument();
      expect(screen.getByText("大阪府大阪市4-5-6")).toBeInTheDocument();
      expect(screen.getByText("田中花子")).toBeInTheDocument();
    });

    it("should display '-' for null address and contact_person", () => {
      render(<CustomerTable {...defaultProps} />, { user: mockAdminUser });

      // 3つ目の顧客は住所・担当者がnull
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThanOrEqual(2);
    });

    it("should render correct row numbers", () => {
      render(<CustomerTable {...defaultProps} />, { user: mockAdminUser });

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("should show pagination info", () => {
      render(<CustomerTable {...defaultProps} />, { user: mockAdminUser });

      expect(screen.getByText("1 - 20 / 25件")).toBeInTheDocument();
      expect(screen.getByText("1 / 2")).toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("should show empty message when no customers", () => {
      render(
        <CustomerTable
          {...defaultProps}
          customers={[]}
          pagination={{ total: 0, per_page: 20, current_page: 1, last_page: 1 }}
        />,
        { user: mockAdminUser }
      );

      expect(screen.getByText("顧客データがありません")).toBeInTheDocument();
    });

    it("should show 0件 in pagination when empty", () => {
      render(
        <CustomerTable
          {...defaultProps}
          customers={[]}
          pagination={{ total: 0, per_page: 20, current_page: 1, last_page: 1 }}
        />,
        { user: mockAdminUser }
      );

      expect(screen.getByText("0件")).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("should show loading skeleton when isLoading is true", () => {
      render(<CustomerTable {...defaultProps} isLoading={true} />, {
        user: mockAdminUser,
      });

      // SkeletonコンポーネントはアニメーションするためDataがレンダリングされない
      expect(screen.queryByText("株式会社ABC")).not.toBeInTheDocument();
    });

    it("should disable pagination buttons when loading", () => {
      render(<CustomerTable {...defaultProps} isLoading={true} />, {
        user: mockAdminUser,
      });

      expect(
        screen.getByRole("button", { name: "最初のページ" })
      ).toBeDisabled();
      expect(screen.getByRole("button", { name: "前のページ" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "次のページ" })).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "最後のページ" })
      ).toBeDisabled();
    });
  });

  describe("edit permission", () => {
    it("should show edit buttons when canEdit is true", () => {
      render(<CustomerTable {...defaultProps} canEdit={true} />, {
        user: mockAdminUser,
      });

      expect(
        screen.getByRole("link", { name: "株式会社ABCを編集" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "株式会社XYZを編集" })
      ).toBeInTheDocument();
    });

    it("should not show edit buttons when canEdit is false", () => {
      render(<CustomerTable {...defaultProps} canEdit={false} />, {
        user: mockMemberUser,
      });

      expect(
        screen.queryByRole("link", { name: "株式会社ABCを編集" })
      ).not.toBeInTheDocument();
    });

    it("should have correct edit link href", () => {
      render(<CustomerTable {...defaultProps} canEdit={true} />, {
        user: mockAdminUser,
      });

      const editLink = screen.getByRole("link", { name: "株式会社ABCを編集" });
      expect(editLink).toHaveAttribute("href", "/customers/1/edit");
    });
  });

  describe("pagination", () => {
    it("should disable previous buttons on first page", () => {
      render(<CustomerTable {...defaultProps} />, { user: mockAdminUser });

      expect(
        screen.getByRole("button", { name: "最初のページ" })
      ).toBeDisabled();
      expect(screen.getByRole("button", { name: "前のページ" })).toBeDisabled();
    });

    it("should enable next buttons when not on last page", () => {
      render(<CustomerTable {...defaultProps} />, { user: mockAdminUser });

      expect(
        screen.getByRole("button", { name: "次のページ" })
      ).not.toBeDisabled();
      expect(
        screen.getByRole("button", { name: "最後のページ" })
      ).not.toBeDisabled();
    });

    it("should disable next buttons on last page", () => {
      render(
        <CustomerTable
          {...defaultProps}
          pagination={{ ...mockPagination, current_page: 2 }}
        />,
        { user: mockAdminUser }
      );

      expect(screen.getByRole("button", { name: "次のページ" })).toBeDisabled();
      expect(
        screen.getByRole("button", { name: "最後のページ" })
      ).toBeDisabled();
    });

    it("should call onPageChange when pagination buttons are clicked", async () => {
      const onPageChange = vi.fn();
      const { user } = render(
        <CustomerTable {...defaultProps} onPageChange={onPageChange} />,
        { user: mockAdminUser }
      );

      await user.click(screen.getByRole("button", { name: "次のページ" }));
      expect(onPageChange).toHaveBeenCalledWith(2);

      await user.click(screen.getByRole("button", { name: "最後のページ" }));
      expect(onPageChange).toHaveBeenCalledWith(2);
    });
  });

  describe("sorting", () => {
    it("should call onSortChange when customer_name header is clicked", async () => {
      const onSortChange = vi.fn();
      const { user } = render(
        <CustomerTable {...defaultProps} onSortChange={onSortChange} />,
        { user: mockAdminUser }
      );

      await user.click(screen.getByText("顧客名"));

      expect(onSortChange).toHaveBeenCalledWith("customer_name", "asc");
    });

    it("should toggle order when same sort field is clicked", async () => {
      const onSortChange = vi.fn();
      const { user } = render(
        <CustomerTable
          {...defaultProps}
          sort="customer_name"
          order="asc"
          onSortChange={onSortChange}
        />,
        { user: mockAdminUser }
      );

      await user.click(screen.getByText("顧客名"));

      expect(onSortChange).toHaveBeenCalledWith("customer_name", "desc");
    });
  });
});
