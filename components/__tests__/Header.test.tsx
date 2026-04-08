import { render, screen } from "@testing-library/react";
import Header from "@/components/Header";

describe("Header", () => {
  test("ロゴテキストが '芸能人スタイルランキング' であること", () => {
    render(<Header />);
    expect(screen.getByText("芸能人スタイルランキング")).toBeInTheDocument();
  });

  test("ロゴがトップページへのリンクであること", () => {
    render(<Header />);
    const logoLink = screen.getByText("芸能人スタイルランキング").closest("a");
    expect(logoLink).toHaveAttribute("href", "/");
  });

  test("ランキングリンクが存在しないこと", () => {
    render(<Header />);
    expect(screen.queryByText("ランキング")).not.toBeInTheDocument();
  });
});
