import { normalizeCupLabel } from "./cup-order";
import {
  DIAGNOSIS_CUP_ORDER,
  DIAGNOSIS_MODEL_ENTRIES,
  type DiagnosisCup,
} from "./diagnosis-model";

const LARGE_CUP_WARNING_MIN: DiagnosisCup = "H";
const SCARCE_CUP_SAMPLE_THRESHOLD = 10;

export type FemaleCupTrainingCoverageSummary = {
  largeCupWarningMin: DiagnosisCup;
  scarceSampleThreshold: number;
  sampleCounts: Record<DiagnosisCup, number>;
};

const sampleCounts = Object.fromEntries(
  DIAGNOSIS_CUP_ORDER.map((cup) => [cup, 0]),
) as Record<DiagnosisCup, number>;

for (const entry of DIAGNOSIS_MODEL_ENTRIES) {
  const normalizedCup = normalizeCupLabel(entry.cup);

  if (!normalizedCup) {
    continue;
  }

  sampleCounts[normalizedCup] += 1;
}

export const FEMALE_CUP_TRAINING_COVERAGE_SUMMARY: FemaleCupTrainingCoverageSummary =
  Object.freeze({
    largeCupWarningMin: LARGE_CUP_WARNING_MIN,
    scarceSampleThreshold: SCARCE_CUP_SAMPLE_THRESHOLD,
    sampleCounts: Object.freeze(sampleCounts),
  });
