/**
 * コメントAPIスキーマのテスト
 */

import { describe, it, expect } from "vitest";

import {
  CreateCommentSchema,
  CommentIdParamSchema,
  ReportIdParamSchema,
} from "./comment";

describe("CreateCommentSchema", () => {
  describe("正常系", () => {
    it("有効なコメント内容をパースできる", () => {
      const input = {
        comment_text: "良い報告ですね。引き続きお願いします。",
      };

      const result = CreateCommentSchema.parse(input);

      expect(result.comment_text).toBe(
        "良い報告ですね。引き続きお願いします。"
      );
    });

    it("1文字のコメント（最小境界値）をパースできる", () => {
      const input = {
        comment_text: "あ",
      };

      const result = CreateCommentSchema.parse(input);

      expect(result.comment_text).toBe("あ");
      expect(result.comment_text.length).toBe(1);
    });

    it("500文字のコメント（最大境界値）をパースできる", () => {
      const input = {
        comment_text: "あ".repeat(500),
      };

      const result = CreateCommentSchema.parse(input);

      expect(result.comment_text.length).toBe(500);
    });

    it("英数字と記号を含むコメントをパースできる", () => {
      const input = {
        comment_text: "ABC123!@#$%^&*()_+-=[]{}|;':\",./<>?",
      };

      const result = CreateCommentSchema.parse(input);

      expect(result.comment_text).toBe(input.comment_text);
    });

    it("改行を含むコメントをパースできる", () => {
      const input = {
        comment_text: "1行目\n2行目\n3行目",
      };

      const result = CreateCommentSchema.parse(input);

      expect(result.comment_text).toBe("1行目\n2行目\n3行目");
    });

    it("スペースを含むコメントをパースできる", () => {
      const input = {
        comment_text: "  前後に  スペースを含む  コメント  ",
      };

      const result = CreateCommentSchema.parse(input);

      expect(result.comment_text).toBe("  前後に  スペースを含む  コメント  ");
    });
  });

  describe("異常系", () => {
    it("comment_textが未指定の場合はエラーになる", () => {
      const input = {};

      expect(() => CreateCommentSchema.parse(input)).toThrow();
    });

    it("comment_textが空文字の場合はエラーになる", () => {
      const input = {
        comment_text: "",
      };

      expect(() => CreateCommentSchema.parse(input)).toThrow();
    });

    it("comment_textが501文字の場合はエラーになる", () => {
      const input = {
        comment_text: "あ".repeat(501),
      };

      expect(() => CreateCommentSchema.parse(input)).toThrow();
    });

    it("comment_textが1000文字の場合はエラーになる", () => {
      const input = {
        comment_text: "あ".repeat(1000),
      };

      expect(() => CreateCommentSchema.parse(input)).toThrow();
    });

    it("comment_textがnullの場合はエラーになる", () => {
      const input = {
        comment_text: null,
      };

      expect(() => CreateCommentSchema.parse(input)).toThrow();
    });

    it("comment_textが数値の場合はエラーになる", () => {
      const input = {
        comment_text: 12345,
      };

      expect(() => CreateCommentSchema.parse(input)).toThrow();
    });

    it("comment_textが配列の場合はエラーになる", () => {
      const input = {
        comment_text: ["コメント"],
      };

      expect(() => CreateCommentSchema.parse(input)).toThrow();
    });

    it("comment_textがオブジェクトの場合はエラーになる", () => {
      const input = {
        comment_text: { text: "コメント" },
      };

      expect(() => CreateCommentSchema.parse(input)).toThrow();
    });
  });

  describe("エラーメッセージ", () => {
    it("空文字の場合は「コメント内容は必須です」というエラーメッセージが返る", () => {
      const input = {
        comment_text: "",
      };

      const result = CreateCommentSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0]?.message).toBe("コメント内容は必須です");
      }
    });

    it("501文字の場合は「コメント内容は500文字以内で入力してください」というエラーメッセージが返る", () => {
      const input = {
        comment_text: "あ".repeat(501),
      };

      const result = CreateCommentSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(1);
        expect(result.error.issues[0]?.message).toBe(
          "コメント内容は500文字以内で入力してください"
        );
      }
    });
  });
});

describe("CommentIdParamSchema", () => {
  describe("正常系", () => {
    it("文字列のIDをパースできる", () => {
      const result = CommentIdParamSchema.parse({ id: "1" });
      expect(result.id).toBe(1);
    });

    it("数値のIDをパースできる", () => {
      const result = CommentIdParamSchema.parse({ id: 5 });
      expect(result.id).toBe(5);
    });

    it("大きな数値のIDをパースできる", () => {
      const result = CommentIdParamSchema.parse({ id: "999999" });
      expect(result.id).toBe(999999);
    });

    it("1（最小有効値）をパースできる", () => {
      const result = CommentIdParamSchema.parse({ id: "1" });
      expect(result.id).toBe(1);
    });
  });

  describe("異常系", () => {
    it("0はエラーになる", () => {
      expect(() => CommentIdParamSchema.parse({ id: "0" })).toThrow();
    });

    it("負の値はエラーになる", () => {
      expect(() => CommentIdParamSchema.parse({ id: "-1" })).toThrow();
    });

    it("小数はエラーになる", () => {
      expect(() => CommentIdParamSchema.parse({ id: "1.5" })).toThrow();
    });

    it("数値に変換できない文字列はエラーになる", () => {
      expect(() => CommentIdParamSchema.parse({ id: "abc" })).toThrow();
    });

    it("idが未指定の場合はエラーになる", () => {
      expect(() => CommentIdParamSchema.parse({})).toThrow();
    });

    it("空文字はエラーになる", () => {
      expect(() => CommentIdParamSchema.parse({ id: "" })).toThrow();
    });

    it("nullはエラーになる", () => {
      expect(() => CommentIdParamSchema.parse({ id: null })).toThrow();
    });

    it("undefinedはエラーになる", () => {
      expect(() => CommentIdParamSchema.parse({ id: undefined })).toThrow();
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

    it("1（最小有効値）をパースできる", () => {
      const result = ReportIdParamSchema.parse({ id: "1" });
      expect(result.id).toBe(1);
    });

    it("大きな数値のIDをパースできる", () => {
      const result = ReportIdParamSchema.parse({ id: "1000000" });
      expect(result.id).toBe(1000000);
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

    it("小数はエラーになる", () => {
      expect(() => ReportIdParamSchema.parse({ id: "10.5" })).toThrow();
    });

    it("idが未指定の場合はエラーになる", () => {
      expect(() => ReportIdParamSchema.parse({})).toThrow();
    });
  });
});
