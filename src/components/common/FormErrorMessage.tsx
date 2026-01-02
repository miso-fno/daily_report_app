"use client";

import { AlertCircle, XCircle } from "lucide-react";
import * as React from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export interface FormError {
  /** エラーが発生したフィールド名 */
  field?: string;
  /** エラーメッセージ */
  message: string;
}

export interface FormSummaryErrorProps {
  /** エラーのリスト */
  errors: FormError[];
  /** タイトル */
  title?: string;
  /** 追加のクラス名 */
  className?: string;
  /** 閉じるボタンを表示するか */
  dismissible?: boolean;
  /** 閉じるボタンクリック時のコールバック */
  onDismiss?: () => void;
}

/**
 * フォームサマリーエラー（画面上部に表示）
 *
 * フォーム送信時のバリデーションエラーを一覧表示します。
 *
 * @example
 * ```tsx
 * const errors = [
 *   { field: "email", message: "メールアドレスの形式が正しくありません" },
 *   { field: "password", message: "パスワードは8文字以上必要です" },
 * ];
 *
 * <FormSummaryError
 *   errors={errors}
 *   title="入力内容にエラーがあります"
 * />
 * ```
 */
export function FormSummaryError({
  errors,
  title = "入力内容にエラーがあります",
  className,
  dismissible = false,
  onDismiss,
}: FormSummaryErrorProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <Alert
      variant="destructive"
      className={cn("relative", className)}
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {errors.map((error, index) => (
            <li key={`${error.field ?? "error"}-${index}`}>
              {error.field && (
                <span className="font-medium">{error.field}: </span>
              )}
              {error.message}
            </li>
          ))}
        </ul>
      </AlertDescription>
      {dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-3 top-3 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="閉じる"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </Alert>
  );
}

export interface FieldErrorProps {
  /** エラーメッセージ */
  message?: string;
  /** 追加のクラス名 */
  className?: string;
  /** エラーのID（aria-describedby用） */
  id?: string;
}

/**
 * フィールドエラー（入力項目下に表示）
 *
 * 個別の入力フィールドのエラーメッセージを表示します。
 *
 * @example
 * ```tsx
 * <div>
 *   <Label htmlFor="email">メールアドレス</Label>
 *   <Input
 *     id="email"
 *     aria-invalid={!!errors.email}
 *     aria-describedby="email-error"
 *     className={errors.email ? "border-destructive" : ""}
 *   />
 *   <FieldError id="email-error" message={errors.email} />
 * </div>
 * ```
 */
export function FieldError({ message, className, id }: FieldErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p
      id={id}
      className={cn("mt-1 text-sm text-destructive", className)}
      role="alert"
    >
      {message}
    </p>
  );
}

export interface FormFieldWrapperProps {
  /** ラベル */
  label: string;
  /** フィールドID */
  htmlFor: string;
  /** エラーメッセージ */
  error?: string;
  /** 必須フィールドかどうか */
  required?: boolean;
  /** ヘルプテキスト */
  helpText?: string;
  /** 追加のクラス名 */
  className?: string;
  /** 子要素（入力フィールド） */
  children: React.ReactNode;
}

/**
 * フォームフィールドラッパー
 *
 * ラベル、入力フィールド、エラーメッセージ、ヘルプテキストをまとめて扱うラッパーコンポーネント。
 * エラー時には入力フィールドに赤枠が適用されます。
 *
 * @example
 * ```tsx
 * <FormFieldWrapper
 *   label="メールアドレス"
 *   htmlFor="email"
 *   error={errors.email}
 *   required
 * >
 *   <Input id="email" type="email" {...register("email")} />
 * </FormFieldWrapper>
 * ```
 */
export function FormFieldWrapper({
  label,
  htmlFor,
  error,
  required = false,
  helpText,
  className,
  children,
}: FormFieldWrapperProps) {
  const errorId = `${htmlFor}-error`;
  const helpId = `${htmlFor}-help`;
  const hasError = !!error;

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && (
          <span className="ml-1 text-destructive" aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="sr-only">（必須）</span>}
      </label>

      {/* 子要素に適切なaria属性を追加 */}
      {React.isValidElement<React.HTMLAttributes<HTMLElement>>(children)
        ? React.cloneElement(children, {
            "aria-invalid": hasError ? true : undefined,
            "aria-describedby":
              [
                hasError ? errorId : null,
                // エラーがない場合のみヘルプテキストを参照
                !hasError && helpText ? helpId : null,
              ]
                .filter(Boolean)
                .join(" ") || undefined,
            className: cn(
              children.props.className,
              hasError && "border-destructive focus-visible:ring-destructive"
            ),
          })
        : children}

      {helpText && !hasError && (
        <p id={helpId} className="text-sm text-muted-foreground">
          {helpText}
        </p>
      )}

      {error && <FieldError id={errorId} message={error} />}
    </div>
  );
}

/**
 * 入力フィールドにエラー状態のスタイルを適用するユーティリティ
 *
 * @example
 * ```tsx
 * <Input className={getErrorInputClassName(!!errors.email)} />
 * ```
 */
export function getErrorInputClassName(hasError: boolean): string {
  return hasError ? "border-destructive focus-visible:ring-destructive" : "";
}
