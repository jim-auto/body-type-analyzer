import {
  type FemaleRankingEntry,
  type MaleRankingEntry,
  type RankingData,
} from "./ranking.ts";
import {
  getCupDifference,
} from "./profile-estimates.ts";
import {
  getFemaleRankingEstimatedCup,
  getFemaleRankingEstimatedHeight,
  getMaleRankingEstimatedHeight,
} from "./ranking-estimates.ts";
import { femaleProfilePool, maleProfilePool } from "./source-profiles.ts";
import {
  FEMALE_STATS,
  MALE_STATS,
  calculateCupDeviation,
  calculateDeviation,
  getCupSortValue,
} from "./statistics.ts";

const ESTIMATED_CUP_ORDER = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

function buildFemaleBaseEntry(
  profile: (typeof femaleProfilePool)[number]
): Omit<FemaleRankingEntry, "score"> {
  const estimatedHeight = getFemaleRankingEstimatedHeight(profile);
  const estimatedCup = getFemaleRankingEstimatedCup(profile);

  return {
    ...profile,
    estimatedHeight,
    heightDiff: estimatedHeight - profile.actualHeight,
    estimatedCup,
    cupDiff: getCupDifference(profile.cup, estimatedCup),
  };
}

function buildMaleBaseEntry(
  profile: (typeof maleProfilePool)[number]
): Omit<MaleRankingEntry, "score"> {
  const estimatedHeight = getMaleRankingEstimatedHeight(profile);

  return {
    ...profile,
    estimatedHeight,
    heightDiff: estimatedHeight - profile.actualHeight,
  };
}

function getFemaleHeightDeviation(actualHeight: number): number {
  return calculateDeviation(
    actualHeight,
    FEMALE_STATS.height.mean,
    FEMALE_STATS.height.stddev
  );
}

function getMaleHeightDeviation(actualHeight: number): number {
  return calculateDeviation(
    actualHeight,
    MALE_STATS.height.mean,
    MALE_STATS.height.stddev
  );
}

function buildFemaleStyleRanking(): FemaleRankingEntry[] {
  return femaleProfilePool
    .map((profile) => {
      const entry = buildFemaleBaseEntry(profile);
      const heightDeviation = getFemaleHeightDeviation(profile.actualHeight);
      const cupDeviation = profile.cup
        ? calculateCupDeviation(profile.cup)
        : null;

      return {
        ...entry,
        cupSortValue: getCupSortValue(profile.cup),
        score:
          cupDeviation === null
            ? heightDeviation
            : Math.round((heightDeviation + cupDeviation) / 2),
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.cupSortValue - left.cupSortValue ||
        (right.bust ?? 0) - (left.bust ?? 0) ||
        right.actualHeight - left.actualHeight ||
        left.name.localeCompare(right.name, "ja")
    )
    .map(({ cupSortValue: _cupSortValue, ...entry }) => entry);
}

function buildMaleStyleRanking(): MaleRankingEntry[] {
  return maleProfilePool
    .map((profile) => ({
      ...buildMaleBaseEntry(profile),
      score: getMaleHeightDeviation(profile.actualHeight),
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.actualHeight - left.actualHeight ||
        left.name.localeCompare(right.name, "ja")
    );
}

function buildFemaleEstimatedHeightRanking(): FemaleRankingEntry[] {
  return femaleProfilePool
    .map((profile) => {
      const entry = buildFemaleBaseEntry(profile);

      return {
        ...entry,
        score: entry.estimatedHeight,
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.actualHeight - left.actualHeight ||
        left.name.localeCompare(right.name, "ja")
    );
}

function buildFemaleEstimatedCupRanking(): FemaleRankingEntry[] {
  return femaleProfilePool
    .map((profile) => buildFemaleBaseEntry(profile))
    .filter(
      (
        entry
      ): entry is Omit<FemaleRankingEntry, "score"> & { estimatedCup: string } =>
        entry.estimatedCup !== null
    )
    .map((entry) => ({
      ...entry,
      score:
        ESTIMATED_CUP_ORDER.indexOf(
          entry.estimatedCup as (typeof ESTIMATED_CUP_ORDER)[number]
        ) + 1,
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        (right.bust ?? 0) - (left.bust ?? 0) ||
        right.actualHeight - left.actualHeight ||
        left.name.localeCompare(right.name, "ja")
    );
}

function buildMaleEstimatedHeightRanking(): MaleRankingEntry[] {
  return maleProfilePool
    .map((profile) => {
      const entry = buildMaleBaseEntry(profile);

      return {
        ...entry,
        score: entry.estimatedHeight,
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.actualHeight - left.actualHeight ||
        left.name.localeCompare(right.name, "ja")
    );
}

export function buildRankingData(): RankingData {
  return {
    female: [
      {
        category: "style",
        title: "スタイル偏差値ランキング",
        ranking: buildFemaleStyleRanking(),
      },
      {
        category: "estimatedHeight",
        title: "AI推定身長ランキング",
        ranking: buildFemaleEstimatedHeightRanking(),
      },
      {
        category: "estimatedCup",
        title: "AI推定カップ数ランキング",
        ranking: buildFemaleEstimatedCupRanking(),
      },
    ],
    male: [
      {
        category: "style",
        title: "スタイル偏差値ランキング",
        ranking: buildMaleStyleRanking(),
      },
      {
        category: "estimatedHeight",
        title: "AI推定身長ランキング",
        ranking: buildMaleEstimatedHeightRanking(),
      },
    ],
  };
}
