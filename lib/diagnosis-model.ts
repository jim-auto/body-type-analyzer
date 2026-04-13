import diagnosisModelJson from "../public/data/diagnosis-model.json" with { type: "json" };
import maleDiagnosisModelJson from "../public/data/male-diagnosis-model.json" with { type: "json" };

import {
  FEMALE_STATS,
  MALE_STATS,
  calculateCupDeviation,
  calculateDeviation,
} from "./statistics.ts";

export const DIAGNOSIS_CUP_ORDER = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

const MAX_SIMILAR_CELEBRITIES = 3;
const HEIGHT_MIN = 140;
const HEIGHT_MAX = 190;
const DEVIATION_MIN = 20;
const DEVIATION_MAX = 80;
const CONFIDENCE_MIN = 18;
const CONFIDENCE_MAX = 96;

export type DiagnosisCup = (typeof DIAGNOSIS_CUP_ORDER)[number];
export type SilhouetteType = "X" | "I" | "A";

export type DiagnosisFeatures = {
  heightPrimary: number[];
  heightBalanced: number[];
  heightWide: number[];
  heightCenter: number[];
  heightProfile: number[];
  heightEdgeFull: number[];
  heightEdgeCenter: number[];
  heightHistFull: number[];
  heightLbpFull: number[];
  heightDctFull: number[];
  heightHogFull: number[];
  heightPose: number[];
  cupPrimary: number[];
  cupSecondary: number[];
  cupCenter: number[];
  cupProfile: number[];
  cupEdgeTop: number[];
  cupHistTop: number[];
  cupLbpTop: number[];
  cupDctTop: number[];
  cupHogTop: number[];
  cupPose: number[];
  similarity: number[];
};

export type NormalizationStats = {
  [K in keyof DiagnosisFeatures]: {
    mean: number[];
    stddev: number[];
  };
};

export type SimilarCelebrity = {
  name: string;
  image: string;
  similarity: number;
  actualHeight: number;
  cup: DiagnosisCup;
};

export type DiagnosisResult = {
  estimatedHeight: number;
  estimatedCup: DiagnosisCup;
  heightDeviation: number;
  cupDeviation: number;
  silhouetteType: SilhouetteType;
  confidence: number;
  similarCelebrity: string;
  similarCelebrities: SimilarCelebrity[];
};

export type DistanceStats = {
  min: number;
  max: number;
  p10: number;
  p50: number;
  p90: number;
};

export type ErrorCoverage = {
  rate: number;
  maxError: number;
};

export type MetricDistribution = {
  mean: number;
  stddev: number;
};

export type StabilityCoverage = {
  rate: number;
  meanMaxError: number;
  stddevMaxError: number;
};

export type HeightMetrics = {
  strategy: string;
  trainingCount: number;
  mae: number;
  exactRate: number;
  within2Rate: number;
  coverage: ErrorCoverage[];
  generalization: {
    method: string;
    holdoutCount: number;
    trainingCount: number;
    mae: number;
    exactRate: number;
    within2Rate: number;
    coverage: ErrorCoverage[];
    stability?: {
      method: string;
      splitCount: number;
      mae: MetricDistribution;
      exactRate: MetricDistribution;
      within2Rate: MetricDistribution;
      coverage: StabilityCoverage[];
      holdoutCount: MetricDistribution;
      trainingCount: MetricDistribution;
    };
  };
  models: Array<{
    featureSet: keyof DiagnosisFeatures;
    k: number;
  }>;
};

export type CupMetrics = {
  strategy: string;
  trainingCount: number;
  mae: number;
  exactRate: number;
  within1Rate: number;
  coverage: ErrorCoverage[];
  generalization: {
    method: string;
    holdoutCount: number;
    trainingCount: number;
    mae: number;
    exactRate: number;
    within1Rate: number;
    coverage: ErrorCoverage[];
    stability?: {
      method: string;
      splitCount: number;
      mae: MetricDistribution;
      exactRate: MetricDistribution;
      within1Rate: MetricDistribution;
      coverage: StabilityCoverage[];
      holdoutCount: MetricDistribution;
      trainingCount: MetricDistribution;
    };
  };
  models: Array<{
    featureSet: keyof DiagnosisFeatures;
    k: number;
  }>;
};

export type SimilarityMetrics = {
  feature: string;
  trainingCount: number;
  distance: DistanceStats;
};

export type DiagnosisModelEntry = {
  name: string;
  image: string;
  actualHeight: number;
  cup: DiagnosisCup;
  silhouetteType: SilhouetteType;
  availability: {
    height: boolean;
    cup: boolean;
    similarity: boolean;
  };
  sourceWeights: {
    height: number;
    cup: number;
    similarity: number;
  };
  featureWeights?: {
    [K in keyof DiagnosisFeatures]?: number;
  };
  featureSets: DiagnosisFeatures;
};

export type DiagnosisModel = {
  version: number;
  generatedAt: string;
  normalization?: NormalizationStats;
  metrics: {
    trainingCount: number;
    height: HeightMetrics;
    cup: CupMetrics;
    similarity: SimilarityMetrics;
  };
  entries: DiagnosisModelEntry[];
};

export type DiagnosisModelEvaluation = {
  trainingCount: number;
  height: Pick<HeightMetrics, "mae" | "exactRate" | "within2Rate" | "coverage">;
  cup: Pick<CupMetrics, "mae" | "exactRate" | "within1Rate" | "coverage">;
};

type Neighbor = {
  entry: DiagnosisModelEntry;
  distance: number;
  weight: number;
  distanceScore: number;
};

type DiagnoseOptions = {
  excludeName?: string;
};

const diagnosisModel = diagnosisModelJson as DiagnosisModel;

export type MaleDiagnosisModelEntry = {
  name: string;
  image: string;
  actualHeight: number;
  featureSets: Record<string, number[]>;
};

export type MaleDiagnosisModel = {
  version: number;
  generatedAt: string;
  normalization?: Record<string, { mean: number[]; stddev: number[] }>;
  metrics: {
    trainingCount: number;
    height: HeightMetrics;
    similarity: SimilarityMetrics;
  };
  entries: MaleDiagnosisModelEntry[];
};

export type MaleDiagnosisResult = {
  estimatedHeight: number;
  heightDeviation: number;
  confidence: number;
  similarCelebrities: SimilarCelebrity[];
};

const maleDiagnosisModel = maleDiagnosisModelJson as unknown as MaleDiagnosisModel;

export const DIAGNOSIS_MODEL = diagnosisModel;
export const DIAGNOSIS_MODEL_ENTRIES = diagnosisModel.entries;
export const DIAGNOSIS_MODEL_METRICS = diagnosisModel.metrics;
export const DIAGNOSIS_MODEL_NORMALIZATION = diagnosisModel.normalization;
export const MALE_DIAGNOSIS_MODEL = maleDiagnosisModel;
export const MALE_DIAGNOSIS_MODEL_ENTRIES = maleDiagnosisModel.entries;
export const MALE_DIAGNOSIS_MODEL_METRICS = maleDiagnosisModel.metrics;

export function normalizeFeatures(
  features: DiagnosisFeatures,
): DiagnosisFeatures {
  const normalization = DIAGNOSIS_MODEL_NORMALIZATION;

  if (!normalization) {
    return features;
  }

  const result = {} as DiagnosisFeatures;

  for (const key of Object.keys(features) as (keyof DiagnosisFeatures)[]) {
    const stats = normalization[key];

    if (!stats) {
      result[key] = features[key];
      continue;
    }

    result[key] = features[key].map((value, index) => {
      const stddev = stats.stddev[index];

      if (stddev === undefined || stddev <= 1e-9) {
        return 0;
      }

      return Math.round(((value - stats.mean[index]) / stddev) * 10000) / 10000;
    });
  }

  return result;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getCupIndex(cup: DiagnosisCup): number {
  return DIAGNOSIS_CUP_ORDER.indexOf(cup);
}

function euclideanDistance(left: number[], right: number[]): number {
  let sum = 0;

  for (let index = 0; index < left.length; index += 1) {
    const delta = left[index] - right[index];
    sum += delta * delta;
  }

  return Math.sqrt(sum);
}

function normalizeDistance(distance: number, stats: DistanceStats): number {
  if (distance <= stats.p10) {
    return 1;
  }

  if (distance >= stats.p90) {
    return 0;
  }

  return 1 - (distance - stats.p10) / (stats.p90 - stats.p10 || 1);
}

function getNeighbors(
  targetFeatures: number[],
  featureSetName: keyof DiagnosisFeatures,
  neighborCount: number,
  stats?: DistanceStats,
  excludeName?: string
): Neighbor[] {
  const availabilityKey = featureSetName.startsWith("cup")
    ? "cup"
    : featureSetName === "similarity"
      ? "similarity"
      : "height";

  return DIAGNOSIS_MODEL_ENTRIES.filter((entry) => entry.name !== excludeName)
    .filter((entry) => entry.availability[availabilityKey])
    .filter(
      (entry) =>
        (entry.featureWeights?.[featureSetName] ??
          entry.sourceWeights?.[availabilityKey] ??
          1) > 0
    )
    .map((entry) => {
      const distance = euclideanDistance(
        targetFeatures,
        entry.featureSets[featureSetName]
      );

      return {
        entry,
        distance,
        weight:
          (entry.featureWeights?.[featureSetName] ??
            entry.sourceWeights?.[availabilityKey] ??
            1) /
          ((distance + 1e-6) ** 2),
        distanceScore: stats ? normalizeDistance(distance, stats) : 1 / (1 + distance),
      };
    })
    .sort(
      (left, right) =>
        left.distance - right.distance ||
        (left.entry.name < right.entry.name
          ? -1
          : left.entry.name > right.entry.name
            ? 1
            : 0)
    )
    .slice(0, neighborCount);
}

function weightedMean(neighbors: Neighbor[], value: (entry: DiagnosisModelEntry) => number): number {
  if (neighbors.length === 0) {
    return 0;
  }

  const totalWeight = neighbors.reduce((sum, neighbor) => sum + neighbor.weight, 0);
  const weightedSum = neighbors.reduce(
    (sum, neighbor) => sum + neighbor.weight * value(neighbor.entry),
    0
  );

  if (totalWeight <= 1e-12) {
    return neighbors.reduce((sum, neighbor) => sum + value(neighbor.entry), 0) / neighbors.length;
  }

  return weightedSum / totalWeight;
}

function weightedCupVote(neighbors: Neighbor[]): {
  cup: DiagnosisCup;
  winningShare: number;
} {
  const scores = new Map<DiagnosisCup, number>(
    DIAGNOSIS_CUP_ORDER.map((cup) => [cup, 0])
  );

  neighbors.forEach((neighbor) => {
    scores.set(neighbor.entry.cup, (scores.get(neighbor.entry.cup) ?? 0) + neighbor.weight);
  });

  const totalWeight = neighbors.reduce((sum, neighbor) => sum + neighbor.weight, 0);
  const cup = DIAGNOSIS_CUP_ORDER.reduce((bestCup, currentCup) => {
    const currentScore = scores.get(currentCup) ?? 0;
    const bestScore = scores.get(bestCup) ?? 0;

    if (currentScore !== bestScore) {
      return currentScore > bestScore ? currentCup : bestCup;
    }

    return Math.abs(getCupIndex(currentCup) - 3) < Math.abs(getCupIndex(bestCup) - 3)
      ? currentCup
      : bestCup;
  }, DIAGNOSIS_CUP_ORDER[0]);

  return {
    cup,
    winningShare: totalWeight <= 1e-12 ? 1 / DIAGNOSIS_CUP_ORDER.length : (scores.get(cup) ?? 0) / totalWeight,
  };
}

function voteCups(predictions: DiagnosisCup[]): {
  cup: DiagnosisCup;
  winningShare: number;
} {
  const indices = predictions.map((p) => getCupIndex(p));
  let avg = indices.reduce((sum, i) => sum + i, 0) / indices.length;
  const maxIdx = Math.max(...indices);

  if (maxIdx >= 5) {
    avg += (maxIdx - avg) * 0.35;
  }

  const roundedIndex = clamp(Math.round(avg), 0, DIAGNOSIS_CUP_ORDER.length - 1);
  const cup = DIAGNOSIS_CUP_ORDER[roundedIndex];
  const matching = predictions.filter((p) => p === cup).length;

  return {
    cup,
    winningShare: matching / predictions.length,
  };
}

export function inferSilhouetteType(
  estimatedHeight: number,
  estimatedCup: DiagnosisCup
): SilhouetteType {
  const cupIndex = getCupIndex(estimatedCup);

  if (estimatedHeight <= 158 && cupIndex >= getCupIndex("E")) {
    return "A";
  }

  if (estimatedHeight >= 164 && cupIndex <= getCupIndex("C")) {
    return "I";
  }

  return "X";
}

function predictHeight(
  features: DiagnosisFeatures,
  options?: DiagnoseOptions
): { estimatedHeight: number; neighbors: Neighbor[] } {
  const modelPredictions = DIAGNOSIS_MODEL_METRICS.height.models.map((model) => {
    const neighbors = getNeighbors(
      features[model.featureSet],
      model.featureSet,
      model.k,
      undefined,
      options?.excludeName
    );

    return {
      neighbors,
      prediction: weightedMean(neighbors, (entry) => entry.actualHeight),
    };
  });
  const predictions = modelPredictions.map((model) => model.prediction).sort((a, b) => a - b);
  const median =
    predictions.length % 2 === 1
      ? predictions[(predictions.length - 1) / 2]
      : (predictions[predictions.length / 2 - 1] + predictions[predictions.length / 2]) / 2;

  return {
    estimatedHeight: clamp(Math.round(median), HEIGHT_MIN, HEIGHT_MAX),
    neighbors: modelPredictions.flatMap((model) => model.neighbors),
  };
}

function predictCup(
  features: DiagnosisFeatures,
  options?: DiagnoseOptions
): { estimatedCup: DiagnosisCup; neighbors: Neighbor[]; winningShare: number } {
  const modelPredictions = DIAGNOSIS_MODEL_METRICS.cup.models.map((model) => {
    const neighbors = getNeighbors(
      features[model.featureSet],
      model.featureSet,
      model.k,
      undefined,
      options?.excludeName
    );
    const prediction = weightedCupVote(neighbors);

    return {
      neighbors,
      prediction: prediction.cup,
    };
  });
  const { cup, winningShare } = voteCups(
    modelPredictions.map((model) => model.prediction)
  );

  return {
    estimatedCup: cup,
    neighbors: modelPredictions.flatMap((model) => model.neighbors),
    winningShare,
  };
}

function getSimilarCelebrities(
  features: DiagnosisFeatures,
  options?: DiagnoseOptions
): SimilarCelebrity[] {
  const neighbors = getNeighbors(
    features.similarity,
    "similarity",
    MAX_SIMILAR_CELEBRITIES,
    DIAGNOSIS_MODEL_METRICS.similarity.distance,
    options?.excludeName
  );

  return neighbors.map((neighbor) => ({
    name: neighbor.entry.name,
    image: neighbor.entry.image,
    similarity: clamp(Math.round(62 + neighbor.distanceScore * 34), 62, 96),
    actualHeight: neighbor.entry.actualHeight,
    cup: neighbor.entry.cup,
  }));
}

function averageDistanceScore(neighbors: Neighbor[]): number {
  return neighbors.reduce((sum, neighbor) => sum + neighbor.distanceScore, 0) / neighbors.length;
}

function buildErrorCoverage(errors: number[], rates: number[]): ErrorCoverage[] {
  const ordered = [...errors].sort((left, right) => left - right);

  return rates.map((rate) => ({
    rate,
    maxError: ordered[Math.max(0, Math.ceil(ordered.length * rate) - 1)] ?? 0,
  }));
}

function computeConfidence(
  heightNeighbors: Neighbor[],
  cupNeighbors: Neighbor[],
  winningCupShare: number,
  similarCelebrities: SimilarCelebrity[]
): number {
  const heightScore = averageDistanceScore(heightNeighbors);
  const cupScore = averageDistanceScore(cupNeighbors);
  const similarityScore = (similarCelebrities[0]?.similarity ?? 62) / 100;

  return clamp(
    Math.round(
      (heightScore * 0.3 + cupScore * 0.2 + winningCupShare * 0.35 + similarityScore * 0.15) *
        100
    ),
    CONFIDENCE_MIN,
    CONFIDENCE_MAX
  );
}

export function diagnoseFromFeatures(
  features: DiagnosisFeatures,
  options?: DiagnoseOptions
): DiagnosisResult {
  const { estimatedHeight, neighbors: heightNeighbors } = predictHeight(features, options);
  const {
    estimatedCup,
    neighbors: cupNeighbors,
    winningShare,
  } = predictCup(features, options);
  const similarCelebrities = getSimilarCelebrities(features, options);

  return {
    estimatedHeight,
    estimatedCup,
    heightDeviation: clamp(
      calculateDeviation(
        estimatedHeight,
        FEMALE_STATS.height.mean,
        FEMALE_STATS.height.stddev
      ),
      DEVIATION_MIN,
      DEVIATION_MAX
    ),
    cupDeviation: clamp(calculateCupDeviation(estimatedCup), DEVIATION_MIN, DEVIATION_MAX),
    silhouetteType: inferSilhouetteType(estimatedHeight, estimatedCup),
    confidence: computeConfidence(
      heightNeighbors,
      cupNeighbors,
      winningShare,
      similarCelebrities
    ),
    similarCelebrity: similarCelebrities[0]?.name ?? DIAGNOSIS_MODEL_ENTRIES[0].name,
    similarCelebrities,
  };
}

function getMaleNeighbors(
  targetFeatures: number[],
  featureSetName: string,
  neighborCount: number,
  stats?: DistanceStats,
  excludeName?: string
): Neighbor[] {
  return MALE_DIAGNOSIS_MODEL_ENTRIES
    .filter((entry) => entry.name !== excludeName)
    .map((entry) => {
      const entryFeatures = entry.featureSets[featureSetName];

      if (!entryFeatures) {
        return null;
      }

      const distance = euclideanDistance(targetFeatures, entryFeatures);

      return {
        entry: {
          ...entry,
          cup: "A" as DiagnosisCup,
          silhouetteType: "I" as SilhouetteType,
          availability: { height: true, cup: false, similarity: true },
          sourceWeights: { height: 1, cup: 0, similarity: 1 },
        },
        distance,
        weight: 1 / ((distance + 1e-6) ** 2),
        distanceScore: stats ? normalizeDistance(distance, stats) : 1 / (1 + distance),
      };
    })
    .filter((n): n is Neighbor => n !== null)
    .sort(
      (left, right) =>
        left.distance - right.distance ||
        (left.entry.name < right.entry.name ? -1 : left.entry.name > right.entry.name ? 1 : 0)
    )
    .slice(0, neighborCount);
}

export function diagnoseMaleFromFeatures(
  features: Record<string, number[]>,
  options?: DiagnoseOptions
): MaleDiagnosisResult {
  const models = MALE_DIAGNOSIS_MODEL_METRICS.height.models;
  const modelPredictions = models.map((model) => {
    const targetFeatures = features[model.featureSet];

    if (!targetFeatures) {
      return { neighbors: [] as Neighbor[], prediction: 175 };
    }

    const neighbors = getMaleNeighbors(
      targetFeatures,
      model.featureSet,
      model.k,
      undefined,
      options?.excludeName
    );

    return {
      neighbors,
      prediction: weightedMean(neighbors, (entry) => entry.actualHeight),
    };
  });

  const predictions = modelPredictions.map((m) => m.prediction).sort((a, b) => a - b);
  const median =
    predictions.length % 2 === 1
      ? predictions[(predictions.length - 1) / 2]
      : (predictions[predictions.length / 2 - 1] + predictions[predictions.length / 2]) / 2;
  const estimatedHeight = clamp(Math.round(median), HEIGHT_MIN, HEIGHT_MAX);
  const heightNeighbors = modelPredictions.flatMap((m) => m.neighbors);

  const similarityFeatures = features.similarity;
  const similarCelebrities: SimilarCelebrity[] = similarityFeatures
    ? getMaleNeighbors(
        similarityFeatures,
        "similarity",
        MAX_SIMILAR_CELEBRITIES,
        MALE_DIAGNOSIS_MODEL_METRICS.similarity.distance,
        options?.excludeName
      ).map((neighbor) => ({
        name: neighbor.entry.name,
        image: neighbor.entry.image,
        similarity: clamp(Math.round(62 + neighbor.distanceScore * 34), 62, 96),
        actualHeight: neighbor.entry.actualHeight,
        cup: "A" as DiagnosisCup,
      }))
    : [];

  const heightScore = averageDistanceScore(heightNeighbors);
  const similarityScore = (similarCelebrities[0]?.similarity ?? 62) / 100;

  return {
    estimatedHeight,
    heightDeviation: clamp(
      calculateDeviation(estimatedHeight, MALE_STATS.height.mean, MALE_STATS.height.stddev),
      DEVIATION_MIN,
      DEVIATION_MAX
    ),
    confidence: clamp(
      Math.round((heightScore * 0.6 + similarityScore * 0.4) * 100),
      CONFIDENCE_MIN,
      CONFIDENCE_MAX
    ),
    similarCelebrities,
  };
}

export function normalizeMaleFeatures(
  features: Record<string, number[]>
): Record<string, number[]> {
  const normalization = maleDiagnosisModel.normalization;

  if (!normalization) {
    return features;
  }

  const result: Record<string, number[]> = {};

  for (const [key, values] of Object.entries(features)) {
    const stats = normalization[key];

    if (!stats) {
      result[key] = values;
      continue;
    }

    result[key] = values.map((value, index) => {
      const stddev = stats.stddev[index];

      if (stddev === undefined || stddev <= 1e-9) {
        return 0;
      }

      return Math.round(((value - stats.mean[index]) / stddev) * 10000) / 10000;
    });
  }

  return result;
}

export function evaluateDiagnosisModel(): DiagnosisModelEvaluation {
  const heightEntries = DIAGNOSIS_MODEL_ENTRIES.filter((entry) => entry.availability.height);
  const cupEntries = DIAGNOSIS_MODEL_ENTRIES.filter((entry) => entry.availability.cup);
  const heightResults = heightEntries.map((entry) =>
    diagnoseFromFeatures(
      entry.featureSets,
      { excludeName: entry.name }
    )
  );
  const cupResults = cupEntries.map((entry) =>
    diagnoseFromFeatures(
      entry.featureSets,
      { excludeName: entry.name }
    )
  );
  const heightErrors = heightResults.map((result, index) =>
    Math.abs(result.estimatedHeight - heightEntries[index].actualHeight)
  );
  const cupErrors = cupResults.map((result, index) =>
    Math.abs(getCupIndex(result.estimatedCup) - getCupIndex(cupEntries[index].cup))
  );

  return {
    trainingCount: DIAGNOSIS_MODEL_ENTRIES.length,
    height: {
      mae: heightErrors.reduce((sum, error) => sum + error, 0) / heightErrors.length,
      exactRate:
        heightErrors.filter((error) => error === 0).length / heightErrors.length,
      within2Rate:
        heightErrors.filter((error) => error <= 2).length / heightErrors.length,
      coverage: buildErrorCoverage(heightErrors, [0.7, 0.8]),
    },
    cup: {
      mae: cupErrors.reduce((sum, error) => sum + error, 0) / cupErrors.length,
      exactRate: cupErrors.filter((error) => error === 0).length / cupErrors.length,
      within1Rate: cupErrors.filter((error) => error <= 1).length / cupErrors.length,
      coverage: buildErrorCoverage(cupErrors, [0.7, 0.8]),
    },
  };
}
