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
}
FEATURE_CANDIDATES = (
    "heightPrimary",
    "heightBalanced",
    "heightWide",
    "heightCenter",
    "heightProfile",
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


def extract_feature_block(gray_image: Image.Image, region_name: str, size: int, mode: str) -> list[float]:
    values = crop_and_resize(gray_image, region_name, size)

    if mode == "profile":
        return profile_features(values, size)

    return values


def extract_features(gray_image: Image.Image, specs: list[tuple[str, int, str]]) -> list[float]:
    features: list[float] = []

    for region_name, size, mode in specs:
        features.extend(extract_feature_block(gray_image, region_name, size, mode))

    return features


def euclidean_distance(left: list[float], right: list[float]) -> float:
    return math.sqrt(sum((l - r) ** 2 for l, r in zip(left, right, strict=True)))


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


def build_model() -> dict[str, object]:
    profiles = load_profiles()
    gray_images = [
        Image.open(resolve_image_path(str(profile["image"]))).convert("L") for profile in profiles
    ]
    feature_sets = {
        feature_name: [
            extract_features(image, specs) for image in gray_images
        ]
        for feature_name, specs in FEATURE_SETS.items()
    }
    heights = [float(profile["actualHeight"]) for profile in profiles]
    _, metrics, predictions = select_models(feature_sets, heights)

    return {
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


def main() -> None:
    model = build_model()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(model, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Wrote {OUTPUT_PATH} with {model['metrics']['trainingCount']} male training images",
    )


if __name__ == "__main__":
    main()
