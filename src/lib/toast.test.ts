import { toast } from "sonner";
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showPromiseToast,
  dismissAllToasts,
  dismissToast,
  showApiResultToast,
} from "./toast";

// sonner の toast 関数をモック
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    promise: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

describe("Toast utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("showSuccessToast", () => {
    it("should call toast.success with message and default duration", () => {
      showSuccessToast("保存しました");

      expect(toast.success).toHaveBeenCalledWith("保存しました", {
        duration: 5000,
        description: undefined,
        action: undefined,
      });
    });

    it("should call toast.success with custom duration", () => {
      showSuccessToast("保存しました", { duration: 3000 });

      expect(toast.success).toHaveBeenCalledWith("保存しました", {
        duration: 3000,
        description: undefined,
        action: undefined,
      });
    });

    it("should call toast.success with description", () => {
      showSuccessToast("保存しました", {
        description: "データが正常に保存されました",
      });

      expect(toast.success).toHaveBeenCalledWith("保存しました", {
        duration: 5000,
        description: "データが正常に保存されました",
        action: undefined,
      });
    });

    it("should call toast.success with action", () => {
      const onClick = vi.fn();
      showSuccessToast("保存しました", {
        action: { label: "元に戻す", onClick },
      });

      expect(toast.success).toHaveBeenCalledWith("保存しました", {
        duration: 5000,
        description: undefined,
        action: { label: "元に戻す", onClick },
      });
    });
  });

  describe("showErrorToast", () => {
    it("should call toast.error with message and default duration", () => {
      showErrorToast("エラーが発生しました");

      expect(toast.error).toHaveBeenCalledWith("エラーが発生しました", {
        duration: 5000,
        description: undefined,
        action: undefined,
      });
    });

    it("should call toast.error with description", () => {
      showErrorToast("保存に失敗しました", {
        description: "ネットワークエラー",
      });

      expect(toast.error).toHaveBeenCalledWith("保存に失敗しました", {
        duration: 5000,
        description: "ネットワークエラー",
        action: undefined,
      });
    });
  });

  describe("showWarningToast", () => {
    it("should call toast.warning with message and default duration", () => {
      showWarningToast("入力内容を確認してください");

      expect(toast.warning).toHaveBeenCalledWith("入力内容を確認してください", {
        duration: 5000,
        description: undefined,
        action: undefined,
      });
    });
  });

  describe("showInfoToast", () => {
    it("should call toast.info with message and default duration", () => {
      showInfoToast("新しいデータがあります");

      expect(toast.info).toHaveBeenCalledWith("新しいデータがあります", {
        duration: 5000,
        description: undefined,
        action: undefined,
      });
    });
  });

  describe("showPromiseToast", () => {
    it("should call toast.promise with promise and messages", async () => {
      const promise = Promise.resolve({ name: "テスト" });

      showPromiseToast(promise, {
        loading: "保存中...",
        success: "保存しました",
        error: "保存に失敗しました",
      });

      expect(toast.promise).toHaveBeenCalledWith(promise, {
        loading: "保存中...",
        success: "保存しました",
        error: "保存に失敗しました",
      });
    });

    it("should support callback functions for success and error messages", async () => {
      const promise = Promise.resolve({ name: "テスト" });
      const successFn = (data: { name: string }) =>
        `${data.name}を保存しました`;
      const errorFn = (err: Error) => `エラー: ${err.message}`;

      showPromiseToast(promise, {
        loading: "保存中...",
        success: successFn,
        error: errorFn,
      });

      expect(toast.promise).toHaveBeenCalledWith(promise, {
        loading: "保存中...",
        success: successFn,
        error: errorFn,
      });
    });
  });

  describe("dismissAllToasts", () => {
    it("should call toast.dismiss without arguments", () => {
      dismissAllToasts();

      expect(toast.dismiss).toHaveBeenCalledWith();
    });
  });

  describe("dismissToast", () => {
    it("should call toast.dismiss with string toastId", () => {
      dismissToast("toast-123");

      expect(toast.dismiss).toHaveBeenCalledWith("toast-123");
    });

    it("should call toast.dismiss with number toastId", () => {
      dismissToast(456);

      expect(toast.dismiss).toHaveBeenCalledWith(456);
    });
  });

  describe("showApiResultToast", () => {
    it("should show success toast when result.success is true", () => {
      const result = { success: true, message: "処理完了" };

      showApiResultToast(result);

      expect(toast.success).toHaveBeenCalledWith(
        "処理完了",
        expect.any(Object)
      );
    });

    it("should show custom success message when provided", () => {
      const result = { success: true, message: "API成功" };

      showApiResultToast(result, { successMessage: "カスタム成功メッセージ" });

      expect(toast.success).toHaveBeenCalledWith(
        "カスタム成功メッセージ",
        expect.any(Object)
      );
    });

    it("should show default success message when no message in result", () => {
      const result = { success: true };

      showApiResultToast(result);

      expect(toast.success).toHaveBeenCalledWith(
        "処理が完了しました",
        expect.any(Object)
      );
    });

    it("should show error toast when result.success is false", () => {
      const result = { success: false, error: { message: "サーバーエラー" } };

      showApiResultToast(result);

      expect(toast.error).toHaveBeenCalledWith(
        "サーバーエラー",
        expect.any(Object)
      );
    });

    it("should show custom error message when provided", () => {
      const result = { success: false, error: { message: "サーバーエラー" } };

      showApiResultToast(result, { errorMessage: "カスタムエラーメッセージ" });

      expect(toast.error).toHaveBeenCalledWith(
        "カスタムエラーメッセージ",
        expect.any(Object)
      );
    });

    it("should show message from result when error object is missing", () => {
      const result = { success: false, message: "失敗しました" };

      showApiResultToast(result);

      expect(toast.error).toHaveBeenCalledWith(
        "失敗しました",
        expect.any(Object)
      );
    });

    it("should show default error message when no error info in result", () => {
      const result = { success: false };

      showApiResultToast(result);

      expect(toast.error).toHaveBeenCalledWith(
        "エラーが発生しました",
        expect.any(Object)
      );
    });
  });
});
