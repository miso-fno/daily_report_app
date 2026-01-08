/**
 * 日報ステータス更新APIのユニットテスト
 *
 * テスト対象:
 * - PATCH /api/v1/reports/{id}/status - ステータス更新
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PATCH } from "./route";

import type { NextRequest } from "next/server";

// Prismaモック
const mockPrismaFindUnique = vi.fn();
const mockPrismaFindFirst = vi.fn();
const mockPrismaUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    dailyReport: {
      findUnique: (...args: unknown[]) => mockPrismaFindUnique(...args),
      update: (...args: unknown[]) => mockPrismaUpdate(...args),
    },
    salesPerson: {
      findFirst: (...args: unknown[]) => mockPrismaFindFirst(...args),
    },
  },
}));

// 認証モック
const mockAuth = vi.fn();
vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

describe("Reports API - PATCH /api/v1/reports/{id}/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createRequest = (id: string, body: unknown): NextRequest => {
    return new Request(`http://localhost/api/v1/reports/${id}/status`, {
      method: "PATCH",
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

  const managerSession = {
    user: {
      id: 2,
      name: "テスト上長",
      email: "manager@example.com",
      isManager: true,
    },
  };

  describe("認証チェック", () => {
    it("未認証の場合、401エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(null);

      const request = createRequest("1", { status: "submitted" });
      const response = await PATCH(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });
  });

  describe("ステータス更新 - 正常系", () => {
    it("本人が下書きから提出済に変更できること", async () => {
      mockAuth.mockResolvedValue(memberSession);
      mockPrismaFindUnique.mockResolvedValue({
        id: 1,
        salesPersonId: 1,
        status: "draft",
      });
      mockPrismaUpdate.mockResolvedValue({
        id: 1,
        status: "submitted",
        updatedAt: new Date("2024-01-15T18:00:00Z"),
      });

      const request = createRequest("1", { status: "submitted" });
      const response = await PATCH(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe("submitted");
      expect(body.data.status_label).toBe("提出済");
      expect(body.message).toBe("ステータスを更新しました");
    });

    it("上長が日報を確認済にできること（UT-STS-001）", async () => {
      mockAuth.mockResolvedValue(managerSession);
      mockPrismaFindUnique.mockResolvedValue({
        id: 1,
        salesPersonId: 1, // 部下の日報
        status: "submitted",
      });
      mockPrismaFindFirst.mockResolvedValue({ id: 1, managerId: 2 }); // 部下である
      mockPrismaUpdate.mockResolvedValue({
        id: 1,
        status: "confirmed",
        updatedAt: new Date("2024-01-15T19:00:00Z"),
      });

      const request = createRequest("1", { status: "confirmed" });
      const response = await PATCH(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe("confirmed");
      expect(body.data.status_label).toBe("確認済");
    });
  });

  describe("ステータス更新 - 権限チェック", () => {
    it("一般営業担当者は確認済にできないこと（UT-STS-002）", async () => {
      mockAuth.mockResolvedValue(memberSession);
      mockPrismaFindUnique.mockResolvedValue({
        id: 1,
        salesPersonId: 1,
        status: "submitted",
      });

      const request = createRequest("1", { status: "confirmed" });
      const response = await PATCH(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain(
        "自分の日報を確認済にすることはできません"
      );
    });

    it("上長でも自分の日報は確認済にできないこと", async () => {
      mockAuth.mockResolvedValue(managerSession);
      mockPrismaFindUnique.mockResolvedValue({
        id: 1,
        salesPersonId: 2, // 自分の日報
        status: "submitted",
      });

      const request = createRequest("1", { status: "confirmed" });
      const response = await PATCH(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain(
        "自分の日報を確認済にすることはできません"
      );
    });

    it("他人の日報をdraft/submittedに変更できないこと", async () => {
      mockAuth.mockResolvedValue(managerSession);
      mockPrismaFindUnique.mockResolvedValue({
        id: 1,
        salesPersonId: 1, // 部下の日報
        status: "submitted",
      });
      mockPrismaFindFirst.mockResolvedValue({ id: 1, managerId: 2 }); // 部下である

      const request = createRequest("1", { status: "draft" });
      const response = await PATCH(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain(
        "他人の日報のステータスを下書きまたは提出済に変更することはできません"
      );
    });

    it("アクセス権限のない日報のステータスを更新できないこと", async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: 3,
          name: "別のユーザー",
          isManager: false,
        },
      });
      mockPrismaFindUnique.mockResolvedValue({
        id: 1,
        salesPersonId: 1, // 別の人の日報
        status: "draft",
      });
      mockPrismaFindFirst.mockResolvedValue(null); // 部下ではない

      const request = createRequest("1", { status: "submitted" });
      const response = await PATCH(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
    });
  });

  describe("ステータス更新 - 存在チェック", () => {
    it("存在しない日報のステータスを更新しようとした場合、404エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(memberSession);
      mockPrismaFindUnique.mockResolvedValue(null);

      const request = createRequest("999", { status: "submitted" });
      const response = await PATCH(request, createContext("999"));
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
    });
  });

  describe("ステータス更新 - バリデーション", () => {
    it("無効なステータスを指定した場合、422エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(memberSession);

      const request = createRequest("1", { status: "invalid" });
      const response = await PATCH(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });

    it("ステータスが未指定の場合、422エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(memberSession);

      const request = createRequest("1", {});
      const response = await PATCH(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });
  });
});
