from __future__ import annotations

import json
import math
import statistics
import subprocess
from datetime import datetime, timezone
from itertools import combinations, product
from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = REPO_ROOT / "public" / "data" / "male-ranking-model.json"
DIAGNOSIS_OUTPUT_PATH = REPO_ROOT / "public" / "data" / "male-diagnosis-model.json"

REGIONS = {
    "full": (0.0, 0.0, 1.0, 1.0),
    "top": (0.0, 0.0, 1.0, 0.45),
    "low": (0.0, 0.45, 1.0, 1.0),
    "fullCenter": (0.16, 0.0, 0.84, 1.0),
    "lowCenter": (0.16, 0.45, 0.84, 1.0),
}
FEATURE_SETS = {
    "heightPrimary": [("full", 6, "gray"), ("full", 8, "gray")],
    "heightBalanced": [("full", 6, "gray"), ("top", 6, "gray"), ("low", 6, "gray")],
    "heightWide": [("full", 14, "gray")],
    "heightCenter": [("fullCenter", 8, "gray"), ("lowCenter", 8, "gray")],
    "heightProfile": [("fullCenter", 12, "profile"), ("lowCenter", 10, "profile")],
    "heightHistFull": [("full", 8, "gray_histogram"), ("full", 8, "edge_histogram")],
    "heightDctFull": [("full", 12, "dct")],
    "heightHogFull": [("full", 8, "hog"), ("fullCenter", 8, "hog")],
    "similarity": [("full", 8, "gray"), ("top", 8, "gray")],
}
FEATURE_CANDIDATES = (
    "heightPrimary",
    "heightBalanced",
    "heightWide",
    "heightCenter",
    "heightProfile",
    "heightHistFull",
    "heightDctFull",
    "heightHogFull",
)
K_CANDIDATES = (1, 3, 5, 7, 9, 11, 13, 15)
MAX_ENSEMBLE_SIZE = 3


def load_profiles() -> list[dict[str, object]]:
    result = subprocess.run(
        [
            "node",
            "--input-type=module",
            "-e",
            "import { maleProfilePool } from './lib/source-profiles.ts';"
            "console.log(JSON.stringify(maleProfilePool))",
        ],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=True,
    )
    profiles = json.loads(result.stdout)

    return [
        {
            "name": profile["name"],
            "image": profile["image"],
            "actualHeight": float(profile["actualHeight"]),
        }
        for profile in profiles
        if str(profile["image"]).startswith("/images/")
    ]


def resolve_image_path(image_path: str) -> Path:
    return REPO_ROOT / "public" / image_path.lstrip("/")


def crop_and_resize(gray_image: Image.Image, region_name: str, size: int) -> list[float]:
    left_ratio, top_ratio, right_ratio, bottom_ratio = REGIONS[region_name]
    left = int(gray_image.width * left_ratio)
    top = int(gray_image.height * top_ratio)
    right = max(left + 1, int(gray_image.width * right_ratio))
    bottom = max(top + 1, int(gray_image.height * bottom_ratio))
    cropped = gray_image.crop((left, top, right, bottom))
    resized = cropped.resize((size, size), Image.Resampling.BILINEAR)

    return [round(pixel / 255, 4) for pixel in resized.get_flattened_data()]


def to_grid(values: list[float], size: int) -> list[list[float]]:
    return [values[index * size : (index + 1) * size] for index in range(size)]


def profile_features(values: list[float], size: int) -> list[float]:
    grid = to_grid(values, size)
    rows = [round(statistics.fmean(row), 4) for row in grid]
    columns = [
        round(statistics.fmean([grid[row_index][column_index] for row_index in range(size)]), 4)
        for column_index in range(size)
    ]

    return rows + columns


def edge_features(values: list[float], size: int) -> list[float]:
    edges: list[float] = []

    for row_index in range(size):
        for column_index in range(size):
            center = values[row_index * size + column_index]
            left = values[row_index * size + max(0, column_index - 1)]
            right = values[row_index * size + min(size - 1, column_index + 1)]
            up = values[max(0, row_index - 1) * size + column_index]
            down = values[min(size - 1, row_index + 1) * size + column_index]
            gradient = min(1.0, (abs(right - left) + abs(down - up)) / 2)

            edges.append(round(gradient, 4))

    return edges


def histogram_features(values: list[float], bin_count: int = 16) -> list[float]:
    bins = [0.0] * bin_count

    for value in values:
        index = min(int(value * bin_count), bin_count - 1)
        bins[index] += 1

    total = len(values) if len(values) > 0 else 1

    return [round(count / total, 4) for count in bins]


def edge_histogram_features(values: list[float], size: int, bin_count: int = 16) -> list[float]:
    edges = edge_features(values, size)

    return histogram_features(edges, bin_count)


def dct_1d(vector: list[float]) -> list[float]:
    n = len(vector)
    result: list[float] = []
    for k in range(n):
        total = 0.0
        for i in range(n):
            total += vector[i] * math.cos(math.pi * k * (2 * i + 1) / (2 * n))
        result.append(round(total * math.sqrt(2 / n), 4))
    return result


def dct_features(values: list[float], size: int, coeff_count: int = 8) -> list[float]:
    grid = to_grid(values, size)
    row_dct = [dct_1d(row) for row in grid]
    col_transposed = [[row_dct[r][c] for r in range(size)] for c in range(size)]
    full_dct = [dct_1d(col) for col in col_transposed]
    coefficients: list[float] = []
    for row in range(min(coeff_count, size)):
        for col in range(min(coeff_count, size)):
            coefficients.append(full_dct[col][row])
    return coefficients[:coeff_count * coeff_count]


def hog_features(values: list[float], size: int, bin_count: int = 8) -> list[float]:
    bins = [0.0] * bin_count
    for row in range(size):
        for col in range(size):
            left = values[row * size + max(0, col - 1)]
            right = values[row * size + min(size - 1, col + 1)]
            up = values[max(0, row - 1) * size + col]
            down = values[min(size - 1, row + 1) * size + col]
            gx = right - left
            gy = down - up
            magnitude = math.sqrt(gx * gx + gy * gy)
            angle = math.atan2(gy, gx) + math.pi
            bin_index = min(int(angle / (2 * math.pi) * bin_count), bin_count - 1)
            bins[bin_index] += magnitude
    total = sum(bins) if sum(bins) > 0 else 1
    return [round(b / total, 4) for b in bins]


def extract_feature_block(gray_image: Image.Image, region_name: str, size: int, mode: str) -> list[float]:
    values = crop_and_resize(gray_image, region_name, size)

    if mode == "profile":
        return profile_features(values, size)

    if mode == "gray_histogram":
        return histogram_features(values)

    if mode == "edge_histogram":
        return edge_histogram_features(values, size)

    if mode == "dct":
        return dct_features(values, size)

    if mode == "hog":
        return hog_features(values, size)

    return values


def extract_features(gray_image: Image.Image, specs: list[tuple[str, int, str]]) -> list[float]:
    features: list[float] = []

    for region_name, size, mode in specs:
        features.extend(extract_feature_block(gray_image, region_name, size, mode))

    return features


def euclidean_distance(left: list[float], right: list[float]) -> float:
    return math.sqrt(sum((l - r) ** 2 for l, r in zip(left, right, strict=True)))


def compute_normalization_stats(
    named_feature_sets: dict[str, list[list[float]]],
) -> dict[str, dict[str, list[float]]]:
    stats: dict[str, dict[str, list[float]]] = {}

    for feature_name, vectors in named_feature_sets.items():
        if not vectors:
            stats[feature_name] = {"mean": [], "stddev": []}
            continue

        dim = len(vectors[0])
        means: list[float] = []
        stddevs: list[float] = []

        for d in range(dim):
            values = [vectors[i][d] for i in range(len(vectors))]
            mean = statistics.fmean(values)
            stddev = statistics.pstdev(values)
            means.append(round(mean, 6))
            stddevs.append(round(stddev, 6))

        stats[feature_name] = {"mean": means, "stddev": stddevs}

    return stats


def normalize_feature_sets(
    named_feature_sets: dict[str, list[list[float]]],
    normalization_stats: dict[str, dict[str, list[float]]],
) -> dict[str, list[list[float]]]:
    normalized: dict[str, list[list[float]]] = {}

    for feature_name, vectors in named_feature_sets.items():
        stats = normalization_stats[feature_name]
        means = stats["mean"]
        stddevs = stats["stddev"]
        normalized[feature_name] = [
            [
                round((v - means[d]) / stddevs[d], 4) if stddevs[d] > 1e-9 else 0.0
                for d, v in enumerate(vector)
            ]
            for vector in vectors
        ]

    return normalized


def js_round(value: float) -> int:
    return math.floor(value + 0.5)


def weighted_average(neighbors: list[tuple[float, float]]) -> float:
    weights = [1 / ((distance + 1e-6) ** 2) for distance, _ in neighbors]
    weighted_sum = sum(weight * value for weight, (_, value) in zip(weights, neighbors, strict=True))

    return weighted_sum / sum(weights)


def get_neighbors(
    feature_sets: list[list[float]],
    heights: list[float],
    target_index: int,
    neighbor_count: int,
) -> list[tuple[float, float]]:
    neighbors = [
        (euclidean_distance(feature_sets[target_index], feature_sets[index]), heights[index])
        for index in range(len(feature_sets))
        if index != target_index
    ]
    neighbors.sort(key=lambda item: item[0])

    return neighbors[:neighbor_count]


def build_ranked_neighbors(
    named_feature_sets: dict[str, list[list[float]]],
    heights: list[float],
) -> dict[str, dict[int, list[tuple[float, float]]]]:
    return {
        feature_name: {
            index: get_neighbors(
                named_feature_sets[feature_name],
                heights,
                index,
                len(heights) - 1,
            )
            for index in range(len(heights))
        }
        for feature_name in FEATURE_CANDIDATES
    }


def error_bound_for_rate(values: list[float], ratio: float) -> float:
    ordered = sorted(values)
    target_index = max(0, math.ceil(len(ordered) * ratio) - 1)
    return ordered[target_index]


def build_error_coverage(values: list[float], ratios: list[float]) -> list[dict[str, float]]:
    return [
        {
            "rate": ratio,
            "maxError": round(error_bound_for_rate(values, ratio), 6),
        }
        for ratio in ratios
    ]


def median_rounded(values: list[float]) -> int:
    return js_round(statistics.median(values))


def evaluate_models(
    ranked_neighbors: dict[str, dict[int, list[tuple[float, float]]]],
    heights: list[float],
    models: tuple[tuple[str, int], ...],
) -> tuple[dict[str, float], list[int]]:
    predictions: list[int] = []
    errors: list[float] = []

    for index in range(len(heights)):
        prediction = median_rounded(
            [
                weighted_average(ranked_neighbors[feature_name][index][:neighbor_count])
                for feature_name, neighbor_count in models
            ]
        )
        predictions.append(prediction)
        errors.append(abs(prediction - heights[index]))

    return (
        {
            "mae": round(statistics.fmean(errors), 6),
            "exactRate": round(sum(error == 0 for error in errors) / len(errors), 6),
            "within2Rate": round(sum(error <= 2 for error in errors) / len(errors), 6),
            "coverage": build_error_coverage(errors, [0.7, 0.8]),
            "trainingCount": len(heights),
            "models": [
                {
                    "featureSet": feature_name,
                    "k": neighbor_count,
                }
                for feature_name, neighbor_count in models
            ],
        },
        predictions,
    )


def select_models(
    named_feature_sets: dict[str, list[list[float]]],
    heights: list[float],
) -> tuple[tuple[tuple[str, int], ...], dict[str, float], list[int]]:
    ranked_neighbors = build_ranked_neighbors(named_feature_sets, heights)
    best_models: tuple[tuple[str, int], ...] | None = None
    best_metrics: dict[str, float] | None = None
    best_predictions: list[int] | None = None
    best_score: tuple[float, float, float, float] | None = None

    for size in range(1, min(len(FEATURE_CANDIDATES), MAX_ENSEMBLE_SIZE) + 1):
        for feature_names in combinations(FEATURE_CANDIDATES, size):
            for ks in product(K_CANDIDATES, repeat=size):
                models = tuple(zip(feature_names, ks, strict=True))
                metrics, predictions = evaluate_models(
                    ranked_neighbors,
                    heights,
                    models,
                )
                coverage80 = metrics["coverage"][1]["maxError"]
                score = (
                    metrics["within2Rate"],
                    -coverage80,
                    -metrics["mae"],
                    metrics["exactRate"],
                )

                if best_score is None or score > best_score:
                    best_models = models
                    best_metrics = metrics
                    best_predictions = predictions
                    best_score = score

    if best_models is None or best_metrics is None or best_predictions is None:
        raise RuntimeError("Failed to select male height models")

    return best_models, best_metrics, best_predictions


def build_pairwise_distance_stats(feature_vectors: list[list[float]]) -> dict[str, float]:
    distances = [
        euclidean_distance(feature_vectors[i], feature_vectors[j])
        for i in range(len(feature_vectors))
        for j in range(i + 1, len(feature_vectors))
    ]
    return {
        "min": round(min(distances), 6),
        "max": round(max(distances), 6),
        "p10": round(percentile(distances, 0.10), 6),
        "p50": round(percentile(distances, 0.50), 6),
        "p90": round(percentile(distances, 0.90), 6),
    }


def percentile(values: list[float], ratio: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    position = (len(ordered) - 1) * ratio
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return ordered[lower]
    return ordered[lower] + (ordered[upper] - ordered[lower]) * (position - lower)


def build_model() -> tuple[dict[str, object], dict[str, object]]:
    profiles = load_profiles()
    gray_images = [
        Image.open(resolve_image_path(str(profile["image"]))).convert("L") for profile in profiles
    ]
    raw_feature_sets = {
        feature_name: [
            extract_features(image, specs) for image in gray_images
        ]
        for feature_name, specs in FEATURE_SETS.items()
        if specs  # skip empty specs
    }
    normalization_stats = compute_normalization_stats(raw_feature_sets)
    feature_sets = normalize_feature_sets(raw_feature_sets, normalization_stats)
    heights = [float(profile["actualHeight"]) for profile in profiles]
    selected_models, metrics, predictions = select_models(feature_sets, heights)

    ranking_model = {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "metrics": {
            "trainingCount": len(profiles),
            "height": {
                "strategy": "auto-selected median ensemble of kNN regressors",
                **metrics,
            },
        },
        "estimates": {
            str(profile["name"]): prediction
            for profile, prediction in zip(profiles, predictions, strict=True)
        },
    }

    diagnosis_model = {
        "version": 2,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "normalization": normalization_stats,
        "metrics": {
            "trainingCount": len(profiles),
            "height": {
                "strategy": "auto-selected normalized kNN regressors",
                **metrics,
            },
            "similarity": {
                "feature": "full grayscale 8x8 + top grayscale 8x8",
                "trainingCount": len(profiles),
                "distance": build_pairwise_distance_stats(feature_sets["similarity"]),
            },
        },
        "entries": [
            {
                "name": profile["name"],
                "image": profile["image"],
                "actualHeight": float(profile["actualHeight"]),
                "featureSets": {
                    feature_name: feature_sets[feature_name][index]
                    for feature_name in feature_sets
                },
            }
            for index, profile in enumerate(profiles)
        ],
    }

    return ranking_model, diagnosis_model


def main() -> None:
    ranking_model, diagnosis_model = build_model()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(ranking_model, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    DIAGNOSIS_OUTPUT_PATH.write_text(
        json.dumps(diagnosis_model, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    count = ranking_model["metrics"]["trainingCount"]
    print(f"Wrote {OUTPUT_PATH} with {count} male training images")
    print(f"Wrote {DIAGNOSIS_OUTPUT_PATH} with {len(diagnosis_model['entries'])} entries")


if __name__ == "__main__":
    main()
