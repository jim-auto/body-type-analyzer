import {
  DIAGNOSIS_MODEL_METRICS,
  MALE_DIAGNOSIS_MODEL_METRICS,
  diagnoseMaleFromFeatures,
  diagnoseFromFeatures,
  normalizeFeatures,
  normalizeMaleFeatures,
  type DiagnosisFeatures,
  type DiagnosisResult,
  type MaleDiagnosisResult,
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
  [
    { region: "full", size: 8, mode: "gray_histogram" },
    { region: "full", size: 8, mode: "edge_histogram" },
  ],
  [
    { region: "full", size: 8, mode: "lbp" },
    { region: "fullCenter", size: 8, mode: "lbp" },
  ],
  [{ region: "full", size: 12, mode: "dct" }],
  [
    { region: "full", size: 8, mode: "hog" },
    { region: "fullCenter", size: 8, mode: "hog" },
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
  [
    { region: "top", size: 8, mode: "gray_histogram" },
    { region: "top", size: 8, mode: "edge_histogram" },
  ],
  [
    { region: "top", size: 8, mode: "lbp" },
    { region: "topCenter", size: 8, mode: "lbp" },
  ],
  [{ region: "top", size: 12, mode: "dct" }],
  [
    { region: "top", size: 8, mode: "hog" },
    { region: "topCenter", size: 8, mode: "hog" },
  ],
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
const LOW_INFORMATION_BRIGHTNESS_MIN = 0.88;
const LOW_INFORMATION_CONTRAST_MAX = 0.09;
const LOW_INFORMATION_EDGE_MEAN_MAX = 0.03;
const LOW_INFORMATION_ENTROPY_MAX = 2.2;

export const DIAGNOSIS_INPUT_QUALITY_ERROR_MESSAGE =
  "Image quality is too low for a stable estimate. Use a clearer photo with visible outline and contrast.";

export const AI_LOADING_MESSAGES = [
  "輪郭と明暗パターンを抽出中…",
  "学習プロフィール画像と比較中…",
  "身長の近傍候補を集計中…",
  "カップの近傍投票を計算中…",
  "診断結果を組み立て中…",
] as const;

export const DIAGNOSIS_MODEL_SUMMARY = `学習プロフィール画像${DIAGNOSIS_MODEL_METRICS.trainingCount}枚の近傍比較モデル`;
export const MALE_DIAGNOSIS_MODEL_SUMMARY = `学習プロフィール画像${MALE_DIAGNOSIS_MODEL_METRICS.trainingCount}枚の近傍比較モデル`;
export const DIAGNOSIS_VALIDATION_LABEL = `固定テスト: 身長の7割が±${DIAGNOSIS_MODEL_METRICS.height.generalization.coverage[0]?.maxError ?? 0}cm以内 / カップの7割が±${DIAGNOSIS_MODEL_METRICS.cup.generalization.coverage[0]?.maxError ?? 0}カップ以内`;

export const DIAGNOSIS_DISCLAIMERS = [
  `※ ${DIAGNOSIS_MODEL_SUMMARY}です`,
  `※ 固定テスト: 身長${DIAGNOSIS_MODEL_METRICS.height.generalization.holdoutCount}件 / カップ${DIAGNOSIS_MODEL_METRICS.cup.generalization.holdoutCount}件`,
  "※ 未知データへの精度保証はありません。結果は参考・エンタメ用途です",
  "※ 画像はサーバーに送信されません。全てブラウザ内で処理されます",
] as const;

type FeatureRegion = keyof typeof REGION_BOUNDS;
type FeatureMode = "gray" | "profile" | "edge" | "gray_histogram" | "edge_histogram" | "lbp" | "dct" | "hog";
type FeatureSpec = { region: FeatureRegion; size: number; mode: FeatureMode };
type FocusRange = { start: number; end: number };
type RatioBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};
type FocusCropConfig = {
  lowQuantile: number;
  highQuantile: number;
  minWidthRatio: number;
  minHeightRatio: number;
  horizontalPaddingRatio: number;
  verticalPaddingRatio: number;
};
type FocusedCanvasResult = {
  canvas: HTMLCanvasElement;
  box: RatioBox;
};
type PoseLandmark = {
  x: number;
  y: number;
  visibility?: number;
};
type PoseAnalysis = {
  features: number[];
  landmarks: PoseLandmark[] | null;
};

export type DiagnosisImageQualityMetrics = {
  width: number;
  height: number;
  aspectRatio: number;
  brightnessMean: number;
  contrastStddev: number;
  edgeMean: number;
  edgeP90: number;
  entropy: number;
};

export type PoseKeypointName =
  | "nose"
  | "leftShoulder"
  | "rightShoulder"
  | "leftHip"
  | "rightHip";

export type PoseKeypoint = {
  name: PoseKeypointName;
  x: number;
  y: number;
  visibility: number;
};

export type DiagnosisVisualizationOverlay = {
  imageWidth: number;
  imageHeight: number;
  focusBox: RatioBox;
  cupFeatureBox: RatioBox;
  chestBox: RatioBox;
  chestBoxSource: "pose" | "feature-crop";
  bodyMaskDataUrl: string | null;
  bodyMaskCoverage: number | null;
  poseKeypoints: PoseKeypoint[] | null;
};

export class DiagnosisInputQualityError extends Error {
  constructor(message = DIAGNOSIS_INPUT_QUALITY_ERROR_MESSAGE) {
    super(message);
    this.name = "DiagnosisInputQualityError";
  }
}

const DEFAULT_FOCUS_CROP: FocusCropConfig = {
  lowQuantile: FOCUS_LOW_QUANTILE,
  highQuantile: FOCUS_HIGH_QUANTILE,
  minWidthRatio: FOCUS_MIN_WIDTH_RATIO,
  minHeightRatio: FOCUS_MIN_HEIGHT_RATIO,
  horizontalPaddingRatio: FOCUS_HORIZONTAL_PADDING_RATIO,
  verticalPaddingRatio: FOCUS_VERTICAL_PADDING_RATIO,
};

function roundFeature(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function roundQualityMetric(value: number): number {
  return Math.round(value * 1000000) / 1000000;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundBoxValue(value: number): number {
  return Math.round(clamp(value, 0, 1) * 10000) / 10000;
}

function normalizeRatioBox(box: RatioBox): RatioBox {
  const left = clamp(box.left, 0, 1);
  const top = clamp(box.top, 0, 1);
  const right = clamp(box.left + box.width, left, 1);
  const bottom = clamp(box.top + box.height, top, 1);

  return {
    left: roundBoxValue(left),
    top: roundBoxValue(top),
    width: roundBoxValue(right - left),
    height: roundBoxValue(bottom - top),
  };
}

function projectRegionToSourceBox(focusBox: RatioBox, region: FeatureRegion): RatioBox {
  const [leftRatio, topRatio, rightRatio, bottomRatio] = REGION_BOUNDS[region];

  return normalizeRatioBox({
    left: focusBox.left + focusBox.width * leftRatio,
    top: focusBox.top + focusBox.height * topRatio,
    width: focusBox.width * (rightRatio - leftRatio),
    height: focusBox.height * (bottomRatio - topRatio),
  });
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function populationStddev(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const average = mean(values);

  return Math.sqrt(
    values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length
  );
}

function percentile(values: number[], ratio: number): number {
  if (values.length === 0) {
    return 0;
  }

  const ordered = [...values].sort((left, right) => left - right);
  const index = Math.min(
    ordered.length - 1,
    Math.max(0, Math.round((ordered.length - 1) * ratio))
  );

  return ordered[index] ?? 0;
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

function createFocusedCanvasResult(
  image: HTMLImageElement,
  focusCrop: FocusCropConfig
): FocusedCanvasResult {
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
    focusCrop.lowQuantile,
    focusCrop.highQuantile
  );
  const columnBounds = getWeightedBounds(
    columnWeights,
    focusCrop.lowQuantile,
    focusCrop.highQuantile
  );
  const verticalRange = expandFocusRange(
    rowBounds.start / FOCUS_SAMPLE_SIZE,
    (rowBounds.end + 1) / FOCUS_SAMPLE_SIZE,
    focusCrop.minHeightRatio,
    focusCrop.verticalPaddingRatio
  );
  const horizontalRange = expandFocusRange(
    columnBounds.start / FOCUS_SAMPLE_SIZE,
    (columnBounds.end + 1) / FOCUS_SAMPLE_SIZE,
    focusCrop.minWidthRatio,
    focusCrop.horizontalPaddingRatio
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

  return {
    canvas: focusedCanvas,
    box: normalizeRatioBox({
      left: sourceLeft / Math.max(1, image.naturalWidth),
      top: sourceTop / Math.max(1, image.naturalHeight),
      width: sourceWidth / Math.max(1, image.naturalWidth),
      height: sourceHeight / Math.max(1, image.naturalHeight),
    }),
  };
}

function createSourceCanvas(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("画像の読み込みに失敗しました");
  }

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  context.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);

  return canvas;
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

function lbpFromGrayscale(grayscale: number[], size: number, binCount = 16): number[] {
  const offsets = [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]] as const;
  const patterns: number[] = [];

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const center = grayscale[row * size + col] ?? 0;
      let code = 0;

      for (let bit = 0; bit < offsets.length; bit += 1) {
        const [dr, dc] = offsets[bit]!;
        const nr = Math.max(0, Math.min(size - 1, row + dr));
        const nc = Math.max(0, Math.min(size - 1, col + dc));

        if ((grayscale[nr * size + nc] ?? 0) >= center) {
          code |= 1 << bit;
        }
      }

      patterns.push(code);
    }
  }

  const bins = Array.from({ length: binCount }, () => 0);
  const total = patterns.length || 1;

  for (const pattern of patterns) {
    const binIndex = Math.min(Math.floor((pattern * binCount) / 256), binCount - 1);
    bins[binIndex] += 1;
  }

  return bins.map((count) => roundFeature(count / total));
}

function hogFromGrayscale(grayscale: number[], size: number, binCount = 8): number[] {
  const bins = Array.from({ length: binCount }, () => 0);

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const left = grayscale[row * size + Math.max(0, col - 1)] ?? 0;
      const right = grayscale[row * size + Math.min(size - 1, col + 1)] ?? 0;
      const up = grayscale[Math.max(0, row - 1) * size + col] ?? 0;
      const down = grayscale[Math.min(size - 1, row + 1) * size + col] ?? 0;
      const gx = right - left;
      const gy = down - up;
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      const angle = Math.atan2(gy, gx) + Math.PI;
      const binIndex = Math.min(
        Math.floor((angle / (2 * Math.PI)) * binCount),
        binCount - 1
      );

      bins[binIndex] += magnitude;
    }
  }

  const total = bins.reduce((sum, b) => sum + b, 0) || 1;

  return bins.map((b) => roundFeature(b / total));
}

function dct1d(vector: number[]): number[] {
  const n = vector.length;
  const scale = Math.sqrt(2 / n);

  return Array.from({ length: n }, (_, k) => {
    let total = 0;

    for (let i = 0; i < n; i += 1) {
      total += (vector[i] ?? 0) * Math.cos((Math.PI * k * (2 * i + 1)) / (2 * n));
    }

    return roundFeature(total * scale);
  });
}

function dctFromGrayscale(grayscale: number[], size: number, coeffCount = 8): number[] {
  const grid: number[][] = [];

  for (let r = 0; r < size; r += 1) {
    grid.push(grayscale.slice(r * size, (r + 1) * size));
  }

  const rowDct = grid.map((row) => dct1d(row));
  const colTransposed: number[][] = [];

  for (let c = 0; c < size; c += 1) {
    colTransposed.push(Array.from({ length: size }, (_, r) => rowDct[r]?.[c] ?? 0));
  }

  const fullDct = colTransposed.map((col) => dct1d(col));
  const coefficients: number[] = [];
  const limit = Math.min(coeffCount, size);

  for (let row = 0; row < limit; row += 1) {
    for (let col = 0; col < limit; col += 1) {
      coefficients.push(fullDct[col]?.[row] ?? 0);
    }
  }

  return coefficients.slice(0, coeffCount * coeffCount);
}

function histogramFromValues(values: number[], binCount = 16): number[] {
  const bins = Array.from({ length: binCount }, () => 0);

  for (const value of values) {
    const index = Math.min(Math.floor(value * binCount), binCount - 1);
    bins[index] += 1;
  }

  const total = values.length || 1;

  return bins.map((count) => roundFeature(count / total));
}

function extractFeatureBlock(image: HTMLCanvasElement, spec: FeatureSpec): number[] {
  const grayscale = grayscaleFromPixels(drawRegion(image, spec.region, spec.size));

  if (spec.mode === "profile") {
    return profileFromGrayscale(grayscale, spec.size);
  }

  if (spec.mode === "edge") {
    return edgeFromGrayscale(grayscale, spec.size);
  }

  if (spec.mode === "gray_histogram") {
    return histogramFromValues(grayscale);
  }

  if (spec.mode === "edge_histogram") {
    return histogramFromValues(edgeFromGrayscale(grayscale, spec.size));
  }

  if (spec.mode === "lbp") {
    return lbpFromGrayscale(grayscale, spec.size);
  }

  if (spec.mode === "dct") {
    return dctFromGrayscale(grayscale, spec.size);
  }

  if (spec.mode === "hog") {
    return hogFromGrayscale(grayscale, spec.size);
  }

  return grayscale;
}

function extractFeatures(image: HTMLCanvasElement, specs: readonly FeatureSpec[]): number[] {
  return specs.flatMap((spec) => extractFeatureBlock(image, spec));
}

export function buildDiagnosisImageQualityMetrics(
  image: HTMLCanvasElement
): DiagnosisImageQualityMetrics {
  const grayscale = grayscaleFromPixels(drawRegion(image, "full", FOCUS_SAMPLE_SIZE));
  const edgeValues = edgeFromGrayscale(grayscale, FOCUS_SAMPLE_SIZE);
  const histogram = Array.from({ length: 256 }, () => 0);

  grayscale.forEach((value) => {
    const bucket = Math.min(255, Math.max(0, Math.round(value * 255)));

    histogram[bucket] += 1;
  });

  const total = histogram.reduce((sum, count) => sum + count, 0);
  let entropy = 0;

  histogram.forEach((count) => {
    if (count === 0 || total === 0) {
      return;
    }

    const probability = count / total;
    entropy -= probability * Math.log2(probability);
  });

  return {
    width: image.width,
    height: image.height,
    aspectRatio: roundQualityMetric(image.width / Math.max(1, image.height)),
    brightnessMean: roundQualityMetric(mean(grayscale)),
    contrastStddev: roundQualityMetric(populationStddev(grayscale)),
    edgeMean: roundQualityMetric(mean(edgeValues)),
    edgeP90: roundQualityMetric(percentile(edgeValues, 0.9)),
    entropy: roundQualityMetric(entropy),
  };
}

export function isLowInformationDiagnosisImageQuality(
  metrics: DiagnosisImageQualityMetrics
): boolean {
  return (
    metrics.brightnessMean > LOW_INFORMATION_BRIGHTNESS_MIN &&
    metrics.contrastStddev < LOW_INFORMATION_CONTRAST_MAX &&
    metrics.edgeMean < LOW_INFORMATION_EDGE_MEAN_MAX &&
    metrics.entropy < LOW_INFORMATION_ENTROPY_MAX
  );
}

export function isDiagnosisInputQualityError(
  error: unknown
): error is DiagnosisInputQualityError {
  return error instanceof DiagnosisInputQualityError;
}

function averageFeatureVectors(featureVectors: number[][]): number[] {
  if (featureVectors.length === 1) {
    return featureVectors[0] ?? [];
  }

  const vectorLength = featureVectors[0]?.length ?? 0;

  return Array.from({ length: vectorLength }, (_, index) => {
    const sum = featureVectors.reduce(
      (total, featureVector) => total + (featureVector[index] ?? 0),
      0
    );

    return roundFeature(sum / featureVectors.length);
  });
}

function extractEnsembleFeatures(
  images: HTMLCanvasElement[],
  specs: readonly FeatureSpec[]
): number[] {
  return averageFeatureVectors(images.map((image) => extractFeatures(image, specs)));
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

function buildBodyMaskVisualization(
  image: HTMLImageElement,
  focusBox: RatioBox,
  landmarks: PoseLandmark[] | null
): { dataUrl: string; coverage: number } | null {
  const width = image.naturalWidth;
  const height = image.naturalHeight;

  if (width <= 0 || height <= 0) {
    return null;
  }
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  canvas.width = width;
  canvas.height = height;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "rgba(14, 165, 233, 0.36)";

  const leftShoulder = landmarks?.[11];
  const rightShoulder = landmarks?.[12];
  const leftHip = landmarks?.[23];
  const rightHip = landmarks?.[24];
  const hasTorso =
    leftShoulder &&
    rightShoulder &&
    leftHip &&
    rightHip &&
    areTorsoLandmarksInFrame(leftShoulder, rightShoulder, leftHip, rightHip) &&
    mean([leftShoulder, rightShoulder, leftHip, rightHip].map((point) => point.visibility ?? 1)) >= 0.2;

  if (hasTorso) {
    const shoulderPadding = Math.abs(rightShoulder.x - leftShoulder.x) * 0.22;
    const hipPadding = Math.abs(rightHip.x - leftHip.x) * 0.16;
    const topPadding = Math.max(0.02, (leftHip.y + rightHip.y - leftShoulder.y - rightShoulder.y) * 0.04);

    context.beginPath();
    context.moveTo(
      (leftShoulder.x - shoulderPadding) * width,
      (leftShoulder.y - topPadding) * height
    );
    context.quadraticCurveTo(
      ((leftShoulder.x + rightShoulder.x) / 2) * width,
      (Math.min(leftShoulder.y, rightShoulder.y) - topPadding * 2) * height,
      (rightShoulder.x + shoulderPadding) * width,
      (rightShoulder.y - topPadding) * height
    );
    context.lineTo((rightHip.x + hipPadding) * width, rightHip.y * height);
    context.quadraticCurveTo(
      ((leftHip.x + rightHip.x) / 2) * width,
      (Math.max(leftHip.y, rightHip.y) + topPadding * 2) * height,
      (leftHip.x - hipPadding) * width,
      leftHip.y * height
    );
    context.closePath();
    context.fill();
  } else {
    const left = focusBox.left * width;
    const top = focusBox.top * height;
    const boxWidth = focusBox.width * width;
    const boxHeight = focusBox.height * height;

    context.fillRect(left, top, boxWidth, boxHeight);
  }

  const pixels = context.getImageData(0, 0, width, height).data;
  let activePixels = 0;

  for (let index = 3; index < pixels.length; index += 4) {
    if ((pixels[index] ?? 0) > 8) {
      activePixels += 1;
    }
  }

  return {
    dataUrl: canvas.toDataURL("image/png"),
    coverage: roundQualityMetric(activePixels / Math.max(1, width * height)),
  };
}

const POSE_FEATURE_DIM = 12;
const POSE_ZERO_FEATURES = Array.from({ length: POSE_FEATURE_DIM }, () => 0);

function landmarkDistance(
  landmarks: Array<{ x: number; y: number }>,
  a: number,
  b: number
): number {
  const la = landmarks[a]!;
  const lb = landmarks[b]!;

  return Math.sqrt((la.x - lb.x) ** 2 + (la.y - lb.y) ** 2);
}

function computePoseFeatures(
  landmarks: Array<{ x: number; y: number }>
): number[] {
  const shoulderW = landmarkDistance(landmarks, 11, 12);
  const hipW = landmarkDistance(landmarks, 23, 24);
  const torsoL =
    (landmarkDistance(landmarks, 11, 23) + landmarkDistance(landmarks, 12, 24)) /
    2;
  const leftLeg =
    landmarkDistance(landmarks, 23, 25) + landmarkDistance(landmarks, 25, 27);
  const rightLeg =
    landmarkDistance(landmarks, 24, 26) + landmarkDistance(landmarks, 26, 28);
  const legL = (leftLeg + rightLeg) / 2;
  const armL =
    (landmarkDistance(landmarks, 11, 13) + landmarkDistance(landmarks, 12, 14)) /
    2;
  const noseY = landmarks[0]!.y;
  const ankleY = (landmarks[27]!.y + landmarks[28]!.y) / 2;
  const bodySpan = Math.max(0.001, ankleY - noseY);

  return [
    roundFeature(shoulderW),
    roundFeature(hipW),
    roundFeature(torsoL),
    roundFeature(legL),
    roundFeature(bodySpan),
    roundFeature(shoulderW / Math.max(hipW, 0.001)),
    roundFeature(legL / Math.max(torsoL, 0.001)),
    roundFeature(torsoL / bodySpan),
    roundFeature(legL / bodySpan),
    roundFeature(armL),
    roundFeature(shoulderW / bodySpan),
    roundFeature(hipW / bodySpan),
  ];
}

const LANDMARK_FRAME_MIN = 0;
const LANDMARK_FRAME_MAX = 1;

function isLandmarkInFrame(landmark: PoseLandmark | undefined): boolean {
  if (!landmark) return false;
  return (
    landmark.x >= LANDMARK_FRAME_MIN &&
    landmark.x <= LANDMARK_FRAME_MAX &&
    landmark.y >= LANDMARK_FRAME_MIN &&
    landmark.y <= LANDMARK_FRAME_MAX
  );
}

function areTorsoLandmarksInFrame(
  leftShoulder: PoseLandmark | undefined,
  rightShoulder: PoseLandmark | undefined,
  leftHip: PoseLandmark | undefined,
  rightHip: PoseLandmark | undefined
): boolean {
  return (
    isLandmarkInFrame(leftShoulder) &&
    isLandmarkInFrame(rightShoulder) &&
    isLandmarkInFrame(leftHip) &&
    isLandmarkInFrame(rightHip)
  );
}

export function buildChestBoxFromPose(landmarks: PoseLandmark[] | null): RatioBox | null {
  if (!landmarks) {
    return null;
  }

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return null;
  }

  if (!areTorsoLandmarksInFrame(leftShoulder, rightShoulder, leftHip, rightHip)) {
    return null;
  }

  const torsoLandmarks = [leftShoulder, rightShoulder, leftHip, rightHip];
  const visibility = mean(
    torsoLandmarks.map((landmark) => landmark.visibility ?? 1)
  );
  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
  const hipY = (leftHip.y + rightHip.y) / 2;
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
  const torsoHeight = hipY - shoulderY;

  if (
    visibility < 0.2 ||
    shoulderWidth < 0.04 ||
    torsoHeight < 0.08 ||
    !Number.isFinite(shoulderWidth) ||
    !Number.isFinite(torsoHeight)
  ) {
    return null;
  }

  const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
  const hipCenterX = (leftHip.x + rightHip.x) / 2;
  const centerX = shoulderCenterX * 0.72 + hipCenterX * 0.28;
  const width = clamp(shoulderWidth * 1.08, 0.16, 0.72);
  const top = shoulderY + torsoHeight * 0.14;
  const height = clamp(torsoHeight * 0.38, 0.08, 0.32);

  return normalizeRatioBox({
    left: centerX - width / 2,
    top,
    width,
    height,
  });
}

const POSE_KEYPOINT_MAP: ReadonlyArray<{ name: PoseKeypointName; index: number }> = [
  { name: "nose", index: 0 },
  { name: "leftShoulder", index: 11 },
  { name: "rightShoulder", index: 12 },
  { name: "leftHip", index: 23 },
  { name: "rightHip", index: 24 },
];

function buildPoseKeypoints(
  landmarks: PoseLandmark[] | null
): PoseKeypoint[] | null {
  if (!landmarks || landmarks.length === 0) {
    return null;
  }

  const keypoints: PoseKeypoint[] = [];
  for (const { name, index } of POSE_KEYPOINT_MAP) {
    const landmark = landmarks[index];
    if (!landmark) continue;
    keypoints.push({
      name,
      x: landmark.x,
      y: landmark.y,
      visibility: landmark.visibility ?? 1,
    });
  }

  return keypoints.length > 0 ? keypoints : null;
}

function buildDiagnosisVisualization(
  image: HTMLImageElement,
  focusBox: RatioBox,
  poseAnalysis: PoseAnalysis
): DiagnosisVisualizationOverlay {
  const fallbackChestBox = projectRegionToSourceBox(focusBox, "topCenter");
  const chestBox = buildChestBoxFromPose(poseAnalysis.landmarks);
  const bodyMask = buildBodyMaskVisualization(
    image,
    focusBox,
    poseAnalysis.landmarks
  );

  return {
    imageWidth: image.naturalWidth,
    imageHeight: image.naturalHeight,
    focusBox,
    cupFeatureBox: projectRegionToSourceBox(focusBox, "top"),
    chestBox: chestBox ?? fallbackChestBox,
    chestBoxSource: chestBox ? "pose" : "feature-crop",
    bodyMaskDataUrl: bodyMask?.dataUrl ?? null,
    bodyMaskCoverage: bodyMask?.coverage ?? null,
    poseKeypoints: buildPoseKeypoints(poseAnalysis.landmarks),
  };
}

async function extractPoseAnalysis(
  image: HTMLImageElement
): Promise<PoseAnalysis> {
  try {
    const { PoseLandmarker, FilesetResolver } = await import(
      "@mediapipe/tasks-vision"
    );
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    const landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
      },
      runningMode: "IMAGE",
      minPoseDetectionConfidence: 0.2,
    });

    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        return {
          features: POSE_ZERO_FEATURES,
          landmarks: null,
        };
      }

      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      context.drawImage(image, 0, 0);

      const result = landmarker.detect(canvas);

      try {
        const landmarks = result.landmarks?.[0] ?? null;

        if (!landmarks) {
          return {
            features: POSE_ZERO_FEATURES,
            landmarks: null,
          };
        }

        return {
          features: computePoseFeatures(landmarks),
          landmarks,
        };
      } finally {
        result.close();
      }
    } finally {
      landmarker.close();
    }
  } catch {
    return {
      features: POSE_ZERO_FEATURES,
      landmarks: null,
    };
  }
}

export type DiagnosisFeatureResult = {
  features: DiagnosisFeatures;
  isLowQuality: boolean;
  visualization?: DiagnosisVisualizationOverlay;
};

export async function extractDiagnosisFeatures(
  file: File
): Promise<DiagnosisFeatureResult> {
  const image = await loadImage(file);
  const sourceImage = createSourceCanvas(image);
  const focusedImageResult = createFocusedCanvasResult(image, DEFAULT_FOCUS_CROP);
  const focusedImage = focusedImageResult.canvas;
  const focusedQualityMetrics = buildDiagnosisImageQualityMetrics(focusedImage);

  const isLowQuality = isLowInformationDiagnosisImageQuality(focusedQualityMetrics);

  const poseAnalysis = await extractPoseAnalysis(image);
  const poseFeatures = poseAnalysis.features;

  const rawFeatures: DiagnosisFeatures = {
    heightPrimary: extractEnsembleFeatures([sourceImage, focusedImage], HEIGHT_FEATURE_SPECS[0]),
    heightBalanced: extractEnsembleFeatures([sourceImage, focusedImage], HEIGHT_FEATURE_SPECS[1]),
    heightWide: extractEnsembleFeatures([sourceImage, focusedImage], HEIGHT_FEATURE_SPECS[2]),
    heightCenter: extractEnsembleFeatures([sourceImage, focusedImage], HEIGHT_FEATURE_SPECS[3]),
    heightProfile: extractEnsembleFeatures([sourceImage, focusedImage], HEIGHT_FEATURE_SPECS[4]),
    heightEdgeFull: extractEnsembleFeatures([sourceImage, focusedImage], HEIGHT_FEATURE_SPECS[5]),
    heightEdgeCenter: extractEnsembleFeatures([sourceImage, focusedImage], HEIGHT_FEATURE_SPECS[6]),
    heightHistFull: extractEnsembleFeatures([sourceImage, focusedImage], HEIGHT_FEATURE_SPECS[7]),
    heightLbpFull: extractEnsembleFeatures([sourceImage, focusedImage], HEIGHT_FEATURE_SPECS[8]),
    heightDctFull: extractEnsembleFeatures([sourceImage, focusedImage], HEIGHT_FEATURE_SPECS[9]),
    heightHogFull: extractEnsembleFeatures([sourceImage, focusedImage], HEIGHT_FEATURE_SPECS[10]),
    heightPose: poseFeatures,
    cupPrimary: extractFeatures(focusedImage, CUP_FEATURE_SPECS[0]),
    cupSecondary: extractFeatures(focusedImage, CUP_FEATURE_SPECS[1]),
    cupCenter: extractFeatures(focusedImage, CUP_FEATURE_SPECS[2]),
    cupProfile: extractFeatures(focusedImage, CUP_FEATURE_SPECS[3]),
    cupEdgeTop: extractFeatures(focusedImage, CUP_FEATURE_SPECS[4]),
    cupHistTop: extractFeatures(focusedImage, CUP_FEATURE_SPECS[5]),
    cupLbpTop: extractFeatures(focusedImage, CUP_FEATURE_SPECS[6]),
    cupDctTop: extractFeatures(focusedImage, CUP_FEATURE_SPECS[7]),
    cupHogTop: extractFeatures(focusedImage, CUP_FEATURE_SPECS[8]),
    cupPose: poseFeatures,
    similarity: extractFeatures(focusedImage, SIMILARITY_FEATURE_SPECS),
  };

  return {
    features: normalizeFeatures(rawFeatures),
    isLowQuality,
    visualization: buildDiagnosisVisualization(
      image,
      focusedImageResult.box,
      poseAnalysis
    ),
  };
}

export async function extractMaleDiagnosisFeatures(
  file: File
): Promise<{
  features: Record<string, number[]>;
  isLowQuality: boolean;
  visualization?: DiagnosisVisualizationOverlay;
}> {
  const image = await loadImage(file);
  const sourceImage = createSourceCanvas(image);
  const focusedImageResult = createFocusedCanvasResult(image, DEFAULT_FOCUS_CROP);
  const focusedImage = focusedImageResult.canvas;
  const focusedQualityMetrics = buildDiagnosisImageQualityMetrics(focusedImage);
  const isLowQuality = isLowInformationDiagnosisImageQuality(focusedQualityMetrics);

  const rawFeatures: Record<string, number[]> = {
    heightPrimary: extractEnsembleFeatures([sourceImage, focusedImage], HEIGHT_FEATURE_SPECS[0]),
    heightBalanced: extractEnsembleFeatures([sourceImage, focusedImage], HEIGHT_FEATURE_SPECS[1]),
    heightWide: extractEnsembleFeatures([sourceImage, focusedImage], HEIGHT_FEATURE_SPECS[2]),
    heightCenter: extractEnsembleFeatures([sourceImage, focusedImage], HEIGHT_FEATURE_SPECS[3]),
    heightProfile: extractEnsembleFeatures([sourceImage, focusedImage], HEIGHT_FEATURE_SPECS[4]),
    heightHistFull: extractEnsembleFeatures([sourceImage, focusedImage], HEIGHT_FEATURE_SPECS[7]),
    heightDctFull: extractEnsembleFeatures([sourceImage, focusedImage], HEIGHT_FEATURE_SPECS[9]),
    heightHogFull: extractEnsembleFeatures([sourceImage, focusedImage], HEIGHT_FEATURE_SPECS[10]),
    similarity: extractFeatures(focusedImage, SIMILARITY_FEATURE_SPECS),
  };

  return {
    features: normalizeMaleFeatures(rawFeatures),
    isLowQuality,
  };
}

export function diagnoseMale(features: Record<string, number[]>): MaleDiagnosisResult {
  return diagnoseMaleFromFeatures(features);
}

export function diagnose(features: DiagnosisFeatures): DiagnosisResult {
  return diagnoseFromFeatures(features);
}

export type { DiagnosisFeatures, DiagnosisResult, MaleDiagnosisResult, SilhouetteType };
