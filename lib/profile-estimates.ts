import { bustToEstimatedCup } from "@/lib/statistics";

const CUP_ORDER = ["A", "B", "C", "D", "E", "F", "G"] as const;

export function getNameSeed(name: string): number {
  return Array.from(name).reduce((total, character) => {
    return total + character.charCodeAt(0);
  }, 0);
}

export function getDeterministicHeightDelta(name: string): number {
  const seed = getNameSeed(name);
  const magnitude = (seed % 8) + 1;
  const selector = Math.floor(seed / 8) % 6;

  if (selector === 0) {
    return 0;
  }

  return selector % 2 === 0 ? magnitude : -magnitude;
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

export function getCupDifference(
  actualCup: string | null | undefined,
  estimatedCup: string | null
): number | null {
  if (!actualCup || !estimatedCup) {
    return null;
  }

  const actualIndex = CUP_ORDER.indexOf(actualCup as (typeof CUP_ORDER)[number]);
  const estimatedIndex = CUP_ORDER.indexOf(
    estimatedCup as (typeof CUP_ORDER)[number]
  );

  if (actualIndex === -1 || estimatedIndex === -1) {
    return null;
  }

  return estimatedIndex - actualIndex;
}
