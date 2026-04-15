import { bustToEstimatedCup } from "./statistics.ts";
import { getCupIndex, getCupLabel, normalizeCupLabel } from "./cup-order.ts";

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
const CUP_TYPICAL_BUST_BY_ACTUAL = {
  A: 79,
  B: 80,
  C: 82,
  D: 84,
  E: 85,
  F: 88,
  G: 90,
} as const;
const EXTENDED_CUP_H_BUST = 96;
const EXTENDED_CUP_BUST_STEP_CM = 4;
const CUP_MEDIAN_TRUST_BAND_CM = 5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getTypicalBustForCup(cup: string | null | undefined): number | null {
  const normalizedCup = normalizeCupLabel(cup);

  if (!normalizedCup) {
    return null;
  }

  const directBust =
    CUP_TYPICAL_BUST_BY_ACTUAL[
      normalizedCup as keyof typeof CUP_TYPICAL_BUST_BY_ACTUAL
    ];

  if (directBust !== undefined) {
    return directBust;
  }

  const index = getCupIndex(normalizedCup);
  const hIndex = getCupIndex("H");

  if (index === null || hIndex === null || index < hIndex) {
    return null;
  }

  return EXTENDED_CUP_H_BUST + (index - hIndex) * EXTENDED_CUP_BUST_STEP_CM;
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

  const normalizedActualCup = getCupLabel(actualIndex);
  const medianBust = getTypicalBustForCup(normalizedActualCup);

  // Published cup sizes are more reliable when the bust sits near that cup's
  // observed median in our source dataset, so trust the public value first.
  if (
    medianBust !== null &&
    Math.abs(bust - medianBust) <= CUP_MEDIAN_TRUST_BAND_CM
  ) {
    return normalizedActualCup;
  }

  const difference = estimatedIndex - actualIndex;

  if (Math.abs(difference) <= 1) {
    return estimatedCup;
  }

  if (Math.abs(difference) === 2) {
    return getCupLabel(actualIndex + Math.sign(difference));
  }

  return normalizedActualCup;
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

export function getDisplayCupDifference(
  actualCup: string | null | undefined,
  estimatedCup: string | null
): number | null {
  return getCupDifference(actualCup, estimatedCup);
}
