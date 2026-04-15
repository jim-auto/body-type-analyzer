export const EXTENDED_CUP_ORDER = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
] as const;

const CUP_MIN_CODE = "A".charCodeAt(0);
const CUP_MAX_CODE = "Z".charCodeAt(0);

export type ExtendedCupLabel = (typeof EXTENDED_CUP_ORDER)[number];

export function normalizeCupLabel(
  cup: string | null | undefined
): ExtendedCupLabel | null {
  if (!cup) {
    return null;
  }

  const normalized = cup.trim().toUpperCase();

  if (normalized.length !== 1) {
    return null;
  }

  const code = normalized.charCodeAt(0);

  if (code < CUP_MIN_CODE || code > CUP_MAX_CODE) {
    return null;
  }

  return normalized as ExtendedCupLabel;
}

export function getCupIndex(cup: string | null | undefined): number | null {
  const normalized = normalizeCupLabel(cup);

  if (!normalized) {
    return null;
  }

  return normalized.charCodeAt(0) - CUP_MIN_CODE;
}

export function getCupLabel(index: number): ExtendedCupLabel {
  const boundedIndex = Math.max(
    0,
    Math.min(EXTENDED_CUP_ORDER.length - 1, Math.round(index))
  );

  return EXTENDED_CUP_ORDER[boundedIndex];
}

export function getPreferredCupLabel(entry: {
  cup: string | null | undefined;
  displayCup?: string | null | undefined;
}): ExtendedCupLabel | null {
  return normalizeCupLabel(entry.displayCup) ?? normalizeCupLabel(entry.cup);
}
