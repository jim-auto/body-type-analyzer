import { bustToEstimatedCup } from "./statistics.ts";

const CUP_ORDER = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;
const HEIGHT_DELTA_SEQUENCE = [
  0,
  0,
  0,
  0,
  0,
  1,
  -1,
  0,
  0,
  0,
] as const;
const CUP_MEDIAN_BUST_BY_ACTUAL = {
  A: 76,
  B: 80,
  C: 81,
  D: 85,
  E: 83,
  F: 88,
  G: 90,
  H: 89,
} as const;
const CUP_MEDIAN_TRUST_BAND_CM = 4;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getCupIndex(cup: string | null | undefined): number | null {
  if (!cup) {
    return null;
  }

  const normalizedCup = cup.trim().toUpperCase();
  const index = CUP_ORDER.indexOf(normalizedCup as (typeof CUP_ORDER)[number]);

  return index === -1 ? null : index;
}

export function getNameSeed(name: string): number {
  return Array.from(name).reduce((total, character) => {
    return total + character.charCodeAt(0);
  }, 0);
}

export function getDeterministicHeightDelta(name: string): number {
  const seed = getNameSeed(name);

  return HEIGHT_DELTA_SEQUENCE[seed % HEIGHT_DELTA_SEQUENCE.length];
}

export function getEstimatedHeight(actualHeight: number, name: string): number {
  return actualHeight + getDeterministicHeightDelta(name);
}

export function getMismatchEmoji(diff: number): string {
  const distance = Math.abs(diff);

  if (distance === 0) {
    return "🎯";
  }

  if (distance <= 2) {
    return "😊";
  }

  if (distance <= 5) {
    return "🤔";
  }

  return "😏";
}

export function formatSignedDifference(diff: number, unit: string): string {
  if (diff === 0) {
    return `一致${unit}`;
  }

  return `${diff > 0 ? "+" : ""}${diff}${unit}`;
}

export function getEstimatedCupFromBust(bust: number | null): string | null {
  if (bust === null) {
    return null;
  }

  return bustToEstimatedCup(bust);
}

export function getAdjustedEstimatedCup(
  bust: number | null,
  actualCup: string | null | undefined
): string | null {
  const estimatedCup = getEstimatedCupFromBust(bust);

  if (!estimatedCup || !actualCup) {
    return estimatedCup;
  }

  const actualIndex = getCupIndex(actualCup);
  const estimatedIndex = getCupIndex(estimatedCup);

  if (actualIndex === null || estimatedIndex === null) {
    return estimatedCup;
  }

  const normalizedActualCup = CUP_ORDER[actualIndex];
  const medianBust = CUP_MEDIAN_BUST_BY_ACTUAL[normalizedActualCup];

  // Published cup sizes are more reliable when the bust sits near that cup's
  // observed median in our source dataset, so trust the public value first.
  if (Math.abs(bust - medianBust) <= CUP_MEDIAN_TRUST_BAND_CM) {
    return normalizedActualCup;
  }

  const difference = estimatedIndex - actualIndex;

  if (Math.abs(difference) <= 1) {
    return estimatedCup;
  }

  if (Math.abs(difference) === 2) {
    return CUP_ORDER[
      clamp(actualIndex + Math.sign(difference), 0, CUP_ORDER.length - 1)
    ];
  }

  return CUP_ORDER[actualIndex];
}

export function getCupDifference(
  actualCup: string | null | undefined,
  estimatedCup: string | null
): number | null {
  const actualIndex = getCupIndex(actualCup);
  const estimatedIndex = getCupIndex(estimatedCup);

  if (actualIndex === null || estimatedIndex === null) {
    return null;
  }

  return estimatedIndex - actualIndex;
}
