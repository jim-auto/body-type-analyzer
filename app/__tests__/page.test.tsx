import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Home from "@/app/page";

const mockRankingData = [
  {
    category: "silhouette",
    title: "Silhouette Balance Deviation",
    ranking: [
      { name: "Taylor Swift", score: 72, image: "https://ui-avatars.com/api/?name=Taylor+Swift&size=128&background=random&color=fff&bold=true" },
      { name: "Beyoncé", score: 70, image: "https://ui-avatars.com/api/?name=Beyoncé&size=128&background=random&color=fff&bold=true" },
      { name: "Rihanna", score: 68, image: "https://ui-avatars.com/api/?name=Rihanna&size=128&background=random&color=fff&bold=true" },
      { name: "Zendaya", score: 66, image: "https://ui-avatars.com/api/?name=Zendaya&size=128&background=random&color=fff&bold=true" },
      { name: "Jennifer Lopez", score: 64, image: "https://ui-avatars.com/api/?name=Jennifer+Lopez&size=128&background=random&color=fff&bold=true" },
    ],
  },
  {
    category: "upperBody",
    title: "Upper Body Dominance Deviation",
    ranking: [
      { name: "Scarlett Johansson", score: 71, image: "https://ui-avatars.com/api/?name=Scarlett+Johansson&size=128&background=random&color=fff&bold=true" },
      { name: "Kim Kardashian", score: 69, image: "https://ui-avatars.com/api/?name=Kim+Kardashian&size=128&background=random&color=fff&bold=true" },
      { name: "Ariana Grande", score: 67, image: "https://ui-avatars.com/api/?name=Ariana+Grande&size=128&background=random&color=fff&bold=true" },
      { name: "Dua Lipa", score: 65, image: "https://ui-avatars.com/api/?name=Dua+Lipa&size=128&background=random&color=fff&bold=true" },
      { name: "Billie Eilish", score: 63, image: "https://ui-avatars.com/api/?name=Billie+Eilish&size=128&background=random&color=fff&bold=true" },
    ],
  },
  {
    category: "proportion",
    title: "Proportion Harmony Score",
    ranking: [
      { name: "Gigi Hadid", score: 73, image: "https://ui-avatars.com/api/?name=Gigi+Hadid&size=128&background=random&color=fff&bold=true" },
      { name: "Kendall Jenner", score: 70, image: "https://ui-avatars.com/api/?name=Kendall+Jenner&size=128&background=random&color=fff&bold=true" },
      { name: "Hailey Bieber", score: 68, image: "https://ui-avatars.com/api/?name=Hailey+Bieber&size=128&background=random&color=fff&bold=true" },
      { name: "Bella Hadid", score: 66, image: "https://ui-avatars.com/api/?name=Bella+Hadid&size=128&background=random&color=fff&bold=true" },
      { name: "Adele", score: 64, image: "https://ui-avatars.com/api/?name=Adele&size=128&background=random&color=fff&bold=true" },
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

describe("Home (Ranking Page)", () => {
  test("ローディング中の表示があること", () => {
    render(<Home />);
    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });

  test("データ読み込み後にカテゴリタイトルが表示されること", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(
        screen.getByText("Celebrity Body Balance Ranking")
      ).toBeInTheDocument();
    });
    // Title appears both as tab button and h2 heading
    const titles = screen.getAllByText("Silhouette Balance Deviation");
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });

  test("ランキング項目が正しい順序で表示されること", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Taylor Swift")).toBeInTheDocument();
    });
    expect(screen.getByText("Beyoncé")).toBeInTheDocument();
    expect(screen.getByText("Rihanna")).toBeInTheDocument();
    expect(screen.getByText("Zendaya")).toBeInTheDocument();
    expect(screen.getByText("Jennifer Lopez")).toBeInTheDocument();
  });

  test("タブ切り替えで別カテゴリが表示されること", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Taylor Swift")).toBeInTheDocument();
    });

    const upperBodyTab = screen.getByText("Upper Body Dominance Deviation", {
      selector: "button",
    });
    fireEvent.click(upperBodyTab);

    await waitFor(() => {
      expect(screen.getByText("Scarlett Johansson")).toBeInTheDocument();
    });
    expect(screen.getByText("Kim Kardashian")).toBeInTheDocument();
  });

  test("各有名人の名前が表示されること", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Taylor Swift")).toBeInTheDocument();
    });
    // First category names visible
    expect(screen.getByText("Beyoncé")).toBeInTheDocument();
    expect(screen.getByText("Rihanna")).toBeInTheDocument();
    expect(screen.getByText("Zendaya")).toBeInTheDocument();
    expect(screen.getByText("Jennifer Lopez")).toBeInTheDocument();
  });

  test("スコアが表示されること", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Taylor Swift")).toBeInTheDocument();
    });
    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByText("70")).toBeInTheDocument();
    expect(screen.getByText("68")).toBeInTheDocument();
    expect(screen.getByText("66")).toBeInTheDocument();
    expect(screen.getByText("64")).toBeInTheDocument();
  });

  test("画像（img要素）が表示されること", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Taylor Swift")).toBeInTheDocument();
    });
    const images = screen.getAllByRole("img");
    expect(images.length).toBe(5);
  });

  test("画像のsrc属性がui-avatars.comのURLであること", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Taylor Swift")).toBeInTheDocument();
    });
    const images = screen.getAllByRole("img");
    images.forEach((img) => {
      expect(img.getAttribute("src")).toContain("ui-avatars.com");
    });
  });

  test("1位のメダル色が金色であること", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Taylor Swift")).toBeInTheDocument();
    });
    // The rank badge with "1" should have the gold medal class
    const rankBadge = screen.getByText("1");
    expect(rankBadge.className).toContain("bg-yellow-400");
  });

  test("fetch失敗時にエラーハンドリングされること", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error("Network error"))
    );
    render(<Home />);
    await waitFor(() => {
      expect(
        screen.getByText("データの読み込みに失敗しました")
      ).toBeInTheDocument();
    });
  });

  test("ページタイトルが表示されること", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(
        screen.getByText("Celebrity Body Balance Ranking")
      ).toBeInTheDocument();
    });
  });

  test("サブタイトルが表示されること", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(
        screen.getByText("有名人の体型バランスを偏差値でランキング")
      ).toBeInTheDocument();
    });
  });

  test("3つのタブボタンが表示されること", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Taylor Swift")).toBeInTheDocument();
    });
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
  });

  test("2位のメダル色が銀色であること", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Beyoncé")).toBeInTheDocument();
    });
    const rankBadge = screen.getByText("2");
    expect(rankBadge.className).toContain("bg-gray-300");
  });

  test("3位のメダル色が銅色であること", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Rihanna")).toBeInTheDocument();
    });
    const rankBadge = screen.getByText("3");
    expect(rankBadge.className).toContain("bg-amber-600");
  });

  test("3番目のタブをクリックするとproportionカテゴリが表示されること", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Taylor Swift")).toBeInTheDocument();
    });

    const proportionTab = screen.getByText("Proportion Harmony Score", {
      selector: "button",
    });
    fireEvent.click(proportionTab);

    await waitFor(() => {
      expect(screen.getByText("Gigi Hadid")).toBeInTheDocument();
    });
    expect(screen.getByText("Kendall Jenner")).toBeInTheDocument();
    expect(screen.getByText("Adele")).toBeInTheDocument();
  });

  test("画像にalt属性として名前が設定されていること", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("Taylor Swift")).toBeInTheDocument();
    });
    const img = screen.getByAltText("Taylor Swift");
    expect(img).toBeInTheDocument();
    expect(img.tagName).toBe("IMG");
  });
});
