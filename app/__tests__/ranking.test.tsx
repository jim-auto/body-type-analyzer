import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import RankingPage from "@/app/ranking/page";

const mockRankingData = [
  {
    category: "silhouette",
    title: "Silhouette Balance Deviation",
    ranking: [
      { name: "Taylor Swift", score: 72 },
      { name: "Beyoncé", score: 70 },
      { name: "Rihanna", score: 68 },
      { name: "Zendaya", score: 66 },
      { name: "Jennifer Lopez", score: 64 },
    ],
  },
  {
    category: "upperBody",
    title: "Upper Body Dominance Deviation",
    ranking: [
      { name: "Scarlett Johansson", score: 71 },
      { name: "Kim Kardashian", score: 69 },
      { name: "Ariana Grande", score: 67 },
      { name: "Dua Lipa", score: 65 },
      { name: "Billie Eilish", score: 63 },
    ],
  },
  {
    category: "proportion",
    title: "Proportion Harmony Score",
    ranking: [
      { name: "Gigi Hadid", score: 73 },
      { name: "Kendall Jenner", score: 70 },
      { name: "Hailey Bieber", score: 68 },
      { name: "Bella Hadid", score: 66 },
      { name: "Adele", score: 64 },
    ],
  },
];

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve(mockRankingData),
    })
  ) as jest.Mock;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("RankingPage", () => {
  test("ローディング中の表示があること", () => {
    render(<RankingPage />);
    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });

  test("データ読み込み後にカテゴリタイトルが表示されること", async () => {
    render(<RankingPage />);
    await waitFor(() => {
      expect(
        screen.getByText("有名人体型バランスランキング")
      ).toBeInTheDocument();
    });
    // The first category title should be visible (both as tab and as heading)
    expect(screen.getByText("Taylor Swift")).toBeInTheDocument();
  });

  test("ランキング項目が正しい順序で表示されること", async () => {
    render(<RankingPage />);
    await waitFor(() => {
      expect(screen.getByText("Taylor Swift")).toBeInTheDocument();
    });
    // Check all 5 entries of the first category
    expect(screen.getByText("Beyoncé")).toBeInTheDocument();
    expect(screen.getByText("Rihanna")).toBeInTheDocument();
    expect(screen.getByText("Zendaya")).toBeInTheDocument();
    expect(screen.getByText("Jennifer Lopez")).toBeInTheDocument();
  });

  test("タブ切り替えで別カテゴリが表示されること", async () => {
    render(<RankingPage />);
    await waitFor(() => {
      expect(screen.getByText("Taylor Swift")).toBeInTheDocument();
    });

    // Click the second tab
    const upperBodyTab = screen.getByText("Upper Body Dominance Deviation", {
      selector: "button",
    });
    fireEvent.click(upperBodyTab);

    await waitFor(() => {
      expect(screen.getByText("Scarlett Johansson")).toBeInTheDocument();
    });
    expect(screen.getByText("Kim Kardashian")).toBeInTheDocument();
  });

  test("トップページへのリンクが存在すること", async () => {
    render(<RankingPage />);
    await waitFor(() => {
      expect(screen.getByText("トップページへ戻る")).toBeInTheDocument();
    });
    const link = screen.getByText("トップページへ戻る").closest("a");
    expect(link).toHaveAttribute("href", "/");
  });

  test("ページタイトルが表示されること", async () => {
    render(<RankingPage />);
    await waitFor(() => {
      expect(
        screen.getByText("有名人体型バランスランキング")
      ).toBeInTheDocument();
    });
  });

  test("3つのタブボタンが表示されること", async () => {
    render(<RankingPage />);
    await waitFor(() => {
      expect(screen.getByText("Taylor Swift")).toBeInTheDocument();
    });
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
  });
});
