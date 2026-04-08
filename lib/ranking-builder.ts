import {
  type FemaleRankingEntry,
  type MaleRankingEntry,
  type RankingData,
} from "./ranking.ts";
import { femaleProfilePool, maleProfilePool } from "./source-profiles.ts";
import { FEMALE_STATS, MALE_STATS, calculateDeviation } from "./statistics.ts";

const RANKING_LIMIT = 20;

function cloneRanking<T extends FemaleRankingEntry | MaleRankingEntry>(
  entries: T[]
): T[] {
  return entries.map((entry) => ({ ...entry }));
}

function buildFemaleHeightRanking(): FemaleRankingEntry[] {
  return femaleProfilePool
    .map((profile) => ({
      ...profile,
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
      const metric = profile.bust ?? profile.actualHeight;
      const score =
        profile.bust === null
          ? calculateDeviation(
              profile.actualHeight,
              FEMALE_STATS.height.mean,
              FEMALE_STATS.height.stddev
            )
          : calculateDeviation(
              profile.bust,
              FEMALE_STATS.bust.mean,
              FEMALE_STATS.bust.stddev
            );

      return {
        ...profile,
        metric,
        score,
      };
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.metric - left.metric ||
        right.actualHeight - left.actualHeight ||
        left.name.localeCompare(right.name, "ja")
    )
    .slice(0, RANKING_LIMIT)
    .map(({ metric: _metric, ...entry }) => entry);
}

function buildMaleHeightRanking(): MaleRankingEntry[] {
  return maleProfilePool
    .map((profile) => ({
      ...profile,
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

export function buildRankingData(): RankingData {
  const femaleHeightRanking = buildFemaleHeightRanking();
  const femaleUpperBodyRanking = buildFemaleUpperBodyRanking();
  const maleHeightRanking = buildMaleHeightRanking();

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
        ranking: cloneRanking(maleHeightRanking),
      },
      {
        category: "proportion",
        title: "プロポーション調和スコア",
        ranking: cloneRanking(maleHeightRanking),
      },
    ],
  };
}
