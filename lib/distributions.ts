import { femaleProfilePool, maleProfilePool } from "./source-profiles.ts";
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

export type FemaleCupDistributionBucket = DistributionBucket & {
  cup: (typeof FEMALE_CUP_ORDER)[number];
  referencePercentage: number | null;
};

export type MaleHeightDistributionBucket = DistributionBucket;

export type FemaleCupDistributionSummary = {
  total: number;
  referencePublisher: string;
  referenceYear: number;
  buckets: FemaleCupDistributionBucket[];
};

export type MaleHeightDistributionSummary = {
  total: number;
  mean: number;
  stddev: number;
  buckets: MaleHeightDistributionBucket[];
};

function toPercentage(count: number, total: number): number {
  return Number(((count / total) * 100).toFixed(1));
}

export function buildFemaleCupDistributionSummary(): FemaleCupDistributionSummary {
  const total = femaleProfilePool.length;

  return {
    total,
    referencePublisher: CUP_DISTRIBUTION_SOURCE.publisher,
    referenceYear: CUP_DISTRIBUTION_SOURCE.year,
    buckets: FEMALE_CUP_ORDER.map((cup) => {
      const count = femaleProfilePool.filter((entry) => entry.cup === cup).length;
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
        count,
        percentage: toPercentage(count, total),
        referencePercentage,
      };
    }),
  };
}

export function buildMaleHeightDistributionSummary(): MaleHeightDistributionSummary {
  const total = maleProfilePool.length;

  return {
    total,
    mean: MALE_STATS.height.mean,
    stddev: MALE_STATS.height.stddev,
    buckets: MALE_HEIGHT_BUCKETS.map((bucket) => {
      const count = maleProfilePool.filter(
        (entry) =>
          entry.actualHeight >= bucket.min && entry.actualHeight < bucket.max
      ).length;

      return {
        label: bucket.label,
        count,
        percentage: toPercentage(count, total),
      };
    }),
  };
}
