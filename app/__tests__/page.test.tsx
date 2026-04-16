import { fireEvent, render, screen, within } from "@testing-library/react";

import Home from "@/app/page";
import { FEMALE_CUP_TRAINING_COVERAGE_SUMMARY } from "@/lib/cup-training-coverage";
import { getCupIndex, normalizeCupLabel } from "@/lib/cup-order";
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
const scarceCupWarningMinIndex = getCupIndex(
  FEMALE_CUP_TRAINING_COVERAGE_SUMMARY.largeCupWarningMin
);

const femaleStyleCategory = rankingData.female.find(
  (entry) => entry.category === "style"
)!;
const femalePublicHeightCategory = rankingData.female.find(
  (entry) => entry.category === "publicHeight"
)!;
const femalePublicCupCategory = rankingData.female.find(
  (entry) => entry.category === "publicCup"
)!;
const maleStyleCategory = rankingData.male.find(
  (entry) => entry.category === "style"
)!;
const femaleSearchQueryEntry = femaleStyleCategory.ranking.find(
  (entry) =>
    femaleStyleCategory.ranking.filter((candidate) =>
      candidate.name.includes(entry.name)
    ).length <= PAGE_SIZE
)!;
const femaleStyleLocalImageEntryIndex = femaleStyleCategory.ranking.findIndex(
  (entry) => entry.image.startsWith("/")
);
const femaleStyleLocalImageEntry =
  femaleStyleCategory.ranking[femaleStyleLocalImageEntryIndex];
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
const getDisplayedWeight = (entry: {
  actualWeight: number | null;
  estimatedWeight: number;
}) => entry.actualWeight ?? entry.estimatedWeight;
const getWeightChipText = (entry: {
  actualWeight: number | null;
  estimatedWeight: number;
}) => `${entry.actualWeight !== null ? "公表" : "推定"}${getDisplayedWeight(entry)}kg`;
const femaleStyleKnownWeightEntryIndex = femaleStyleCategory.ranking.findIndex(
  (entry) => entry.actualWeight !== null
);
const femaleStyleKnownWeightEntry =
  femaleStyleCategory.ranking[femaleStyleKnownWeightEntryIndex];
const femaleStyleEstimatedWeightEntryIndex = femaleStyleCategory.ranking.findIndex(
  (entry) => entry.actualWeight === null
);
const femaleStyleEstimatedWeightEntry =
  femaleStyleCategory.ranking[femaleStyleEstimatedWeightEntryIndex];
const femaleStyleUnder45Entry = femaleStyleCategory.ranking.find(
  (entry) => getDisplayedWeight(entry) < 45
)!;
const femaleStyleNonUnder45Entry = femaleStyleCategory.ranking.find(
  (entry) => getDisplayedWeight(entry) >= 45
)!;
const femaleStyleUnder45Count = femaleStyleCategory.ranking.filter(
  (entry) => getDisplayedWeight(entry) < 45
).length;
const maleStyle55To59Entry = maleStyleCategory.ranking.find((entry) => {
  const weight = getDisplayedWeight(entry);

  return weight >= 55 && weight < 60;
})!;
const maleStyleNon55To59Entry = maleStyleCategory.ranking.find(
  (entry) => getDisplayedWeight(entry) >= 60
)!;
const maleStyle55To59Count = maleStyleCategory.ranking.filter((entry) => {
  const weight = getDisplayedWeight(entry);

  return weight >= 55 && weight < 60;
}).length;

function getFemaleCupSampleCount(cup: string | null | undefined): number | null {
  const normalizedCup = normalizeCupLabel(cup);

  if (!normalizedCup) {
    return null;
  }

  return FEMALE_CUP_TRAINING_COVERAGE_SUMMARY.sampleCounts[normalizedCup] ?? 0;
}

const femaleScarceCupEntryIndex = femalePublicCupCategory.ranking.findIndex((entry) => {
  const displayedCup = entry.displayCup ?? entry.cup;
  const displayedCupIndex = getCupIndex(displayedCup);
  const sampleCount = getFemaleCupSampleCount(displayedCup);

  return (
    displayedCupIndex !== null &&
    scarceCupWarningMinIndex !== null &&
    displayedCupIndex >= scarceCupWarningMinIndex &&
    sampleCount !== null &&
    sampleCount < FEMALE_CUP_TRAINING_COVERAGE_SUMMARY.scarceSampleThreshold
  );
});
const femaleScarceCupEntry =
  femaleScarceCupEntryIndex >= 0
    ? femalePublicCupCategory.ranking[femaleScarceCupEntryIndex]
    : null;

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

const clickWeightFilter = (label: string) => {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${label}\\s`) }));
};

const searchByName = (query: string) => {
  fireEvent.change(screen.getByLabelText("名前で検索"), {
    target: { value: query },
  });
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

  test("AIスタイル診断への CTA が表示される", () => {
    renderHome();

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "あなたのスタイルも診断してみる？",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "AIスタイル診断をはじめる" })
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

  test("初期表示で女性の公表カップ数ランキングが表示される", () => {
    renderHome();

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: femalePublicCupCategory.title,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(femalePublicCupCategory.ranking[0].name)
    ).toBeInTheDocument();
    expect(
      screen.getByText(femalePublicCupCategory.ranking[1].name)
    ).toBeInTheDocument();
  });

  test("女性 style ランキングでカップ数と身長と偏差値が表示される", () => {
    const entryWithCup = femaleStyleCategory.ranking.find((entry) => entry.cup !== null)!;
    const displayedCup = entryWithCup.displayCup ?? entryWithCup.cup;

    renderHome();
    clickCategoryTab(femaleStyleCategory.title);

    expect(screen.getByText(entryWithCup.name)).toBeInTheDocument();
    expect(screen.getAllByText(`${displayedCup}カップ`).length).toBeGreaterThan(0);
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

  test("Ranking cards show public weight chips for female profiles", () => {
    expect(femaleStyleKnownWeightEntryIndex).toBeGreaterThanOrEqual(0);

    renderHome();
    clickCategoryTab(femaleStyleCategory.title);

    const pageNumber = Math.floor(femaleStyleKnownWeightEntryIndex / PAGE_SIZE) + 1;
    if (pageNumber > 1) {
      clickPageNumber(pageNumber);
    }

    const card = screen
      .getByText(femaleStyleKnownWeightEntry.name)
      .closest("div.rounded-2xl");

    expect(card).not.toBeNull();
    expect(
      within(card as HTMLElement).getByText(
        getWeightChipText(femaleStyleKnownWeightEntry)
      )
    ).toBeInTheDocument();
  });

  test("Ranking cards show estimated weight chips when public weight is missing", () => {
    expect(femaleStyleEstimatedWeightEntryIndex).toBeGreaterThanOrEqual(0);

    renderHome();
    clickCategoryTab(femaleStyleCategory.title);

    const pageNumber =
      Math.floor(femaleStyleEstimatedWeightEntryIndex / PAGE_SIZE) + 1;
    if (pageNumber > 1) {
      clickPageNumber(pageNumber);
    }

    const card = screen
      .getByText(femaleStyleEstimatedWeightEntry.name)
      .closest("div.rounded-2xl");

    expect(card).not.toBeNull();
    expect(
      within(card as HTMLElement).getByText(
        getWeightChipText(femaleStyleEstimatedWeightEntry)
      )
    ).toBeInTheDocument();
  });

  test("Weight filter narrows female ranking entries by selected range", () => {
    renderHome();
    clickCategoryTab(femaleStyleCategory.title);

    clickWeightFilter("Under 45kg");

    expect(screen.getByText(femaleStyleUnder45Entry.name)).toBeInTheDocument();
    expect(screen.queryByText(femaleStyleNonUnder45Entry.name)).not.toBeInTheDocument();
    expect(
      screen.getByText(`1-20位 / ${femaleStyleUnder45Count}人`)
    ).toBeInTheDocument();
  });

  test("Weight filter narrows male ranking entries by selected range", () => {
    renderHome();
    clickGenderTab("男性");

    clickWeightFilter("55-59kg");

    expect(screen.getByText(maleStyle55To59Entry.name)).toBeInTheDocument();
    expect(screen.queryByText(maleStyleNon55To59Entry.name)).not.toBeInTheDocument();
    expect(
      screen.getByText(`1-20位 / ${maleStyle55To59Count}人`)
    ).toBeInTheDocument();
  });

  test("女性 style ランキングで公表値の要約が表示される", () => {
    const topEntry = femaleStyleCategory.ranking[0];
    const displayedCup = topEntry.displayCup ?? topEntry.cup;
    const estimatedCupText = topEntry.estimatedCup
      ? `${topEntry.estimatedCup}カップ`
      : "カップ推定不可";

    renderHome();
    clickCategoryTab(femaleStyleCategory.title);

    expect(
      screen.getByText(
        displayedCup
          ? `公表: ${topEntry.actualHeight}cm / ${displayedCup}カップ ・ AI推定: ${topEntry.estimatedHeight}cm / ${estimatedCupText}`
          : `公表: ${topEntry.actualHeight}cm / カップ非公表 ・ AI推定: ${topEntry.estimatedHeight}cm / ${estimatedCupText}`
      )
    ).toBeInTheDocument();
  });

  test("カテゴリタブ数が女性3つ・男性2つになっている", () => {
    renderHome();

    expect(screen.getAllByRole("button", { name: /ランキング$/ })).toHaveLength(3);

    clickGenderTab("男性");

    expect(screen.getByText(maleStyleCategory.ranking[0].name)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /ランキング$/ })).toHaveLength(2);
    expect(
      screen.queryByRole("button", { name: "公表カップ数ランキング" })
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
    expect(
      screen.getAllByText(
        `公表: ${topMaleEntry.actualHeight}cm ・ AI推定: ${topMaleEntry.estimatedHeight}cm`
      ).length
    ).toBeGreaterThan(0);
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

    clickCategoryTab("公表カップ数ランキング");
    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "公表カップ数ランキング",
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
    expect(femaleStyleLocalImageEntryIndex).toBeGreaterThanOrEqual(0);

    mutableEnv.NODE_ENV = "production";
    renderHome();
    clickCategoryTab(femaleStyleCategory.title);

    const pageNumber = Math.floor(femaleStyleLocalImageEntryIndex / PAGE_SIZE) + 1;
    if (pageNumber > 1) {
      clickPageNumber(pageNumber);
    }

    const localImage = screen.getByAltText(femaleStyleLocalImageEntry.name);
    expect(localImage).toHaveAttribute(
      "src",
      `/body-type-analyzer${femaleStyleLocalImageEntry.image}`
    );
  });

  test("公表身長タブをクリックすると cm 表示になる", () => {
    const topEntry = femalePublicHeightCategory.ranking[0];

    renderHome();
    clickCategoryTab("公表身長ランキング");

    expect(screen.getByText(topEntry.name)).toBeInTheDocument();
    expect(screen.getAllByText(`${topEntry.score}cm`).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        `AI推定身長: ${topEntry.estimatedHeight}cm（差: ${formatSignedDifference(
          topEntry.heightDiff,
          "cm"
        )} ${getMismatchEmoji(topEntry.heightDiff)}）`
      ).length
    ).toBeGreaterThan(0);
  });

  test("公表カップタブをクリックするとカップ表示になる", () => {
    const topEntry = femalePublicCupCategory.ranking[0];
    const displayedCup = topEntry.displayCup ?? topEntry.cup;
    const expectedDetail =
      !topEntry.estimatedCup || topEntry.displayCupDiff === null
        ? topEntry.estimatedCup
          ? `AI推定カップ: ${topEntry.estimatedCup}カップ`
          : "AI推定カップ: 不明"
        : `AI推定カップ: ${topEntry.estimatedCup}カップ（差: ${formatSignedDifference(
            topEntry.displayCupDiff,
            "サイズ"
          )} ${getMismatchEmoji(topEntry.displayCupDiff)}）`;

    renderHome();
    clickCategoryTab("公表カップ数ランキング");

    expect(screen.getByText(topEntry.name)).toBeInTheDocument();
    expect(
      screen.getAllByText(`${displayedCup}カップ`).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(expectedDetail).length).toBeGreaterThan(0);
  });

  test("学習データが薄い大カップ帯にはデータ不足の注意を表示する", () => {
    expect(femaleScarceCupEntry).not.toBeNull();

    renderHome();
    clickCategoryTab("公表カップ数ランキング");

    const pageNumber = Math.floor(femaleScarceCupEntryIndex / PAGE_SIZE) + 1;

    if (pageNumber > 1) {
      clickPageNumber(pageNumber);
    }

    const card = screen
      .getByText(femaleScarceCupEntry!.name)
      .closest("div.rounded-2xl");

    expect(card).not.toBeNull();
    expect(
      within(card as HTMLElement).getByText("データ不足なカップ数")
    ).toBeInTheDocument();
  });


  test("Distribution section shows female cup and male height series", () => {
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
