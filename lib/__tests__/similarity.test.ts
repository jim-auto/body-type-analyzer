import { findSimilarCelebrities, Celebrity } from "@/lib/similarity";
import type { AnalysisResult } from "@/lib/analyzer";

const makeCelebrities = (): Celebrity[] => [
  { name: "Taylor Swift", silhouetteType: "X", deviationScore: 72, atmosphere: "sharp" },
  { name: "Beyoncé", silhouetteType: "X", deviationScore: 70, atmosphere: "balanced" },
  { name: "Rihanna", silhouetteType: "A", deviationScore: 68, atmosphere: "sharp" },
  { name: "Zendaya", silhouetteType: "I", deviationScore: 66, atmosphere: "sharp" },
  { name: "Jennifer Lopez", silhouetteType: "X", deviationScore: 64, atmosphere: "balanced" },
  { name: "Scarlett Johansson", silhouetteType: "X", deviationScore: 71, atmosphere: "soft" },
  { name: "Kim Kardashian", silhouetteType: "A", deviationScore: 69, atmosphere: "soft" },
  { name: "Ariana Grande", silhouetteType: "I", deviationScore: 67, atmosphere: "soft" },
  { name: "Dua Lipa", silhouetteType: "I", deviationScore: 65, atmosphere: "sharp" },
  { name: "Billie Eilish", silhouetteType: "A", deviationScore: 63, atmosphere: "soft" },
  { name: "Gigi Hadid", silhouetteType: "I", deviationScore: 73, atmosphere: "balanced" },
  { name: "Kendall Jenner", silhouetteType: "I", deviationScore: 70, atmosphere: "sharp" },
  { name: "Hailey Bieber", silhouetteType: "X", deviationScore: 68, atmosphere: "balanced" },
  { name: "Bella Hadid", silhouetteType: "I", deviationScore: 66, atmosphere: "sharp" },
  { name: "Adele", silhouetteType: "A", deviationScore: 64, atmosphere: "soft" },
];

const makeResult = (overrides: Partial<AnalysisResult> = {}): AnalysisResult => ({
  silhouetteType: "X",
  upperBodyBalance: "標準",
  deviationScore: 70,
  aiConfidence: 30,
  atmosphere: "balanced",
  cupSize: "C",
  percentile: 30,
  ...overrides,
});

describe("findSimilarCelebrities", () => {
  test("同じ入力から同じ結果が返る（冪等性）", () => {
    const result = makeResult();
    const celebs = makeCelebrities();
    const first = findSimilarCelebrities(result, celebs, 42);
    const second = findSimilarCelebrities(result, celebs, 42);
    expect(first).toEqual(second);
  });

  test("返り値が5人以下であること", () => {
    const result = makeResult();
    const celebs = makeCelebrities();
    const similar = findSimilarCelebrities(result, celebs, 42);
    expect(similar.length).toBeLessThanOrEqual(5);
  });

  test("similarityが60〜99の範囲であること", () => {
    const result = makeResult();
    const celebs = makeCelebrities();
    const similar = findSimilarCelebrities(result, celebs, 42);
    for (const s of similar) {
      expect(s.similarity).toBeGreaterThanOrEqual(60);
      expect(s.similarity).toBeLessThanOrEqual(99);
    }
  });

  test("silhouetteTypeが一致する有名人が優先されること", () => {
    const result = makeResult({ silhouetteType: "X", deviationScore: 70 });
    // All same deviation score, different silhouette types
    const celebs: Celebrity[] = [
      { name: "Person A", silhouetteType: "I", deviationScore: 70, atmosphere: "balanced" },
      { name: "Person B", silhouetteType: "X", deviationScore: 70, atmosphere: "balanced" },
    ];
    const similar = findSimilarCelebrities(result, celebs, 1);
    expect(similar[0].name).toBe("Person B");
  });

  test("deviationScoreが近い有名人が優先されること", () => {
    const result = makeResult({ silhouetteType: "I", deviationScore: 70, atmosphere: "sharp" });
    const celebs: Celebrity[] = [
      { name: "Far", silhouetteType: "I", deviationScore: 50, atmosphere: "sharp" },
      { name: "Close", silhouetteType: "I", deviationScore: 69, atmosphere: "sharp" },
    ];
    const similar = findSimilarCelebrities(result, celebs, 1);
    expect(similar[0].name).toBe("Close");
  });

  test("atmosphereが一致する有名人にボーナスがあること", () => {
    const result = makeResult({ silhouetteType: "I", deviationScore: 70, atmosphere: "soft" });
    const celebs: Celebrity[] = [
      { name: "No Match", silhouetteType: "I", deviationScore: 70, atmosphere: "sharp" },
      { name: "Match", silhouetteType: "I", deviationScore: 73, atmosphere: "soft" },
    ];
    const similar = findSimilarCelebrities(result, celebs, 1);
    // Match has diff = |73-70| - 5 (silhouette) - 3 (atmosphere) = -5
    // No Match has diff = |70-70| - 5 (silhouette) = -5
    // Both are -5, but "Match" comes first alphabetically... actually let's check
    // Match: |73-70| = 3, -5(sil), -3(atm) = -5
    // No Match: |70-70| = 0, -5(sil) = -5
    // Same diff, tiebreak by name: "Match" < "No Match"
    // Actually both have diff -5, so Match wins by name
    expect(similar[0].name).toBe("Match");
  });

  test("空の有名人リストで空配列が返ること", () => {
    const result = makeResult();
    const similar = findSimilarCelebrities(result, [], 42);
    expect(similar).toEqual([]);
  });

  test("有名人が5人未満の場合、その人数分だけ返ること", () => {
    const result = makeResult();
    const celebs: Celebrity[] = [
      { name: "A", silhouetteType: "X", deviationScore: 70, atmosphere: "balanced" },
      { name: "B", silhouetteType: "I", deviationScore: 65, atmosphere: "sharp" },
    ];
    const similar = findSimilarCelebrities(result, celebs, 1);
    expect(similar).toHaveLength(2);
  });

  test("結果がsimilarityの降順でソートされていること", () => {
    const result = makeResult();
    const celebs = makeCelebrities();
    const similar = findSimilarCelebrities(result, celebs, 42);
    for (let i = 1; i < similar.length; i++) {
      expect(similar[i - 1].similarity).toBeGreaterThanOrEqual(similar[i].similarity);
    }
  });

  test("atmosphereボーナスでdiffが確実に小さくなること", () => {
    const result = makeResult({ silhouetteType: "I", deviationScore: 50, atmosphere: "soft" });
    // Two celebs far from user score, no silhouette match — atmosphere bonus makes the difference
    const celebs: Celebrity[] = [
      { name: "NoAtm", silhouetteType: "A", deviationScore: 60, atmosphere: "sharp" },
      { name: "Atm", silhouetteType: "A", deviationScore: 60, atmosphere: "soft" },
    ];
    const similar = findSimilarCelebrities(result, celebs, 1);
    // Atm: diff = |60-50| - 3 = 7, similarity = 100 - 7*3 = 79
    // NoAtm: diff = |60-50| = 10, similarity = 100 - 10*3 = 70
    expect(similar[0].name).toBe("Atm");
    expect(similar[0].similarity).toBeGreaterThan(similar[1].similarity);
  });
});
