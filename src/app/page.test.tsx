import { render, screen } from "@/test/test-utils";

import Home from "./page";

describe("Home", () => {
  it("タイトルが表示される", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: "営業日報システム" })
    ).toBeInTheDocument();
  });
});
