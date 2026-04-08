import { fireEvent, render, screen } from "@testing-library/react";

import Home from "@/app/page";
import {
  buildFemaleCupDistributionSummary,
  buildMaleHeightDistributionSummary,
} from "@/lib/distributions";
import {
  formatSignedDifference,
  getMismatchEmoji,
} from "@/lib/profile-estimates";
import type { RankingData } from "@/lib/ranking";
import rankingDataJson from "../../public/data/ranking.json";

const originalNodeEnv = process.env.NODE_ENV;
const mutableEnv = process.env as Record<string, string | undefined>;
const rankingData = rankingDataJson as RankingData;
const femaleCupDistribution = buildFemaleCupDistributionSummary();
const maleHeightDistribution = buildMaleHeightDistributionSummary();
const PAGE_SIZE = 20;

const femaleStyleCategory = rankingData.female.find(
  (entry) => entry.category === "style"
)!;
const maleStyleCategory = rankingData.male.find(
  (entry) => entry.category === "style"
)!;
const femaleEstimatedCupCategory = rankingData.female.find(
  (entry) => entry.category === "estimatedCup"
)!;
const femaleStyleLocalImageEntry = femaleStyleCategory.ranking.find((entry) =>
  entry.image.startsWith("/")
)!;

const renderHome = () => render(<Home />);

const clickGenderTab = (label: "女性" | "男性") => {
  fireEvent.click(screen.getByRole("button", { name: label }));
};

const clickCategoryTab = (label: string) => {
  fireEvent.click(screen.getByRole("button", { name: label }));
};

const clickNextPage = () => {
  fireEvent.click(screen.getByRole("button", { name: "次の20人" }));
};

const getFemaleCategory = (categoryKey: string) => {
  const category = rankingData.female.find((entry) => entry.category === categoryKey);

  expect(category).toBeDefined();
  return category!;
};

afterEach(() => {
  mutableEnv.NODE_ENV = originalNodeEnv;
});

describe("Home (Ranking Page)", () => {
  test("ページタイトルとサブタイトルが表示される", () => {
    renderHome();

    expect(
      screen.getByRole("heading", { level: 1, name: "芸能人スタイルランキング" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("芸能人のスタイルをAIが偏差値で格付け！")
    ).toBeInTheDocument();
  });

  test("AI診断への CTA が表示される", () => {
    renderHome();

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "あなたのスタイルも診断してみる？",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "AI診断をはじめる" })
    ).toHaveAttribute("href", "/analyze");
    expect(
      screen.getByRole("link", { name: "モデル性能を見る" })
    ).toHaveAttribute("href", "/analyze#model-performance");
  });

  test("初期表示で女性の style カテゴリが表示される", () => {
    renderHome();

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: femaleStyleCategory.title,
      })
    ).toBeInTheDocument();
    expect(screen.getByText(femaleStyleCategory.ranking[0].name)).toBeInTheDocument();
    expect(screen.getByText(femaleStyleCategory.ranking[1].name)).toBeInTheDocument();
  });

  test("女性 style ランキングでカップ数と身長と偏差値が表示される", () => {
    const entryWithCup = femaleStyleCategory.ranking.find((entry) => entry.cup !== null)!;

    renderHome();

    expect(screen.getByText(entryWithCup.name)).toBeInTheDocument();
    expect(screen.getAllByText(`${entryWithCup.cup}カップ`).length).toBeGreaterThan(0);
    expect(screen.getAllByText(`${entryWithCup.actualHeight}cm`).length).toBeGreaterThan(
      0
    );
    expect(screen.getAllByText(`偏差値${entryWithCup.score}`).length).toBeGreaterThan(0);
  });

  test("女性 style ランキングでAI推定表示がされる", () => {
    renderHome();

    expect(screen.getAllByText(/^AI推定:/)).toHaveLength(PAGE_SIZE);
  });

  test("カテゴリタブ数が女性3つ・男性2つになっている", () => {
    renderHome();

    expect(screen.getAllByRole("button", { name: /ランキング$/ })).toHaveLength(3);

    clickGenderTab("男性");

    expect(screen.getByText(maleStyleCategory.ranking[0].name)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /ランキング$/ })).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: "AI推定カップ数ランキング" })
    ).not.toBeInTheDocument();
  });

  test("男性に切り替えると男性 style ランキングが表示される", () => {
    const topMaleEntry = maleStyleCategory.ranking[0];

    renderHome();
    clickGenderTab("男性");

    expect(screen.getByText(topMaleEntry.name)).toBeInTheDocument();
    expect(screen.getAllByText(`${topMaleEntry.actualHeight}cm`).length).toBeGreaterThan(
      0
    );
    expect(screen.getAllByText(`偏差値${topMaleEntry.score}`).length).toBeGreaterThan(
      0
    );
    expect(screen.getAllByText(/^AI推定: .*cm/)).toHaveLength(PAGE_SIZE);
  });

  test("ランキングは20人ずつページ送りできる", () => {
    const firstPageTop = femaleStyleCategory.ranking[0];
    const secondPageTop = femaleStyleCategory.ranking[20];

    renderHome();

    expect(screen.getByText(firstPageTop.name)).toBeInTheDocument();
    expect(screen.queryByText(secondPageTop.name)).not.toBeInTheDocument();
    expect(screen.getByText("1-20位 / 100人")).toBeInTheDocument();

    clickNextPage();

    expect(screen.queryByText(firstPageTop.name)).not.toBeInTheDocument();
    expect(screen.getByText(secondPageTop.name)).toBeInTheDocument();
    expect(screen.getByText("21-40位 / 100人")).toBeInTheDocument();
  });

  test("男女切り替え時にカテゴリタブが最初に戻る", () => {
    renderHome();

    clickCategoryTab("AI推定カップ数ランキング");
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "AI推定カップ数ランキング",
      })
    ).toBeInTheDocument();

    clickGenderTab("男性");

    expect(screen.getByText(maleStyleCategory.ranking[0].name)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "スタイル偏差値ランキング",
      })
    ).toBeInTheDocument();
  });

  test("productionではローカル画像にbasePathが付与される", () => {
    mutableEnv.NODE_ENV = "production";
    renderHome();

    const localImage = screen.getByAltText(femaleStyleLocalImageEntry.name);
    expect(localImage).toHaveAttribute(
      "src",
      `/body-type-analyzer${femaleStyleLocalImageEntry.image}`
    );
  });

  test("推定身長タブをクリックすると cm 表示になる", () => {
    const estimatedHeightCategory = getFemaleCategory("estimatedHeight");
    const topEntry = estimatedHeightCategory.ranking[0];

    renderHome();
    clickCategoryTab("AI推定身長ランキング");

    expect(screen.getByText(topEntry.name)).toBeInTheDocument();
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

  test("推定カップタブをクリックするとカップ表示になる", () => {
    const topEntry = femaleEstimatedCupCategory.ranking[0];
    const cupDiffLabel =
      topEntry.cupDiff === null
        ? "不明 🤔"
        : `${formatSignedDifference(topEntry.cupDiff, "サイズ")} ${getMismatchEmoji(
            topEntry.cupDiff
          )}`;

    renderHome();
    clickCategoryTab("AI推定カップ数ランキング");

    expect(screen.getByText(topEntry.name)).toBeInTheDocument();
    expect(
      screen.getAllByText(`${topEntry.estimatedCup}カップ`).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        `実際: ${topEntry.cup ? `${topEntry.cup}カップ` : "非公表"}（差: ${cupDiffLabel}）`
      ).length
    ).toBeGreaterThan(0);
  });

  test("分布セクションに女性カップ分布と男性身長分布が表示される", () => {
    const femalePublicBucket = femaleCupDistribution.publicSeries.buckets.find(
      (bucket) => bucket.cup === "C"
    )!;
    const femaleEstimatedBucket = femaleCupDistribution.estimatedSeries.buckets.find(
      (bucket) => bucket.cup === "C"
    )!;
    const malePublicBucket = maleHeightDistribution.publicSeries.buckets.find(
      (bucket) => bucket.label === "175-179cm"
    )!;
    const maleEstimatedBucket = maleHeightDistribution.estimatedSeries.buckets.find(
      (bucket) => bucket.label === "175-179cm"
    )!;

    renderHome();

    expect(
      screen.getByRole("heading", { level: 2, name: "分布セクション" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "女性カップ分布" })
    ).toBeInTheDocument();
    expect(screen.getAllByText(femaleCupDistribution.publicSeries.title)).toHaveLength(
      2
    );
    expect(
      screen.getAllByText(femaleCupDistribution.estimatedSeries.title)
    ).toHaveLength(2);
    expect(
      screen.getAllByText(
        `${femalePublicBucket.count}人 / ${femalePublicBucket.percentage.toFixed(1)}%`
      )
    ).not.toHaveLength(0);
    expect(
      screen.getAllByText(
        `${femaleEstimatedBucket.count}人 / ${femaleEstimatedBucket.percentage.toFixed(1)}%`
      )
    ).not.toHaveLength(0);
    expect(
      screen.getByRole("heading", { level: 3, name: "男性身長分布" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(
        `${malePublicBucket.count}人 / ${malePublicBucket.percentage.toFixed(1)}%`
      )
    ).not.toHaveLength(0);
    expect(
      screen.getAllByText(
        `${maleEstimatedBucket.count}人 / ${maleEstimatedBucket.percentage.toFixed(1)}%`
      )
    ).not.toHaveLength(0);
  });
});
