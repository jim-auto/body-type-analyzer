export const FEMALE_STATS = {
  height: { mean: 158.0, stddev: 5.4 },
  bust: { mean: 84.1, stddev: 4.5 },
} as const;

export const MALE_STATS = {
  height: { mean: 171.0, stddev: 5.8 },
} as const;

export const CUP_DISTRIBUTION = {
  A: 0.021,
  B: 0.179,
  C: 0.269,
  D: 0.263,
  E: 0.188,
  F: 0.064,
  G: 0.016,
} as const;

export const CUP_DISTRIBUTION_SOURCE = {
  year: 2018,
  publisher: "Triumph",
  url: "https://jp.triumph.com/topics/cate02/c-cup-mitame.html",
} as const;

const DISPLAY_CUP_ORDER = ["A", "B", "C", "D", "E", "F", "G"] as const;
const CUP_SORT_ORDER = ["AA", ...DISPLAY_CUP_ORDER, "H", "I"] as const;
const CUP_PERCENTILE_MIN = 0.001;
const CUP_PERCENTILE_MAX = 0.999;

export const CUP_DISTRIBUTION_LABEL =
  "\u65e5\u672c\u4eba\u5973\u6027\u306e\u5206\u5e03\u53c2\u8003\uff08\u30c8\u30ea\u30f3\u30d7 2018\u5e74\u58f2\u4e0a\u5272\u5408\uff09: " +
  DISPLAY_CUP_ORDER.map(
    (cup) => `${cup}(${(CUP_DISTRIBUTION[cup] * 100).toFixed(1)}%)`
  ).join(" ");

export function calculateDeviation(
  value: number,
  mean: number,
  stddev: number
): number {
  return Math.round(50 + (10 * (value - mean)) / stddev);
}

export function getCupSortValue(cup: string | null | undefined): number {
  if (!cup) {
    return -1;
  }

  const normalizedCup = cup.trim().toUpperCase();
  const index = CUP_SORT_ORDER.indexOf(
    normalizedCup as (typeof CUP_SORT_ORDER)[number]
  );

  return index === -1 ? -1 : index;
}

export function calculateCupDeviation(cup: string): number {
  const percentile = getCupPercentile(cup);

  if (percentile === null) {
    return 50;
  }

  const boundedPercentile = Math.max(
    CUP_PERCENTILE_MIN,
    Math.min(CUP_PERCENTILE_MAX, percentile)
  );

  return Math.round(50 + 10 * inverseNormalCdf(boundedPercentile));
}

export function bustToEstimatedCup(bustCm: number): string {
  const estimatedUnder = Math.round(bustCm * 0.82);
  const under = Math.round(estimatedUnder / 5) * 5;
  const diff = bustCm - under;

  if (diff < 11.25) return "A";
  if (diff < 13.75) return "B";
  if (diff < 16.25) return "C";
  if (diff < 18.75) return "D";
  if (diff < 21.25) return "E";
  if (diff < 23.75) return "F";
  return "G";
}

function getCupPercentile(cup: string): number | null {
  const normalizedCup = cup.trim().toUpperCase();

  if (normalizedCup === "AA") {
    return CUP_DISTRIBUTION.A / 2;
  }

  let cumulative = 0;

  for (let index = 0; index < DISPLAY_CUP_ORDER.length; index += 1) {
    const currentCup = DISPLAY_CUP_ORDER[index];
    const probability = CUP_DISTRIBUTION[currentCup];

    cumulative += probability;

    if (normalizedCup !== currentCup) {
      continue;
    }

    const isTopPublishedCup = index === DISPLAY_CUP_ORDER.length - 1;

    return isTopPublishedCup ? cumulative - probability / 2 : cumulative;
  }

  if (normalizedCup === "H") {
    return 1 - CUP_DISTRIBUTION.G / 4;
  }

  if (normalizedCup === "I") {
    return 1 - CUP_DISTRIBUTION.G / 8;
  }

  return null;
}

function inverseNormalCdf(probability: number): number {
  const a = [
    -3.969683028665376e1,
    2.209460984245205e2,
    -2.759285104469687e2,
    1.38357751867269e2,
    -3.066479806614716e1,
    2.506628277459239,
  ] as const;
  const b = [
    -5.447609879822406e1,
    1.615858368580409e2,
    -1.556989798598866e2,
    6.680131188771972e1,
    -1.328068155288572e1,
  ] as const;
  const c = [
    -7.784894002430293e-3,
    -3.223964580411365e-1,
    -2.400758277161838,
    -2.549732539343734,
    4.374664141464968,
    2.938163982698783,
  ] as const;
  const d = [
    7.784695709041462e-3,
    3.224671290700398e-1,
    2.445134137142996,
    3.754408661907416,
  ] as const;
  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  if (probability < pLow) {
    const q = Math.sqrt(-2 * Math.log(probability));

    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }

  if (probability <= pHigh) {
    const q = probability - 0.5;
    const r = q * q;

    return (
      (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) *
      q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  }

  const q = Math.sqrt(-2 * Math.log(1 - probability));

  return -(
    (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  );
}
