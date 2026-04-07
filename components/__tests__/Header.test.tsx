import { render, screen } from "@testing-library/react";
import Header from "@/components/Header";

describe("Header", () => {
  test("ロゴテキストが 'Body Balance Ranking' であること", () => {
    render(<Header />);
    expect(screen.getByText("Body Balance Ranking")).toBeInTheDocument();
  });

  test("ロゴがトップページへのリンクであること", () => {
    render(<Header />);
    const logoLink = screen.getByText("Body Balance Ranking").closest("a");
    expect(logoLink).toHaveAttribute("href", "/");
  });

  test("ランキングリンクが存在しないこと", () => {
    render(<Header />);
    expect(screen.queryByText("ランキング")).not.toBeInTheDocument();
  });
});
