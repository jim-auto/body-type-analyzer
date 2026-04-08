export const FEMALE_STATS = {
  height: { mean: 158.0, stddev: 5.4 },
  bust: { mean: 84.1, stddev: 4.5 },
} as const;

export const MALE_STATS = {
  height: { mean: 171.0, stddev: 5.8 },
} as const;

export function calculateDeviation(
  value: number,
  mean: number,
  stddev: number
): number {
  return Math.round(50 + (10 * (value - mean)) / stddev);
}

export function bustToEstimatedCup(bustCm: number): string {
  const diff = bustCm - (bustCm - 12.5);

  if (diff < 11.25) return "A";
  if (diff < 13.75) return "B";
  if (diff < 16.25) return "C";
  if (diff < 18.75) return "D";
  if (diff < 21.25) return "E";
  if (diff < 23.75) return "F";
  return "G";
}
