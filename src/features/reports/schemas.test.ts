import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  visitRecordFormSchema,
  reportFormSchema,
  getDefaultReportFormValues,
  getDefaultVisitRecordValues,
  validateReportDate,
  validateForSubmission,
  convertFormToApiRequest,
} from "./schemas";

describe("visitRecordFormSchema", () => {
  describe("customer_id validation", () => {
    it("should fail when customer_id is empty", () => {
      const result = visitRecordFormSchema.safeParse({
        customer_id: "",
        visit_content: "テスト訪問内容",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("顧客を選択してください");
      }
    });

    it("should pass with valid customer_id", () => {
      const result = visitRecordFormSchema.safeParse({
        customer_id: "1",
        visit_content: "テスト訪問内容",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("visit_content validation", () => {
    it("should fail when visit_content is empty", () => {
      const result = visitRecordFormSchema.safeParse({
        customer_id: "1",
        visit_content: "",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const visitContentError = result.error.issues.find(
          (issue) => issue.path[0] === "visit_content"
        );
        expect(visitContentError?.message).toBe("訪問内容は必須です");
      }
    });

    it("should fail when visit_content exceeds 1000 characters", () => {
      const result = visitRecordFormSchema.safeParse({
        customer_id: "1",
        visit_content: "あ".repeat(1001),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          "訪問内容は1000文字以内で入力してください"
        );
      }
    });

    it("should pass with valid visit_content", () => {
      const result = visitRecordFormSchema.safeParse({
        customer_id: "1",
        visit_content: "テスト訪問内容",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("visit_purpose validation", () => {
    it("should fail when visit_purpose exceeds 100 characters", () => {
      const result = visitRecordFormSchema.safeParse({
        customer_id: "1",
        visit_content: "テスト訪問内容",
        visit_purpose: "あ".repeat(101),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const visitPurposeError = result.error.issues.find(
          (issue) => issue.path[0] === "visit_purpose"
        );
        expect(visitPurposeError?.message).toBe(
          "訪問目的は100文字以内で入力してください"
        );
      }
    });

    it("should pass with empty visit_purpose", () => {
      const result = visitRecordFormSchema.safeParse({
        customer_id: "1",
        visit_content: "テスト訪問内容",
        visit_purpose: "",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("visit_result validation", () => {
    it("should fail when visit_result exceeds 200 characters", () => {
      const result = visitRecordFormSchema.safeParse({
        customer_id: "1",
        visit_content: "テスト訪問内容",
        visit_result: "あ".repeat(201),
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const visitResultError = result.error.issues.find(
          (issue) => issue.path[0] === "visit_result"
        );
        expect(visitResultError?.message).toBe(
          "訪問結果は200文字以内で入力してください"
        );
      }
    });
  });
});

describe("reportFormSchema", () => {
  describe("report_date validation", () => {
    it("should fail when report_date is empty", () => {
      const result = reportFormSchema.safeParse({
        report_date: "",
        visits: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("報告日は必須です");
      }
    });

    it("should pass with valid report_date", () => {
      const result = reportFormSchema.safeParse({
        report_date: "2024-01-15",
        visits: [],
      });

      expect(result.success).toBe(true);
    });
  });

  describe("problem validation", () => {
    it("should fail when problem exceeds 2000 characters", () => {
      const result = reportFormSchema.safeParse({
        report_date: "2024-01-15",
        problem: "あ".repeat(2001),
        visits: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const problemError = result.error.issues.find(
          (issue) => issue.path[0] === "problem"
        );
        expect(problemError?.message).toBe(
          "課題・相談は2000文字以内で入力してください"
        );
      }
    });
  });

  describe("plan validation", () => {
    it("should fail when plan exceeds 2000 characters", () => {
      const result = reportFormSchema.safeParse({
        report_date: "2024-01-15",
        plan: "あ".repeat(2001),
        visits: [],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const planError = result.error.issues.find(
          (issue) => issue.path[0] === "plan"
        );
        expect(planError?.message).toBe(
          "明日の予定は2000文字以内で入力してください"
        );
      }
    });
  });

  describe("visits validation", () => {
    it("should pass with empty visits array", () => {
      const result = reportFormSchema.safeParse({
        report_date: "2024-01-15",
        visits: [],
      });

      expect(result.success).toBe(true);
    });

    it("should validate nested visit records", () => {
      const result = reportFormSchema.safeParse({
        report_date: "2024-01-15",
        visits: [
          {
            customer_id: "",
            visit_content: "テスト",
          },
        ],
      });

      expect(result.success).toBe(false);
    });
  });
});

describe("getDefaultReportFormValues", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return today's date as report_date", () => {
    const values = getDefaultReportFormValues();

    expect(values.report_date).toBe("2024-01-15");
  });

  it("should return empty strings for optional fields", () => {
    const values = getDefaultReportFormValues();

    expect(values.problem).toBe("");
    expect(values.plan).toBe("");
  });

  it("should return empty visits array", () => {
    const values = getDefaultReportFormValues();

    expect(values.visits).toEqual([]);
  });
});

describe("getDefaultVisitRecordValues", () => {
  it("should return default values for visit record", () => {
    const values = getDefaultVisitRecordValues();

    expect(values.customer_id).toBe("");
    expect(values.visit_time).toBe("");
    expect(values.visit_purpose).toBe("");
    expect(values.visit_content).toBe("");
    expect(values.visit_result).toBe("");
  });
});

describe("validateReportDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return error for empty date", () => {
    const result = validateReportDate("");

    expect(result).toBe("報告日は必須です");
  });

  it("should return error for future date", () => {
    const result = validateReportDate("2024-01-16");

    expect(result).toBe("報告日に未来日は指定できません");
  });

  it("should return null for today's date", () => {
    const result = validateReportDate("2024-01-15");

    expect(result).toBeNull();
  });

  it("should return null for past date", () => {
    const result = validateReportDate("2024-01-14");

    expect(result).toBeNull();
  });
});

describe("validateForSubmission", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-15T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return error when report_date is empty", () => {
    const errors = validateForSubmission({
      report_date: "",
      visits: [
        {
          customer_id: "1",
          visit_content: "テスト",
        },
      ],
    });

    expect(errors).toContain("報告日は必須です");
  });

  it("should return error when report_date is future", () => {
    const errors = validateForSubmission({
      report_date: "2024-01-16",
      visits: [
        {
          customer_id: "1",
          visit_content: "テスト",
        },
      ],
    });

    expect(errors).toContain("報告日に未来日は指定できません");
  });

  it("should return error when visits is empty", () => {
    const errors = validateForSubmission({
      report_date: "2024-01-15",
      visits: [],
    });

    expect(errors).toContain("提出時は訪問記録を1件以上登録してください");
  });

  it("should return empty array when valid for submission", () => {
    const errors = validateForSubmission({
      report_date: "2024-01-15",
      visits: [
        {
          customer_id: "1",
          visit_content: "テスト訪問内容",
        },
      ],
    });

    expect(errors).toEqual([]);
  });
});

describe("convertFormToApiRequest", () => {
  it("should convert form values to API request format with draft status", () => {
    const formData = {
      report_date: "2024-01-15",
      problem: "課題テスト",
      plan: "予定テスト",
      visits: [
        {
          customer_id: "1",
          visit_time: "10:00",
          visit_purpose: "商談",
          visit_content: "新規提案を行いました",
          visit_result: "次回アポイント取得",
        },
      ],
    };

    const result = convertFormToApiRequest(formData, "draft");

    expect(result.report_date).toBe("2024-01-15");
    expect(result.problem).toBe("課題テスト");
    expect(result.plan).toBe("予定テスト");
    expect(result.status).toBe("draft");
    expect(result.visits).toHaveLength(1);
    expect(result.visits[0]).toEqual({
      customer_id: 1,
      visit_time: "10:00",
      visit_purpose: "商談",
      visit_content: "新規提案を行いました",
      visit_result: "次回アポイント取得",
    });
  });

  it("should convert form values to API request format with submitted status", () => {
    const formData = {
      report_date: "2024-01-15",
      visits: [
        {
          customer_id: "2",
          visit_content: "テスト訪問",
        },
      ],
    };

    const result = convertFormToApiRequest(formData, "submitted");

    expect(result.status).toBe("submitted");
  });

  it("should convert empty optional fields to null", () => {
    const formData = {
      report_date: "2024-01-15",
      problem: "",
      plan: "",
      visits: [
        {
          customer_id: "1",
          visit_time: "",
          visit_purpose: "",
          visit_content: "テスト",
          visit_result: "",
        },
      ],
    };

    const result = convertFormToApiRequest(formData, "draft");

    expect(result.problem).toBeNull();
    expect(result.plan).toBeNull();
    expect(result.visits[0]?.visit_time).toBeNull();
    expect(result.visits[0]?.visit_purpose).toBeNull();
    expect(result.visits[0]?.visit_result).toBeNull();
  });

  it("should parse customer_id as number", () => {
    const formData = {
      report_date: "2024-01-15",
      visits: [
        {
          customer_id: "123",
          visit_content: "テスト",
        },
      ],
    };

    const result = convertFormToApiRequest(formData, "draft");

    expect(result.visits[0]?.customer_id).toBe(123);
  });

  it("should handle multiple visits", () => {
    const formData = {
      report_date: "2024-01-15",
      visits: [
        {
          customer_id: "1",
          visit_content: "訪問1",
        },
        {
          customer_id: "2",
          visit_content: "訪問2",
        },
        {
          customer_id: "3",
          visit_content: "訪問3",
        },
      ],
    };

    const result = convertFormToApiRequest(formData, "draft");

    expect(result.visits).toHaveLength(3);
    expect(result.visits[0]?.customer_id).toBe(1);
    expect(result.visits[1]?.customer_id).toBe(2);
    expect(result.visits[2]?.customer_id).toBe(3);
  });
});
