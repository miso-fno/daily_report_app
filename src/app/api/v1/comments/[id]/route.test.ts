/**
 * コメントAPI削除のユニットテスト
 *
 * テスト対象:
 * - DELETE /api/v1/comments/{id} - コメント削除
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE } from "./route";

import type { NextRequest } from "next/server";

// Prismaモック
const mockPrismaCommentFindUnique = vi.fn();
const mockPrismaCommentDelete = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    comment: {
      findUnique: (...args: unknown[]) => mockPrismaCommentFindUnique(...args),
      delete: (...args: unknown[]) => mockPrismaCommentDelete(...args),
    },
  },
}));

// 認証モック
const mockAuth = vi.fn();
vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

describe("Comments API - DELETE /api/v1/comments/{id}", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const createRequest = (id: string): NextRequest => {
    return new Request(`http://localhost/api/v1/comments/${id}`, {
      method: "DELETE",
    }) as unknown as NextRequest;
  };

  const createContext = (id: string) => ({
    params: Promise.resolve({ id }),
  });

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

      const request = createRequest("1");
      const response = await DELETE(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.success).toBe(false);
    });
  });

  describe("コメント削除 - 正常系", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(managerSession);
    });

    it("自分のコメントを削除できること（UT-CMT-003）", async () => {
      mockPrismaCommentFindUnique.mockResolvedValue({
        id: 1,
        salesPersonId: 2, // 自分が投稿したコメント
      });
      mockPrismaCommentDelete.mockResolvedValue({ id: 1 });

      const request = createRequest("1");
      const response = await DELETE(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.data.comment_id).toBe(1);
      expect(body.message).toBe("コメントを削除しました");
    });
  });

  describe("コメント削除 - 存在チェック", () => {
    it("存在しないコメントを削除しようとした場合、404エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(managerSession);
      mockPrismaCommentFindUnique.mockResolvedValue(null);

      const request = createRequest("999");
      const response = await DELETE(request, createContext("999"));
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain("コメントが見つかりません");
    });
  });

  describe("コメント削除 - 権限チェック", () => {
    it("他人のコメントを削除しようとした場合、403エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(managerSession);
      mockPrismaCommentFindUnique.mockResolvedValue({
        id: 1,
        salesPersonId: 3, // 別の人が投稿したコメント
      });

      const request = createRequest("1");
      const response = await DELETE(request, createContext("1"));
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.success).toBe(false);
      expect(body.error.message).toContain(
        "自分が投稿したコメントのみ削除できます"
      );
    });
  });

  describe("コメント削除 - バリデーション", () => {
    it("不正なIDフォーマットの場合、422エラーを返すこと", async () => {
      mockAuth.mockResolvedValue(managerSession);

      const request = createRequest("abc");
      const response = await DELETE(request, createContext("abc"));
      const body = await response.json();

      expect(response.status).toBe(422);
      expect(body.success).toBe(false);
    });
  });
});
