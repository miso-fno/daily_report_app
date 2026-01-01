import { describe, it, expect } from "vitest";

import {
  DEPARTMENTS,
  ROLES,
  isManagerToRoleValue,
  roleValueToIsManager,
  getRoleLabel,
  SALES_PERSONS_API_BASE,
  DEFAULT_PER_PAGE,
} from "./constants";

describe("DEPARTMENTS", () => {
  it("should have 4 departments", () => {
    expect(DEPARTMENTS).toHaveLength(4);
  });

  it("should contain required departments", () => {
    const departmentValues = DEPARTMENTS.map((d) => d.value);
    expect(departmentValues).toContain("営業1課");
    expect(departmentValues).toContain("営業2課");
    expect(departmentValues).toContain("営業3課");
    expect(departmentValues).toContain("管理部");
  });

  it("should have value and label for each department", () => {
    DEPARTMENTS.forEach((dept) => {
      expect(dept).toHaveProperty("value");
      expect(dept).toHaveProperty("label");
      expect(typeof dept.value).toBe("string");
      expect(typeof dept.label).toBe("string");
    });
  });
});

describe("ROLES", () => {
  it("should have 2 roles", () => {
    expect(ROLES).toHaveLength(2);
  });

  it("should contain 'general' and 'manager' roles", () => {
    const roleValues = ROLES.map((r) => r.value);
    expect(roleValues).toContain("general");
    expect(roleValues).toContain("manager");
  });

  it("should have correct isManager mapping", () => {
    const generalRole = ROLES.find((r) => r.value === "general");
    const managerRole = ROLES.find((r) => r.value === "manager");

    expect(generalRole?.isManager).toBe(false);
    expect(managerRole?.isManager).toBe(true);
  });

  it("should have correct labels", () => {
    const generalRole = ROLES.find((r) => r.value === "general");
    const managerRole = ROLES.find((r) => r.value === "manager");

    expect(generalRole?.label).toBe("一般");
    expect(managerRole?.label).toBe("上長");
  });
});

describe("isManagerToRoleValue", () => {
  it("should return 'general' for false", () => {
    expect(isManagerToRoleValue(false)).toBe("general");
  });

  it("should return 'manager' for true", () => {
    expect(isManagerToRoleValue(true)).toBe("manager");
  });
});

describe("roleValueToIsManager", () => {
  it("should return false for 'general'", () => {
    expect(roleValueToIsManager("general")).toBe(false);
  });

  it("should return true for 'manager'", () => {
    expect(roleValueToIsManager("manager")).toBe(true);
  });
});

describe("getRoleLabel", () => {
  it("should return '一般' for false", () => {
    expect(getRoleLabel(false)).toBe("一般");
  });

  it("should return '上長' for true", () => {
    expect(getRoleLabel(true)).toBe("上長");
  });
});

describe("constants", () => {
  it("should have correct API base path", () => {
    expect(SALES_PERSONS_API_BASE).toBe("/api/v1/sales-persons");
  });

  it("should have correct default per page value", () => {
    expect(DEFAULT_PER_PAGE).toBe(20);
  });
});
