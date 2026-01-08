/**
 * 訪問記録API更新・削除のユニットテスト
 *
 * テスト対象:
 * - PUT /api/v1/visits/{id} - 訪問記録更新
 * - DELETE /api/v1/visits/{id} - 訪問記録削除
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE, PUT } from "./route";

import type { NextRequest } from "next/server";

// Prismaモック
const mockPrismaVisitFindUnique = vi.fn();
const mockPrismaVisitUpdate = vi.fn();
const mockPrismaVisitDelete = vi.fn();
const mockPrismaCustomerFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    visitRecord: {
      findUnique: (...args: unknown[]) => mockPrismaVisitFindUnique(...args),
      update: (...args: unknown[]) => mockPrismaVisitUpdate(...args),
      delete: (...args: unknown[]) => mockPrismaVisitDelete(...args),
    },
    customer: {
      findUnique: (...args: unknown[]) => mockPrismaCustomerFindUnique(...args),
    },
  },
}));

// 認証モック
const mockAuth = vi.fn();
vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

describe("Visits API - PUT /api/v1/visits/{id}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createRequest = (id: string, body: unknown): NextRequest => {
    return new Request(`http://localhost/api/v1/visits/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }) as unknown as NextRequest;
  };

  const createContext = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  const memberSession = {
    user: {
      id: 1,
      name: "テスト太郎",
      email: "member@example.com",
      isManager: false,
    },
  };

  describe("認証チェック", () => {
    it("未認証の場合、401エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(null);

      const request = createRequest("1", {
        customer_id: 1,
        visit_content: "更新テスト",
      });
      const response = await PUT(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });
  });

  describe("訪問記録更新 - 正常系", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(memberSession);
    });

    it("訪問記録を更新できること", async () => {
      mockPrismaVisitFindUnique.mockResolvedValue({
        id: 1,
        reportId: 1,
        customerId: 1,
        dailyReport: {
          salesPersonId: 1,
          status: "draft",
        },
      });
      mockPrismaCustomerFindUnique.mockResolvedValue({
        id: 2,
        customerName: "新しい顧客",
      });
      mockPrismaVisitUpdate.mockResolvedValue({
        id: 1,
        reportId: 1,
        customerId: 2,
        updatedAt: new Date("2024-01-15T18:00:00Z"),
      });

      const request = createRequest("1", {
        customer_id: 2,
        visit_time: "14:00",
        visit_purpose: "フォローアップ",
        visit_content: "更新されたテスト訪問",
        visit_result: "契約獲得",
      });
      const response = await PUT(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data).toMatchObject({
        visit_id: 1,
        report_id: 1,
        customer_id: 2,
        customer_name: "新しい顧客",
      });
      expect(body.message).toBe("訪問記録を更新しました");
    });
  });

  describe("訪問記録更新 - バリデーションエラー", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(memberSession);
    });

    it("顧客IDが未指定の場合、バリデーションエラーになること", async () => {
      const request = createRequest("1", {
        visit_content: "テスト訪問",
      });
      const response = await PUT(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });

    it("訪問内容が未入力の場合、バリデーションエラーになること", async () => {
      const request = createRequest("1", {
        customer_id: 1,
      });
      const response = await PUT(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });

    it("訪問内容が1000文字を超える場合、バリデーションエラーになること", async () => {
      const longContent = "あ".repeat(1001);

      const request = createRequest("1", {
        customer_id: 1,
        visit_content: longContent,
      });
      const response = await PUT(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });
  });

  describe("訪問記録更新 - 存在チェック", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(memberSession);
    });

    it("存在しない訪問記録を更新しようとした場合、404エラーを返すこと", async () => {
      mockPrismaVisitFindUnique.mockResolvedValue(null);

      const request = createRequest("999", {
        customer_id: 1,
        visit_content: "テスト訪問",
      });
      const response = await PUT(request, createContext("999"));
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });

    it("存在しない顧客IDを指定した場合、エラーになること", async () => {
      mockPrismaVisitFindUnique.mockResolvedValue({
        id: 1,
        reportId: 1,
        dailyReport: {
          salesPersonId: 1,
          status: "draft",
        },
      });
      mockPrismaCustomerFindUnique.mockResolvedValue(null);

      const request = createRequest("1", {
        customer_id: 999,
        visit_content: "テスト訪問",
      });
      const response = await PUT(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("顧客が存在しません");
    });
  });

  describe("訪問記録更新 - 権限チェック", () => {
    it("他人の日報の訪問記録を更新しようとした場合、403エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(memberSession);
      mockPrismaVisitFindUnique.mockResolvedValue({
        id: 1,
        reportId: 1,
        dailyReport: {
          salesPersonId: 2, // 別の人の日報
          status: "draft",
        },
      });

      const request = createRequest("1", {
        customer_id: 1,
        visit_content: "テスト訪問",
      });
      const response = await PUT(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });

    it("確認済の日報の訪問記録を更新しようとした場合、403エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(memberSession);
      mockPrismaVisitFindUnique.mockResolvedValue({
        id: 1,
        reportId: 1,
        dailyReport: {
          salesPersonId: 1,
          status: "confirmed", // 確認済
        },
      });

      const request = createRequest("1", {
        customer_id: 1,
        visit_content: "テスト訪問",
      });
      const response = await PUT(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain(
        "確認済の日報の訪問記録は編集できません"
      );
    });
  });
});

describe("Visits API - DELETE /api/v1/visits/{id}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createRequest = (id: string): NextRequest => {
    return new Request(`http://localhost/api/v1/visits/${id}`, {
      method: "DELETE",
    }) as unknown as NextRequest;
  };

  const createContext = (id: string) => ({
    params: Promise.resolve({ id }),
  });

  const memberSession = {
    user: {
      id: 1,
      name: "テスト太郎",
      email: "member@example.com",
      isManager: false,
    },
  };

  describe("認証チェック", () => {
    it("未認証の場合、401エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(null);

      const request = createRequest("1");
      const response = await DELETE(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });
  });

  describe("訪問記録削除 - 正常系", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(memberSession);
    });

    it("訪問記録を削除できること（UT-RPT-008）", async () => {
      mockPrismaVisitFindUnique.mockResolvedValue({
        id: 1,
        reportId: 1,
        dailyReport: {
          salesPersonId: 1,
          status: "draft",
        },
      });
      mockPrismaVisitDelete.mockResolvedValue({ id: 1 });

      const request = createRequest("1");
      const response = await DELETE(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.visit_id).toBe(1);
      expect(body.message).toBe("訪問記録を削除しました");
    });
  });

  describe("訪問記録削除 - 存在チェック", () => {
    it("存在しない訪問記録を削除しようとした場合、404エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(memberSession);
      mockPrismaVisitFindUnique.mockResolvedValue(null);

      const request = createRequest("999");
      const response = await DELETE(request, createContext("999"));
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  describe("訪問記録削除 - 権限チェック", () => {
    it("他人の日報の訪問記録を削除しようとした場合、403エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(memberSession);
      mockPrismaVisitFindUnique.mockResolvedValue({
        id: 1,
        reportId: 1,
        dailyReport: {
          salesPersonId: 2, // 別の人の日報
          status: "draft",
        },
      });

      const request = createRequest("1");
      const response = await DELETE(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });

    it("確認済の日報の訪問記録を削除しようとした場合、403エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(memberSession);
      mockPrismaVisitFindUnique.mockResolvedValue({
        id: 1,
        reportId: 1,
        dailyReport: {
          salesPersonId: 1,
          status: "confirmed", // 確認済
        },
      });

      const request = createRequest("1");
      const response = await DELETE(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain(
        "確認済の日報の訪問記録は削除できません"
      );
    });
  });
});
