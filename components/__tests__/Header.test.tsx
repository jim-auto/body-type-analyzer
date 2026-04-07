import { render, screen } from "@testing-library/react";
import Header from "@/components/Header";

describe("Header", () => {
  test("ロゴリンクが表示されること", () => {
    render(<Header />);
    expect(screen.getByText("体型バランスAI診断")).toBeInTheDocument();
  });

  test("ランキングリンクが存在すること", () => {
    render(<Header />);
    expect(screen.getByText("ランキング")).toBeInTheDocument();
  });

  test("ロゴリンク先が/であること", () => {
    render(<Header />);
    const logoLink = screen.getByText("体型バランスAI診断").closest("a");
    expect(logoLink).toHaveAttribute("href", "/");
  });

  test("ランキングリンク先が/rankingであること", () => {
    render(<Header />);
    const rankingLink = screen.getByText("ランキング").closest("a");
    expect(rankingLink).toHaveAttribute("href", "/ranking");
  });
});
