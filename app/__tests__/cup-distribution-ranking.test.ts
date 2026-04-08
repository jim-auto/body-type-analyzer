import rankingData from "../../public/data/ranking.json";
import { getEstimatedCupFromBust } from "@/lib/profile-estimates";
import type { RankingData } from "@/lib/ranking";
import { femaleProfilePool } from "@/lib/source-profiles";
import { calculateCupDeviation } from "@/lib/statistics";

const femaleCategories = (rankingData as RankingData).female;

describe("female upperBody ranking", () => {
  test("uses explicit cup data when available", () => {
    const explicitCupProfile = femaleProfilePool.find((entry) => entry.cup === "G");
    const upperBodyRanking =
      femaleCategories.find((category) => category.category === "upperBody")
        ?.ranking ?? [];
    const explicitCupEntry = upperBodyRanking.find(
      (entry) => entry.name === explicitCupProfile?.name
    );

    expect(explicitCupProfile).toBeDefined();
    expect(explicitCupEntry).toBeDefined();
    expect(explicitCupEntry?.score).toBe(
      calculateCupDeviation(explicitCupProfile!.cup!)
    );
  });

  test("falls back to estimated cup when only bust is available", () => {
    const upperBodyRanking =
      femaleCategories.find((category) => category.category === "upperBody")
        ?.ranking ?? [];
    const estimatedCupEntry = upperBodyRanking.find(
      (entry) => entry.cup === null && entry.estimatedCup !== null
    );
    const estimatedCupProfile = femaleProfilePool.find(
      (entry) => entry.name === estimatedCupEntry?.name
    );

    expect(estimatedCupEntry).toBeDefined();
    expect(estimatedCupProfile).toBeDefined();
    expect(estimatedCupEntry?.score).toBe(
      calculateCupDeviation(getEstimatedCupFromBust(estimatedCupProfile!.bust)!)
    );
  });

  test("keeps large cups near the top of the ranking", () => {
    const upperBodyRanking =
      femaleCategories.find((category) => category.category === "upperBody")
        ?.ranking ?? [];
    const topThreeCups = upperBodyRanking
      .slice(0, 3)
      .map((entry) => entry.cup ?? entry.estimatedCup);
    const hCupEntry = upperBodyRanking.find((entry) => entry.cup === "H");
    const cCupEntry = upperBodyRanking.find((entry) => entry.cup === "C");

    expect(topThreeCups.some((cup) => cup === "G" || cup === "H")).toBe(true);
    expect(hCupEntry).toBeDefined();
    expect(cCupEntry).toBeDefined();
    expect(hCupEntry?.score).toBeGreaterThan(cCupEntry!.score);
  });
});
