import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

const DEFAULT_BASELINE_REF = "HEAD";
const DEFAULT_MODEL_PATH = path.join("public", "data", "diagnosis-model.json");
const HEIGHT_MIN = 140;
const HEIGHT_MAX = 190;
const CUP_ORDER = Array.from({ length: 26 }, (_, index) =>
  String.fromCharCode("A".charCodeAt(0) + index),
);

function parseArgs(argv) {
  const options = {
    baselineRef: DEFAULT_BASELINE_REF,
    baselinePath: "",
    candidatePath: DEFAULT_MODEL_PATH,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--baseline-ref") {
      options.baselineRef = argv[index + 1] ?? options.baselineRef;
      index += 1;
      continue;
    }

    if (arg === "--baseline-path") {
      options.baselinePath = argv[index + 1] ?? options.baselinePath;
      index += 1;
      continue;
    }

    if (arg === "--candidate-path") {
      options.candidatePath = argv[index + 1] ?? options.candidatePath;
      index += 1;
    }
  }

  return options;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getCupIndex(cup) {
  const index = CUP_ORDER.indexOf(cup);
  return index >= 0 ? index : 0;
}

function euclideanDistance(left, right) {
  let sum = 0;

  for (let index = 0; index < left.length; index += 1) {
    const delta = left[index] - right[index];
    sum += delta * delta;
  }

  return Math.sqrt(sum);
}

function weightedMean(neighbors, selectValue) {
  if (neighbors.length === 0) {
    return 0;
  }

  const totalWeight = neighbors.reduce((sum, neighbor) => sum + neighbor.weight, 0);
  const weightedSum = neighbors.reduce(
    (sum, neighbor) => sum + neighbor.weight * selectValue(neighbor.entry),
    0,
  );

  if (totalWeight <= 1e-12) {
    return (
      neighbors.reduce((sum, neighbor) => sum + selectValue(neighbor.entry), 0) /
      neighbors.length
    );
  }

  return weightedSum / totalWeight;
}

function weightedCupVote(neighbors) {
  const scores = new Map(CUP_ORDER.map((cup) => [cup, 0]));

  for (const neighbor of neighbors) {
    scores.set(neighbor.entry.cup, (scores.get(neighbor.entry.cup) ?? 0) + neighbor.weight);
  }

  const totalWeight = neighbors.reduce((sum, neighbor) => sum + neighbor.weight, 0);
  const cup = CUP_ORDER.reduce((bestCup, currentCup) => {
    const currentScore = scores.get(currentCup) ?? 0;
    const bestScore = scores.get(bestCup) ?? 0;

    if (currentScore !== bestScore) {
      return currentScore > bestScore ? currentCup : bestCup;
    }

    return Math.abs(getCupIndex(currentCup) - 3) < Math.abs(getCupIndex(bestCup) - 3)
      ? currentCup
      : bestCup;
  }, CUP_ORDER[0]);

  return {
    cup,
    winningShare:
      totalWeight <= 1e-12 ? 1 / CUP_ORDER.length : (scores.get(cup) ?? 0) / totalWeight,
  };
}

function voteCups(predictions) {
  const indices = predictions.map(getCupIndex);
  let average = indices.reduce((sum, value) => sum + value, 0) / indices.length;
  const maxIndex = Math.max(...indices);

  if (maxIndex >= 5) {
    average += (maxIndex - average) * 0.35;
  }

  const roundedIndex = clamp(Math.round(average), 0, CUP_ORDER.length - 1);
  const cup = CUP_ORDER[roundedIndex];
  const matching = predictions.filter((prediction) => prediction === cup).length;

  return {
    cup,
    winningShare: matching / predictions.length,
  };
}

function getNeighbors(model, targetFeatures, featureSetName, neighborCount, excludeName) {
  const availabilityKey = featureSetName.startsWith("cup")
    ? "cup"
    : featureSetName === "similarity"
      ? "similarity"
      : "height";

  return model.entries
    .filter((entry) => entry.name !== excludeName)
    .filter((entry) => entry.availability[availabilityKey])
    .filter((entry) => availabilityKey === "cup" || entry.actualHeight !== null)
    .filter(
      (entry) =>
        (entry.featureWeights?.[featureSetName] ??
          entry.sourceWeights?.[availabilityKey] ??
          1) > 0,
    )
    .map((entry) => {
      const distance = euclideanDistance(targetFeatures, entry.featureSets[featureSetName]);

      return {
        entry,
        distance,
        weight:
          (entry.featureWeights?.[featureSetName] ??
            entry.sourceWeights?.[availabilityKey] ??
            1) /
          ((distance + 1e-6) ** 2),
      };
    })
    .sort(
      (left, right) =>
        left.distance - right.distance || left.entry.name.localeCompare(right.entry.name),
    )
    .slice(0, neighborCount);
}

function predictHeight(model, entry) {
  const predictions = model.metrics.height.models
    .map((spec) => {
      const neighbors = getNeighbors(
        model,
        entry.featureSets[spec.featureSet],
        spec.featureSet,
        spec.k,
        entry.name,
      );

      return weightedMean(neighbors, (neighborEntry) => neighborEntry.actualHeight ?? HEIGHT_MIN);
    })
    .sort((left, right) => left - right);

  const median =
    predictions.length % 2 === 1
      ? predictions[(predictions.length - 1) / 2]
      : (predictions[predictions.length / 2 - 1] + predictions[predictions.length / 2]) / 2;

  return clamp(Math.round(median), HEIGHT_MIN, HEIGHT_MAX);
}

function predictCup(model, entry) {
  const predictions = model.metrics.cup.models.map((spec) => {
    const neighbors = getNeighbors(
      model,
      entry.featureSets[spec.featureSet],
      spec.featureSet,
      spec.k,
      entry.name,
    );

    return weightedCupVote(neighbors).cup;
  });

  return voteCups(predictions).cup;
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function evaluateOnNames(model, names) {
  const entryByName = new Map(model.entries.map((entry) => [entry.name, entry]));
  const heightErrors = [];
  const cupErrors = [];

  for (const name of names) {
    const entry = entryByName.get(name);

    if (!entry) {
      continue;
    }

    if (entry.availability.height && entry.actualHeight !== null) {
      heightErrors.push(Math.abs(predictHeight(model, entry) - entry.actualHeight));
    }

    if (entry.availability.cup) {
      cupErrors.push(Math.abs(getCupIndex(predictCup(model, entry)) - getCupIndex(entry.cup)));
    }
  }

  return {
    heightMae: Number(mean(heightErrors).toFixed(6)),
    cupMae: Number(mean(cupErrors).toFixed(6)),
    within1Rate: Number((cupErrors.filter((error) => error <= 1).length / cupErrors.length).toFixed(6)),
    heightCount: heightErrors.length,
    cupCount: cupErrors.length,
  };
}

async function loadModelFromFile(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function loadModelFromGitRef(ref, filePath) {
  return JSON.parse(
    execFileSync("git", ["show", `${ref}:${filePath.replace(/\\/gu, "/")}`], {
      cwd: process.cwd(),
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
    }),
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const baselineModel = options.baselinePath
    ? await loadModelFromFile(options.baselinePath)
    : loadModelFromGitRef(options.baselineRef, DEFAULT_MODEL_PATH);
  const candidateModel = await loadModelFromFile(options.candidatePath);
  const benchmarkNames = baselineModel.entries
    .map((entry) => entry.name)
    .filter((name) => candidateModel.entries.some((entry) => entry.name === name));
  const baseline = evaluateOnNames(baselineModel, benchmarkNames);
  const candidate = evaluateOnNames(candidateModel, benchmarkNames);

  console.log(
    JSON.stringify(
      {
        baselineRef: options.baselinePath ? null : options.baselineRef,
        baselinePath: options.baselinePath || DEFAULT_MODEL_PATH,
        candidatePath: options.candidatePath,
        benchmarkCount: benchmarkNames.length,
        baseline,
        candidate,
        delta: {
          heightMae: Number((candidate.heightMae - baseline.heightMae).toFixed(6)),
          cupMae: Number((candidate.cupMae - baseline.cupMae).toFixed(6)),
          within1Rate: Number((candidate.within1Rate - baseline.within1Rate).toFixed(6)),
        },
      },
      null,
      2,
    ),
  );
}

await main();
