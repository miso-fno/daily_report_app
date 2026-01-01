import { describe, it, expect } from "vitest";

import { render, screen, mockAdminUser } from "@/test/test-utils";

import { SalesPersonsTable } from "./SalesPersonsTable";

import type { SalesPersonListItem } from "../types";

describe("SalesPersonsTable", () => {
  const mockSalesPersons: SalesPersonListItem[] = [
    {
      sales_person_id: 1,
      name: "山田太郎",
      email: "yamada@example.com",
      department: "営業1課",
      manager_id: 2,
      manager_name: "鈴木一郎",
      is_manager: false,
    },
    {
      sales_person_id: 2,
      name: "鈴木一郎",
      email: "suzuki@example.com",
      department: "営業1課",
      manager_id: null,
      manager_name: null,
      is_manager: true,
    },
    {
      sales_person_id: 3,
      name: "佐藤花子",
      email: "sato@example.com",
      department: "営業2課",
      manager_id: null,
      manager_name: null,
      is_manager: false,
    },
  ];

  describe("rendering", () => {
    it("should render table headers", () => {
      render(
        <SalesPersonsTable salesPersons={mockSalesPersons} startIndex={0} />,
        { user: mockAdminUser }
      );

      expect(
        screen.getByRole("columnheader", { name: "No" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "氏名" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "部署" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "上長" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "権限" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("columnheader", { name: "操作" })
      ).toBeInTheDocument();
    });

    it("should render sales person data in rows", () => {
      render(
        <SalesPersonsTable salesPersons={mockSalesPersons} startIndex={0} />,
        { user: mockAdminUser }
      );

      expect(screen.getByText("山田太郎")).toBeInTheDocument();
      // 鈴木一郎は本人の行と山田太郎の上長として2回出現
      expect(screen.getAllByText("鈴木一郎").length).toBe(2);
      expect(screen.getByText("佐藤花子")).toBeInTheDocument();

      expect(screen.getAllByText("営業1課").length).toBe(2);
      expect(screen.getByText("営業2課")).toBeInTheDocument();
    });

    it("should display '-' for null manager_name", () => {
      render(
        <SalesPersonsTable salesPersons={mockSalesPersons} startIndex={0} />,
        { user: mockAdminUser }
      );

      // manager_nameがnullのユーザーは2人
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBe(2);
    });

    it("should render correct row numbers", () => {
      render(
        <SalesPersonsTable salesPersons={mockSalesPersons} startIndex={0} />,
        { user: mockAdminUser }
      );

      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("should render correct row numbers with startIndex", () => {
      render(
        <SalesPersonsTable salesPersons={mockSalesPersons} startIndex={20} />,
        { user: mockAdminUser }
      );

      expect(screen.getByText("21")).toBeInTheDocument();
      expect(screen.getByText("22")).toBeInTheDocument();
      expect(screen.getByText("23")).toBeInTheDocument();
    });

    it("should display role badges correctly", () => {
      render(
        <SalesPersonsTable salesPersons={mockSalesPersons} startIndex={0} />,
        { user: mockAdminUser }
      );

      // 一般2人、上長1人（バッジのみをカウント）
      const generalBadges = screen.getAllByText("一般");
      expect(generalBadges.length).toBe(2);

      // "上長" はヘッダーとバッジ両方に存在する
      const allManagerTexts = screen.getAllByText("上長");
      // ヘッダー1 + バッジ1 = 2
      expect(allManagerTexts.length).toBe(2);
    });
  });

  describe("empty state", () => {
    it("should show empty message when no sales persons", () => {
      render(<SalesPersonsTable salesPersons={[]} startIndex={0} />, {
        user: mockAdminUser,
      });

      expect(
        screen.getByText("該当する営業担当者が見つかりませんでした")
      ).toBeInTheDocument();
    });

    it("should not render table when empty", () => {
      render(<SalesPersonsTable salesPersons={[]} startIndex={0} />, {
        user: mockAdminUser,
      });

      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });
  });

  describe("edit links", () => {
    it("should render edit buttons for each row", () => {
      render(
        <SalesPersonsTable salesPersons={mockSalesPersons} startIndex={0} />,
        { user: mockAdminUser }
      );

      const editLinks = screen.getAllByRole("link", { name: /編集/ });
      expect(editLinks.length).toBe(3);
    });

    it("should have correct edit link href", () => {
      render(
        <SalesPersonsTable salesPersons={mockSalesPersons} startIndex={0} />,
        { user: mockAdminUser }
      );

      const editLinks = screen.getAllByRole("link", { name: /編集/ });
      expect(editLinks[0]).toHaveAttribute("href", "/sales-persons/1/edit");
      expect(editLinks[1]).toHaveAttribute("href", "/sales-persons/2/edit");
      expect(editLinks[2]).toHaveAttribute("href", "/sales-persons/3/edit");
    });
  });
});
