import { fireEvent, render, screen, within } from "@testing-library/react";

import Home from "@/app/page";
import {
  buildFemaleCupDistributionSummary,
  buildMaleHeightDistributionSummary,
} from "@/lib/distributions";
import {
  FEMALE_PROFILE_GOAL_SUMMARY,
  getFemaleProfileOccupations,
  PROFILE_OCCUPATION_LABELS,
} from "@/lib/profile-occupations";
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
const femaleSearchQueryEntry = femaleStyleCategory.ranking.find(
  (entry) =>
    femaleStyleCategory.ranking.filter((candidate) =>
      candidate.name.includes(entry.name)
    ).length <= PAGE_SIZE
)!;
const femaleStyleLocalImageEntry = femaleStyleCategory.ranking.find((entry) =>
  entry.image.startsWith("/")
)!;
const femaleStyleOccupationEntry = femaleStyleCategory.ranking.find(
  (entry) => getFemaleProfileOccupations(entry.name).length > 0
)!;
const femaleStyleAvEntry = femaleStyleCategory.ranking.find((entry) =>
  getFemaleProfileOccupations(entry.name).includes("av")
)!;
const femaleStyleNonAvEntry = femaleStyleCategory.ranking.find(
  (entry) => !getFemaleProfileOccupations(entry.name).includes("av")
)!;
const femaleStyleAvCount = femaleStyleCategory.ranking.filter((entry) =>
  getFemaleProfileOccupations(entry.name).includes("av")
).length;

const renderHome = () => render(<Home />);

const clickGenderTab = (label: "女性" | "男性") => {
  fireEvent.click(screen.getByRole("button", { name: label }));
};

const clickCategoryTab = (label: string) => {
  fireEvent.click(screen.getByRole("button", { name: label }));
};

const clickPageNumber = (pageNumber: number) => {
  fireEvent.click(screen.getByRole("button", { name: String(pageNumber) }));
};

const clickOccupationFilter = (label: string) => {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${label}\\s`) }));
};

const searchByName = (query: string) => {
  fireEvent.change(screen.getByLabelText("名前で検索"), {
    target: { value: query },
  });
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

  test("Coverage section shows occupation targets and remaining counts", () => {
    const avGoal = FEMALE_PROFILE_GOAL_SUMMARY.occupations.find(
      (entry) => entry.occupation === "av"
    )!;

    renderHome();

    const avCard =
      screen
        .getAllByText(avGoal.label)
        .map((element) => element.closest("article"))
        .find((element): element is HTMLElement =>
          Boolean(element?.textContent?.includes("Current / Goal / Left"))
        ) ?? null;

    expect(
      screen.getByRole("heading", { level: 3, name: "Targets" })
    ).toBeInTheDocument();
    expect(avCard).not.toBeNull();
    expect(within(avCard as HTMLElement).getByText(avGoal.label)).toBeInTheDocument();
    expect(
      within(avCard as HTMLElement).getByText(
        new RegExp(`${avGoal.count}\\s*/\\s*${avGoal.target}人`)
      )
    ).toBeInTheDocument();
    expect(within(avCard as HTMLElement).getByText(String(avGoal.remaining))).toBeInTheDocument();
  });

  test("初期表示で女性の AI推定カップ数ランキングが表示される", () => {
    renderHome();

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: femaleEstimatedCupCategory.title,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(femaleEstimatedCupCategory.ranking[0].name)
    ).toBeInTheDocument();
    expect(
      screen.getByText(femaleEstimatedCupCategory.ranking[1].name)
    ).toBeInTheDocument();
  });

  test("女性 style ランキングでカップ数と身長と偏差値が表示される", () => {
    const entryWithCup = femaleStyleCategory.ranking.find((entry) => entry.cup !== null)!;

    renderHome();
    clickCategoryTab(femaleStyleCategory.title);

    expect(screen.getByText(entryWithCup.name)).toBeInTheDocument();
    expect(screen.getAllByText(`${entryWithCup.cup}カップ`).length).toBeGreaterThan(0);
    expect(screen.getAllByText(`${entryWithCup.actualHeight}cm`).length).toBeGreaterThan(
      0
    );
    expect(screen.getAllByText(`偏差値${entryWithCup.score}`).length).toBeGreaterThan(0);
  });

  test("Ranking cards show occupation chips for female profiles", () => {
    const occupationLabels = getFemaleProfileOccupations(
      femaleStyleOccupationEntry.name
    )
      .slice(0, 3)
      .map((occupation) => PROFILE_OCCUPATION_LABELS[occupation]);

    renderHome();
    clickCategoryTab(femaleStyleCategory.title);

    const card = screen
      .getByText(femaleStyleOccupationEntry.name)
      .closest("div.rounded-2xl");

    expect(card).not.toBeNull();

    occupationLabels.forEach((label) => {
      expect(within(card as HTMLElement).getByText(label)).toBeInTheDocument();
    });
  });

  test("Occupation filter narrows female ranking entries by selected job", () => {
    renderHome();
    clickCategoryTab(femaleStyleCategory.title);

    clickOccupationFilter(PROFILE_OCCUPATION_LABELS.av);

    expect(screen.getByText(femaleStyleAvEntry.name)).toBeInTheDocument();
    expect(screen.queryByText(femaleStyleNonAvEntry.name)).not.toBeInTheDocument();
    expect(screen.getByText(`1-20位 / ${femaleStyleAvCount}人`)).toBeInTheDocument();
  });

  test("Occupation filter is hidden on male ranking", () => {
    renderHome();
    clickOccupationFilter(PROFILE_OCCUPATION_LABELS.av);
    clickGenderTab("男性");

    expect(
      screen.queryByText("Occupation Filter")
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: new RegExp(`^${PROFILE_OCCUPATION_LABELS.av}\\s`),
      })
    ).not.toBeInTheDocument();
  });

  test("女性 style ランキングでAI推定表示がされる", () => {
    renderHome();
    clickCategoryTab(femaleStyleCategory.title);

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

  test("ランキングは番号ボタンでページ移動できる", () => {
    const firstPageTop = femaleStyleCategory.ranking[0];
    const secondPageTop = femaleStyleCategory.ranking[20];
    const totalLabel = `${femaleStyleCategory.ranking.length}人`;

    renderHome();
    clickCategoryTab(femaleStyleCategory.title);

    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2" })).toBeInTheDocument();
    expect(screen.getByText(firstPageTop.name)).toBeInTheDocument();
    expect(screen.queryByText(secondPageTop.name)).not.toBeInTheDocument();
    expect(screen.getByText(`1-20位 / ${totalLabel}`)).toBeInTheDocument();

    clickPageNumber(2);

    expect(screen.queryByText(firstPageTop.name)).not.toBeInTheDocument();
    expect(screen.getByText(secondPageTop.name)).toBeInTheDocument();
    expect(screen.getByText(`21-40位 / ${totalLabel}`)).toBeInTheDocument();
  });

  test("名前検索でランキングを絞り込みページを先頭に戻せる", () => {
    const searchTarget = femaleSearchQueryEntry;
    const matchingEntries = femaleStyleCategory.ranking.filter((entry) =>
      entry.name.includes(searchTarget.name)
    );
    const expectedPageEnd = Math.min(PAGE_SIZE, matchingEntries.length);
    const expectedTotalPages = Math.max(
      1,
      Math.ceil(matchingEntries.length / PAGE_SIZE)
    );

    renderHome();
    clickCategoryTab(femaleStyleCategory.title);

    clickPageNumber(2);
    searchByName(searchTarget.name);

    expect(screen.getByText(searchTarget.name)).toBeInTheDocument();
    expect(
      screen.getByText(`1-${expectedPageEnd}位 / ${matchingEntries.length}人`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `ページ 1 / ${expectedTotalPages} ・ 「${searchTarget.name}」の検索結果`
      )
    ).toBeInTheDocument();
  });

  test("名前検索で結果がないと空状態を表示する", () => {
    renderHome();

    searchByName("存在しない人物");

    expect(screen.getByText("該当する人物が見つかりません。")).toBeInTheDocument();
    expect(screen.getByText("0人")).toBeInTheDocument();
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
    clickCategoryTab(femaleStyleCategory.title);

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
