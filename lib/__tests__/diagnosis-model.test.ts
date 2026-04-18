import {
  DIAGNOSIS_CUP_ORDER,
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
    expect(DIAGNOSIS_CUP_ORDER).toContain(result.estimatedCup);
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
    expect(
      Math.abs(evaluation.height.mae - DIAGNOSIS_MODEL_METRICS.height.mae)
    ).toBeLessThanOrEqual(0.25);
    expect(
      Math.abs(evaluation.height.exactRate - DIAGNOSIS_MODEL_METRICS.height.exactRate)
    ).toBeLessThanOrEqual(0.03);
    expect(
      Math.abs(
        evaluation.height.within2Rate - DIAGNOSIS_MODEL_METRICS.height.within2Rate
      )
    ).toBeLessThanOrEqual(0.02);
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
    expect(DIAGNOSIS_MODEL_METRICS.trainingCount).toBeGreaterThanOrEqual(100);
    expect(DIAGNOSIS_MODEL_METRICS.height.mae).toBeLessThan(5.0);
    expect(DIAGNOSIS_MODEL_METRICS.height.coverage[0]?.maxError).toBeLessThanOrEqual(7);
    expect(DIAGNOSIS_MODEL_METRICS.cup.within1Rate).toBeGreaterThanOrEqual(0.3);
    expect(
      DIAGNOSIS_MODEL_METRICS.height.generalization.coverage[0]?.maxError
    ).toBeLessThanOrEqual(7);
    expect(DIAGNOSIS_MODEL_METRICS.height.generalization.mae).toBeLessThan(5.0);
    expect(DIAGNOSIS_MODEL_METRICS.cup.generalization.within1Rate).toBeGreaterThanOrEqual(0.3);
    expect(DIAGNOSIS_MODEL_METRICS.cup.generalization.mae).toBeLessThanOrEqual(3.0);
  });

  test("featureSets は必要な全ての特徴量を持つ", () => {
    expect(sampleEntry.featureSets.heightPrimary.length).toBe(100);
    expect(sampleEntry.featureSets.heightBalanced.length).toBe(108);
    expect(sampleEntry.featureSets.heightWide.length).toBe(196);
    expect(sampleEntry.featureSets.heightCenter.length).toBe(128);
    expect(sampleEntry.featureSets.heightProfile.length).toBe(44);
    expect(sampleEntry.featureSets.heightEdgeFull.length).toBe(64);
    expect(sampleEntry.featureSets.heightEdgeCenter.length).toBe(128);
    expect(sampleEntry.featureSets.cupPrimary.length).toBe(208);
    expect(sampleEntry.featureSets.cupSecondary.length).toBe(100);
    expect(sampleEntry.featureSets.cupCenter.length).toBe(164);
    expect(sampleEntry.featureSets.cupProfile.length).toBe(44);
    expect(sampleEntry.featureSets.cupEdgeTop.length).toBe(100);
    expect(sampleEntry.featureSets.similarity.length).toBe(128);
  });

  test("inferSilhouetteType は推定値の組み合わせから安定して分類する", () => {
    expect(inferSilhouetteType(156, "F")).toBe("A");
    expect(inferSilhouetteType(168, "B")).toBe("I");
    expect(inferSilhouetteType(162, "D")).toBe("X");
  });

  test("クラス頻度補正により低カップ予測が出ることがある", () => {
    // 学習データはF以上に強く偏っているため、補正前は全件H付近に張り付く。
    // 補正後は少なくとも一定数の小カップ予測 (E以下) が現れることを確認する。
    const cupEntries = DIAGNOSIS_MODEL_ENTRIES.filter(
      (entry) => entry.availability.cup
    );
    const lowCupSet = new Set<string>(["A", "B", "C", "D", "E"]);
    const lowCupTrue = cupEntries.filter((entry) => lowCupSet.has(entry.cup));

    expect(lowCupTrue.length).toBeGreaterThan(0);

    const lowCupRecovered = lowCupTrue.filter((entry) => {
      const result = diagnoseFromFeatures(entry.featureSets, {
        excludeName: entry.name,
      });
      return lowCupSet.has(result.estimatedCup);
    });

    // 真値が小カップの人のうち少なくとも 20% は小カップ域に予測されること。
    // 補正なしの旧ロジックではほぼ 0% だった。
    expect(lowCupRecovered.length / lowCupTrue.length).toBeGreaterThanOrEqual(0.2);
  });

  test("予測カップは A-K の範囲全体にわたって分布する", () => {
    // 補正後は単一カップに張り付かず、複数カップが出力されることを確認する。
    const cupEntries = DIAGNOSIS_MODEL_ENTRIES.filter(
      (entry) => entry.availability.cup
    );
    const distinctPredictions = new Set<string>();
    for (const entry of cupEntries) {
      const result = diagnoseFromFeatures(entry.featureSets, {
        excludeName: entry.name,
      });
      distinctPredictions.add(result.estimatedCup);
      if (distinctPredictions.size >= 5) break;
    }
    expect(distinctPredictions.size).toBeGreaterThanOrEqual(5);
  });
});
