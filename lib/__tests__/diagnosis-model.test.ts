import {
  DIAGNOSIS_MODEL_ENTRIES,
  DIAGNOSIS_MODEL_METRICS,
  diagnoseFromFeatures,
  evaluateDiagnosisModel,
  inferSilhouetteType,
  type DiagnosisFeatures,
} from "@/lib/diagnosis-model";

const sampleEntry = DIAGNOSIS_MODEL_ENTRIES.find(
  (entry) => entry.name === "橋本マナミ"
) ?? DIAGNOSIS_MODEL_ENTRIES[0];

const sampleFeatures: DiagnosisFeatures = {
  ...sampleEntry.featureSets,
};

describe("diagnosis-model", () => {
  test("diagnoseFromFeatures は同じ特徴量で同じ結果を返す", () => {
    expect(diagnoseFromFeatures(sampleFeatures)).toEqual(
      diagnoseFromFeatures(sampleFeatures)
    );
  });

  test("diagnoseFromFeatures は除外指定つきでも妥当な範囲の結果を返す", () => {
    const result = diagnoseFromFeatures(sampleFeatures, {
      excludeName: sampleEntry.name,
    });

    expect(result.estimatedHeight).toBeGreaterThanOrEqual(140);
    expect(result.estimatedHeight).toBeLessThanOrEqual(190);
    expect(["A", "B", "C", "D", "E", "F", "G", "H"]).toContain(
      result.estimatedCup
    );
    expect(result.heightDeviation).toBeGreaterThanOrEqual(20);
    expect(result.heightDeviation).toBeLessThanOrEqual(80);
    expect(result.cupDeviation).toBeGreaterThanOrEqual(20);
    expect(result.cupDeviation).toBeLessThanOrEqual(80);
    expect(result.confidence).toBeGreaterThanOrEqual(18);
    expect(result.confidence).toBeLessThanOrEqual(96);
    expect(result.similarCelebrities).toHaveLength(3);
    expect(result.similarCelebrities[0]?.name).toBe(result.similarCelebrity);
  });

  test("evaluateDiagnosisModel の再計算結果は保存済みメトリクスと一致する", () => {
    const evaluation = evaluateDiagnosisModel();

    expect(evaluation.trainingCount).toBe(DIAGNOSIS_MODEL_METRICS.trainingCount);
    expect(evaluation.height.mae).toBeCloseTo(DIAGNOSIS_MODEL_METRICS.height.mae, 6);
    expect(evaluation.height.exactRate).toBeCloseTo(
      DIAGNOSIS_MODEL_METRICS.height.exactRate,
      6
    );
    expect(evaluation.height.within2Rate).toBeCloseTo(
      DIAGNOSIS_MODEL_METRICS.height.within2Rate,
      6
    );
    expect(evaluation.height.coverage).toEqual(DIAGNOSIS_MODEL_METRICS.height.coverage);
    expect(evaluation.cup.mae).toBeCloseTo(DIAGNOSIS_MODEL_METRICS.cup.mae, 6);
    expect(evaluation.cup.exactRate).toBeCloseTo(
      DIAGNOSIS_MODEL_METRICS.cup.exactRate,
      6
    );
    expect(evaluation.cup.within1Rate).toBeCloseTo(
      DIAGNOSIS_MODEL_METRICS.cup.within1Rate,
      6
    );
    expect(evaluation.cup.coverage).toEqual(DIAGNOSIS_MODEL_METRICS.cup.coverage);
  });

  test("保存済みメトリクスは最低限の汎化閾値を満たす", () => {
    expect(DIAGNOSIS_MODEL_METRICS.trainingCount).toBeGreaterThanOrEqual(50);
    expect(DIAGNOSIS_MODEL_METRICS.height.mae).toBeLessThan(3.9);
    expect(DIAGNOSIS_MODEL_METRICS.height.within2Rate).toBeGreaterThan(0.45);
    expect(DIAGNOSIS_MODEL_METRICS.cup.mae).toBeLessThan(1.05);
    expect(DIAGNOSIS_MODEL_METRICS.cup.within1Rate).toBeGreaterThan(0.72);
  });

  test("featureSets は必要な全ての特徴量を持つ", () => {
    expect(sampleEntry.featureSets.heightPrimary.length).toBe(100);
    expect(sampleEntry.featureSets.heightBalanced.length).toBe(108);
    expect(sampleEntry.featureSets.heightWide.length).toBe(196);
    expect(sampleEntry.featureSets.heightCenter.length).toBe(128);
    expect(sampleEntry.featureSets.heightProfile.length).toBe(44);
    expect(sampleEntry.featureSets.cupPrimary.length).toBe(208);
    expect(sampleEntry.featureSets.cupSecondary.length).toBe(100);
    expect(sampleEntry.featureSets.cupCenter.length).toBe(164);
    expect(sampleEntry.featureSets.cupProfile.length).toBe(44);
    expect(sampleEntry.featureSets.similarity.length).toBe(128);
  });

  test("inferSilhouetteType は推定値の組み合わせから安定して分類する", () => {
    expect(inferSilhouetteType(156, "F")).toBe("A");
    expect(inferSilhouetteType(168, "B")).toBe("I");
    expect(inferSilhouetteType(162, "D")).toBe("X");
  });
});
