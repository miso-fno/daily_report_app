/**
 * 顧客マスタバリデーションスキーマのテスト
 */

import {
  createCustomerSchema,
  updateCustomerSchema,
  customerListQuerySchema,
  customerIdSchema,
} from "./customer";

describe("createCustomerSchema", () => {
  describe("customer_name", () => {
    it("有効な顧客名を受け入れる", () => {
      const result = createCustomerSchema.safeParse({
        customer_name: "株式会社ABC",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customer_name).toBe("株式会社ABC");
      }
    });

    it("顧客名が必須", () => {
      const result = createCustomerSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path[0]).toBe("customer_name");
      }
    });

    it("空の顧客名を拒否する", () => {
      const result = createCustomerSchema.safeParse({
        customer_name: "",
      });
      expect(result.success).toBe(false);
    });

    it("100文字以内の顧客名を受け入れる", () => {
      const result = createCustomerSchema.safeParse({
        customer_name: "あ".repeat(100),
      });
      expect(result.success).toBe(true);
    });

    it("101文字以上の顧客名を拒否する", () => {
      const result = createCustomerSchema.safeParse({
        customer_name: "あ".repeat(101),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("address", () => {
    it("有効な住所を受け入れる", () => {
      const result = createCustomerSchema.safeParse({
        customer_name: "株式会社ABC",
        address: "東京都港区芝1-1-1",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.address).toBe("東京都港区芝1-1-1");
      }
    });

    it("住所はオプション", () => {
      const result = createCustomerSchema.safeParse({
        customer_name: "株式会社ABC",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.address).toBeNull();
      }
    });

    it("200文字以内の住所を受け入れる", () => {
      const result = createCustomerSchema.safeParse({
        customer_name: "株式会社ABC",
        address: "あ".repeat(200),
      });
      expect(result.success).toBe(true);
    });

    it("201文字以上の住所を拒否する", () => {
      const result = createCustomerSchema.safeParse({
        customer_name: "株式会社ABC",
        address: "あ".repeat(201),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("phone", () => {
    it("固定電話番号を受け入れる（ハイフンあり）", () => {
      const result = createCustomerSchema.safeParse({
        customer_name: "株式会社ABC",
        phone: "03-1234-5678",
      });
      expect(result.success).toBe(true);
    });

    it("固定電話番号を受け入れる（ハイフンなし）", () => {
      const result = createCustomerSchema.safeParse({
        customer_name: "株式会社ABC",
        phone: "0312345678",
      });
      expect(result.success).toBe(true);
    });

    it("携帯電話番号を受け入れる（ハイフンあり）", () => {
      const result = createCustomerSchema.safeParse({
        customer_name: "株式会社ABC",
        phone: "090-1234-5678",
      });
      expect(result.success).toBe(true);
    });

    it("携帯電話番号を受け入れる（ハイフンなし）", () => {
      const result = createCustomerSchema.safeParse({
        customer_name: "株式会社ABC",
        phone: "09012345678",
      });
      expect(result.success).toBe(true);
    });

    it("電話番号はオプション", () => {
      const result = createCustomerSchema.safeParse({
        customer_name: "株式会社ABC",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phone).toBeNull();
      }
    });

    it("不正な電話番号を拒否する", () => {
      const result = createCustomerSchema.safeParse({
        customer_name: "株式会社ABC",
        phone: "invalid-phone",
      });
      expect(result.success).toBe(false);
    });

    it("国際電話番号形式を拒否する", () => {
      const result = createCustomerSchema.safeParse({
        customer_name: "株式会社ABC",
        phone: "+81-3-1234-5678",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("contact_person", () => {
    it("有効な担当者名を受け入れる", () => {
      const result = createCustomerSchema.safeParse({
        customer_name: "株式会社ABC",
        contact_person: "山田太郎",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contact_person).toBe("山田太郎");
      }
    });

    it("担当者名はオプション", () => {
      const result = createCustomerSchema.safeParse({
        customer_name: "株式会社ABC",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.contact_person).toBeNull();
      }
    });

    it("50文字以内の担当者名を受け入れる", () => {
      const result = createCustomerSchema.safeParse({
        customer_name: "株式会社ABC",
        contact_person: "あ".repeat(50),
      });
      expect(result.success).toBe(true);
    });

    it("51文字以上の担当者名を拒否する", () => {
      const result = createCustomerSchema.safeParse({
        customer_name: "株式会社ABC",
        contact_person: "あ".repeat(51),
      });
      expect(result.success).toBe(false);
    });
  });

  it("全フィールドを含む有効なデータを受け入れる", () => {
    const result = createCustomerSchema.safeParse({
      customer_name: "株式会社ABC",
      address: "東京都港区芝1-1-1",
      phone: "03-1234-5678",
      contact_person: "山田太郎",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        customer_name: "株式会社ABC",
        address: "東京都港区芝1-1-1",
        phone: "03-1234-5678",
        contact_person: "山田太郎",
      });
    }
  });
});

describe("updateCustomerSchema", () => {
  it("createCustomerSchemaと同じ検証ルールを持つ", () => {
    const validData = {
      customer_name: "株式会社ABC",
      address: "東京都港区芝1-1-1",
      phone: "03-1234-5678",
      contact_person: "山田太郎",
    };

    const createResult = createCustomerSchema.safeParse(validData);
    const updateResult = updateCustomerSchema.safeParse(validData);

    expect(createResult.success).toBe(true);
    expect(updateResult.success).toBe(true);
    if (createResult.success && updateResult.success) {
      expect(createResult.data).toEqual(updateResult.data);
    }
  });
});

describe("customerListQuerySchema", () => {
  describe("customer_name", () => {
    it("検索用顧客名を受け入れる", () => {
      const result = customerListQuerySchema.safeParse({
        customer_name: "株式会社",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customer_name).toBe("株式会社");
      }
    });

    it("customer_nameはオプション", () => {
      const result = customerListQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customer_name).toBeUndefined();
      }
    });
  });

  describe("page", () => {
    it("有効なページ番号を受け入れる", () => {
      const result = customerListQuerySchema.safeParse({
        page: 5,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
      }
    });

    it("文字列のページ番号を数値に変換する", () => {
      const result = customerListQuerySchema.safeParse({
        page: "3",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
      }
    });

    it("デフォルト値は1", () => {
      const result = customerListQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
      }
    });

    it("0を拒否する", () => {
      const result = customerListQuerySchema.safeParse({
        page: 0,
      });
      expect(result.success).toBe(false);
    });

    it("負の値を拒否する", () => {
      const result = customerListQuerySchema.safeParse({
        page: -1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("per_page", () => {
    it("有効な表示件数を受け入れる", () => {
      const result = customerListQuerySchema.safeParse({
        per_page: 50,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.per_page).toBe(50);
      }
    });

    it("デフォルト値は20", () => {
      const result = customerListQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.per_page).toBe(20);
      }
    });

    it("100を受け入れる", () => {
      const result = customerListQuerySchema.safeParse({
        per_page: 100,
      });
      expect(result.success).toBe(true);
    });

    it("101を拒否する", () => {
      const result = customerListQuerySchema.safeParse({
        per_page: 101,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("sort", () => {
    it("customer_nameを受け入れる", () => {
      const result = customerListQuerySchema.safeParse({
        sort: "customer_name",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("customer_name");
      }
    });

    it("created_atを受け入れる", () => {
      const result = customerListQuerySchema.safeParse({
        sort: "created_at",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("created_at");
      }
    });

    it("デフォルト値はcreated_at", () => {
      const result = customerListQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("created_at");
      }
    });

    it("無効なソート項目を拒否する", () => {
      const result = customerListQuerySchema.safeParse({
        sort: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("order", () => {
    it("ascを受け入れる", () => {
      const result = customerListQuerySchema.safeParse({
        order: "asc",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order).toBe("asc");
      }
    });

    it("descを受け入れる", () => {
      const result = customerListQuerySchema.safeParse({
        order: "desc",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order).toBe("desc");
      }
    });

    it("デフォルト値はdesc", () => {
      const result = customerListQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.order).toBe("desc");
      }
    });

    it("無効なソート順を拒否する", () => {
      const result = customerListQuerySchema.safeParse({
        order: "ascending",
      });
      expect(result.success).toBe(false);
    });
  });

  it("全クエリパラメータを含む有効なデータを受け入れる", () => {
    const result = customerListQuerySchema.safeParse({
      customer_name: "株式会社",
      page: 2,
      per_page: 30,
      sort: "customer_name",
      order: "asc",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        customer_name: "株式会社",
        page: 2,
        per_page: 30,
        sort: "customer_name",
        order: "asc",
      });
    }
  });
});

describe("customerIdSchema", () => {
  it("有効な正の整数IDを受け入れる", () => {
    const result = customerIdSchema.safeParse({ id: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(1);
    }
  });

  it("文字列のIDを数値に変換する", () => {
    const result = customerIdSchema.safeParse({ id: "42" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe(42);
    }
  });

  it("0を拒否する", () => {
    const result = customerIdSchema.safeParse({ id: 0 });
    expect(result.success).toBe(false);
  });

  it("負の値を拒否する", () => {
    const result = customerIdSchema.safeParse({ id: -1 });
    expect(result.success).toBe(false);
  });

  it("小数を整数に変換する", () => {
    const result = customerIdSchema.safeParse({ id: 3.7 });
    expect(result.success).toBe(false);
  });

  it("文字列（非数値）を拒否する", () => {
    const result = customerIdSchema.safeParse({ id: "abc" });
    expect(result.success).toBe(false);
  });
});
