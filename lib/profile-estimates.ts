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
const DEFAULT_FEMALE_HEIGHT_FOR_WEIGHT = 160;
const DEFAULT_FEMALE_BUST_FOR_WEIGHT = 84;
const DEFAULT_FEMALE_CUP_INDEX_FOR_WEIGHT = 2;
const FEMALE_WEIGHT_ESTIMATE_BASE = -56.10081929;
const FEMALE_WEIGHT_HEIGHT_COEFFICIENT = 0.38059393;
const FEMALE_WEIGHT_BUST_COEFFICIENT = 0.49493558;
const FEMALE_WEIGHT_CUP_COEFFICIENT = -0.31081718;
const FEMALE_WEIGHT_JITTER_SEQUENCE = [0, 0.4, -0.4, 0.8, -0.8] as const;
const MALE_WEIGHT_BMI_BASE = 20.5;
const MALE_WEIGHT_BMI_JITTER_SEQUENCE = [
  0,
  0.4,
  -0.4,
  0.8,
  -0.8,
  0.2,
  -0.2,
] as const;

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

export function getValidActualWeight(weight: number | null): number | null {
  if (weight === null || weight < 25 || weight > 95) {
    return null;
  }

  return weight;
}

function getWeightJitter(
  name: string,
  sequence: readonly number[]
): number {
  return sequence[getNameSeed(name) % sequence.length] ?? 0;
}

export function getEstimatedFemaleWeight(
  actualHeight: number,
  bust: number | null,
  actualCup: string | null | undefined,
  name: string
): number {
  const height =
    actualHeight > 0
      ? actualHeight
      : DEFAULT_FEMALE_HEIGHT_FOR_WEIGHT + getDeterministicHeightDelta(name);
  const estimatedCupFromBust = getEstimatedCupFromBust(bust);
  const cupIndex =
    getCupIndex(actualCup) ??
    getCupIndex(estimatedCupFromBust) ??
    DEFAULT_FEMALE_CUP_INDEX_FOR_WEIGHT;
  const bustForEstimate =
    bust ??
    getTypicalBustForCup(actualCup) ??
    getTypicalBustForCup(estimatedCupFromBust) ??
    DEFAULT_FEMALE_BUST_FOR_WEIGHT;
  const rawWeight =
    FEMALE_WEIGHT_ESTIMATE_BASE +
    FEMALE_WEIGHT_HEIGHT_COEFFICIENT * height +
    FEMALE_WEIGHT_BUST_COEFFICIENT * bustForEstimate +
    FEMALE_WEIGHT_CUP_COEFFICIENT * cupIndex +
    getWeightJitter(name, FEMALE_WEIGHT_JITTER_SEQUENCE);

  return clamp(Math.round(rawWeight), 35, 78);
}

export function getEstimatedMaleWeight(
  actualHeight: number,
  name: string
): number {
  const height = actualHeight > 0 ? actualHeight : 172;
  const heightMeters = height / 100;
  const bmi =
    MALE_WEIGHT_BMI_BASE +
    getWeightJitter(name, MALE_WEIGHT_BMI_JITTER_SEQUENCE);

  return clamp(Math.round(heightMeters * heightMeters * bmi), 50, 98);
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
