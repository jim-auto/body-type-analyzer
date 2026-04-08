import { bustToEstimatedCup } from "@/lib/statistics";

const CUP_ORDER = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];

type Tone = "🎯" | "😊" | "🤔" | "😏";

export type HeightInsight = {
  estimatedHeight: number;
  delta: number;
  detail: string;
};

export type CupInsight = {
  estimatedCup: string;
  delta: number | null;
  detail: string;
};

function getNameSeed(name: string): number {
  return Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function getTone(absDelta: number): Tone {
  if (absDelta === 0) {
    return "🎯";
  }

  if (absDelta <= 2) {
    return "😊";
  }

  if (absDelta <= 5) {
    return "🤔";
  }

  return "😏";
}

function getCupIndex(cup: string): number | null {
  const index = CUP_ORDER.indexOf(cup);
  return index === -1 ? null : index;
}

function formatSignedValue(delta: number, unit: string): string {
  if (delta === 0) {
    return `一致 ${getTone(0)}`;
  }

  return `${delta > 0 ? `+${delta}` : delta}${unit} ${getTone(Math.abs(delta))}`;
}

export function getHeightInsight(
  name: string,
  actualHeight: number
): HeightInsight {
  const seed = getNameSeed(name);
  const delta = (seed % 17) - 8;

  return {
    estimatedHeight: actualHeight + delta,
    delta,
    detail: formatSignedValue(delta, "cm"),
  };
}

export function getCupInsight(
  actualCup: string,
  bust: number | null
): CupInsight | null {
  if (bust === null) {
    return null;
  }

  const estimatedCup = bustToEstimatedCup(bust);
  const actualIndex = getCupIndex(actualCup);
  const estimatedIndex = getCupIndex(estimatedCup);

  if (actualIndex === null || estimatedIndex === null) {
    return {
      estimatedCup,
      delta: null,
      detail: `実測B${bust}cm`,
    };
  }

  const delta = estimatedIndex - actualIndex;

  return {
    estimatedCup,
    delta,
    detail:
      delta === 0
        ? `一致 ${getTone(0)}`
        : `${delta > 0 ? `+${delta}` : delta}サイズ ${getTone(
            Math.abs(delta)
          )}`,
  };
}
