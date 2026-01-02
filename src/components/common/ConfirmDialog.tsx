"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ConfirmDialogVariant = "default" | "destructive" | "warning";

export interface ConfirmDialogProps {
  /** ダイアログの開閉状態 */
  open: boolean;
  /** ダイアログを閉じるコールバック */
  onOpenChange: (open: boolean) => void;
  /** ダイアログのタイトル */
  title: string;
  /** ダイアログの説明文 */
  description: string;
  /** 確認ボタンのテキスト */
  confirmLabel?: string;
  /** キャンセルボタンのテキスト */
  cancelLabel?: string;
  /** 確認ボタンクリック時のコールバック */
  onConfirm: () => void | Promise<void>;
  /** キャンセルボタンクリック時のコールバック */
  onCancel?: () => void;
  /** ダイアログの種類（default: 通常, destructive: 削除, warning: 警告） */
  variant?: ConfirmDialogVariant;
  /** 確認処理中かどうか */
  isLoading?: boolean;
}

/**
 * 確認ダイアログコンポーネント
 *
 * 削除確認や画面遷移確認など、ユーザーに確認を求める際に使用します。
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <ConfirmDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="削除の確認"
 *   description="このデータを削除してもよろしいですか？この操作は取り消せません。"
 *   confirmLabel="削除する"
 *   variant="destructive"
 *   onConfirm={handleDelete}
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "確認",
  cancelLabel = "キャンセル",
  onConfirm,
  onCancel,
  variant = "default",
  isLoading = false,
}: ConfirmDialogProps) {
  const [isPending, setIsPending] = React.useState(false);

  const handleConfirm = async () => {
    setIsPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsPending(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  const isProcessing = isLoading || isPending;

  // variant に応じたボタンスタイル
  const confirmButtonVariant =
    variant === "destructive" ? "destructive" : "default";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => {
          // 処理中は外側クリックでの閉じを防止
          if (isProcessing) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // 処理中はEscキーでの閉じを防止
          if (isProcessing) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isProcessing}
            >
              {cancelLabel}
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant={confirmButtonVariant}
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? "処理中..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 未保存データの確認ダイアログ用のカスタムフック
 *
 * @example
 * ```tsx
 * const { showUnsavedDialog, confirmNavigation, UnsavedDialog } = useUnsavedChangesDialog();
 *
 * const handleNavigation = async (path: string) => {
 *   if (hasUnsavedChanges) {
 *     const confirmed = await confirmNavigation();
 *     if (!confirmed) return;
 *   }
 *   router.push(path);
 * };
 *
 * return (
 *   <>
 *     <button onClick={() => handleNavigation('/other')}>Move</button>
 *     <UnsavedDialog />
 *   </>
 * );
 * ```
 */
export function useUnsavedChangesDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const resolverRef = React.useRef<((value: boolean) => void) | null>(null);

  const confirmNavigation = React.useCallback((): Promise<boolean> => {
    setIsOpen(true);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleConfirm = React.useCallback(() => {
    resolverRef.current?.(true);
    resolverRef.current = null;
    setIsOpen(false);
  }, []);

  const handleCancel = React.useCallback(() => {
    resolverRef.current?.(false);
    resolverRef.current = null;
    setIsOpen(false);
  }, []);

  const UnsavedDialog = React.useCallback(
    () => (
      <ConfirmDialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancel();
          }
        }}
        title="保存されていない変更があります"
        description="このページを離れると、入力した内容が失われます。本当にこのページを離れますか？"
        confirmLabel="このページを離れる"
        cancelLabel="このページに留まる"
        variant="warning"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    ),
    [isOpen, handleConfirm, handleCancel]
  );

  return {
    showUnsavedDialog: isOpen,
    confirmNavigation,
    UnsavedDialog,
  };
}
