/**
 * 日報APIスキーマのテスト
 */

import { describe, it, expect } from "vitest";

import {
  CreateReportSchema,
  getStatusLabel,
  ReportIdParamSchema,
  ReportsQuerySchema,
  ReportStatus,
  UpdateReportSchema,
  UpdateStatusSchema,
  VisitRecordSchema,
} from "./report";

// 日付関連のテストで固定の日付を使用するためのヘルパー
function getYesterday(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0] as string;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0] as string;
}

function getTomorrow(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0] as string;
}

describe("ReportStatus", () => {
  it("ステータス値が正しく定義されている", () => {
    expect(ReportStatus.DRAFT).toBe("draft");
    expect(ReportStatus.SUBMITTED).toBe("submitted");
    expect(ReportStatus.CONFIRMED).toBe("confirmed");
  });
});

describe("getStatusLabel", () => {
  it("draftを下書きに変換する", () => {
    expect(getStatusLabel("draft")).toBe("下書き");
  });

  it("submittedを提出済に変換する", () => {
    expect(getStatusLabel("submitted")).toBe("提出済");
  });

  it("confirmedを確認済に変換する", () => {
    expect(getStatusLabel("confirmed")).toBe("確認済");
  });
});

describe("ReportsQuerySchema", () => {
  it("正常なクエリパラメータをパースできる", () => {
    const result = ReportsQuerySchema.parse({
      date_from: "2024-01-01",
      date_to: "2024-01-31",
      sales_person_id: "1",
      status: "submitted",
      page: "1",
      per_page: "20",
      sort: "report_date",
      order: "desc",
    });

    expect(result).toEqual({
      date_from: "2024-01-01",
      date_to: "2024-01-31",
      sales_person_id: 1,
      status: "submitted",
      page: 1,
      per_page: 20,
      sort: "report_date",
      order: "desc",
    });
  });

  it("空のクエリパラメータでもデフォルト値が適用される", () => {
    const result = ReportsQuerySchema.parse({});

    expect(result).toEqual({
      date_from: undefined,
      date_to: undefined,
      sales_person_id: undefined,
      status: undefined,
      page: 1,
      per_page: 20,
      sort: "report_date",
      order: "desc",
    });
  });

  it("不正なステータスはエラーになる", () => {
    expect(() => {
      ReportsQuerySchema.parse({
        status: "invalid",
      });
    }).toThrow();
  });

  it("不正な日付形式はエラーになる", () => {
    expect(() => {
      ReportsQuerySchema.parse({
        date_from: "2024/01/01",
      });
    }).toThrow();
  });

  it("sortがreport_dateまたはcreated_at以外はエラーになる", () => {
    expect(() => {
      ReportsQuerySchema.parse({
        sort: "invalid_sort",
      });
    }).toThrow();
  });
});

describe("VisitRecordSchema", () => {
  it("正常な訪問記録をパースできる", () => {
    const result = VisitRecordSchema.parse({
      customer_id: 1,
      visit_time: "10:30",
      visit_purpose: "新製品のご提案",
      visit_content: "新製品Xについて説明。担当者の佐藤様は興味を示された。",
      visit_result: "次回デモ日程調整中",
    });

    expect(result).toEqual({
      customer_id: 1,
      visit_time: "10:30",
      visit_purpose: "新製品のご提案",
      visit_content: "新製品Xについて説明。担当者の佐藤様は興味を示された。",
      visit_result: "次回デモ日程調整中",
    });
  });

  it("必須項目のみでパースできる", () => {
    const result = VisitRecordSchema.parse({
      customer_id: 1,
      visit_content: "訪問内容です。",
    });

    expect(result.customer_id).toBe(1);
    expect(result.visit_content).toBe("訪問内容です。");
    expect(result.visit_time).toBeUndefined();
    expect(result.visit_purpose).toBeUndefined();
    expect(result.visit_result).toBeUndefined();
  });

  it("customer_idが未指定の場合はエラーになる", () => {
    expect(() => {
      VisitRecordSchema.parse({
        visit_content: "訪問内容です。",
      });
    }).toThrow();
  });

  it("visit_contentが空の場合はエラーになる", () => {
    expect(() => {
      VisitRecordSchema.parse({
        customer_id: 1,
        visit_content: "",
      });
    }).toThrow();
  });

  it("visit_contentが1000文字を超える場合はエラーになる", () => {
    expect(() => {
      VisitRecordSchema.parse({
        customer_id: 1,
        visit_content: "あ".repeat(1001),
      });
    }).toThrow();
  });

  it("visit_purposeが100文字を超える場合はエラーになる", () => {
    expect(() => {
      VisitRecordSchema.parse({
        customer_id: 1,
        visit_content: "訪問内容です。",
        visit_purpose: "あ".repeat(101),
      });
    }).toThrow();
  });

  it("visit_resultが200文字を超える場合はエラーになる", () => {
    expect(() => {
      VisitRecordSchema.parse({
        customer_id: 1,
        visit_content: "訪問内容です。",
        visit_result: "あ".repeat(201),
      });
    }).toThrow();
  });

  it("visit_timeが不正な形式の場合はエラーになる", () => {
    expect(() => {
      VisitRecordSchema.parse({
        customer_id: 1,
        visit_content: "訪問内容です。",
        visit_time: "10:00:00",
      });
    }).toThrow();

    expect(() => {
      VisitRecordSchema.parse({
        customer_id: 1,
        visit_content: "訪問内容です。",
        visit_time: "25:00",
      });
    }).toThrow();
  });

  it("visit_timeがnullの場合は許容される", () => {
    const result = VisitRecordSchema.parse({
      customer_id: 1,
      visit_content: "訪問内容です。",
      visit_time: null,
    });

    expect(result.visit_time).toBeNull();
  });
});

describe("CreateReportSchema", () => {
  it("正常なリクエストボディをパースできる", () => {
    const yesterday = getYesterday();
    const result = CreateReportSchema.parse({
      report_date: yesterday,
      problem: "課題・相談内容",
      plan: "明日の予定",
      status: "draft",
      visits: [
        {
          customer_id: 1,
          visit_time: "10:00",
          visit_content: "訪問内容です。",
        },
      ],
    });

    expect(result.report_date).toBe(yesterday);
    expect(result.problem).toBe("課題・相談内容");
    expect(result.plan).toBe("明日の予定");
    expect(result.status).toBe("draft");
    expect(result.visits).toHaveLength(1);
  });

  it("下書き時は訪問記録なしでもパースできる", () => {
    const yesterday = getYesterday();
    const result = CreateReportSchema.parse({
      report_date: yesterday,
      status: "draft",
    });

    expect(result.visits).toEqual([]);
  });

  it("提出時に訪問記録がない場合はエラーになる", () => {
    const yesterday = getYesterday();
    expect(() => {
      CreateReportSchema.parse({
        report_date: yesterday,
        status: "submitted",
        visits: [],
      });
    }).toThrow();
  });

  it("report_dateが未来日の場合はエラーになる", () => {
    const tomorrow = getTomorrow();
    expect(() => {
      CreateReportSchema.parse({
        report_date: tomorrow,
        status: "draft",
      });
    }).toThrow();
  });

  it("report_dateが当日の場合はパースできる", () => {
    const today = getToday();
    const result = CreateReportSchema.parse({
      report_date: today,
      status: "draft",
    });

    expect(result.report_date).toBe(today);
  });

  it("problemが2000文字を超える場合はエラーになる", () => {
    const yesterday = getYesterday();
    expect(() => {
      CreateReportSchema.parse({
        report_date: yesterday,
        problem: "あ".repeat(2001),
        status: "draft",
      });
    }).toThrow();
  });

  it("planが2000文字を超える場合はエラーになる", () => {
    const yesterday = getYesterday();
    expect(() => {
      CreateReportSchema.parse({
        report_date: yesterday,
        plan: "あ".repeat(2001),
        status: "draft",
      });
    }).toThrow();
  });

  it("statusがconfirmedの場合はエラーになる（作成時はdraftまたはsubmittedのみ）", () => {
    const yesterday = getYesterday();
    expect(() => {
      CreateReportSchema.parse({
        report_date: yesterday,
        status: "confirmed",
      });
    }).toThrow();
  });

  it("report_dateが不正な形式の場合はエラーになる", () => {
    expect(() => {
      CreateReportSchema.parse({
        report_date: "2024/01/15",
        status: "draft",
      });
    }).toThrow();
  });
});

describe("UpdateReportSchema", () => {
  it("正常なリクエストボディをパースできる", () => {
    const yesterday = getYesterday();
    const result = UpdateReportSchema.parse({
      report_date: yesterday,
      problem: "更新された課題",
      plan: "更新された予定",
      status: "submitted",
      visits: [
        {
          customer_id: 1,
          visit_content: "訪問内容です。",
        },
      ],
    });

    expect(result.report_date).toBe(yesterday);
    expect(result.status).toBe("submitted");
    expect(result.visits).toHaveLength(1);
  });

  it("提出時に訪問記録がない場合はエラーになる", () => {
    const yesterday = getYesterday();
    expect(() => {
      UpdateReportSchema.parse({
        report_date: yesterday,
        status: "submitted",
        visits: [],
      });
    }).toThrow();
  });

  it("statusがconfirmedの場合はエラーになる", () => {
    const yesterday = getYesterday();
    expect(() => {
      UpdateReportSchema.parse({
        report_date: yesterday,
        status: "confirmed",
      });
    }).toThrow();
  });
});

describe("UpdateStatusSchema", () => {
  it("draftをパースできる", () => {
    const result = UpdateStatusSchema.parse({ status: "draft" });
    expect(result.status).toBe("draft");
  });

  it("submittedをパースできる", () => {
    const result = UpdateStatusSchema.parse({ status: "submitted" });
    expect(result.status).toBe("submitted");
  });

  it("confirmedをパースできる", () => {
    const result = UpdateStatusSchema.parse({ status: "confirmed" });
    expect(result.status).toBe("confirmed");
  });

  it("不正なステータスはエラーになる", () => {
    expect(() => {
      UpdateStatusSchema.parse({ status: "invalid" });
    }).toThrow();
  });

  it("statusが未指定の場合はエラーになる", () => {
    expect(() => {
      UpdateStatusSchema.parse({});
    }).toThrow();
  });
});

describe("ReportIdParamSchema", () => {
  it("正常なIDをパースできる", () => {
    const result = ReportIdParamSchema.parse({ id: "1" });
    expect(result.id).toBe(1);
  });

  it("数値型のIDもパースできる", () => {
    const result = ReportIdParamSchema.parse({ id: 5 });
    expect(result.id).toBe(5);
  });

  it("0以下の値はエラーになる", () => {
    expect(() => {
      ReportIdParamSchema.parse({ id: "0" });
    }).toThrow();
  });

  it("負の値はエラーになる", () => {
    expect(() => {
      ReportIdParamSchema.parse({ id: "-1" });
    }).toThrow();
  });

  it("数値に変換できない文字列はエラーになる", () => {
    expect(() => {
      ReportIdParamSchema.parse({ id: "abc" });
    }).toThrow();
  });
});
