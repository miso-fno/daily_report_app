/**
 * 営業担当者マスタAPIスキーマのテスト
 */

import { describe, it, expect } from "vitest";

import {
  CreateSalesPersonSchema,
  SalesPersonIdParamSchema,
  SalesPersonsQuerySchema,
  UpdateSalesPersonSchema,
} from "./sales-person";

describe("SalesPersonsQuerySchema", () => {
  it("正常なクエリパラメータをパースできる", () => {
    const result = SalesPersonsQuerySchema.parse({
      name: "田中",
      department: "営業部",
      is_manager: "true",
      page: "1",
      per_page: "20",
    });

    expect(result).toEqual({
      name: "田中",
      department: "営業部",
      is_manager: true,
      page: 1,
      per_page: 20,
    });
  });

  it("is_managerがfalseの場合を正しくパースする", () => {
    const result = SalesPersonsQuerySchema.parse({
      is_manager: "false",
    });

    expect(result.is_manager).toBe(false);
  });

  it("空のクエリパラメータでもデフォルト値が適用される", () => {
    const result = SalesPersonsQuerySchema.parse({});

    expect(result).toEqual({
      name: undefined,
      department: undefined,
      is_manager: undefined,
      page: 1,
      per_page: 20,
    });
  });

  it("is_managerが空文字列の場合はundefinedになる", () => {
    const result = SalesPersonsQuerySchema.parse({
      is_manager: "",
    });

    expect(result.is_manager).toBeUndefined();
  });

  it("ページ番号が文字列でも数値に変換される", () => {
    const result = SalesPersonsQuerySchema.parse({
      page: "3",
      per_page: "50",
    });

    expect(result.page).toBe(3);
    expect(result.per_page).toBe(50);
  });
});

describe("CreateSalesPersonSchema", () => {
  it("正常なリクエストボディをパースできる", () => {
    const result = CreateSalesPersonSchema.parse({
      name: "田中太郎",
      email: "tanaka@example.com",
      password: "password123",
      department: "営業部",
      manager_id: 1,
      is_manager: false,
    });

    expect(result).toEqual({
      name: "田中太郎",
      email: "tanaka@example.com",
      password: "password123",
      department: "営業部",
      manager_id: 1,
      is_manager: false,
    });
  });

  it("manager_idがnullでもパースできる", () => {
    const result = CreateSalesPersonSchema.parse({
      name: "田中太郎",
      email: "tanaka@example.com",
      password: "password123",
      department: "営業部",
      manager_id: null,
      is_manager: true,
    });

    expect(result.manager_id).toBeNull();
  });

  it("manager_idが未指定でもパースできる", () => {
    const result = CreateSalesPersonSchema.parse({
      name: "田中太郎",
      email: "tanaka@example.com",
      password: "password123",
      department: "営業部",
      is_manager: true,
    });

    expect(result.manager_id).toBeUndefined();
  });

  it("氏名が空の場合はエラーになる", () => {
    expect(() => {
      CreateSalesPersonSchema.parse({
        name: "",
        email: "tanaka@example.com",
        password: "password123",
        department: "営業部",
        is_manager: false,
      });
    }).toThrow();
  });

  it("氏名が50文字を超える場合はエラーになる", () => {
    expect(() => {
      CreateSalesPersonSchema.parse({
        name: "あ".repeat(51),
        email: "tanaka@example.com",
        password: "password123",
        department: "営業部",
        is_manager: false,
      });
    }).toThrow();
  });

  it("メールアドレスが不正な形式の場合はエラーになる", () => {
    expect(() => {
      CreateSalesPersonSchema.parse({
        name: "田中太郎",
        email: "invalid-email",
        password: "password123",
        department: "営業部",
        is_manager: false,
      });
    }).toThrow();
  });

  it("パスワードが8文字未満の場合はエラーになる", () => {
    expect(() => {
      CreateSalesPersonSchema.parse({
        name: "田中太郎",
        email: "tanaka@example.com",
        password: "short",
        department: "営業部",
        is_manager: false,
      });
    }).toThrow();
  });

  it("部署が空の場合はエラーになる", () => {
    expect(() => {
      CreateSalesPersonSchema.parse({
        name: "田中太郎",
        email: "tanaka@example.com",
        password: "password123",
        department: "",
        is_manager: false,
      });
    }).toThrow();
  });

  it("is_managerが未指定の場合はエラーになる", () => {
    expect(() => {
      CreateSalesPersonSchema.parse({
        name: "田中太郎",
        email: "tanaka@example.com",
        password: "password123",
        department: "営業部",
      });
    }).toThrow();
  });
});

describe("UpdateSalesPersonSchema", () => {
  it("正常なリクエストボディをパースできる", () => {
    const result = UpdateSalesPersonSchema.parse({
      name: "田中太郎",
      email: "tanaka@example.com",
      password: "newpassword123",
      department: "営業部",
      manager_id: 1,
      is_manager: false,
    });

    expect(result).toEqual({
      name: "田中太郎",
      email: "tanaka@example.com",
      password: "newpassword123",
      department: "営業部",
      manager_id: 1,
      is_manager: false,
    });
  });

  it("パスワードなしでもパースできる（更新時は任意）", () => {
    const result = UpdateSalesPersonSchema.parse({
      name: "田中太郎",
      email: "tanaka@example.com",
      department: "営業部",
      is_manager: true,
    });

    expect(result.password).toBeUndefined();
    expect(result.name).toBe("田中太郎");
  });

  it("パスワードが指定されている場合は8文字以上が必要", () => {
    expect(() => {
      UpdateSalesPersonSchema.parse({
        name: "田中太郎",
        email: "tanaka@example.com",
        password: "short",
        department: "営業部",
        is_manager: false,
      });
    }).toThrow();
  });
});

describe("SalesPersonIdParamSchema", () => {
  it("正常なIDをパースできる", () => {
    const result = SalesPersonIdParamSchema.parse({ id: "1" });
    expect(result.id).toBe(1);
  });

  it("数値型のIDもパースできる", () => {
    const result = SalesPersonIdParamSchema.parse({ id: 5 });
    expect(result.id).toBe(5);
  });

  it("0以下の値はエラーになる", () => {
    expect(() => {
      SalesPersonIdParamSchema.parse({ id: "0" });
    }).toThrow();
  });

  it("負の値はエラーになる", () => {
    expect(() => {
      SalesPersonIdParamSchema.parse({ id: "-1" });
    }).toThrow();
  });

  it("数値に変換できない文字列はエラーになる", () => {
    expect(() => {
      SalesPersonIdParamSchema.parse({ id: "abc" });
    }).toThrow();
  });
});
