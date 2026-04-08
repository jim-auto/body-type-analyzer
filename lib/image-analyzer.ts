import {
  DIAGNOSIS_MODEL_METRICS,
  diagnoseFromFeatures,
  type DiagnosisFeatures,
  type DiagnosisResult,
  type SilhouetteType,
} from "./diagnosis-model.ts";

const REGION_BOUNDS = {
  full: [0, 1],
  top: [0, 0.45],
  mid: [0.25, 0.75],
  low: [0.45, 1],
} as const;

const HEIGHT_FEATURE_SPECS = [
  [
    { region: "full", size: 6 },
    { region: "full", size: 8 },
  ],
  [
    { region: "full", size: 6 },
    { region: "top", size: 6 },
    { region: "low", size: 6 },
  ],
  [{ region: "full", size: 14 }],
] as const;
const CUP_FEATURE_SPECS = [
  [
    { region: "top", size: 8 },
    { region: "top", size: 12 },
  ],
  [
    { region: "top", size: 8 },
    { region: "mid", size: 6 },
  ],
] as const;
const SIMILARITY_FEATURE_SPECS = [
  { region: "full", size: 8 },
  { region: "top", size: 8 },
] as const;

export const AI_LOADING_MESSAGES = [
  "輪郭と明暗パターンを抽出中…",
  "公開プロフィール画像と比較中…",
  "身長の近傍候補を集計中…",
  "カップの近傍投票を計算中…",
  "診断結果を組み立て中…",
] as const;

export const DIAGNOSIS_MODEL_SUMMARY = `学習プロフィール画像${DIAGNOSIS_MODEL_METRICS.trainingCount}枚の近傍比較モデル`;
export const DIAGNOSIS_VALIDATION_LABEL = `検証: 身長の8割が±${DIAGNOSIS_MODEL_METRICS.height.coverage[1]?.maxError ?? 0}cm以内 / カップの7割が±${DIAGNOSIS_MODEL_METRICS.cup.coverage[0]?.maxError ?? 0}カップ以内`;

export const DIAGNOSIS_DISCLAIMERS = [
  `※ ${DIAGNOSIS_MODEL_SUMMARY}です`,
  `※ leave-one-out検証: 身長の8割が±${DIAGNOSIS_MODEL_METRICS.height.coverage[1]?.maxError ?? 0}cm以内 / カップの7割が±${DIAGNOSIS_MODEL_METRICS.cup.coverage[0]?.maxError ?? 0}カップ以内`,
  "※ 未知データへの精度保証はありません。結果は参考・エンタメ用途です",
  "※ 画像はサーバーに送信されません。全てブラウザ内で処理されます",
] as const;

export const DIAGNOSIS_SHARE_URL =
  "https://jim-auto.github.io/body-type-analyzer/";

type FeatureRegion = keyof typeof REGION_BOUNDS;
type FeatureSpec = { region: FeatureRegion; size: number };

function roundFeature(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function drawRegion(
  image: HTMLImageElement,
  region: FeatureRegion,
  size: number
): Uint8ClampedArray {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("画像の読み込みに失敗しました");
  }

  const [topRatio, bottomRatio] = REGION_BOUNDS[region];
  const sourceTop = Math.floor(image.naturalHeight * topRatio);
  const sourceHeight = Math.max(
    1,
    Math.floor(image.naturalHeight * bottomRatio) - sourceTop
  );

  canvas.width = size;
  canvas.height = size;
  context.drawImage(
    image,
    0,
    sourceTop,
    image.naturalWidth,
    sourceHeight,
    0,
    0,
    size,
    size
  );

  return context.getImageData(0, 0, size, size).data;
}

function grayscaleFromPixels(pixels: Uint8ClampedArray): number[] {
  const grayscale: number[] = [];

  for (let index = 0; index < pixels.length; index += 4) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    const gray = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

    grayscale.push(roundFeature(gray));
  }

  return grayscale;
}

function extractFeatures(image: HTMLImageElement, specs: readonly FeatureSpec[]): number[] {
  return specs.flatMap((spec) =>
    grayscaleFromPixels(drawRegion(image, spec.region, spec.size))
  );
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("画像の読み込みに失敗しました"));
    };
    image.src = objectUrl;
  });
}

export async function extractDiagnosisFeatures(
  file: File
): Promise<DiagnosisFeatures> {
  const image = await loadImage(file);

  return {
    heightPrimary: extractFeatures(image, HEIGHT_FEATURE_SPECS[0]),
    heightBalanced: extractFeatures(image, HEIGHT_FEATURE_SPECS[1]),
    heightWide: extractFeatures(image, HEIGHT_FEATURE_SPECS[2]),
    cupPrimary: extractFeatures(image, CUP_FEATURE_SPECS[0]),
    cupSecondary: extractFeatures(image, CUP_FEATURE_SPECS[1]),
    similarity: extractFeatures(image, SIMILARITY_FEATURE_SPECS),
  };
}

export function diagnose(features: DiagnosisFeatures): DiagnosisResult {
  return diagnoseFromFeatures(features);
}

export function buildShareText(result: DiagnosisResult): string {
  return [
    "【芸能人スタイルランキング 画像比較診断】",
    `推定身長: ${result.estimatedHeight}cm（偏差値${result.heightDeviation}）`,
    `推定カップ: ${result.estimatedCup}カップ（偏差値${result.cupDeviation}）`,
    `似ている有名人: ${result.similarCelebrity}`,
    `AI信頼度: ${result.confidence}%（近傍比較モデル）`,
    "",
    "#芸能人スタイルランキング",
    DIAGNOSIS_SHARE_URL,
  ].join("\n");
}

export function buildXShareUrl(result: DiagnosisResult): string {
  return `https://x.com/intent/tweet?text=${encodeURIComponent(
    buildShareText(result)
  )}`;
}

export type { DiagnosisFeatures, DiagnosisResult, SilhouetteType };
