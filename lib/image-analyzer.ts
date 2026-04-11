import {
  DIAGNOSIS_MODEL_METRICS,
  diagnoseFromFeatures,
  type DiagnosisFeatures,
  type DiagnosisResult,
  type SilhouetteType,
} from "./diagnosis-model.ts";

const REGION_BOUNDS = {
  full: [0, 0, 1, 1],
  top: [0, 0, 1, 0.45],
  mid: [0, 0.25, 1, 0.75],
  low: [0, 0.45, 1, 1],
  fullCenter: [0.16, 0, 0.84, 1],
  topCenter: [0.18, 0.02, 0.82, 0.55],
  torsoCenter: [0.18, 0.16, 0.82, 0.72],
  lowCenter: [0.16, 0.45, 0.84, 1],
} as const;

const HEIGHT_FEATURE_SPECS = [
  [
    { region: "full", size: 6, mode: "gray" },
    { region: "full", size: 8, mode: "gray" },
  ],
  [
    { region: "full", size: 6, mode: "gray" },
    { region: "top", size: 6, mode: "gray" },
    { region: "low", size: 6, mode: "gray" },
  ],
  [{ region: "full", size: 14, mode: "gray" }],
  [
    { region: "fullCenter", size: 8, mode: "gray" },
    { region: "lowCenter", size: 8, mode: "gray" },
  ],
  [
    { region: "fullCenter", size: 12, mode: "profile" },
    { region: "lowCenter", size: 10, mode: "profile" },
  ],
  [{ region: "full", size: 8, mode: "edge" }],
  [
    { region: "fullCenter", size: 8, mode: "edge" },
    { region: "lowCenter", size: 8, mode: "edge" },
  ],
] as const;
const CUP_FEATURE_SPECS = [
  [
    { region: "top", size: 8, mode: "gray" },
    { region: "top", size: 12, mode: "gray" },
  ],
  [
    { region: "top", size: 8, mode: "gray" },
    { region: "mid", size: 6, mode: "gray" },
  ],
  [
    { region: "topCenter", size: 10, mode: "gray" },
    { region: "torsoCenter", size: 8, mode: "gray" },
  ],
  [
    { region: "topCenter", size: 12, mode: "profile" },
    { region: "torsoCenter", size: 10, mode: "profile" },
  ],
  [{ region: "top", size: 10, mode: "edge" }],
] as const;
const SIMILARITY_FEATURE_SPECS = [
  { region: "full", size: 8, mode: "gray" },
  { region: "top", size: 8, mode: "gray" },
] as const;
const FOCUS_SAMPLE_SIZE = 64;
const FOCUS_LOW_QUANTILE = 0.08;
const FOCUS_HIGH_QUANTILE = 0.92;
const FOCUS_MIN_WIDTH_RATIO = 0.68;
const FOCUS_MIN_HEIGHT_RATIO = 0.88;
const FOCUS_HORIZONTAL_PADDING_RATIO = 0.1;
const FOCUS_VERTICAL_PADDING_RATIO = 0.04;

export const AI_LOADING_MESSAGES = [
  "輪郭と明暗パターンを抽出中…",
  "学習プロフィール画像と比較中…",
  "身長の近傍候補を集計中…",
  "カップの近傍投票を計算中…",
  "診断結果を組み立て中…",
] as const;

export const DIAGNOSIS_MODEL_SUMMARY = `学習プロフィール画像${DIAGNOSIS_MODEL_METRICS.trainingCount}枚の近傍比較モデル`;
export const DIAGNOSIS_VALIDATION_LABEL = `固定テスト: 身長の7割が±${DIAGNOSIS_MODEL_METRICS.height.generalization.coverage[0]?.maxError ?? 0}cm以内 / カップの7割が±${DIAGNOSIS_MODEL_METRICS.cup.generalization.coverage[0]?.maxError ?? 0}カップ以内`;

export const DIAGNOSIS_DISCLAIMERS = [
  `※ ${DIAGNOSIS_MODEL_SUMMARY}です`,
  `※ 固定テスト: 身長${DIAGNOSIS_MODEL_METRICS.height.generalization.holdoutCount}件 / カップ${DIAGNOSIS_MODEL_METRICS.cup.generalization.holdoutCount}件`,
  "※ 未知データへの精度保証はありません。結果は参考・エンタメ用途です",
  "※ 画像はサーバーに送信されません。全てブラウザ内で処理されます",
] as const;

type FeatureRegion = keyof typeof REGION_BOUNDS;
type FeatureMode = "gray" | "profile" | "edge";
type FeatureSpec = { region: FeatureRegion; size: number; mode: FeatureMode };
type FocusRange = { start: number; end: number };

function roundFeature(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function getWeightedBounds(weights: number[], lowQuantile: number, highQuantile: number) {
  const total = weights.reduce((sum, value) => sum + value, 0);

  if (total <= 1e-9) {
    return { start: 0, end: weights.length - 1 };
  }

  const lowTarget = total * lowQuantile;
  const highTarget = total * highQuantile;
  let cumulative = 0;
  let start = 0;
  let end = weights.length - 1;
  let foundStart = false;

  for (let index = 0; index < weights.length; index += 1) {
    cumulative += weights[index] ?? 0;

    if (!foundStart && cumulative >= lowTarget) {
      start = index;
      foundStart = true;
    }

    if (cumulative >= highTarget) {
      end = index;
      break;
    }
  }

  return { start, end: Math.max(start, end) };
}

function expandFocusRange(
  start: number,
  end: number,
  minSpan: number,
  paddingRatio: number
): FocusRange {
  const center = (start + end) / 2;
  const span = Math.max(minSpan, (end - start) * (1 + paddingRatio * 2));
  let nextStart = Math.max(0, center - span / 2);
  let nextEnd = Math.min(1, center + span / 2);

  if (nextEnd - nextStart < span) {
    if (nextStart === 0) {
      nextEnd = Math.min(1, span);
    } else {
      nextStart = Math.max(0, 1 - span);
    }
  }

  return { start: nextStart, end: nextEnd };
}

function createFocusedCanvas(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("画像の読み込みに失敗しました");
  }

  canvas.width = FOCUS_SAMPLE_SIZE;
  canvas.height = FOCUS_SAMPLE_SIZE;
  context.drawImage(image, 0, 0, FOCUS_SAMPLE_SIZE, FOCUS_SAMPLE_SIZE);
  const samplePixels = context.getImageData(0, 0, FOCUS_SAMPLE_SIZE, FOCUS_SAMPLE_SIZE).data;
  const grayscale = grayscaleFromPixels(samplePixels);
  const edgeValues = edgeFromGrayscale(grayscale, FOCUS_SAMPLE_SIZE);
  const rowWeights = Array.from({ length: FOCUS_SAMPLE_SIZE }, () => 0);
  const columnWeights = Array.from({ length: FOCUS_SAMPLE_SIZE }, () => 0);

  for (let rowIndex = 0; rowIndex < FOCUS_SAMPLE_SIZE; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < FOCUS_SAMPLE_SIZE; columnIndex += 1) {
      const energy = edgeValues[rowIndex * FOCUS_SAMPLE_SIZE + columnIndex] ?? 0;

      rowWeights[rowIndex] += energy;
      columnWeights[columnIndex] += energy;
    }
  }

  const rowBounds = getWeightedBounds(
    rowWeights,
    FOCUS_LOW_QUANTILE,
    FOCUS_HIGH_QUANTILE
  );
  const columnBounds = getWeightedBounds(
    columnWeights,
    FOCUS_LOW_QUANTILE,
    FOCUS_HIGH_QUANTILE
  );
  const verticalRange = expandFocusRange(
    rowBounds.start / FOCUS_SAMPLE_SIZE,
    (rowBounds.end + 1) / FOCUS_SAMPLE_SIZE,
    FOCUS_MIN_HEIGHT_RATIO,
    FOCUS_VERTICAL_PADDING_RATIO
  );
  const horizontalRange = expandFocusRange(
    columnBounds.start / FOCUS_SAMPLE_SIZE,
    (columnBounds.end + 1) / FOCUS_SAMPLE_SIZE,
    FOCUS_MIN_WIDTH_RATIO,
    FOCUS_HORIZONTAL_PADDING_RATIO
  );
  const sourceLeft = Math.floor(image.naturalWidth * horizontalRange.start);
  const sourceTop = Math.floor(image.naturalHeight * verticalRange.start);
  const sourceRight = Math.max(
    sourceLeft + 1,
    Math.ceil(image.naturalWidth * horizontalRange.end)
  );
  const sourceBottom = Math.max(
    sourceTop + 1,
    Math.ceil(image.naturalHeight * verticalRange.end)
  );
  const sourceWidth = sourceRight - sourceLeft;
  const sourceHeight = sourceBottom - sourceTop;
  const focusedCanvas = document.createElement("canvas");
  const focusedContext = focusedCanvas.getContext("2d", { willReadFrequently: true });

  if (!focusedContext) {
    throw new Error("画像の読み込みに失敗しました");
  }

  focusedCanvas.width = sourceWidth;
  focusedCanvas.height = sourceHeight;
  focusedContext.drawImage(
    image,
    sourceLeft,
    sourceTop,
    sourceWidth,
    sourceHeight,
    0,
    0,
    sourceWidth,
    sourceHeight
  );

  return focusedCanvas;
}

function drawRegion(
  image: HTMLCanvasElement,
  region: FeatureRegion,
  size: number
): Uint8ClampedArray {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("画像の読み込みに失敗しました");
  }

  const [leftRatio, topRatio, rightRatio, bottomRatio] = REGION_BOUNDS[region];
  const sourceLeft = Math.floor(image.width * leftRatio);
  const sourceTop = Math.floor(image.height * topRatio);
  const sourceWidth = Math.max(
    1,
    Math.floor(image.width * rightRatio) - sourceLeft
  );
  const sourceHeight = Math.max(
    1,
    Math.floor(image.height * bottomRatio) - sourceTop
  );

  canvas.width = size;
  canvas.height = size;
  context.drawImage(
    image,
    sourceLeft,
    sourceTop,
    sourceWidth,
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

function profileFromGrayscale(grayscale: number[], size: number): number[] {
  const rows = Array.from({ length: size }, (_, rowIndex) => {
    const start = rowIndex * size;
    const row = grayscale.slice(start, start + size);
    return roundFeature(row.reduce((sum, value) => sum + value, 0) / size);
  });
  const columns = Array.from({ length: size }, (_, columnIndex) => {
    let sum = 0;

    for (let rowIndex = 0; rowIndex < size; rowIndex += 1) {
      sum += grayscale[rowIndex * size + columnIndex] ?? 0;
    }

    return roundFeature(sum / size);
  });

  return [...rows, ...columns];
}

function edgeFromGrayscale(grayscale: number[], size: number): number[] {
  const edgeValues: number[] = [];

  for (let rowIndex = 0; rowIndex < size; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < size; columnIndex += 1) {
      const center = grayscale[rowIndex * size + columnIndex] ?? 0;
      const left = grayscale[rowIndex * size + Math.max(0, columnIndex - 1)] ?? center;
      const right =
        grayscale[rowIndex * size + Math.min(size - 1, columnIndex + 1)] ?? center;
      const up = grayscale[Math.max(0, rowIndex - 1) * size + columnIndex] ?? center;
      const down =
        grayscale[Math.min(size - 1, rowIndex + 1) * size + columnIndex] ?? center;
      const gradient = Math.min(1, (Math.abs(right - left) + Math.abs(down - up)) / 2);

      edgeValues.push(roundFeature(gradient));
    }
  }

  return edgeValues;
}

function extractFeatureBlock(image: HTMLCanvasElement, spec: FeatureSpec): number[] {
  const grayscale = grayscaleFromPixels(drawRegion(image, spec.region, spec.size));

  if (spec.mode === "profile") {
    return profileFromGrayscale(grayscale, spec.size);
  }

  if (spec.mode === "edge") {
    return edgeFromGrayscale(grayscale, spec.size);
  }

  return grayscale;
}

function extractFeatures(image: HTMLCanvasElement, specs: readonly FeatureSpec[]): number[] {
  return specs.flatMap((spec) => extractFeatureBlock(image, spec));
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
  const focusedImage = createFocusedCanvas(image);

  return {
    heightPrimary: extractFeatures(focusedImage, HEIGHT_FEATURE_SPECS[0]),
    heightBalanced: extractFeatures(focusedImage, HEIGHT_FEATURE_SPECS[1]),
    heightWide: extractFeatures(focusedImage, HEIGHT_FEATURE_SPECS[2]),
    heightCenter: extractFeatures(focusedImage, HEIGHT_FEATURE_SPECS[3]),
    heightProfile: extractFeatures(focusedImage, HEIGHT_FEATURE_SPECS[4]),
    heightEdgeFull: extractFeatures(focusedImage, HEIGHT_FEATURE_SPECS[5]),
    heightEdgeCenter: extractFeatures(focusedImage, HEIGHT_FEATURE_SPECS[6]),
    cupPrimary: extractFeatures(focusedImage, CUP_FEATURE_SPECS[0]),
    cupSecondary: extractFeatures(focusedImage, CUP_FEATURE_SPECS[1]),
    cupCenter: extractFeatures(focusedImage, CUP_FEATURE_SPECS[2]),
    cupProfile: extractFeatures(focusedImage, CUP_FEATURE_SPECS[3]),
    cupEdgeTop: extractFeatures(focusedImage, CUP_FEATURE_SPECS[4]),
    similarity: extractFeatures(focusedImage, SIMILARITY_FEATURE_SPECS),
  };
}

export function diagnose(features: DiagnosisFeatures): DiagnosisResult {
  return diagnoseFromFeatures(features);
}

export type { DiagnosisFeatures, DiagnosisResult, SilhouetteType };
