import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import Home from "@/app/page";
import {
  formatSignedDifference,
  getMismatchEmoji,
} from "@/lib/profile-estimates";
import type { RankingData } from "@/lib/ranking";
import rankingData from "../../public/data/ranking.json";

const originalNodeEnv = process.env.NODE_ENV;
const originalFetch = global.fetch;

const mockRankingData = rankingData as RankingData;
const mutableEnv = process.env as Record<string, string | undefined>;

const femaleStyleCategory = mockRankingData.female.find(
  (entry) => entry.category === "style"
)!;
const maleStyleCategory = mockRankingData.male.find(
  (entry) => entry.category === "style"
)!;
const femaleStyleLocalImageEntry = femaleStyleCategory.ranking.find((entry) =>
  entry.image.startsWith("/")
)!;

const renderHome = () => render(<Home />);

const waitForFemaleStyle = async () => {
  expect(
    await screen.findByText(femaleStyleCategory.ranking[0].name)
  ).toBeInTheDocument();
};

const clickGenderTab = (label: "女性" | "男性") => {
  fireEvent.click(screen.getByRole("button", { name: label }));
};

const clickCategoryTab = (label: string) => {
  fireEvent.click(screen.getByRole("button", { name: label }));
};

const getFemaleCategory = (categoryKey: string) => {
  const category = mockRankingData.female.find(
    (entry) => entry.category === categoryKey
  );

  expect(category).toBeDefined();
  return category!;
};

beforeEach(() => {
  mutableEnv.NODE_ENV = "test";
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve(mockRankingData),
    })
  ) as jest.Mock;
});

afterEach(() => {
  mutableEnv.NODE_ENV = originalNodeEnv;
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

describe("Home (Ranking Page)", () => {
  test("ローディング中の表示がある", () => {
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(() => {})
    );

    renderHome();
    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });

  test("fetch失敗時にエラーメッセージが表示される", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error("Network error"))
    );

    renderHome();

    expect(
      await screen.findByText("データの読み込みに失敗しました")
    ).toBeInTheDocument();
  });

  test("ページタイトルとサブタイトルが表示される", async () => {
    renderHome();
    await waitForFemaleStyle();

    expect(screen.getByText("芸能人スタイルランキング")).toBeInTheDocument();
    expect(
      screen.getByText("芸能人のスタイルをAIが偏差値で格付け！")
    ).toBeInTheDocument();
  });

  test("AI診断への CTA が表示される", async () => {
    renderHome();
    await waitForFemaleStyle();

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "あなたのスタイルも診断してみる？",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "AI診断をはじめる" })
    ).toHaveAttribute("href", "/analyze");
  });

  test("初期表示で女性の style カテゴリが表示される", async () => {
    renderHome();
    await waitForFemaleStyle();

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: femaleStyleCategory.title,
      })
    ).toBeInTheDocument();
    expect(screen.getByText(femaleStyleCategory.ranking[0].name)).toBeInTheDocument();
    expect(screen.getByText(femaleStyleCategory.ranking[1].name)).toBeInTheDocument();
  });

  test("女性 style ランキングでカップ数と身長と偏差値が表示される", async () => {
    const entryWithCup = femaleStyleCategory.ranking.find((entry) => entry.cup !== null)!;

    renderHome();
    await waitForFemaleStyle();

    expect(screen.getByText(entryWithCup.name)).toBeInTheDocument();
    expect(screen.getAllByText(`${entryWithCup.cup}カップ`).length).toBeGreaterThan(0);
    expect(screen.getAllByText(`${entryWithCup.actualHeight}cm`).length).toBeGreaterThan(
      0
    );
    expect(screen.getAllByText(`偏差値${entryWithCup.score}`).length).toBeGreaterThan(0);
  });

  test("女性 style ランキングでAI推定表示がされる", async () => {
    renderHome();
    await waitForFemaleStyle();

    expect(screen.getAllByText(/^AI推定:/)).toHaveLength(20);
  });

  test("カテゴリタブ数が女性3つ・男性2つになっている", async () => {
    renderHome();
    await waitForFemaleStyle();

    expect(screen.getAllByRole("button", { name: /ランキング$/ })).toHaveLength(3);

    clickGenderTab("男性");

    expect(await screen.findByText(maleStyleCategory.ranking[0].name)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /ランキング$/ })).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: "AI推定カップ数ランキング" })
    ).not.toBeInTheDocument();
  });

  test("男性に切り替えると男性 style ランキングが表示される", async () => {
    const topMaleEntry = maleStyleCategory.ranking[0];

    renderHome();
    await waitForFemaleStyle();

    clickGenderTab("男性");

    expect(await screen.findByText(topMaleEntry.name)).toBeInTheDocument();
    expect(screen.getAllByText(`${topMaleEntry.actualHeight}cm`).length).toBeGreaterThan(
      0
    );
    expect(screen.getAllByText(`偏差値${topMaleEntry.score}`).length).toBeGreaterThan(
      0
    );
    expect(screen.getAllByText(/^AI推定: .*cm/)).toHaveLength(20);
  });

  test("男女切り替え時にカテゴリタブが最初に戻る", async () => {
    renderHome();
    await waitForFemaleStyle();

    clickCategoryTab("AI推定カップ数ランキング");
    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "AI推定カップ数ランキング",
      })
    ).toBeInTheDocument();

    clickGenderTab("男性");

    expect(await screen.findByText(maleStyleCategory.ranking[0].name)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "スタイル偏差値ランキング",
      })
    ).toBeInTheDocument();
  });

  test("productionではfetchと画像にbasePathが付与される", async () => {
    mutableEnv.NODE_ENV = "production";
    const remoteImageEntry = {
      ...femaleStyleCategory.ranking[0],
      name: "Remote Image Test",
      image: "https://example.com/remote.jpg",
    };
    const productionRankingData = JSON.parse(
      JSON.stringify(mockRankingData)
    ) as RankingData;

    productionRankingData.female = productionRankingData.female.map((category) =>
      category.category === "style"
        ? {
            ...category,
            ranking: [...category.ranking, remoteImageEntry],
          }
        : category
    );
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve(productionRankingData),
      })
    );

    renderHome();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/body-type-analyzer/data/ranking.json"
      );
    });

    const localImage = await screen.findByAltText(femaleStyleLocalImageEntry.name);
    expect(localImage).toHaveAttribute(
      "src",
      `/body-type-analyzer${femaleStyleLocalImageEntry.image}`
    );

    const remoteImage = await screen.findByAltText(remoteImageEntry.name);
    expect(remoteImage).toHaveAttribute("src", remoteImageEntry.image);
  });

  test("推定身長タブをクリックすると cm 表示になる", async () => {
    const estimatedHeightCategory = getFemaleCategory("estimatedHeight");
    const topEntry = estimatedHeightCategory.ranking[0];

    renderHome();
    await waitForFemaleStyle();

    clickCategoryTab("AI推定身長ランキング");

    expect(await screen.findByText(topEntry.name)).toBeInTheDocument();
    expect(screen.getAllByText(`${topEntry.score}cm`).length).toBeGreaterThan(0);
    expect(
      screen.getByText(
        `実際: ${topEntry.actualHeight}cm（差: ${formatSignedDifference(
          topEntry.heightDiff,
          "cm"
        )} ${getMismatchEmoji(topEntry.heightDiff)}）`
      )
    ).toBeInTheDocument();
  });

  test("推定カップタブをクリックするとカップ表示になる", async () => {
    const estimatedCupCategory = getFemaleCategory("estimatedCup");
    const topEntry = estimatedCupCategory.ranking[0];
    const cupDiffLabel =
      topEntry.cupDiff === null
        ? "不明 🤔"
        : `${formatSignedDifference(topEntry.cupDiff, "サイズ")} ${getMismatchEmoji(
            topEntry.cupDiff
          )}`;

    renderHome();
    await waitForFemaleStyle();

    clickCategoryTab("AI推定カップ数ランキング");

    expect(await screen.findByText(topEntry.name)).toBeInTheDocument();
    expect(
      screen.getAllByText(`${topEntry.estimatedCup}カップ`).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        `実際: ${topEntry.cup ? `${topEntry.cup}カップ` : "非公表"}（差: ${cupDiffLabel}）`
      ).length
    ).toBeGreaterThan(0);
  });
});
