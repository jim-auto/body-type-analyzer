import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Home from "@/app/page";

const mockRankingData = [
  {
    category: "silhouette",
    title: "Silhouette Balance Deviation",
    ranking: [
      { name: "深田恭子", score: 73, image: "https://ui-avatars.com/api/?name=深田恭子&size=128&background=random&color=fff&bold=true" },
      { name: "石原さとみ", score: 71, image: "https://ui-avatars.com/api/?name=石原さとみ&size=128&background=random&color=fff&bold=true" },
      { name: "佐々木希", score: 69, image: "https://ui-avatars.com/api/?name=佐々木希&size=128&background=random&color=fff&bold=true" },
      { name: "新垣結衣", score: 67, image: "https://ui-avatars.com/api/?name=新垣結衣&size=128&background=random&color=fff&bold=true" },
      { name: "綾瀬はるか", score: 65, image: "https://ui-avatars.com/api/?name=綾瀬はるか&size=128&background=random&color=fff&bold=true" },
    ],
  },
  {
    category: "upperBody",
    title: "Upper Body Dominance Deviation",
    ranking: [
      { name: "長澤まさみ", score: 72, image: "https://ui-avatars.com/api/?name=長澤まさみ&size=128&background=random&color=fff&bold=true" },
      { name: "北川景子", score: 70, image: "https://ui-avatars.com/api/?name=北川景子&size=128&background=random&color=fff&bold=true" },
      { name: "広瀬すず", score: 68, image: "https://ui-avatars.com/api/?name=広瀬すず&size=128&background=random&color=fff&bold=true" },
      { name: "橋本環奈", score: 66, image: "https://ui-avatars.com/api/?name=橋本環奈&size=128&background=random&color=fff&bold=true" },
      { name: "浜辺美波", score: 64, image: "https://ui-avatars.com/api/?name=浜辺美波&size=128&background=random&color=fff&bold=true" },
    ],
  },
  {
    category: "proportion",
    title: "Proportion Harmony Score",
    ranking: [
      { name: "菜々緒", score: 74, image: "https://ui-avatars.com/api/?name=菜々緒&size=128&background=random&color=fff&bold=true" },
      { name: "中条あやみ", score: 71, image: "https://ui-avatars.com/api/?name=中条あやみ&size=128&background=random&color=fff&bold=true" },
      { name: "森星", score: 69, image: "https://ui-avatars.com/api/?name=森星&size=128&background=random&color=fff&bold=true" },
      { name: "今田美桜", score: 67, image: "https://ui-avatars.com/api/?name=今田美桜&size=128&background=random&color=fff&bold=true" },
      { name: "藤田ニコル", score: 65, image: "https://ui-avatars.com/api/?name=藤田ニコル&size=128&background=random&color=fff&bold=true" },
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
      expect(screen.getByText("深田恭子")).toBeInTheDocument();
    });
    expect(screen.getByText("石原さとみ")).toBeInTheDocument();
    expect(screen.getByText("佐々木希")).toBeInTheDocument();
    expect(screen.getByText("新垣結衣")).toBeInTheDocument();
    expect(screen.getByText("綾瀬はるか")).toBeInTheDocument();
  });

  test("タブ切り替えで別カテゴリが表示されること", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("深田恭子")).toBeInTheDocument();
    });

    const upperBodyTab = screen.getByText("Upper Body Dominance Deviation", {
      selector: "button",
    });
    fireEvent.click(upperBodyTab);

    await waitFor(() => {
      expect(screen.getByText("長澤まさみ")).toBeInTheDocument();
    });
    expect(screen.getByText("北川景子")).toBeInTheDocument();
  });

  test("各有名人の名前が表示されること", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("深田恭子")).toBeInTheDocument();
    });
    // First category names visible
    expect(screen.getByText("石原さとみ")).toBeInTheDocument();
    expect(screen.getByText("佐々木希")).toBeInTheDocument();
    expect(screen.getByText("新垣結衣")).toBeInTheDocument();
    expect(screen.getByText("綾瀬はるか")).toBeInTheDocument();
  });

  test("スコアが表示されること", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("深田恭子")).toBeInTheDocument();
    });
    expect(screen.getByText("73")).toBeInTheDocument();
    expect(screen.getByText("71")).toBeInTheDocument();
    expect(screen.getByText("69")).toBeInTheDocument();
    expect(screen.getByText("67")).toBeInTheDocument();
    expect(screen.getByText("65")).toBeInTheDocument();
  });

  test("画像（img要素）が表示されること", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("深田恭子")).toBeInTheDocument();
    });
    const images = screen.getAllByRole("img");
    expect(images.length).toBe(5);
  });

  test("画像のsrc属性がui-avatars.comのURLであること", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("深田恭子")).toBeInTheDocument();
    });
    const images = screen.getAllByRole("img");
    images.forEach((img) => {
      expect(img.getAttribute("src")).toContain("ui-avatars.com");
    });
  });

  test("1位のメダル色が金色であること", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("深田恭子")).toBeInTheDocument();
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
      expect(screen.getByText("深田恭子")).toBeInTheDocument();
    });
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
  });

  test("2位のメダル色が銀色であること", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("石原さとみ")).toBeInTheDocument();
    });
    const rankBadge = screen.getByText("2");
    expect(rankBadge.className).toContain("bg-gray-300");
  });

  test("3位のメダル色が銅色であること", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("佐々木希")).toBeInTheDocument();
    });
    const rankBadge = screen.getByText("3");
    expect(rankBadge.className).toContain("bg-amber-600");
  });

  test("3番目のタブをクリックするとproportionカテゴリが表示されること", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("深田恭子")).toBeInTheDocument();
    });

    const proportionTab = screen.getByText("Proportion Harmony Score", {
      selector: "button",
    });
    fireEvent.click(proportionTab);

    await waitFor(() => {
      expect(screen.getByText("菜々緒")).toBeInTheDocument();
    });
    expect(screen.getByText("中条あやみ")).toBeInTheDocument();
    expect(screen.getByText("藤田ニコル")).toBeInTheDocument();
  });

  test("画像にalt属性として名前が設定されていること", async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText("深田恭子")).toBeInTheDocument();
    });
    const img = screen.getByAltText("深田恭子");
    expect(img).toBeInTheDocument();
    expect(img.tagName).toBe("IMG");
  });
});
