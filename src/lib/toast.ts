import { toast } from "sonner";

/** Toast通知の自動消去時間（ミリ秒） */
const DEFAULT_DURATION = 5000;

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  /** 表示時間（ミリ秒）。デフォルトは5000ms */
  duration?: number;
  /** 説明文 */
  description?: string;
  /** アクションボタン */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * 成功メッセージを表示
 *
 * @example
 * ```ts
 * showSuccessToast("保存しました");
 * showSuccessToast("登録完了", { description: "データが正常に登録されました" });
 * ```
 */
export function showSuccessToast(message: string, options?: ToastOptions) {
  toast.success(message, {
    duration: options?.duration ?? DEFAULT_DURATION,
    description: options?.description,
    action: options?.action
      ? {
          label: options.action.label,
          onClick: options.action.onClick,
        }
      : undefined,
  });
}

/**
 * エラーメッセージを表示
 *
 * @example
 * ```ts
 * showErrorToast("エラーが発生しました");
 * showErrorToast("保存に失敗しました", { description: "ネットワークエラー" });
 * ```
 */
export function showErrorToast(message: string, options?: ToastOptions) {
  toast.error(message, {
    duration: options?.duration ?? DEFAULT_DURATION,
    description: options?.description,
    action: options?.action
      ? {
          label: options.action.label,
          onClick: options.action.onClick,
        }
      : undefined,
  });
}

/**
 * 警告メッセージを表示
 *
 * @example
 * ```ts
 * showWarningToast("入力内容を確認してください");
 * ```
 */
export function showWarningToast(message: string, options?: ToastOptions) {
  toast.warning(message, {
    duration: options?.duration ?? DEFAULT_DURATION,
    description: options?.description,
    action: options?.action
      ? {
          label: options.action.label,
          onClick: options.action.onClick,
        }
      : undefined,
  });
}

/**
 * 情報メッセージを表示
 *
 * @example
 * ```ts
 * showInfoToast("新しいデータがあります");
 * ```
 */
export function showInfoToast(message: string, options?: ToastOptions) {
  toast.info(message, {
    duration: options?.duration ?? DEFAULT_DURATION,
    description: options?.description,
    action: options?.action
      ? {
          label: options.action.label,
          onClick: options.action.onClick,
        }
      : undefined,
  });
}

/**
 * Promise の結果に応じてToastを表示
 *
 * @example
 * ```ts
 * showPromiseToast(
 *   saveData(),
 *   {
 *     loading: "保存中...",
 *     success: "保存しました",
 *     error: "保存に失敗しました",
 *   }
 * );
 *
 * // コールバックで動的メッセージ
 * showPromiseToast(
 *   saveData(),
 *   {
 *     loading: "保存中...",
 *     success: (data) => `${data.name}を保存しました`,
 *     error: (err) => `エラー: ${err.message}`,
 *   }
 * );
 * ```
 */
export function showPromiseToast<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }
) {
  return toast.promise(promise, {
    loading: messages.loading,
    success: messages.success,
    error: messages.error,
  });
}

/**
 * 全てのToastを閉じる
 */
export function dismissAllToasts() {
  toast.dismiss();
}

/**
 * 特定のToastを閉じる
 */
export function dismissToast(toastId: string | number) {
  toast.dismiss(toastId);
}

/**
 * API レスポンスに基づいてToastを表示するユーティリティ
 *
 * @example
 * ```ts
 * const result = await fetchData();
 * showApiResultToast(result, {
 *   successMessage: "データを取得しました",
 *   errorMessage: "データの取得に失敗しました",
 * });
 * ```
 */
export function showApiResultToast<
  T extends {
    success: boolean;
    message?: string;
    error?: { message?: string };
  },
>(
  result: T,
  options: {
    successMessage?: string;
    errorMessage?: string;
  } = {}
) {
  if (result.success) {
    showSuccessToast(
      options.successMessage ?? result.message ?? "処理が完了しました"
    );
  } else {
    showErrorToast(
      options.errorMessage ??
        result.error?.message ??
        result.message ??
        "エラーが発生しました"
    );
  }
}
