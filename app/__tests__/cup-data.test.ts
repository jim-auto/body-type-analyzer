import fs from "node:fs";
import path from "node:path";

import rankingData from "../../public/data/ranking.json";
import {
  FEMALE_STATS,
  MALE_STATS,
  calculateDeviation,
} from "@/lib/statistics";

type FemaleRankingEntry = {
  name: string;
  score: number;
  image: string;
  cup: string | null;
  actualHeight: number;
  bust: number | null;
};

type MaleRankingEntry = {
  name: string;
  score: number;
  image: string;
  actualHeight: number;
};

type FemaleCategory = {
  category: string;
  title: string;
  ranking: FemaleRankingEntry[];
};

type MaleCategory = {
  category: string;
  title: string;
  ranking: MaleRankingEntry[];
};

const validCups = new Set(["A", "B", "C", "D", "E", "F", "G"]);

const femaleCategories = rankingData.female as FemaleCategory[];
const maleCategories = rankingData.male as MaleCategory[];
const femaleEntries = femaleCategories.flatMap((category) => category.ranking);
const maleEntries = maleCategories.flatMap((category) => category.ranking);

describe("ranking.json actual profile data", () => {
  test("女性カテゴリが3つ、男性カテゴリが3つである", () => {
    expect(femaleCategories).toHaveLength(3);
    expect(maleCategories).toHaveLength(3);
  });

  test("各カテゴリのランキングが5人である", () => {
    [...femaleCategories, ...maleCategories].forEach((category) => {
      expect(category.ranking).toHaveLength(5);
    });
  });

  test("女性エントリにactualHeightがある", () => {
    femaleEntries.forEach((entry) => {
      expect(entry.actualHeight).toEqual(expect.any(Number));
    });
  });

  test("女性エントリにbustがありnullまたは数値である", () => {
    femaleEntries.forEach((entry) => {
      expect(entry).toHaveProperty("bust");
      expect(entry.bust === null || typeof entry.bust === "number").toBe(true);
    });
  });

  test("actualHeightは140〜190の範囲内である", () => {
    [...femaleEntries, ...maleEntries].forEach((entry) => {
      expect(entry.actualHeight).toBeGreaterThanOrEqual(140);
      expect(entry.actualHeight).toBeLessThanOrEqual(190);
    });
  });

  test("bustはnullまたは70〜110の範囲内である", () => {
    femaleEntries.forEach((entry) => {
      if (entry.bust === null) {
        expect(entry.bust).toBeNull();
        return;
      }

      expect(entry.bust).toBeGreaterThanOrEqual(70);
      expect(entry.bust).toBeLessThanOrEqual(110);
    });
  });

  test("女性のcupはnullまたはA〜Gである", () => {
    femaleEntries.forEach((entry) => {
      expect(entry.cup === null || validCups.has(entry.cup)).toBe(true);
    });
  });

  test("男性エントリにactualHeightがある", () => {
    maleEntries.forEach((entry) => {
      expect(entry.actualHeight).toEqual(expect.any(Number));
    });
  });

  test("男性エントリにbust/cupがない", () => {
    maleEntries.forEach((entry) => {
      expect(entry).not.toHaveProperty("bust");
      expect(entry).not.toHaveProperty("cup");
    });
  });

  test("画像パスが/images/で始まりファイルが存在する", () => {
    [...femaleEntries, ...maleEntries].forEach((entry) => {
      expect(entry.image.startsWith("/images/")).toBe(true);

      const imagePath = path.join(process.cwd(), "public", entry.image.slice(1));
      expect(fs.existsSync(imagePath)).toBe(true);
    });
  });

  test("全カテゴリのスコアは降順である", () => {
    [...femaleCategories, ...maleCategories].forEach((category) => {
      const scores = category.ranking.map((entry) => entry.score);
      expect(scores).toEqual([...scores].sort((a, b) => b - a));
    });
  });

  test("女性シルエットカテゴリのscoreは身長偏差値で計算されている", () => {
    const silhouette = femaleCategories.find(
      (category) => category.category === "silhouette"
    );

    expect(silhouette).toBeDefined();
    silhouette?.ranking.forEach((entry) => {
      expect(entry.score).toBe(
        calculateDeviation(
          entry.actualHeight,
          FEMALE_STATS.height.mean,
          FEMALE_STATS.height.stddev
        )
      );
    });
  });

  test("女性上半身カテゴリのscoreはbustがあればバスト偏差値、なければ身長偏差値である", () => {
    const upperBody = femaleCategories.find(
      (category) => category.category === "upperBody"
    );

    expect(upperBody).toBeDefined();
    upperBody?.ranking.forEach((entry) => {
      const expectedScore =
        entry.bust === null
          ? calculateDeviation(
              entry.actualHeight,
              FEMALE_STATS.height.mean,
              FEMALE_STATS.height.stddev
            )
          : calculateDeviation(
              entry.bust,
              FEMALE_STATS.bust.mean,
              FEMALE_STATS.bust.stddev
            );

      expect(entry.score).toBe(expectedScore);
    });
  });

  test("女性プロポーションカテゴリのscoreは身長偏差値で計算されている", () => {
    const proportion = femaleCategories.find(
      (category) => category.category === "proportion"
    );

    expect(proportion).toBeDefined();
    proportion?.ranking.forEach((entry) => {
      expect(entry.score).toBe(
        calculateDeviation(
          entry.actualHeight,
          FEMALE_STATS.height.mean,
          FEMALE_STATS.height.stddev
        )
      );
    });
  });

  test("男性全カテゴリのscoreは身長偏差値で計算されている", () => {
    maleCategories.forEach((category) => {
      category.ranking.forEach((entry) => {
        expect(entry.score).toBe(
          calculateDeviation(
            entry.actualHeight,
            MALE_STATS.height.mean,
            MALE_STATS.height.stddev
          )
        );
      });
    });
  });

  test("女性・男性ともに重複しない15人ずつで構成されている", () => {
    expect(new Set(femaleEntries.map((entry) => entry.name)).size).toBe(15);
    expect(new Set(maleEntries.map((entry) => entry.name)).size).toBe(15);
  });
});
