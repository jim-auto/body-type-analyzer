import { render, screen } from "@testing-library/react";
import ShareButtons from "../ShareButtons";
import type { AnalysisResult } from "@/lib/analyzer";
import { generateXShareUrl } from "@/lib/share";

const mockResult: AnalysisResult = {
  silhouetteType: "X",
  upperBodyBalance: "標準",
  deviationScore: 55,
  aiConfidence: 30,
  atmosphere: "balanced",
  cupSize: "C",
  percentile: 45,
};

describe("ShareButtons", () => {
  it("コピーボタンが表示されること", () => {
    render(<ShareButtons result={mockResult} />);
    expect(screen.getByTestId("copy-button")).toBeInTheDocument();
    expect(screen.getByText("結果をコピー")).toBeInTheDocument();
  });

  it("Xシェアボタンが表示されること", () => {
    render(<ShareButtons result={mockResult} />);
    expect(screen.getByTestId("x-share-link")).toBeInTheDocument();
    expect(screen.getByText("Xでシェア")).toBeInTheDocument();
  });

  it("Xシェアリンクのhrefが正しいこと", () => {
    render(<ShareButtons result={mockResult} />);
    const link = screen.getByTestId("x-share-link");
    expect(link).toHaveAttribute("href", generateXShareUrl(mockResult));
  });

  it("Xシェアリンクがtarget='_blank'であること", () => {
    render(<ShareButtons result={mockResult} />);
    const link = screen.getByTestId("x-share-link");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("Xシェアリンクがrel='noopener noreferrer'であること", () => {
    render(<ShareButtons result={mockResult} />);
    const link = screen.getByTestId("x-share-link");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
