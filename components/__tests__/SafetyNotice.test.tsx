import { render, screen } from "@testing-library/react";
import SafetyNotice from "../SafetyNotice";

describe("SafetyNotice", () => {
  it("「本人の画像のみ」が表示されること", () => {
    render(<SafetyNotice />);
    expect(screen.getByText(/本人の画像のみ/)).toBeInTheDocument();
  });

  it("「エンタメ目的」が表示されること", () => {
    render(<SafetyNotice />);
    expect(screen.getByText(/エンタメ目的/)).toBeInTheDocument();
  });

  it("医学的根拠がないことが表示されること", () => {
    render(<SafetyNotice />);
    expect(screen.getByText(/医学的根拠はありません/)).toBeInTheDocument();
  });
});
