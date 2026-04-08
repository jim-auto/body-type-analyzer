import fs from "node:fs";
import path from "node:path";

import rankingData from "../../public/data/ranking.json";
import { buildRankingData } from "@/lib/ranking-builder";
import {
  getCupDifference,
  getEstimatedCupFromBust,
  getEstimatedHeight,
  getNameSeed,
} from "@/lib/profile-estimates";
import type {
  FemaleRankingEntry,
  MaleRankingEntry,
  RankingData,
} from "@/lib/ranking";
import { femaleProfilePool, maleProfilePool } from "@/lib/source-profiles";
import {
  FEMALE_STATS,
  MALE_STATS,
  calculateDeviation,
} from "@/lib/statistics";

const validCups = new Set(["A", "B", "C", "D", "E", "F", "G", "H"]);
const estimatedCupOrder = ["A", "B", "C", "D", "E", "F", "G"] as const;
const expectedRankingData = buildRankingData();

const femaleCategories = rankingData.female as RankingData["female"];
const maleCategories = rankingData.male as RankingData["male"];
const allCategories = [...femaleCategories, ...maleCategories];
const standardCategories = allCategories.filter(
  (category) =>
    category.category !== "estimatedHeight" && category.category !== "estimatedCup"
);

const femaleEntries = femaleCategories.flatMap((category) => category.ranking);
const maleEntries = maleCategories.flatMap((category) => category.ranking);

const currentLocalImageNames = new Set([
  "新垣結衣",
  "佐々木希",
  "綾瀬はるか",
  "深田恭子",
  "石原さとみ",
  "長澤まさみ",
  "浜辺美波",
  "橋本環奈",
  "広瀬すず",
  "北川景子",
  "菜々緒",
  "中条あやみ",
  "今田美桜",
  "藤田ニコル",
  "斎藤工",
  "向井理",
  "福山雅治",
  "玉木宏",
  "竹野内豊",
  "鈴木亮平",
  "松坂桃李",
  "西島秀俊",
  "佐藤健",
  "山田孝之",
  "田中圭",
  "岩田剛典",
  "横浜流星",
  "吉沢亮",
  "中村倫也",
]);

const findFemaleEntry = (categoryKey: string, name: string) =>
  femaleCategories
    .find((category) => category.category === categoryKey)
    ?.ranking.find((entry) => entry.name === name);

const findMaleEntry = (categoryKey: string, name: string) =>
  maleCategories
    .find((category) => category.category === categoryKey)
    ?.ranking.find((entry) => entry.name === name);

describe("ranking.json actual profile data", () => {
  test("女性カテゴリが5つ、男性カテゴリが4つである", () => {
    expect(femaleCategories).toHaveLength(5);
    expect(maleCategories).toHaveLength(4);
  });

  test('女性に "AI推定身長ランキング" カテゴリが存在する', () => {
    expect(
      femaleCategories.find((category) => category.category === "estimatedHeight")
    ).toMatchObject({
      category: "estimatedHeight",
      title: "AI推定身長ランキング",
    });
  });

  test('女性に "AI推定カップ数ランキング" カテゴリが存在する', () => {
    expect(
      femaleCategories.find((category) => category.category === "estimatedCup")
    ).toMatchObject({
      category: "estimatedCup",
      title: "AI推定カップ数ランキング",
    });
  });

  test('男性に "AI推定身長ランキング" カテゴリが存在する', () => {
    expect(
      maleCategories.find((category) => category.category === "estimatedHeight")
    ).toMatchObject({
      category: "estimatedHeight",
      title: "AI推定身長ランキング",
    });
  });

  test("女性・男性のソース母集団が35人以上ある", () => {
    expect(new Set(femaleProfilePool.map((entry) => entry.name)).size).toBeGreaterThanOrEqual(35);
    expect(new Set(maleProfilePool.map((entry) => entry.name)).size).toBeGreaterThanOrEqual(35);
  });

  test("各カテゴリのランキングが20人である", () => {
    allCategories.forEach((category) => {
      expect(category.ranking).toHaveLength(20);
    });
  });

  test("女性エントリにactualHeightがある", () => {
    femaleEntries.forEach((entry) => {
      expect(entry.actualHeight).toEqual(expect.any(Number));
    });
  });

  test("男性エントリにactualHeightがある", () => {
    maleEntries.forEach((entry) => {
      expect(entry.actualHeight).toEqual(expect.any(Number));
    });
  });

  test("全エントリに estimatedHeight と heightDiff がある", () => {
    [...femaleEntries, ...maleEntries].forEach((entry) => {
      expect(entry.estimatedHeight).toBe(
        getEstimatedHeight(entry.actualHeight, entry.name)
      );
      expect(entry.heightDiff).toBe(entry.estimatedHeight - entry.actualHeight);
    });
  });

  test("女性エントリのbustとcupが妥当な形式である", () => {
    femaleEntries.forEach((entry) => {
      expect(entry).toHaveProperty("bust");
      expect(entry.bust === null || typeof entry.bust === "number").toBe(true);
      expect(entry.cup === null || validCups.has(entry.cup)).toBe(true);
      expect(entry.estimatedCup).toBe(getEstimatedCupFromBust(entry.bust));
      expect(entry.cupDiff).toBe(getCupDifference(entry.cup, entry.estimatedCup));
    });
  });

  test("男性エントリにbust/cupがない", () => {
    maleEntries.forEach((entry) => {
      expect(entry).not.toHaveProperty("bust");
      expect(entry).not.toHaveProperty("cup");
    });
  });

  test("local image と ui-avatars のパス形式が正しい", () => {
    [...femaleProfilePool, ...maleProfilePool].forEach((entry) => {
      if (entry.image.startsWith("/images/")) {
        const imagePath = path.join(process.cwd(), "public", entry.image.slice(1));
        expect(fs.existsSync(imagePath)).toBe(true);
        return;
      }

      expect(entry.image).toMatch(
        /^https:\/\/ui-avatars\.com\/api\/\?name=.+&size=300&background=random&color=fff&bold=true$/
      );
    });
  });

  test("既存のローカル画像対象者は image パスを維持している", () => {
    [...femaleProfilePool, ...maleProfilePool]
      .filter((entry) => currentLocalImageNames.has(entry.name))
      .forEach((entry) => {
        expect(entry.image.startsWith("/images/")).toBe(true);
      });
  });

  test("全カテゴリのスコアは降順である", () => {
    allCategories.forEach((category) => {
      const scores = category.ranking.map((entry) => entry.score);
      expect(scores).toEqual([...scores].sort((left, right) => right - left));
    });
  });

  test("推定身長ランキングが推定身長の降順である", () => {
    [femaleCategories, maleCategories].forEach((categories) => {
      const ranking = categories.find(
        (category) => category.category === "estimatedHeight"
      )?.ranking;

      expect(ranking).toBeDefined();
      expect(ranking?.map((entry) => entry.estimatedHeight)).toEqual(
        [...(ranking ?? [])]
          .map((entry) => entry.estimatedHeight)
          .sort((left, right) => right - left)
      );
    });
  });

  test("推定カップ数ランキングがカップの大きさ降順である", () => {
    const ranking =
      femaleCategories.find((category) => category.category === "estimatedCup")
        ?.ranking ?? [];

    const cupIndexes = ranking.map((entry) =>
      estimatedCupOrder.indexOf(
        entry.estimatedCup as (typeof estimatedCupOrder)[number]
      )
    );

    expect(cupIndexes).toEqual([...cupIndexes].sort((left, right) => right - left));
  });

  test("推定カップ数ランキングの score が全員同じではない", () => {
    const ranking =
      femaleCategories.find((category) => category.category === "estimatedCup")
        ?.ranking ?? [];

    expect(new Set(ranking.map((entry) => entry.score)).size).toBeGreaterThan(1);
    ranking.forEach((entry) => {
      expect(entry.score).toBe(
        estimatedCupOrder.indexOf(
          entry.estimatedCup as (typeof estimatedCupOrder)[number]
        ) + 1
      );
    });
  });

  test("推定身長ランキングの各エントリに estimatedHeight がある", () => {
    [femaleCategories, maleCategories].forEach((categories) => {
      categories
        .find((category) => category.category === "estimatedHeight")
        ?.ranking.forEach((entry) => {
          expect(entry.estimatedHeight).toEqual(expect.any(Number));
        });
    });
  });

  test("推定カップ数ランキングの各エントリに estimatedCup がある", () => {
    femaleCategories
      .find((category) => category.category === "estimatedCup")
      ?.ranking.forEach((entry) => {
        expect(entry.estimatedCup).toEqual(expect.any(String));
      });
  });

  test("heightDiff が estimatedHeight - actualHeight と一致する", () => {
    [femaleCategories, maleCategories].forEach((categories) => {
      categories
        .find((category) => category.category === "estimatedHeight")
        ?.ranking.forEach((entry) => {
          expect(entry.heightDiff).toBe(entry.estimatedHeight - entry.actualHeight);
        });
    });
  });

  test("ranking.json は生成ロジックの結果と一致する", () => {
    expect(rankingData).toEqual(expectedRankingData);
  });

  test("score のスポットチェックが calculateDeviation と一致する", () => {
    expect(findFemaleEntry("silhouette", "菜々緒")?.score).toBe(
      calculateDeviation(
        172,
        FEMALE_STATS.height.mean,
        FEMALE_STATS.height.stddev
      )
    );
    expect(findFemaleEntry("silhouette", "泉里香")?.score).toBe(
      calculateDeviation(
        166,
        FEMALE_STATS.height.mean,
        FEMALE_STATS.height.stddev
      )
    );
    expect(findFemaleEntry("upperBody", "原幹恵")?.score).toBe(
      calculateDeviation(94, FEMALE_STATS.bust.mean, FEMALE_STATS.bust.stddev)
    );
    expect(findFemaleEntry("upperBody", "浜辺美波")?.score).toBe(
      calculateDeviation(
        157,
        FEMALE_STATS.height.mean,
        FEMALE_STATS.height.stddev
      )
    );
    expect(findMaleEntry("silhouette", "鈴木亮平")?.score).toBe(
      calculateDeviation(186, MALE_STATS.height.mean, MALE_STATS.height.stddev)
    );
    expect(findMaleEntry("silhouette", "木村拓哉")?.score).toBe(
      calculateDeviation(176, MALE_STATS.height.mean, MALE_STATS.height.stddev)
    );
  });

  test("男性差別化カテゴリの score が想定式と一致する", () => {
    const upperBodyAdjustment = (getNameSeed("鈴木亮平") % 7) - 3;
    const proportionEstimatedHeight = getEstimatedHeight(186, "鈴木亮平");
    const accuracy = 10 - Math.abs(proportionEstimatedHeight - 186);

    expect(findMaleEntry("upperBody", "鈴木亮平")?.score).toBe(
      calculateDeviation(
        186 + upperBodyAdjustment,
        MALE_STATS.height.mean,
        MALE_STATS.height.stddev
      )
    );
    expect(findMaleEntry("proportion", "鈴木亮平")?.score).toBe(
      calculateDeviation(186, MALE_STATS.height.mean, MALE_STATS.height.stddev) +
        Math.round(accuracy / 2)
    );
  });

  test("男性の3カテゴリの順位が完全一致しない", () => {
    const rankingNames = ["silhouette", "upperBody", "proportion"].map(
      (categoryKey) =>
        maleCategories
          .find((category) => category.category === categoryKey)
          ?.ranking.map((entry) => entry.name) ?? []
    );

    expect(rankingNames[0]).not.toEqual(rankingNames[1]);
    expect(rankingNames[0]).not.toEqual(rankingNames[2]);
    expect(rankingNames[1]).not.toEqual(rankingNames[2]);
  });

  test("偏差値の分布が30〜80の範囲に収まる", () => {
    standardCategories.flatMap((category) => category.ranking).forEach((entry) => {
      expect(entry.score).toBeGreaterThanOrEqual(30);
      expect(entry.score).toBeLessThanOrEqual(80);
    });
  });
});
