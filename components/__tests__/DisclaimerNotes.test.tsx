import { render, screen } from "@testing-library/react";
import DisclaimerNotes from "../DisclaimerNotes";

describe("DisclaimerNotes", () => {
  it("3つの免責文言が全て表示されること", () => {
    render(<DisclaimerNotes />);
    expect(screen.getByText(/このAIは雰囲気で動いています/)).toBeInTheDocument();
    expect(screen.getByText(/偏差値はAIの気分で算出されています/)).toBeInTheDocument();
    expect(screen.getByText(/医学的・科学的根拠は一切ありません/)).toBeInTheDocument();
  });

  it("「雰囲気で動いています」が含まれること", () => {
    render(<DisclaimerNotes />);
    expect(screen.getByText(/雰囲気で動いています/)).toBeInTheDocument();
  });

  it("「科学的根拠は一切ありません」が含まれること", () => {
    render(<DisclaimerNotes />);
    expect(screen.getByText(/科学的根拠は一切ありません/)).toBeInTheDocument();
  });
});
