import {
  DIAGNOSIS_MODEL_ENTRIES,
  diagnoseFromFeatures,
} from "./diagnosis-model.ts";
import maleRankingModelJson from "../public/data/male-ranking-model.json" with { type: "json" };
import {
  getAdjustedEstimatedCup,
  getEstimatedHeight,
} from "./profile-estimates.ts";
import type {
  FemaleProfileSource,
  MaleProfileSource,
} from "./source-profiles.ts";

type FemaleModelEstimate = {
  estimatedHeight: number;
  estimatedCup: string;
};

const FEMALE_IMAGE_MODEL_WEIGHT = 0.5;
const MALE_IMAGE_MODEL_WEIGHT = 0.15;
const diagnosisEntryByName = new Map(
  DIAGNOSIS_MODEL_ENTRIES.map((entry) => [entry.name, entry])
);
const femaleEstimateCache = new Map<string, FemaleModelEstimate>();
const maleRankingModel = maleRankingModelJson as {
  estimates: Record<string, number>;
};

const CUP_ORDER = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getCupIndex(cup: string | null | undefined): number | null {
  if (!cup) {
    return null;
  }

  const normalizedCup = cup.trim().toUpperCase();
  const index = CUP_ORDER.indexOf(normalizedCup as (typeof CUP_ORDER)[number]);

  return index === -1 ? null : index;
}

function getFemaleModelEstimate(
  profile: FemaleProfileSource
): FemaleModelEstimate | null {
  if (!profile.image.startsWith("/images/")) {
    return null;
  }

  const cached = femaleEstimateCache.get(profile.name);

  if (cached) {
    return cached;
  }

  const diagnosisEntry = diagnosisEntryByName.get(profile.name);

  if (!diagnosisEntry) {
    return null;
  }

  const result = diagnoseFromFeatures(diagnosisEntry.featureSets, {
    excludeName: diagnosisEntry.name,
  });
  const estimate = {
    estimatedHeight: result.estimatedHeight,
    estimatedCup: result.estimatedCup,
  };

  femaleEstimateCache.set(profile.name, estimate);

  return estimate;
}

export function getFemaleRankingEstimatedHeight(
  profile: FemaleProfileSource
): number {
  const baselineEstimate = getEstimatedHeight(profile.actualHeight, profile.name);
  const modelEstimate = getFemaleModelEstimate(profile)?.estimatedHeight;

  if (modelEstimate === undefined) {
    return baselineEstimate;
  }

  return Math.round(
    modelEstimate * FEMALE_IMAGE_MODEL_WEIGHT +
      baselineEstimate * (1 - FEMALE_IMAGE_MODEL_WEIGHT)
  );
}

export function getFemaleRankingEstimatedCup(
  profile: FemaleProfileSource
): string | null {
  const baselineEstimate = getAdjustedEstimatedCup(profile.bust, profile.cup);
  const modelEstimate = getFemaleModelEstimate(profile)?.estimatedCup;

  if (!modelEstimate) {
    return baselineEstimate;
  }

  if (!baselineEstimate) {
    return modelEstimate;
  }

  const baselineIndex = getCupIndex(baselineEstimate);
  const modelIndex = getCupIndex(modelEstimate);

  if (baselineIndex === null || modelIndex === null) {
    return baselineEstimate;
  }

  const blendedIndex = Math.round(
    modelIndex * FEMALE_IMAGE_MODEL_WEIGHT +
      baselineIndex * (1 - FEMALE_IMAGE_MODEL_WEIGHT)
  );

  return CUP_ORDER[clamp(blendedIndex, 0, CUP_ORDER.length - 1)];
}

export function getMaleRankingEstimatedHeight(
  profile: MaleProfileSource
): number {
  const baselineEstimate = getEstimatedHeight(profile.actualHeight, profile.name);
  const modelEstimate = maleRankingModel.estimates[profile.name];

  if (modelEstimate === undefined) {
    return baselineEstimate;
  }

  return Math.round(
    modelEstimate * MALE_IMAGE_MODEL_WEIGHT +
      baselineEstimate * (1 - MALE_IMAGE_MODEL_WEIGHT)
  );
}
