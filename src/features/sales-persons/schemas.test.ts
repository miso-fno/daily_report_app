import { describe, it, expect } from "vitest";

import {
  createSalesPersonFormSchema,
  updateSalesPersonFormSchema,
  searchFormSchema,
  convertFormToApiRequest,
} from "./schemas";

describe("createSalesPersonFormSchema", () => {
  describe("name validation", () => {
    it("should fail when name is empty", () => {
      const result = createSalesPersonFormSchema.safeParse({
        name: "",
        email: "test@example.com",
        password: "12345678",
        department: "営業1課",
        manager_id: "_none",
        role: "general",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("氏名を入力してください");
      }
    });

    it("should fail when name exceeds 50 characters", () => {
      const result = createSalesPersonFormSchema.safeParse({
        name: "あ".repeat(51),
        email: "test@example.com",
        password: "12345678",
        department: "営業1課",
        manager_id: "_none",
        role: "general",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "氏名は50文字以内で入力してください"
        );
      }
    });

    it("should pass with valid name", () => {
      const result = createSalesPersonFormSchema.safeParse({
        name: "山田太郎",
        email: "test@example.com",
        password: "12345678",
        department: "営業1課",
        manager_id: "_none",
        role: "general",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("email validation", () => {
    it("should fail when email is empty", () => {
      const result = createSalesPersonFormSchema.safeParse({
        name: "山田太郎",
        email: "",
        password: "12345678",
        department: "営業1課",
        manager_id: "_none",
        role: "general",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "メールアドレスを入力してください"
        );
      }
    });

    it("should fail for invalid email format", () => {
      const result = createSalesPersonFormSchema.safeParse({
        name: "山田太郎",
        email: "invalid-email",
        password: "12345678",
        department: "営業1課",
        manager_id: "_none",
        role: "general",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "正しいメールアドレス形式で入力してください"
        );
      }
    });
  });

  describe("password validation", () => {
    it("should fail when password is less than 8 characters", () => {
      const result = createSalesPersonFormSchema.safeParse({
        name: "山田太郎",
        email: "test@example.com",
        password: "1234567",
        department: "営業1課",
        manager_id: "_none",
        role: "general",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "パスワードは8文字以上で入力してください"
        );
      }
    });

    it("should pass with 8+ character password", () => {
      const result = createSalesPersonFormSchema.safeParse({
        name: "山田太郎",
        email: "test@example.com",
        password: "12345678",
        department: "営業1課",
        manager_id: "_none",
        role: "general",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("department validation", () => {
    it("should fail when department is empty", () => {
      const result = createSalesPersonFormSchema.safeParse({
        name: "山田太郎",
        email: "test@example.com",
        password: "12345678",
        department: "",
        manager_id: "_none",
        role: "general",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("部署を選択してください");
      }
    });
  });

  describe("role validation", () => {
    it("should accept 'general' role", () => {
      const result = createSalesPersonFormSchema.safeParse({
        name: "山田太郎",
        email: "test@example.com",
        password: "12345678",
        department: "営業1課",
        manager_id: "_none",
        role: "general",
      });

      expect(result.success).toBe(true);
    });

    it("should accept 'manager' role", () => {
      const result = createSalesPersonFormSchema.safeParse({
        name: "山田太郎",
        email: "test@example.com",
        password: "12345678",
        department: "営業1課",
        manager_id: "_none",
        role: "manager",
      });

      expect(result.success).toBe(true);
    });

    it("should reject invalid role", () => {
      const result = createSalesPersonFormSchema.safeParse({
        name: "山田太郎",
        email: "test@example.com",
        password: "12345678",
        department: "営業1課",
        manager_id: "_none",
        role: "invalid",
      });

      expect(result.success).toBe(false);
    });
  });
});

describe("updateSalesPersonFormSchema", () => {
  describe("password validation", () => {
    it("should allow empty password", () => {
      const result = updateSalesPersonFormSchema.safeParse({
        name: "山田太郎",
        email: "test@example.com",
        password: "",
        department: "営業1課",
        manager_id: "_none",
        role: "general",
      });

      expect(result.success).toBe(true);
    });

    it("should fail when password is provided but less than 8 characters", () => {
      const result = updateSalesPersonFormSchema.safeParse({
        name: "山田太郎",
        email: "test@example.com",
        password: "1234567",
        department: "営業1課",
        manager_id: "_none",
        role: "general",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "パスワードは8文字以上で入力してください"
        );
      }
    });

    it("should pass when password is 8+ characters", () => {
      const result = updateSalesPersonFormSchema.safeParse({
        name: "山田太郎",
        email: "test@example.com",
        password: "12345678",
        department: "営業1課",
        manager_id: "_none",
        role: "general",
      });

      expect(result.success).toBe(true);
    });
  });
});

describe("searchFormSchema", () => {
  it("should allow all fields to be empty", () => {
    const result = searchFormSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("should accept name search", () => {
    const result = searchFormSchema.safeParse({
      name: "山田",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("山田");
    }
  });

  it("should accept department search", () => {
    const result = searchFormSchema.safeParse({
      department: "営業1課",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.department).toBe("営業1課");
    }
  });
});

describe("convertFormToApiRequest", () => {
  describe("create mode (isEdit = false)", () => {
    it("should include password in create mode", () => {
      const formData = {
        name: "山田太郎",
        email: "yamada@example.com",
        password: "password123",
        department: "営業1課",
        manager_id: "_none",
        role: "general" as const,
      };

      const result = convertFormToApiRequest(formData, false);

      expect(result.password).toBe("password123");
      expect(result.name).toBe("山田太郎");
      expect(result.email).toBe("yamada@example.com");
      expect(result.department).toBe("営業1課");
      expect(result.manager_id).toBe(null);
      expect(result.is_manager).toBe(false);
    });

    it("should convert 'manager' role to is_manager=true", () => {
      const formData = {
        name: "山田太郎",
        email: "yamada@example.com",
        password: "password123",
        department: "営業1課",
        manager_id: "_none",
        role: "manager" as const,
      };

      const result = convertFormToApiRequest(formData, false);

      expect(result.is_manager).toBe(true);
    });

    it("should parse manager_id as number", () => {
      const formData = {
        name: "山田太郎",
        email: "yamada@example.com",
        password: "password123",
        department: "営業1課",
        manager_id: "10",
        role: "general" as const,
      };

      const result = convertFormToApiRequest(formData, false);

      expect(result.manager_id).toBe(10);
    });
  });

  describe("edit mode (isEdit = true)", () => {
    it("should not include password when empty in edit mode", () => {
      const formData = {
        name: "山田太郎",
        email: "yamada@example.com",
        password: "",
        department: "営業1課",
        manager_id: "_none",
        role: "general" as const,
      };

      const result = convertFormToApiRequest(formData, true);

      expect(result.password).toBeUndefined();
    });

    it("should include password when provided in edit mode", () => {
      const formData = {
        name: "山田太郎",
        email: "yamada@example.com",
        password: "newpassword123",
        department: "営業1課",
        manager_id: "_none",
        role: "general" as const,
      };

      const result = convertFormToApiRequest(formData, true);

      expect(result.password).toBe("newpassword123");
    });
  });

  describe("manager_id handling", () => {
    it("should return null for _none manager_id", () => {
      const formData = {
        name: "山田太郎",
        email: "yamada@example.com",
        password: "password123",
        department: "営業1課",
        manager_id: "_none",
        role: "general" as const,
      };

      const result = convertFormToApiRequest(formData, false);

      expect(result.manager_id).toBe(null);
    });

    it("should return null for empty manager_id", () => {
      const formData = {
        name: "山田太郎",
        email: "yamada@example.com",
        password: "password123",
        department: "営業1課",
        manager_id: "",
        role: "general" as const,
      };

      const result = convertFormToApiRequest(formData, false);

      expect(result.manager_id).toBe(null);
    });

    it("should return null for invalid manager_id", () => {
      const formData = {
        name: "山田太郎",
        email: "yamada@example.com",
        password: "password123",
        department: "営業1課",
        manager_id: "invalid",
        role: "general" as const,
      };

      const result = convertFormToApiRequest(formData, false);

      expect(result.manager_id).toBe(null);
    });

    it("should parse valid manager_id", () => {
      const formData = {
        name: "山田太郎",
        email: "yamada@example.com",
        password: "password123",
        department: "営業1課",
        manager_id: "5",
        role: "general" as const,
      };

      const result = convertFormToApiRequest(formData, false);

      expect(result.manager_id).toBe(5);
    });
  });
});
