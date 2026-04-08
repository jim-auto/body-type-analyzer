import {
  type FemaleRankingEntry,
  type MaleRankingEntry,
  type RankingData,
} from "./ranking.ts";
import {
  getCupDifference,
  getEstimatedCupFromBust,
  getEstimatedHeight,
  getNameSeed,
} from "./profile-estimates.ts";
import { femaleProfilePool, maleProfilePool } from "./source-profiles.ts";
import {
  FEMALE_STATS,
  MALE_STATS,
  calculateCupDeviation,
  calculateDeviation,
  getCupSortValue,
} from "./statistics.ts";

const RANKING_LIMIT = 20;
const ESTIMATED_CUP_ORDER = ["A", "B", "C", "D", "E", "F", "G"] as const;

function cloneRanking<T extends FemaleRankingEntry | MaleRankingEntry>(
  entries: T[]
): T[] {
  return entries.map((entry) => ({ ...entry }));
}

function buildFemaleBaseEntry(
  profile: (typeof femaleProfilePool)[number]
): Omit<FemaleRankingEntry, "score"> {
  const estimatedHeight = getEstimatedHeight(profile.actualHeight, profile.name);
  const estimatedCup = getEstimatedCupFromBust(profile.bust);

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
  const estimatedHeight = getEstimatedHeight(profile.actualHeight, profile.name);

  return {
    ...profile,
    estimatedHeight,
    heightDiff: estimatedHeight - profile.actualHeight,
  };
}

function buildFemaleHeightRanking(): FemaleRankingEntry[] {
  return femaleProfilePool
    .map((profile) => ({
      ...buildFemaleBaseEntry(profile),
      score: calculateDeviation(
        profile.actualHeight,
        FEMALE_STATS.height.mean,
        FEMALE_STATS.height.stddev
      ),
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.actualHeight - left.actualHeight ||
        left.name.localeCompare(right.name, "ja")
    )
    .slice(0, RANKING_LIMIT);
}

function buildFemaleUpperBodyRanking(): FemaleRankingEntry[] {
  return femaleProfilePool
    .map((profile) => {
      const entry = buildFemaleBaseEntry(profile);
      const cupForRanking = profile.cup ?? entry.estimatedCup;
      const metric = profile.bust ?? profile.actualHeight;
      const cupSortValue = getCupSortValue(cupForRanking);
      const score = cupForRanking
        ? calculateCupDeviation(cupForRanking)
        : calculateDeviation(
            profile.actualHeight,
            FEMALE_STATS.height.mean,
            FEMALE_STATS.height.stddev
          );

      return {
        ...entry,
        metric,
        cupSortValue,
        score,
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.cupSortValue - left.cupSortValue ||
        right.metric - left.metric ||
        right.actualHeight - left.actualHeight ||
        left.name.localeCompare(right.name, "ja")
    )
    .slice(0, RANKING_LIMIT)
    .map(({ metric: _metric, cupSortValue: _cupSortValue, ...entry }) => entry);
}

function buildMaleHeightRanking(): MaleRankingEntry[] {
  return maleProfilePool
    .map((profile) => ({
      ...buildMaleBaseEntry(profile),
      score: calculateDeviation(
        profile.actualHeight,
        MALE_STATS.height.mean,
        MALE_STATS.height.stddev
      ),
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.actualHeight - left.actualHeight ||
        left.name.localeCompare(right.name, "ja")
    )
    .slice(0, RANKING_LIMIT);
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
    )
    .slice(0, RANKING_LIMIT);
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
    )
    .slice(0, RANKING_LIMIT);
}

function buildMaleUpperBodyRanking(): MaleRankingEntry[] {
  return maleProfilePool
    .map((profile) => {
      const adjustment = (getNameSeed(profile.name) % 7) - 3;
      const adjustedHeight = profile.actualHeight + adjustment;

      return {
        ...buildMaleBaseEntry(profile),
        adjustedHeight,
        score: calculateDeviation(
          adjustedHeight,
          MALE_STATS.height.mean,
          MALE_STATS.height.stddev
        ),
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.adjustedHeight - left.adjustedHeight ||
        right.actualHeight - left.actualHeight ||
        left.name.localeCompare(right.name, "ja")
    )
    .slice(0, RANKING_LIMIT)
    .map(({ adjustedHeight: _adjustedHeight, ...entry }) => entry);
}

function buildMaleProportionRanking(): MaleRankingEntry[] {
  return maleProfilePool
    .map((profile) => {
      const entry = buildMaleBaseEntry(profile);
      const accuracy = 10 - Math.abs(entry.estimatedHeight - profile.actualHeight);

      return {
        ...entry,
        accuracy,
        score:
          calculateDeviation(
            profile.actualHeight,
            MALE_STATS.height.mean,
            MALE_STATS.height.stddev
          ) + Math.round(accuracy / 2),
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.accuracy - left.accuracy ||
        right.actualHeight - left.actualHeight ||
        left.name.localeCompare(right.name, "ja")
    )
    .slice(0, RANKING_LIMIT)
    .map(({ accuracy: _accuracy, ...entry }) => entry);
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
    )
    .slice(0, RANKING_LIMIT);
}

export function buildRankingData(): RankingData {
  const femaleHeightRanking = buildFemaleHeightRanking();
  const femaleUpperBodyRanking = buildFemaleUpperBodyRanking();
  const femaleEstimatedHeightRanking = buildFemaleEstimatedHeightRanking();
  const femaleEstimatedCupRanking = buildFemaleEstimatedCupRanking();
  const maleHeightRanking = buildMaleHeightRanking();
  const maleUpperBodyRanking = buildMaleUpperBodyRanking();
  const maleProportionRanking = buildMaleProportionRanking();
  const maleEstimatedHeightRanking = buildMaleEstimatedHeightRanking();

  return {
    female: [
      {
        category: "silhouette",
        title: "シルエットバランス偏差値",
        ranking: cloneRanking(femaleHeightRanking),
      },
      {
        category: "upperBody",
        title: "上半身バランス偏差値",
        ranking: femaleUpperBodyRanking,
      },
      {
        category: "proportion",
        title: "プロポーション調和スコア",
        ranking: cloneRanking(femaleHeightRanking),
      },
      {
        category: "estimatedHeight",
        title: "AI推定身長ランキング",
        ranking: femaleEstimatedHeightRanking,
      },
      {
        category: "estimatedCup",
        title: "AI推定カップ数ランキング",
        ranking: femaleEstimatedCupRanking,
      },
    ],
    male: [
      {
        category: "silhouette",
        title: "シルエットバランス偏差値",
        ranking: cloneRanking(maleHeightRanking),
      },
      {
        category: "upperBody",
        title: "上半身バランス偏差値",
        ranking: maleUpperBodyRanking,
      },
      {
        category: "proportion",
        title: "プロポーション調和スコア",
        ranking: maleProportionRanking,
      },
      {
        category: "estimatedHeight",
        title: "AI推定身長ランキング",
        ranking: maleEstimatedHeightRanking,
      },
    ],
  };
}
