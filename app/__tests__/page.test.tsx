import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import Home from "@/app/page";
import {
  formatSignedDifference,
  getMismatchEmoji,
} from "@/lib/profile-estimates";
import type { RankingData } from "@/lib/ranking";
import {
  CUP_DISTRIBUTION_LABEL,
  calculateCupDeviation,
} from "@/lib/statistics";
import rankingData from "../../public/data/ranking.json";

const originalNodeEnv = process.env.NODE_ENV;
const originalFetch = global.fetch;

const mockRankingData = rankingData as RankingData;
const mutableEnv = process.env as Record<string, string | undefined>;

const renderHome = () => render(<Home />);

const waitForFemaleSilhouette = async () => {
  expect(await screen.findByText("菜々緒")).toBeInTheDocument();
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
    await waitForFemaleSilhouette();

    expect(
      screen.getByText("芸能人スタイルランキング")
    ).toBeInTheDocument();
    expect(
      screen.getByText("芸能人のスタイルをAIが偏差値で格付け！")
    ).toBeInTheDocument();
  });

  test("AI診断への CTA が表示される", async () => {
    renderHome();
    await waitForFemaleSilhouette();

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

  test("初期表示で女性のシルエットカテゴリが表示される", async () => {
    renderHome();
    await waitForFemaleSilhouette();

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "シルエットバランス偏差値",
      })
    ).toBeInTheDocument();
    expect(screen.getByText("新垣結衣")).toBeInTheDocument();
    expect(screen.getByText("長澤まさみ")).toBeInTheDocument();
  });

  test("女性ランキングでカップ数と身長が表示される", async () => {
    renderHome();
    await waitForFemaleSilhouette();

    expect(screen.getByText("Bカップ")).toBeInTheDocument();
    expect(screen.getByText("172cm")).toBeInTheDocument();
    expect(screen.getByText("偏差値76")).toBeInTheDocument();
  });

  test("女性ランキングでAI推定カップ表示がされる", async () => {
    renderHome();
    await waitForFemaleSilhouette();

    expect(screen.getAllByText(/^AI推定:/)).toHaveLength(20);
    expect(screen.getAllByText(/AI推定: Bカップ/).length).toBeGreaterThan(0);
  });

  test("女性の上半身タブに切り替えると身長付きで表示される", async () => {
    renderHome();
    await waitForFemaleSilhouette();

    clickCategoryTab("上半身バランス偏差値");

    expect(await screen.findByText("原幹恵")).toBeInTheDocument();
    expect(screen.getAllByText("163cm").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(`偏差値${calculateCupDeviation("G")}`).length
    ).toBeGreaterThan(0);
    expect(screen.getByText(CUP_DISTRIBUTION_LABEL)).toBeInTheDocument();
  });

  test("男性に切り替えると男性ランキングの身長が表示される", async () => {
    renderHome();
    await waitForFemaleSilhouette();

    clickGenderTab("男性");

    expect(await screen.findByText("鈴木亮平")).toBeInTheDocument();
    expect(screen.getByText("186cm")).toBeInTheDocument();
    expect(screen.getByText("偏差値76")).toBeInTheDocument();
  });

  test("男性ランキングではカップ数が表示されないがAI推定身長は表示される", async () => {
    renderHome();
    await waitForFemaleSilhouette();

    clickGenderTab("男性");

    expect(await screen.findByText("鈴木亮平")).toBeInTheDocument();
    expect(screen.queryByText(/カップ$/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/^AI推定: .*cm/)).toHaveLength(20);
  });

  test("男女切り替え時にカテゴリタブが最初に戻る", async () => {
    renderHome();
    await waitForFemaleSilhouette();

    clickCategoryTab("上半身バランス偏差値");
    expect(await screen.findByText("原幹恵")).toBeInTheDocument();

    clickGenderTab("男性");

    expect(await screen.findByText("鈴木亮平")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "シルエットバランス偏差値",
      })
    ).toBeInTheDocument();
  });

  test("productionではfetchと画像にbasePathが付与される", async () => {
    mutableEnv.NODE_ENV = "production";

    renderHome();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/body-type-analyzer/data/ranking.json"
      );
    });

    const image = await screen.findByAltText("菜々緒");
    expect(image).toHaveAttribute("src", "/body-type-analyzer/images/nanao.jpg");
  });

  test("推定身長タブをクリックすると cm 表示になる", async () => {
    const estimatedHeightCategory = getFemaleCategory("estimatedHeight");
    const topEntry = estimatedHeightCategory.ranking[0];

    renderHome();
    await waitForFemaleSilhouette();

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
    await waitForFemaleSilhouette();

    clickCategoryTab("AI推定カップ数ランキング");

    expect(await screen.findByText(topEntry.name)).toBeInTheDocument();
    expect(screen.getAllByText(`${topEntry.estimatedCup}カップ`).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        `実際: ${topEntry.cup ? `${topEntry.cup}カップ` : "非公表"}（差: ${cupDiffLabel}）`
      ).length
    ).toBeGreaterThan(0);
  });
});
