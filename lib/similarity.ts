import { AnalysisResult } from "./analyzer";

export type Celebrity = {
  name: string;
  silhouetteType: string;
  deviationScore: number;
  atmosphere: string;
};

export function findSimilarCelebrities(
  result: AnalysisResult,
  celebrities: Celebrity[],
  seed: number
): { name: string; similarity: number }[] {
  if (celebrities.length === 0) return [];

  const scored = celebrities.map((celeb) => {
    let diff = Math.abs(celeb.deviationScore - result.deviationScore);
    if (celeb.silhouetteType === result.silhouetteType) {
      diff -= 5;
    }
    if (celeb.atmosphere === result.atmosphere) {
      diff -= 3;
    }
    return { name: celeb.name, diff };
  });

  // Sort by diff ascending, then by name ascending for tiebreak
  scored.sort((a, b) => {
    if (a.diff !== b.diff) return a.diff - b.diff;
    return a.name.localeCompare(b.name);
  });

  const top = scored.slice(0, 5);

  return top.map((item) => ({
    name: item.name,
    similarity: Math.max(60, Math.min(99, 100 - Math.max(0, item.diff) * 3)),
  }));
}
