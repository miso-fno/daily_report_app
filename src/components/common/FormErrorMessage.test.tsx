import { describe, it, expect, vi } from "vitest";

import { render, screen } from "@/test/test-utils";

import {
  FormSummaryError,
  FieldError,
  FormFieldWrapper,
  getErrorInputClassName,
} from "./FormErrorMessage";

describe("FormSummaryError", () => {
  describe("rendering", () => {
    it("should not render when errors array is empty", () => {
      render(<FormSummaryError errors={[]} />);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("should render when there are errors", () => {
      const errors = [{ message: "エラーが発生しました" }];
      render(<FormSummaryError errors={errors} />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("should render default title", () => {
      const errors = [{ message: "エラーが発生しました" }];
      render(<FormSummaryError errors={errors} />);

      expect(
        screen.getByText("入力内容にエラーがあります")
      ).toBeInTheDocument();
    });

    it("should render custom title", () => {
      const errors = [{ message: "エラーが発生しました" }];
      render(<FormSummaryError errors={errors} title="バリデーションエラー" />);

      expect(screen.getByText("バリデーションエラー")).toBeInTheDocument();
    });

    it("should render all error messages", () => {
      const errors = [
        { field: "email", message: "メールアドレスは必須です" },
        { field: "password", message: "パスワードは8文字以上必要です" },
        { message: "入力内容を確認してください" },
      ];
      render(<FormSummaryError errors={errors} />);

      expect(screen.getByText(/メールアドレスは必須です/)).toBeInTheDocument();
      expect(
        screen.getByText(/パスワードは8文字以上必要です/)
      ).toBeInTheDocument();
      expect(
        screen.getByText("入力内容を確認してください")
      ).toBeInTheDocument();
    });

    it("should render field name with error message when field is provided", () => {
      const errors = [{ field: "email", message: "メールアドレスは必須です" }];
      render(<FormSummaryError errors={errors} />);

      expect(screen.getByText("email:")).toBeInTheDocument();
    });

    it("should not render field name when field is not provided", () => {
      const errors = [{ message: "一般的なエラー" }];
      render(<FormSummaryError errors={errors} />);

      expect(screen.queryByText(/:/)).not.toBeInTheDocument();
    });
  });

  describe("dismissible", () => {
    it("should not show dismiss button by default", () => {
      const errors = [{ message: "エラー" }];
      render(<FormSummaryError errors={errors} />);

      expect(
        screen.queryByRole("button", { name: "閉じる" })
      ).not.toBeInTheDocument();
    });

    it("should show dismiss button when dismissible is true", () => {
      const errors = [{ message: "エラー" }];
      render(<FormSummaryError errors={errors} dismissible={true} />);

      expect(
        screen.getByRole("button", { name: "閉じる" })
      ).toBeInTheDocument();
    });

    it("should call onDismiss when dismiss button is clicked", async () => {
      const errors = [{ message: "エラー" }];
      const onDismiss = vi.fn();
      const { user } = render(
        <FormSummaryError
          errors={errors}
          dismissible={true}
          onDismiss={onDismiss}
        />
      );

      await user.click(screen.getByRole("button", { name: "閉じる" }));

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe("accessibility", () => {
    it("should have role alert", () => {
      const errors = [{ message: "エラー" }];
      render(<FormSummaryError errors={errors} />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    it("should have aria-live assertive", () => {
      const errors = [{ message: "エラー" }];
      render(<FormSummaryError errors={errors} />);

      expect(screen.getByRole("alert")).toHaveAttribute(
        "aria-live",
        "assertive"
      );
    });
  });
});

describe("FieldError", () => {
  describe("rendering", () => {
    it("should not render when message is undefined", () => {
      const { container } = render(<FieldError />);

      expect(container.firstChild).toBeNull();
    });

    it("should not render when message is empty string", () => {
      const { container } = render(<FieldError message="" />);

      expect(container.firstChild).toBeNull();
    });

    it("should render error message", () => {
      render(<FieldError message="このフィールドは必須です" />);

      expect(screen.getByText("このフィールドは必須です")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(<FieldError message="エラー" className="custom-class" />);

      expect(screen.getByText("エラー")).toHaveClass("custom-class");
    });

    it("should apply id for aria-describedby", () => {
      render(<FieldError message="エラー" id="email-error" />);

      expect(screen.getByText("エラー")).toHaveAttribute("id", "email-error");
    });
  });

  describe("accessibility", () => {
    it("should have role alert", () => {
      render(<FieldError message="エラー" />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});

describe("FormFieldWrapper", () => {
  describe("rendering", () => {
    it("should render label with htmlFor", () => {
      render(
        <FormFieldWrapper label="メールアドレス" htmlFor="email">
          <input id="email" type="email" />
        </FormFieldWrapper>
      );

      const label = screen.getByText("メールアドレス");
      expect(label).toHaveAttribute("for", "email");
    });

    it("should render children", () => {
      render(
        <FormFieldWrapper label="名前" htmlFor="name">
          <input id="name" type="text" placeholder="名前を入力" />
        </FormFieldWrapper>
      );

      expect(screen.getByPlaceholderText("名前を入力")).toBeInTheDocument();
    });

    it("should show required indicator when required is true", () => {
      render(
        <FormFieldWrapper label="メール" htmlFor="email" required>
          <input id="email" />
        </FormFieldWrapper>
      );

      expect(screen.getByText("*")).toBeInTheDocument();
      expect(screen.getByText("（必須）")).toBeInTheDocument();
    });

    it("should not show required indicator when required is false", () => {
      render(
        <FormFieldWrapper label="メール" htmlFor="email">
          <input id="email" />
        </FormFieldWrapper>
      );

      expect(screen.queryByText("*")).not.toBeInTheDocument();
    });

    it("should show help text when provided", () => {
      render(
        <FormFieldWrapper
          label="パスワード"
          htmlFor="password"
          helpText="8文字以上"
        >
          <input id="password" type="password" />
        </FormFieldWrapper>
      );

      expect(screen.getByText("8文字以上")).toBeInTheDocument();
    });

    it("should not show help text when there is an error", () => {
      render(
        <FormFieldWrapper
          label="パスワード"
          htmlFor="password"
          helpText="8文字以上"
          error="パスワードが短すぎます"
        >
          <input id="password" type="password" />
        </FormFieldWrapper>
      );

      expect(screen.queryByText("8文字以上")).not.toBeInTheDocument();
      expect(screen.getByText("パスワードが短すぎます")).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("should show error message when error is provided", () => {
      render(
        <FormFieldWrapper
          label="Email"
          htmlFor="email"
          error="無効なメールアドレスです"
        >
          <input id="email" type="email" />
        </FormFieldWrapper>
      );

      expect(screen.getByText("無効なメールアドレスです")).toBeInTheDocument();
    });

    it("should add error styling to input when error is provided", () => {
      render(
        <FormFieldWrapper label="Email" htmlFor="email" error="エラー">
          <input id="email" type="email" className="base-class" />
        </FormFieldWrapper>
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("border-destructive");
    });

    it("should set aria-invalid on input when error is provided", () => {
      render(
        <FormFieldWrapper label="Email" htmlFor="email" error="エラー">
          <input id="email" type="email" />
        </FormFieldWrapper>
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("should set aria-describedby on input pointing to error", () => {
      render(
        <FormFieldWrapper label="Email" htmlFor="email" error="エラー">
          <input id="email" type="email" />
        </FormFieldWrapper>
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-describedby", "email-error");
    });
  });

  describe("accessibility", () => {
    it("should set aria-describedby pointing to help text when no error", () => {
      render(
        <FormFieldWrapper
          label="パスワード"
          htmlFor="password"
          helpText="ヘルプ"
        >
          <input id="password" type="text" />
        </FormFieldWrapper>
      );

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-describedby", "password-help");
    });

    it("should set aria-describedby to error only when there is an error", () => {
      render(
        <FormFieldWrapper
          label="パスワード"
          htmlFor="password"
          helpText="8文字以上"
          error="パスワードが短すぎます"
        >
          <input id="password" type="text" />
        </FormFieldWrapper>
      );

      // When there's an error, help text is hidden, so only error should be in describedby
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-describedby", "password-error");
    });

    it("should have sr-only text for required fields", () => {
      render(
        <FormFieldWrapper label="Email" htmlFor="email" required>
          <input id="email" type="email" />
        </FormFieldWrapper>
      );

      expect(screen.getByText("（必須）")).toHaveClass("sr-only");
    });
  });
});

describe("getErrorInputClassName", () => {
  it("should return error classes when hasError is true", () => {
    const className = getErrorInputClassName(true);

    expect(className).toBe("border-destructive focus-visible:ring-destructive");
  });

  it("should return empty string when hasError is false", () => {
    const className = getErrorInputClassName(false);

    expect(className).toBe("");
  });
});
