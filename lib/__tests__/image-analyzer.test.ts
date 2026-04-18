import {
  DIAGNOSIS_INPUT_QUALITY_ERROR_MESSAGE,
  DIAGNOSIS_DISCLAIMERS,
  DIAGNOSIS_MODEL_SUMMARY,
  DIAGNOSIS_VALIDATION_LABEL,
  buildChestBoxFromPose,
  detectUpperBodyMissing,
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

  describe("buildChestBoxFromPose", () => {
    const makeLandmarks = (overrides: Array<{ index: number; y: number; x?: number }> = []) => {
      const landmarks = Array.from({ length: 33 }, () => ({
        x: 0.5,
        y: 0.5,
        visibility: 0.9,
      }));
      // Default torso shape inside the frame
      landmarks[11] = { x: 0.4, y: 0.3, visibility: 0.9 }; // left shoulder
      landmarks[12] = { x: 0.6, y: 0.3, visibility: 0.9 }; // right shoulder
      landmarks[23] = { x: 0.42, y: 0.7, visibility: 0.9 }; // left hip
      landmarks[24] = { x: 0.58, y: 0.7, visibility: 0.9 }; // right hip
      for (const override of overrides) {
        landmarks[override.index] = {
          x: override.x ?? landmarks[override.index].x,
          y: override.y,
          visibility: landmarks[override.index].visibility,
        };
      }
      return landmarks;
    };

    test("全torsoランドマークが画像内にあるときは胸枠を返す", () => {
      const box = buildChestBoxFromPose(makeLandmarks());
      expect(box).not.toBeNull();
      expect(box!.left).toBeGreaterThanOrEqual(0);
      expect(box!.top).toBeGreaterThanOrEqual(0);
    });

    test("腰が画像外 (y > 1) のときは null を返して fallback を誘発する", () => {
      const box = buildChestBoxFromPose(
        makeLandmarks([
          { index: 23, y: 1.35 },
          { index: 24, y: 1.35 },
        ])
      );
      expect(box).toBeNull();
    });

    test("片方の腰だけ画像外でも null を返す", () => {
      const box = buildChestBoxFromPose(
        makeLandmarks([{ index: 24, y: 1.5 }])
      );
      expect(box).toBeNull();
    });

    test("肩が画像外のときも null を返す", () => {
      const box = buildChestBoxFromPose(
        makeLandmarks([
          { index: 11, y: 1.1 },
          { index: 12, y: 1.1 },
        ])
      );
      expect(box).toBeNull();
    });

    test("腰が画像上端より上 (y < 0) でも null", () => {
      const box = buildChestBoxFromPose(
        makeLandmarks([
          { index: 23, y: -0.2 },
          { index: 24, y: -0.2 },
        ])
      );
      expect(box).toBeNull();
    });

    test("landmark が null/欠落なら null", () => {
      expect(buildChestBoxFromPose(null)).toBeNull();
      const incomplete = Array.from({ length: 10 }, () => ({
        x: 0.5,
        y: 0.5,
        visibility: 0.9,
      }));
      expect(buildChestBoxFromPose(incomplete)).toBeNull();
    });
  });

  describe("detectUpperBodyMissing", () => {
    const makeWithShoulders = (shoulderY: number, inFrame = true) => {
      const landmarks = Array.from({ length: 33 }, () => ({
        x: 0.5,
        y: 0.5,
        visibility: 0.9,
      }));
      landmarks[11] = { x: inFrame ? 0.4 : 1.4, y: shoulderY, visibility: 0.9 };
      landmarks[12] = { x: inFrame ? 0.6 : 1.6, y: shoulderY, visibility: 0.9 };
      return landmarks;
    };

    test("肩が画像中央にあれば false", () => {
      expect(detectUpperBodyMissing(makeWithShoulders(0.3))).toBe(false);
    });

    test("肩が y=0.8 ちょうどでは false（境界外）", () => {
      expect(detectUpperBodyMissing(makeWithShoulders(0.8))).toBe(false);
    });

    test("肩が y > 0.8 では true (顔のみクロップ判定)", () => {
      expect(detectUpperBodyMissing(makeWithShoulders(0.85))).toBe(true);
      expect(detectUpperBodyMissing(makeWithShoulders(0.95))).toBe(true);
    });

    test("肩が画像外にある (x>1) と true", () => {
      expect(detectUpperBodyMissing(makeWithShoulders(0.5, false))).toBe(true);
    });

    test("landmarks=null や肩なしのときは false", () => {
      expect(detectUpperBodyMissing(null)).toBe(false);
      expect(detectUpperBodyMissing([])).toBe(false);
      expect(
        detectUpperBodyMissing(
          Array.from({ length: 5 }, () => ({ x: 0.5, y: 0.5, visibility: 0.9 }))
        )
      ).toBe(false);
    });
  });
});
