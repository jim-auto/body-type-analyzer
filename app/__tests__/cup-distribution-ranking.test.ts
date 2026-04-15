import rankingDataJson from "../../public/data/ranking.json";
import type { RankingData } from "@/lib/ranking";
import { femaleProfilePool } from "@/lib/source-profiles";
import {
  FEMALE_STATS,
  calculateCupDeviation,
  calculateDeviation,
} from "@/lib/statistics";

const rankingData = rankingDataJson as RankingData;
const styleRanking =
  rankingData.female.find((category) => category.category === "style")?.ranking ?? [];
const estimatedHeightRanking =
  rankingData.female.find((category) => category.category === "estimatedHeight")
    ?.ranking ?? [];

describe("female cup distribution and style ranking", () => {
  test("女性プロフィール母集団が全カップ帯をカバーする", () => {
    const counts = femaleProfilePool.reduce<Record<string, number>>((result, entry) => {
      result[entry.cup!] = (result[entry.cup!] ?? 0) + 1;
      return result;
    }, {});

    const cupLabels = Object.keys(counts).sort();

    expect(cupLabels).toEqual(
      expect.arrayContaining(["A", "B", "C", "D", "E", "F", "G", "H"])
    );
    expect(cupLabels.some((cup) => /^[I-Z]$/u.test(cup))).toBe(true);
    expect(Object.values(counts).every((count) => count > 0)).toBe(true);
    expect(styleRanking).toHaveLength(femaleProfilePool.length);
    expect(estimatedHeightRanking).toHaveLength(femaleProfilePool.length);
  });

  test("女性 style ランキングの score は身長偏差値とカップ偏差値の平均になる", () => {
    styleRanking.forEach((entry) => {
      expect(entry.score).toBe(
        Math.round(
          (
            calculateDeviation(
              entry.actualHeight,
              FEMALE_STATS.height.mean,
              FEMALE_STATS.height.stddev
            ) + calculateCupDeviation(entry.cup!)
          ) / 2
        )
      );
    });
  });

  test("女性 style ランキングは AI推定身長ランキングと別順位になる", () => {
    expect(styleRanking.map((entry) => entry.name)).not.toEqual(
      estimatedHeightRanking.map((entry) => entry.name)
    );
  });
});
