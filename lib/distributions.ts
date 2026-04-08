import { femaleProfilePool, maleProfilePool } from "./source-profiles.ts";
import {
  getFemaleRankingEstimatedCup,
  getMaleRankingEstimatedHeight,
} from "./ranking-estimates.ts";
import {
  CUP_DISTRIBUTION,
  CUP_DISTRIBUTION_SOURCE,
  MALE_STATS,
} from "./statistics.ts";

const FEMALE_CUP_ORDER = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;
const MALE_HEIGHT_BUCKETS = [
  { label: "165cm未満", min: Number.NEGATIVE_INFINITY, max: 165 },
  { label: "165-169cm", min: 165, max: 170 },
  { label: "170-174cm", min: 170, max: 175 },
  { label: "175-179cm", min: 175, max: 180 },
  { label: "180-184cm", min: 180, max: 185 },
  { label: "185cm以上", min: 185, max: Number.POSITIVE_INFINITY },
] as const;

type DistributionBucket = {
  label: string;
  count: number;
  percentage: number;
};

type DistributionSeries<TBucket extends DistributionBucket> = {
  title: string;
  buckets: TBucket[];
};

export type FemaleCupDistributionBucket = DistributionBucket & {
  cup: (typeof FEMALE_CUP_ORDER)[number];
  referencePercentage: number | null;
};

export type MaleHeightDistributionBucket = DistributionBucket;

export type FemaleCupDistributionSummary = {
  total: number;
  referencePublisher: string;
  referenceYear: number;
  publicSeries: DistributionSeries<FemaleCupDistributionBucket>;
  estimatedSeries: DistributionSeries<FemaleCupDistributionBucket>;
};

export type MaleHeightDistributionSummary = {
  total: number;
  mean: number;
  stddev: number;
  publicSeries: DistributionSeries<MaleHeightDistributionBucket>;
  estimatedSeries: DistributionSeries<MaleHeightDistributionBucket>;
};

function toPercentage(count: number, total: number): number {
  return Number(((count / total) * 100).toFixed(1));
}

function buildFemaleCupBuckets(
  counts: Record<string, number>,
  total: number
): FemaleCupDistributionBucket[] {
  return FEMALE_CUP_ORDER.map((cup) => {
    const referencePercentage =
      cup in CUP_DISTRIBUTION
        ? Number(
            (CUP_DISTRIBUTION[cup as keyof typeof CUP_DISTRIBUTION] * 100).toFixed(
              1
            )
          )
        : null;

    return {
      cup,
      label: `${cup}カップ`,
      count: counts[cup] ?? 0,
      percentage: toPercentage(counts[cup] ?? 0, total),
      referencePercentage,
    };
  });
}

function buildMaleHeightBuckets(
  heights: number[],
  total: number
): MaleHeightDistributionBucket[] {
  return MALE_HEIGHT_BUCKETS.map((bucket) => {
    const count = heights.filter(
      (height) => height >= bucket.min && height < bucket.max
    ).length;

    return {
      label: bucket.label,
      count,
      percentage: toPercentage(count, total),
    };
  });
}

export function buildFemaleCupDistributionSummary(): FemaleCupDistributionSummary {
  const total = femaleProfilePool.length;
  const publicCounts = femaleProfilePool.reduce<Record<string, number>>(
    (result, entry) => {
      if (entry.cup) {
        result[entry.cup] = (result[entry.cup] ?? 0) + 1;
      }

      return result;
    },
    {}
  );
  const estimatedCounts = femaleProfilePool.reduce<Record<string, number>>(
    (result, entry) => {
      const estimatedCup = getFemaleRankingEstimatedCup(entry);

      if (estimatedCup) {
        result[estimatedCup] = (result[estimatedCup] ?? 0) + 1;
      }

      return result;
    },
    {}
  );

  return {
    total,
    referencePublisher: CUP_DISTRIBUTION_SOURCE.publisher,
    referenceYear: CUP_DISTRIBUTION_SOURCE.year,
    publicSeries: {
      title: "公開データ",
      buckets: buildFemaleCupBuckets(publicCounts, total),
    },
    estimatedSeries: {
      title: "推定データ",
      buckets: buildFemaleCupBuckets(estimatedCounts, total),
    },
  };
}

export function buildMaleHeightDistributionSummary(): MaleHeightDistributionSummary {
  const total = maleProfilePool.length;
  const publicHeights = maleProfilePool.map((entry) => entry.actualHeight);
  const estimatedHeights = maleProfilePool.map((entry) =>
    getMaleRankingEstimatedHeight(entry)
  );

  return {
    total,
    mean: MALE_STATS.height.mean,
    stddev: MALE_STATS.height.stddev,
    publicSeries: {
      title: "公開データ",
      buckets: buildMaleHeightBuckets(publicHeights, total),
    },
    estimatedSeries: {
      title: "推定データ",
      buckets: buildMaleHeightBuckets(estimatedHeights, total),
    },
  };
}
