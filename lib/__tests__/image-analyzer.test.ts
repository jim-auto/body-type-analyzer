import {
  DIAGNOSIS_DISCLAIMERS,
  DIAGNOSIS_MODEL_SUMMARY,
  DIAGNOSIS_VALIDATION_LABEL,
  diagnose,
} from "@/lib/image-analyzer";
import { DIAGNOSIS_MODEL_ENTRIES, type DiagnosisFeatures } from "@/lib/diagnosis-model";

const sampleEntry = DIAGNOSIS_MODEL_ENTRIES.find(
  (entry) => entry.name === "深田恭子"
) ?? DIAGNOSIS_MODEL_ENTRIES[0];

const sampleFeatures: DiagnosisFeatures = {
  ...sampleEntry.featureSets,
};

describe("image-analyzer", () => {
  test("diagnose は実モデルから結果を返す", () => {
    const result = diagnose(sampleFeatures);

    expect(result.estimatedHeight).toBeGreaterThanOrEqual(140);
    expect(result.estimatedHeight).toBeLessThanOrEqual(190);
    expect(["A", "B", "C", "D", "E", "F", "G", "H"]).toContain(
      result.estimatedCup
    );
    expect(result.similarCelebrities.length).toBe(3);
    expect(result.similarCelebrities[0]?.name).toBe(result.similarCelebrity);
  });

  test("診断説明文はモデル概要と検証値を含む", () => {
    expect(DIAGNOSIS_MODEL_SUMMARY).toContain("学習プロフィール画像");
    expect(DIAGNOSIS_VALIDATION_LABEL).toContain("固定テスト");
    expect(DIAGNOSIS_VALIDATION_LABEL).toContain("身長の7割");
    expect(DIAGNOSIS_DISCLAIMERS[0]).toContain(DIAGNOSIS_MODEL_SUMMARY);
    expect(DIAGNOSIS_DISCLAIMERS[1]).toContain("固定テスト");
  });
});
