import {
  DIAGNOSIS_INPUT_QUALITY_ERROR_MESSAGE,
  DIAGNOSIS_DISCLAIMERS,
  DIAGNOSIS_MODEL_SUMMARY,
  DIAGNOSIS_VALIDATION_LABEL,
  diagnose,
  isLowInformationDiagnosisImageQuality,
} from "@/lib/image-analyzer";
import {
  DIAGNOSIS_CUP_ORDER,
  DIAGNOSIS_MODEL_ENTRIES,
  type DiagnosisFeatures,
} from "@/lib/diagnosis-model";

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
    expect(DIAGNOSIS_CUP_ORDER).toContain(result.estimatedCup);
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
  test("low-information image quality is rejected by the helper", () => {
    expect(
      isLowInformationDiagnosisImageQuality({
        width: 512,
        height: 512,
        aspectRatio: 1,
        brightnessMean: 0.934,
        contrastStddev: 0.061,
        edgeMean: 0.015,
        edgeP90: 0.043,
        entropy: 1.03,
      })
    ).toBe(true);
    expect(
      isLowInformationDiagnosisImageQuality({
        width: 768,
        height: 1152,
        aspectRatio: 0.667,
        brightnessMean: 0.633,
        contrastStddev: 0.22,
        edgeMean: 0.097,
        edgeP90: 0.241,
        entropy: 7.297,
      })
    ).toBe(false);
    expect(DIAGNOSIS_INPUT_QUALITY_ERROR_MESSAGE).toContain("stable estimate");
  });
});
