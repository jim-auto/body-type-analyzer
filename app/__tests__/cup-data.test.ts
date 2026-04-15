import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

import rankingDataJson from "../../public/data/ranking.json";
import { buildRankingData } from "@/lib/ranking-builder";
import {
  getCupDifference,
  getDisplayCupDifference,
  getAdjustedEstimatedCup,
  getEstimatedHeight,
} from "@/lib/profile-estimates";
import {
  getFemaleRankingEstimatedCup,
  getFemaleRankingEstimatedHeight,
  getMaleRankingEstimatedHeight,
  isFemaleImageModelExcluded,
} from "@/lib/ranking-estimates";
import type {
  FemaleRankingEntry,
  MaleRankingEntry,
  RankingCategory,
  RankingData,
} from "@/lib/ranking";
import { femaleProfilePool, maleProfilePool } from "@/lib/source-profiles";
import {
  FEMALE_STATS,
  MALE_STATS,
  calculateCupDeviation,
  calculateDeviation,
} from "@/lib/statistics";
import {
  EXTENDED_CUP_ORDER,
  getPreferredCupLabel,
} from "@/lib/cup-order";

const rankingData = rankingDataJson as RankingData;
const femaleCategories = rankingData.female;
const maleCategories = rankingData.male;
const allCategories = [...femaleCategories, ...maleCategories];
const femaleEntries = femaleCategories.flatMap((category) => category.ranking);
const maleEntries = maleCategories.flatMap((category) => category.ranking);
const validCups = new Set(EXTENDED_CUP_ORDER);
const estimatedCupOrder = EXTENDED_CUP_ORDER;
const uiAvatarPattern =
  /^https:\/\/ui-avatars\.com\/api\/\?name=.+&size=300&background=random&color=fff&bold=true$/;
const knownAmbiguousImageNames = [
  "鎌倉美咲",
  "若槻千夏",
  "中村倫也",
] as const;

const getCategory = <TEntry extends FemaleRankingEntry | MaleRankingEntry>(
  categories: RankingCategory<TEntry>[],
  categoryKey: string
) => {
  const category = categories.find((entry) => entry.category === categoryKey);

  expect(category).toBeDefined();

  return category!;
};

const mean = (values: number[]) =>
  values.reduce((total, value) => total + value, 0) / values.length;

describe("ranking.json actual profile data", () => {
  test("女性カテゴリが3つ、男性カテゴリが2つである", () => {
    expect(femaleCategories).toHaveLength(3);
    expect(maleCategories).toHaveLength(2);
    expect(femaleCategories.map((category) => category.category)).toEqual([
      "style",
      "estimatedHeight",
      "estimatedCup",
    ]);
    expect(maleCategories.map((category) => category.category)).toEqual([
      "style",
      "estimatedHeight",
    ]);
  });

  test("旧カテゴリが存在しない", () => {
    expect(allCategories.some((category) => category.category === "silhouette")).toBe(
      false
    );
    expect(allCategories.some((category) => category.category === "upperBody")).toBe(
      false
    );
    expect(allCategories.some((category) => category.category === "proportion")).toBe(
      false
    );
  });

  test("カテゴリタイトルが新仕様に一致する", () => {
    expect(getCategory(femaleCategories, "style").title).toBe(
      "スタイル偏差値ランキング"
    );
    expect(getCategory(femaleCategories, "estimatedHeight").title).toBe(
      "AI推定身長ランキング"
    );
    expect(getCategory(femaleCategories, "estimatedCup").title).toBe(
      "AI推定カップ数ランキング"
    );
    expect(getCategory(maleCategories, "style").title).toBe(
      "スタイル偏差値ランキング"
    );
    expect(getCategory(maleCategories, "estimatedHeight").title).toBe(
      "AI推定身長ランキング"
    );
  });

  test("女性・男性のソース母集団が90人以上ある", () => {
    expect(new Set(femaleProfilePool.map((entry) => entry.name)).size).toBeGreaterThanOrEqual(
      90
    );
    expect(new Set(maleProfilePool.map((entry) => entry.name)).size).toBeGreaterThanOrEqual(
      90
    );
  });

  test("各カテゴリのランキングが母集団ぶん表示される", () => {
    femaleCategories.forEach((category) => {
      const expectedLength =
        category.category === "estimatedCup"
          ? femaleProfilePool.filter(
              (entry) => getFemaleRankingEstimatedCup(entry) !== null
            ).length
          : femaleProfilePool.length;

      expect(category.ranking).toHaveLength(expectedLength);
    });

    maleCategories.forEach((category) => {
      expect(category.ranking).toHaveLength(maleProfilePool.length);
    });
  });

  test("全エントリに actualHeight、estimatedHeight、heightDiff がある", () => {
    femaleEntries.forEach((entry) => {
      expect(entry.actualHeight).toEqual(expect.any(Number));
      expect(entry.estimatedHeight).toBe(getFemaleRankingEstimatedHeight(entry));
      expect(entry.heightDiff).toBe(entry.estimatedHeight - entry.actualHeight);
    });

    maleEntries.forEach((entry) => {
      expect(entry.actualHeight).toEqual(expect.any(Number));
      expect(entry.estimatedHeight).toBe(getMaleRankingEstimatedHeight(entry));
      expect(entry.heightDiff).toBe(entry.estimatedHeight - entry.actualHeight);
    });
  });

  test("女性エントリの bust / cup / estimatedCup / cupDiff が妥当である", () => {
    femaleEntries.forEach((entry) => {
      expect(entry.bust).toEqual(expect.any(Number));
      expect(validCups.has(entry.cup ?? "")).toBe(true);
      expect(typeof entry.displayCup).toBe("string");
      expect(entry.estimatedCup).toBe(getFemaleRankingEstimatedCup(entry));
      expect(entry.cupDiff).toBe(
        getCupDifference(getPreferredCupLabel(entry), entry.estimatedCup)
      );
      expect(entry.displayCupDiff).toBe(
        getDisplayCupDifference(getPreferredCupLabel(entry), entry.estimatedCup)
      );
    });
  });

  test("内部推定は H 超の公開カップも扱う", () => {
    expect(
      femaleEntries.some((entry) => /[I-Z]/u.test(entry.displayCup ?? ""))
    ).toBe(true);
  });

  test("推定精度が dataset 全体で改善後の閾値を満たす", () => {
    const femaleHeightDiffs = femaleProfilePool.map((entry) =>
      Math.abs(getFemaleRankingEstimatedHeight(entry) - entry.actualHeight)
    );
    const maleHeightDiffs = maleProfilePool.map((entry) =>
      Math.abs(getMaleRankingEstimatedHeight(entry) - entry.actualHeight)
    );
    const femaleCupDiffs = femaleProfilePool
      .map((entry) =>
        getCupDifference(
          getPreferredCupLabel(entry),
          getFemaleRankingEstimatedCup(entry)
        )
      )
      .filter((value): value is number => value !== null)
      .map((value) => Math.abs(value));

    expect(mean(femaleHeightDiffs)).toBeLessThanOrEqual(2.0);
    expect(mean(maleHeightDiffs)).toBeLessThanOrEqual(1.0);
    expect(Math.max(...femaleHeightDiffs)).toBeLessThanOrEqual(15);
    expect(Math.max(...maleHeightDiffs)).toBeLessThanOrEqual(4);
    expect(
      femaleHeightDiffs.filter((value) => value <= 2).length / femaleHeightDiffs.length
    ).toBeGreaterThanOrEqual(0.65);
    expect(
      maleHeightDiffs.filter((value) => value <= 2).length / maleHeightDiffs.length
    ).toBeGreaterThanOrEqual(0.85);
    // Large-cup coverage expansion trades a small amount of average ranking error for better F+ support.
    expect(mean(femaleCupDiffs)).toBeLessThanOrEqual(1.0);
    expect(
      femaleCupDiffs.filter((value) => value <= 1).length / femaleCupDiffs.length
    ).toBeGreaterThanOrEqual(0.75);
  });

  test("画像モデルの推定が女性・男性の一部ランキング推定に反映される", () => {
    const femaleChangedCount = femaleProfilePool.filter(
      (entry) =>
        entry.image.startsWith("/images/") &&
        getFemaleRankingEstimatedHeight(entry) !==
          getEstimatedHeight(entry.actualHeight, entry.name)
    ).length;
    const maleChangedCount = maleProfilePool.filter(
      (entry) =>
        entry.image.startsWith("/images/") &&
        getMaleRankingEstimatedHeight(entry) !==
          getEstimatedHeight(entry.actualHeight, entry.name)
    ).length;

    expect(femaleChangedCount).toBeGreaterThan(0);
    expect(maleChangedCount).toBeGreaterThanOrEqual(0);
  });

  test("表示専用の女性画像はランキング推定に混ぜない", () => {
    const excludedEntries = femaleProfilePool.filter((entry) =>
      isFemaleImageModelExcluded(entry.name)
    );

    expect(excludedEntries.length).toBeGreaterThan(0);

    excludedEntries.forEach((entry) => {
      expect(getFemaleRankingEstimatedHeight(entry)).toBe(
        getEstimatedHeight(entry.actualHeight, entry.name)
      );
      expect(getFemaleRankingEstimatedCup(entry)).toBe(
        getAdjustedEstimatedCup(entry.bust, entry.cup)
      );
    });
  });

  test("男性エントリに bust / cup がない", () => {
    maleEntries.forEach((entry) => {
      expect(entry).not.toHaveProperty("bust");
      expect(entry).not.toHaveProperty("cup");
    });
  });

  test("画像URLはローカル画像か ui-avatars のどちらかである", () => {
    [...femaleProfilePool, ...maleProfilePool].forEach((entry) => {
      if (entry.image.startsWith("/images/")) {
        const imagePath = path.join(process.cwd(), "public", entry.image.slice(1));
        expect(fs.existsSync(imagePath)).toBe(true);
        return;
      }

      expect(entry.image).toMatch(uiAvatarPattern);
    });
  });

  test("public/images は webp のみを配信する", () => {
    const imageDir = path.join(process.cwd(), "public", "images");
    const imageFiles = fs.readdirSync(imageDir);

    expect(imageFiles.some((filename) => /\.jpe?g$/iu.test(filename))).toBe(false);
  });

  test("曖昧な名前のプロフィールは安全のため ui-avatars を使う", () => {
    knownAmbiguousImageNames.forEach((name) => {
      const entry = [...femaleProfilePool, ...maleProfilePool].find(
        (profile) => profile.name === name
      );

      expect(entry).toBeDefined();
      expect(entry?.image).toMatch(uiAvatarPattern);
    });
  });

  test("別人に同じローカル画像が使い回されていない", () => {
    const imageToNames = new Map<string, string[]>();

    [...femaleProfilePool, ...maleProfilePool].forEach((entry) => {
      if (!entry.image.startsWith("/images/")) {
        return;
      }

      const imagePath = path.join(process.cwd(), "public", entry.image.slice(1));
      const hash = createHash("sha1").update(fs.readFileSync(imagePath)).digest("hex");
      const names = imageToNames.get(hash) ?? [];
      names.push(entry.name);
      imageToNames.set(hash, names);
    });

    const duplicates = [...imageToNames.values()].filter((names) => names.length > 1);

    expect(duplicates).toEqual([]);
  });

  test("全カテゴリのスコアは降順である", () => {
    allCategories.forEach((category) => {
      const scores = category.ranking.map((entry) => entry.score);
      expect(scores).toEqual([...scores].sort((left, right) => right - left));
    });
  });

  test("推定身長ランキングが推定身長の降順である", () => {
    [femaleCategories, maleCategories].forEach((categories) => {
      const ranking = getCategory(categories, "estimatedHeight").ranking;

      expect(ranking.map((entry) => entry.estimatedHeight)).toEqual(
        [...ranking]
          .map((entry) => entry.estimatedHeight)
          .sort((left, right) => right - left)
      );
    });
  });

  test("推定カップ数ランキングが推定カップの降順である", () => {
    const ranking = getCategory(femaleCategories, "estimatedCup").ranking;
    const cupIndexes = ranking.map((entry) =>
      estimatedCupOrder.indexOf(
        entry.estimatedCup as (typeof estimatedCupOrder)[number]
      )
    );

    expect(cupIndexes).toEqual([...cupIndexes].sort((left, right) => right - left));
    ranking.forEach((entry) => {
      expect(entry.score).toBe(
        estimatedCupOrder.indexOf(
          entry.estimatedCup as (typeof estimatedCupOrder)[number]
        ) + 1
      );
    });
  });

  test("女性 style score は身長偏差値とカップ偏差値の平均になる", () => {
    const ranking = getCategory(femaleCategories, "style").ranking;

    ranking.forEach((entry) => {
      const heightDeviation = calculateDeviation(
        entry.actualHeight,
        FEMALE_STATS.height.mean,
        FEMALE_STATS.height.stddev
      );
      const cupDeviation = calculateCupDeviation(
        getPreferredCupLabel(entry) ?? entry.cup!
      );

      expect(entry.score).toBe(Math.round((heightDeviation + cupDeviation) / 2));
    });
  });

  test("男性 style score は身長偏差値そのままになる", () => {
    const ranking = getCategory(maleCategories, "style").ranking;

    ranking.forEach((entry) => {
      expect(entry.score).toBe(
        calculateDeviation(
          entry.actualHeight,
          MALE_STATS.height.mean,
          MALE_STATS.height.stddev
        )
      );
    });
  });

  test("ranking.json は生成ロジックの結果と一致する", () => {
    expect(rankingData).toEqual(buildRankingData());
  });
});
