import { render, screen } from "@testing-library/react";

import Footer from "@/components/Footer";

describe("Footer", () => {
  test("画像クレジットリンクが表示される", () => {
    render(<Footer />);

    expect(screen.getByRole("link", { name: "画像クレジット" })).toHaveAttribute(
      "href",
      "/credits"
    );
  });
});
