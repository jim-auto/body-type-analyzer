import { render, screen } from "@testing-library/react";
import SimilarCelebrities from "@/components/SimilarCelebrities";

const mockCelebs = [
  { name: "Taylor Swift", similarity: 95 },
  { name: "Beyoncé", similarity: 88 },
  { name: "Rihanna", similarity: 82 },
];

describe("SimilarCelebrities", () => {
  test("見出しが表示されること", () => {
    render(<SimilarCelebrities celebrities={mockCelebs} />);
    expect(
      screen.getByText("あなたに近い体型バランスの有名人")
    ).toBeInTheDocument();
  });

  test("全有名人の名前が表示されること", () => {
    render(<SimilarCelebrities celebrities={mockCelebs} />);
    expect(screen.getByText("Taylor Swift")).toBeInTheDocument();
    expect(screen.getByText("Beyoncé")).toBeInTheDocument();
    expect(screen.getByText("Rihanna")).toBeInTheDocument();
  });

  test("類似度が%付きで表示されること", () => {
    render(<SimilarCelebrities celebrities={mockCelebs} />);
    expect(screen.getByText("95%")).toBeInTheDocument();
    expect(screen.getByText("88%")).toBeInTheDocument();
    expect(screen.getByText("82%")).toBeInTheDocument();
  });

  test("空配列の場合、コンポーネントが何も表示しないこと", () => {
    const { container } = render(<SimilarCelebrities celebrities={[]} />);
    expect(container.innerHTML).toBe("");
  });

  test("1人だけの場合でも正しく表示されること", () => {
    render(
      <SimilarCelebrities celebrities={[{ name: "Solo", similarity: 90 }]} />
    );
    expect(screen.getByText("Solo")).toBeInTheDocument();
    expect(screen.getByText("90%")).toBeInTheDocument();
  });
});
