import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

// プロバイダーのラッパー（必要に応じて拡張）
function AllProviders({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// カスタムrender関数
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: AllProviders, ...options }),
  };
}

// re-export everything
export * from "@testing-library/react";

// override render method
export { customRender as render };
