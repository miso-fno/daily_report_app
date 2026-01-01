/**
 * 訪問記録APIスキーマのテスト
 */

import { describe, it, expect } from "vitest";

import {
  CreateVisitSchema,
  ReportIdParamSchema,
  UpdateVisitSchema,
  VisitIdParamSchema,
  VisitTimeSchema,
} from "./visit";

describe("VisitTimeSchema", () => {
  describe("正常系", () => {
    it("有効な時間形式をパースできる", () => {
      const validTimes = ["00:00", "09:30", "12:00", "23:59"];

      for (const time of validTimes) {
        const result = VisitTimeSchema.parse(time);
        expect(result).toBe(time);
      }
    });

    it("nullを許容する", () => {
      const result = VisitTimeSchema.parse(null);
      expect(result).toBeNull();
    });

    it("undefinedを許容する", () => {
      const result = VisitTimeSchema.parse(undefined);
      expect(result).toBeUndefined();
    });
  });

  describe("異常系", () => {
    it("24時以上の時間はエラーになる", () => {
      expect(() => VisitTimeSchema.parse("24:00")).toThrow();
      expect(() => VisitTimeSchema.parse("25:00")).toThrow();
    });

    it("60分以上はエラーになる", () => {
      expect(() => VisitTimeSchema.parse("10:60")).toThrow();
      expect(() => VisitTimeSchema.parse("10:99")).toThrow();
    });

    it("不正な形式はエラーになる", () => {
      expect(() => VisitTimeSchema.parse("10:00:00")).toThrow(); // 秒付き
      expect(() => VisitTimeSchema.parse("10")).toThrow(); // 時のみ
      expect(() => VisitTimeSchema.parse("10:5")).toThrow(); // 分が1桁
      expect(() => VisitTimeSchema.parse("1:05")).toThrow(); // 時が1桁
      expect(() => VisitTimeSchema.parse("ten:thirty")).toThrow(); // 文字列
      expect(() => VisitTimeSchema.parse("")).toThrow(); // 空文字
    });
  });
});

describe("CreateVisitSchema", () => {
  describe("正常系", () => {
    it("すべてのフィールドを含む正常なリクエストをパースできる", () => {
      const input = {
        customer_id: 1,
        visit_time: "10:30",
        visit_purpose: "新製品のご提案",
        visit_content: "新製品Xについて説明。担当者の佐藤様は興味を示された。",
        visit_result: "次回デモ日程調整中",
      };

      const result = CreateVisitSchema.parse(input);

      expect(result).toEqual(input);
    });

    it("必須項目のみでパースできる", () => {
      const input = {
        customer_id: 1,
        visit_content: "訪問内容です。",
      };

      const result = CreateVisitSchema.parse(input);

      expect(result.customer_id).toBe(1);
      expect(result.visit_content).toBe("訪問内容です。");
      expect(result.visit_time).toBeUndefined();
      expect(result.visit_purpose).toBeUndefined();
      expect(result.visit_result).toBeUndefined();
    });

    it("オプションフィールドがnullの場合もパースできる", () => {
      const input = {
        customer_id: 1,
        visit_time: null,
        visit_purpose: null,
        visit_content: "訪問内容です。",
        visit_result: null,
      };

      const result = CreateVisitSchema.parse(input);

      expect(result.visit_time).toBeNull();
      expect(result.visit_purpose).toBeNull();
      expect(result.visit_result).toBeNull();
    });

    it("visit_contentが1000文字の境界値でパースできる", () => {
      const input = {
        customer_id: 1,
        visit_content: "あ".repeat(1000),
      };

      const result = CreateVisitSchema.parse(input);

      expect(result.visit_content.length).toBe(1000);
    });

    it("visit_purposeが100文字の境界値でパースできる", () => {
      const input = {
        customer_id: 1,
        visit_content: "訪問内容",
        visit_purpose: "あ".repeat(100),
      };

      const result = CreateVisitSchema.parse(input);

      expect(result.visit_purpose?.length).toBe(100);
    });

    it("visit_resultが200文字の境界値でパースできる", () => {
      const input = {
        customer_id: 1,
        visit_content: "訪問内容",
        visit_result: "あ".repeat(200),
      };

      const result = CreateVisitSchema.parse(input);

      expect(result.visit_result?.length).toBe(200);
    });
  });

  describe("異常系", () => {
    it("customer_idが未指定の場合はエラーになる", () => {
      const input = {
        visit_content: "訪問内容です。",
      };

      expect(() => CreateVisitSchema.parse(input)).toThrow();
    });

    it("customer_idが0の場合はエラーになる", () => {
      const input = {
        customer_id: 0,
        visit_content: "訪問内容です。",
      };

      expect(() => CreateVisitSchema.parse(input)).toThrow();
    });

    it("customer_idが負の値の場合はエラーになる", () => {
      const input = {
        customer_id: -1,
        visit_content: "訪問内容です。",
      };

      expect(() => CreateVisitSchema.parse(input)).toThrow();
    });

    it("customer_idが小数の場合はエラーになる", () => {
      const input = {
        customer_id: 1.5,
        visit_content: "訪問内容です。",
      };

      expect(() => CreateVisitSchema.parse(input)).toThrow();
    });

    it("visit_contentが未指定の場合はエラーになる", () => {
      const input = {
        customer_id: 1,
      };

      expect(() => CreateVisitSchema.parse(input)).toThrow();
    });

    it("visit_contentが空文字の場合はエラーになる", () => {
      const input = {
        customer_id: 1,
        visit_content: "",
      };

      expect(() => CreateVisitSchema.parse(input)).toThrow();
    });

    it("visit_contentが1000文字を超える場合はエラーになる", () => {
      const input = {
        customer_id: 1,
        visit_content: "あ".repeat(1001),
      };

      expect(() => CreateVisitSchema.parse(input)).toThrow();
    });

    it("visit_purposeが100文字を超える場合はエラーになる", () => {
      const input = {
        customer_id: 1,
        visit_content: "訪問内容です。",
        visit_purpose: "あ".repeat(101),
      };

      expect(() => CreateVisitSchema.parse(input)).toThrow();
    });

    it("visit_resultが200文字を超える場合はエラーになる", () => {
      const input = {
        customer_id: 1,
        visit_content: "訪問内容です。",
        visit_result: "あ".repeat(201),
      };

      expect(() => CreateVisitSchema.parse(input)).toThrow();
    });

    it("visit_timeが不正な形式の場合はエラーになる", () => {
      const input = {
        customer_id: 1,
        visit_content: "訪問内容です。",
        visit_time: "10:00:00",
      };

      expect(() => CreateVisitSchema.parse(input)).toThrow();
    });
  });
});

describe("UpdateVisitSchema", () => {
  describe("正常系", () => {
    it("すべてのフィールドを含む正常なリクエストをパースできる", () => {
      const input = {
        customer_id: 2,
        visit_time: "14:00",
        visit_purpose: "定期訪問",
        visit_content: "定期フォローアップを実施。現状の課題をヒアリング。",
        visit_result: "追加提案を検討",
      };

      const result = UpdateVisitSchema.parse(input);

      expect(result).toEqual(input);
    });

    it("必須項目のみでパースできる", () => {
      const input = {
        customer_id: 1,
        visit_content: "更新された訪問内容です。",
      };

      const result = UpdateVisitSchema.parse(input);

      expect(result.customer_id).toBe(1);
      expect(result.visit_content).toBe("更新された訪問内容です。");
    });
  });

  describe("異常系", () => {
    it("customer_idが未指定の場合はエラーになる", () => {
      const input = {
        visit_content: "訪問内容です。",
      };

      expect(() => UpdateVisitSchema.parse(input)).toThrow();
    });

    it("visit_contentが空文字の場合はエラーになる", () => {
      const input = {
        customer_id: 1,
        visit_content: "",
      };

      expect(() => UpdateVisitSchema.parse(input)).toThrow();
    });

    it("visit_contentが1000文字を超える場合はエラーになる", () => {
      const input = {
        customer_id: 1,
        visit_content: "あ".repeat(1001),
      };

      expect(() => UpdateVisitSchema.parse(input)).toThrow();
    });
  });
});

describe("VisitIdParamSchema", () => {
  describe("正常系", () => {
    it("文字列のIDをパースできる", () => {
      const result = VisitIdParamSchema.parse({ id: "1" });
      expect(result.id).toBe(1);
    });

    it("数値のIDをパースできる", () => {
      const result = VisitIdParamSchema.parse({ id: 5 });
      expect(result.id).toBe(5);
    });

    it("大きな数値のIDをパースできる", () => {
      const result = VisitIdParamSchema.parse({ id: "999999" });
      expect(result.id).toBe(999999);
    });
  });

  describe("異常系", () => {
    it("0はエラーになる", () => {
      expect(() => VisitIdParamSchema.parse({ id: "0" })).toThrow();
    });

    it("負の値はエラーになる", () => {
      expect(() => VisitIdParamSchema.parse({ id: "-1" })).toThrow();
    });

    it("小数はエラーになる", () => {
      expect(() => VisitIdParamSchema.parse({ id: "1.5" })).toThrow();
    });

    it("数値に変換できない文字列はエラーになる", () => {
      expect(() => VisitIdParamSchema.parse({ id: "abc" })).toThrow();
    });

    it("idが未指定の場合はエラーになる", () => {
      expect(() => VisitIdParamSchema.parse({})).toThrow();
    });
  });
});

describe("ReportIdParamSchema", () => {
  describe("正常系", () => {
    it("文字列のIDをパースできる", () => {
      const result = ReportIdParamSchema.parse({ id: "10" });
      expect(result.id).toBe(10);
    });

    it("数値のIDをパースできる", () => {
      const result = ReportIdParamSchema.parse({ id: 20 });
      expect(result.id).toBe(20);
    });
  });

  describe("異常系", () => {
    it("0はエラーになる", () => {
      expect(() => ReportIdParamSchema.parse({ id: "0" })).toThrow();
    });

    it("負の値はエラーになる", () => {
      expect(() => ReportIdParamSchema.parse({ id: "-5" })).toThrow();
    });

    it("数値に変換できない文字列はエラーになる", () => {
      expect(() => ReportIdParamSchema.parse({ id: "invalid" })).toThrow();
    });
  });
});
