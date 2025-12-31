/**
 * 営業担当者マスタAPI - 一覧取得・新規作成
 *
 * GET /api/v1/sales-persons - 一覧取得（ページネーション対応）
 * POST /api/v1/sales-persons - 新規作成
 */

import bcrypt from "bcryptjs";

import { auth } from "@/auth";
import { createApiError } from "@/lib/api/errors";
import { createHandlers } from "@/lib/api/handler";
import { calculateOffset, calculatePagination } from "@/lib/api/pagination";
import {
  createdResponse,
  forbiddenResponse,
  paginatedResponse,
  unauthorizedResponse,
} from "@/lib/api/response";
import {
  CreateSalesPersonSchema,
  SalesPersonsQuerySchema,
} from "@/lib/api/schemas/sales-person";
import {
  parseAndValidateBody,
  searchParamsToObject,
} from "@/lib/api/validation";
import { prisma } from "@/lib/prisma";

import type {
  SalesPersonListItem,
  SalesPersonResponse,
} from "@/lib/api/schemas/sales-person";

/**
 * Prismaの結果を営業担当者レスポンス形式に変換
 */
function toSalesPersonListItem(salesPerson: {
  id: number;
  name: string;
  email: string;
  department: string;
  managerId: number | null;
  isManager: boolean;
  manager: { name: string } | null;
}): SalesPersonListItem {
  return {
    sales_person_id: salesPerson.id,
    name: salesPerson.name,
    email: salesPerson.email,
    department: salesPerson.department,
    manager_id: salesPerson.managerId,
    manager_name: salesPerson.manager?.name ?? null,
    is_manager: salesPerson.isManager,
  };
}

function toSalesPersonResponse(salesPerson: {
  id: number;
  name: string;
  email: string;
  department: string;
  managerId: number | null;
  isManager: boolean;
  createdAt: Date;
  updatedAt: Date;
  manager: { name: string } | null;
}): SalesPersonResponse {
  return {
    sales_person_id: salesPerson.id,
    name: salesPerson.name,
    email: salesPerson.email,
    department: salesPerson.department,
    manager_id: salesPerson.managerId,
    manager_name: salesPerson.manager?.name ?? null,
    is_manager: salesPerson.isManager,
    created_at: salesPerson.createdAt.toISOString(),
    updated_at: salesPerson.updatedAt.toISOString(),
  };
}

const handlers = createHandlers({
  /**
   * GET /api/v1/sales-persons
   * 営業担当者一覧を取得
   */
  GET: async (request) => {
    // 認証チェック
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // 管理者権限チェック（営業担当者マスタは管理者のみ閲覧可）
    // isManagerがtrueのユーザーを管理者として扱う
    if (!session.user.isManager) {
      return forbiddenResponse("営業担当者マスタへのアクセス権限がありません");
    }

    // クエリパラメータのバリデーション
    const { searchParams } = new URL(request.url);
    const queryParams = searchParamsToObject(searchParams);
    const query = SalesPersonsQuerySchema.parse(queryParams);

    // 検索条件を構築
    const where: {
      name?: { contains: string; mode: "insensitive" };
      department?: { contains: string; mode: "insensitive" };
      isManager?: boolean;
    } = {};

    if (query.name) {
      where.name = { contains: query.name, mode: "insensitive" };
    }

    if (query.department) {
      where.department = { contains: query.department, mode: "insensitive" };
    }

    if (query.is_manager !== undefined) {
      where.isManager = query.is_manager;
    }

    // 総件数を取得
    const total = await prisma.salesPerson.count({ where });

    // ページネーション計算
    const { skip, take } = calculateOffset(query.page, query.per_page);
    const pagination = calculatePagination({
      page: query.page,
      perPage: query.per_page,
      total,
    });

    // データ取得
    const salesPersons = await prisma.salesPerson.findMany({
      where,
      skip,
      take,
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        managerId: true,
        isManager: true,
        manager: {
          select: { name: true },
        },
      },
    });

    const items = salesPersons.map(toSalesPersonListItem);

    return paginatedResponse(items, pagination);
  },

  /**
   * POST /api/v1/sales-persons
   * 営業担当者を新規作成
   */
  POST: async (request) => {
    // 認証チェック
    const session = await auth();
    if (!session?.user) {
      return unauthorizedResponse();
    }

    // 管理者権限チェック
    if (!session.user.isManager) {
      return forbiddenResponse("営業担当者の作成権限がありません");
    }

    // リクエストボディのバリデーション
    const body = await parseAndValidateBody(request, CreateSalesPersonSchema);

    // メールアドレスの重複チェック
    const existingUser = await prisma.salesPerson.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      throw createApiError.duplicateEntry(
        "このメールアドレスは既に登録されています"
      );
    }

    // 上長IDの存在チェック（指定されている場合）
    if (body.manager_id) {
      const manager = await prisma.salesPerson.findUnique({
        where: { id: body.manager_id },
      });

      if (!manager) {
        throw createApiError.validationError("指定された上長が存在しません", [
          { field: "manager_id", message: "指定された上長が存在しません" },
        ]);
      }
    }

    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // 営業担当者を作成
    const salesPerson = await prisma.salesPerson.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        department: body.department,
        managerId: body.manager_id ?? null,
        isManager: body.is_manager,
      },
      include: {
        manager: {
          select: { name: true },
        },
      },
    });

    return createdResponse(
      toSalesPersonResponse(salesPerson),
      "営業担当者を作成しました"
    );
  },
});

export const { GET, POST } = handlers;
