import { describe, it, expect } from "vitest";

import { canAccessMenu, canPerformAction, type UserRole } from "./auth";

describe("canAccessMenu", () => {
  describe("dashboard menu", () => {
    it("should allow all roles to access dashboard", () => {
      const roles: UserRole[] = ["member", "manager", "admin"];
      roles.forEach((role) => {
        expect(canAccessMenu("dashboard", role)).toBe(true);
      });
    });
  });

  describe("reports menu", () => {
    it("should allow all roles to access reports", () => {
      const roles: UserRole[] = ["member", "manager", "admin"];
      roles.forEach((role) => {
        expect(canAccessMenu("reports", role)).toBe(true);
      });
    });
  });

  describe("customers menu", () => {
    it("should allow all roles to access customers", () => {
      const roles: UserRole[] = ["member", "manager", "admin"];
      roles.forEach((role) => {
        expect(canAccessMenu("customers", role)).toBe(true);
      });
    });
  });

  describe("sales-persons menu", () => {
    it("should only allow admin to access sales-persons", () => {
      expect(canAccessMenu("sales-persons", "admin")).toBe(true);
      expect(canAccessMenu("sales-persons", "manager")).toBe(false);
      expect(canAccessMenu("sales-persons", "member")).toBe(false);
    });
  });

  describe("unknown menu", () => {
    it("should deny access to unknown menu", () => {
      const roles: UserRole[] = ["member", "manager", "admin"];
      roles.forEach((role) => {
        expect(canAccessMenu("unknown-menu", role)).toBe(false);
      });
    });
  });
});

describe("canPerformAction", () => {
  describe("report actions", () => {
    it("should allow all roles to create reports", () => {
      const roles: UserRole[] = ["member", "manager", "admin"];
      roles.forEach((role) => {
        expect(canPerformAction("report:create", role)).toBe(true);
      });
    });

    it("should allow all roles to edit own reports", () => {
      const roles: UserRole[] = ["member", "manager", "admin"];
      roles.forEach((role) => {
        expect(canPerformAction("report:edit-own", role)).toBe(true);
      });
    });

    it("should only allow manager and admin to confirm reports", () => {
      expect(canPerformAction("report:confirm", "admin")).toBe(true);
      expect(canPerformAction("report:confirm", "manager")).toBe(true);
      expect(canPerformAction("report:confirm", "member")).toBe(false);
    });

    it("should only allow manager and admin to view subordinates reports", () => {
      expect(canPerformAction("report:view-subordinates", "admin")).toBe(true);
      expect(canPerformAction("report:view-subordinates", "manager")).toBe(
        true
      );
      expect(canPerformAction("report:view-subordinates", "member")).toBe(
        false
      );
    });
  });

  describe("customer actions", () => {
    it("should allow all roles to view customers", () => {
      const roles: UserRole[] = ["member", "manager", "admin"];
      roles.forEach((role) => {
        expect(canPerformAction("customer:view", role)).toBe(true);
      });
    });

    it("should only allow admin to edit customers", () => {
      expect(canPerformAction("customer:edit", "admin")).toBe(true);
      expect(canPerformAction("customer:edit", "manager")).toBe(false);
      expect(canPerformAction("customer:edit", "member")).toBe(false);
    });
  });

  describe("sales-person actions", () => {
    it("should only allow admin to view sales-persons", () => {
      expect(canPerformAction("sales-person:view", "admin")).toBe(true);
      expect(canPerformAction("sales-person:view", "manager")).toBe(false);
      expect(canPerformAction("sales-person:view", "member")).toBe(false);
    });

    it("should only allow admin to edit sales-persons", () => {
      expect(canPerformAction("sales-person:edit", "admin")).toBe(true);
      expect(canPerformAction("sales-person:edit", "manager")).toBe(false);
      expect(canPerformAction("sales-person:edit", "member")).toBe(false);
    });
  });

  describe("unknown action", () => {
    it("should deny unknown actions", () => {
      const roles: UserRole[] = ["member", "manager", "admin"];
      roles.forEach((role) => {
        expect(canPerformAction("unknown:action", role)).toBe(false);
      });
    });
  });
});
