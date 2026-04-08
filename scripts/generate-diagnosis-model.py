from __future__ import annotations

import json
import math
import statistics
import subprocess
from dataclasses import dataclass
from datetime import datetime, timezone
from itertools import combinations, product
from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_PATH = REPO_ROOT / "public" / "data" / "diagnosis-model.json"
LOCAL_TRAINING_DATA_PATH = REPO_ROOT / "local-data" / "training-profiles.json"

CUP_ORDER = ["A", "B", "C", "D", "E", "F", "G", "H"]
REGIONS = {
    "full": (0.0, 1.0),
    "top": (0.0, 0.45),
    "mid": (0.25, 0.75),
    "low": (0.45, 1.0),
}
FEATURE_SETS = {
    "heightPrimary": [("full", 6), ("full", 8)],
    "heightBalanced": [("full", 6), ("top", 6), ("low", 6)],
    "heightWide": [("full", 14)],
    "cupPrimary": [("top", 8), ("top", 12)],
    "cupSecondary": [("top", 8), ("mid", 6)],
    "similarity": [("full", 8), ("top", 8)],
}
ORICON_HEIGHT_ALLOWLIST = {
    "そちお",
    "岡あゆみ",
    "加藤ローサ",
    "加藤沙耶香",
    "宮澤佐江",
    "若槻千夏",
    "小倉優子",
}
HEIGHT_FEATURE_CANDIDATES = ("heightPrimary", "heightBalanced", "heightWide")
CUP_FEATURE_CANDIDATES = ("cupPrimary", "cupSecondary")
K_CANDIDATES = (1, 3, 5, 7, 9, 11, 13, 15)


@dataclass(frozen=True)
class Profile:
    name: str
    image: str
    actual_height: float
    cup: str
    use_for_height: bool = True
    use_for_cup: bool = True
    use_for_similarity: bool = True


def load_profiles() -> list[Profile]:
    result = subprocess.run(
        [
            "node",
            "--input-type=module",
            "-e",
            "import { femaleProfilePool } from './lib/source-profiles.ts';"
            "console.log(JSON.stringify(femaleProfilePool))",
        ],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=True,
    )
    profiles = json.loads(result.stdout)

    base_profiles = [
        Profile(
            name=profile["name"],
            image=profile["image"],
            actual_height=float(profile["actualHeight"]),
            cup=profile["cup"],
        )
        for profile in profiles
        if profile["image"].startswith("/images/") and profile["cup"] in CUP_ORDER
    ]
    local_profiles = load_local_training_profiles()
    merged = {profile.name: profile for profile in base_profiles}

    for profile in local_profiles:
        merged[profile.name] = profile

    return list(merged.values())


def load_local_training_profiles() -> list[Profile]:
    if not LOCAL_TRAINING_DATA_PATH.exists():
        return []

    records = json.loads(LOCAL_TRAINING_DATA_PATH.read_text(encoding="utf-8"))

    return [
        Profile(
            name=record["name"],
            image=record["imagePath"],
            actual_height=float(record["actualHeight"]),
            cup=record["cup"],
            use_for_height=bool(
                record.get(
                    "useForHeight",
                    (
                        record.get("source") not in {"oricon", "instagram.com"}
                        or record["name"] in ORICON_HEIGHT_ALLOWLIST
                    ),
                )
            ),
            use_for_cup=bool(record.get("useForCup", False)),
            use_for_similarity=bool(record.get("useForSimilarity", True)),
        )
        for record in records
        if record.get("imagePath") and record.get("cup") in CUP_ORDER
    ]


def resolve_image_path(image_path: str) -> Path:
    if image_path.startswith("/images/"):
        return REPO_ROOT / "public" / image_path.lstrip("/")

    return REPO_ROOT / image_path


def crop_and_resize(gray_image: Image.Image, region_name: str, size: int) -> list[float]:
    top_ratio, bottom_ratio = REGIONS[region_name]
    top = int(gray_image.height * top_ratio)
    bottom = max(top + 1, int(gray_image.height * bottom_ratio))
    cropped = gray_image.crop((0, top, gray_image.width, bottom))
    resized = cropped.resize((size, size), Image.Resampling.BILINEAR)

    return [round(pixel / 255, 4) for pixel in resized.get_flattened_data()]


def extract_features(gray_image: Image.Image, specs: list[tuple[str, int]]) -> list[float]:
    features: list[float] = []

    for region_name, size in specs:
        features.extend(crop_and_resize(gray_image, region_name, size))

    return features


def euclidean_distance(left: list[float], right: list[float]) -> float:
    return math.sqrt(sum((l - r) ** 2 for l, r in zip(left, right, strict=True)))


def js_round(value: float) -> int:
    return math.floor(value + 0.5)


def weighted_average(neighbors: list[tuple[float, float]]) -> float:
    weights = [1 / ((distance + 1e-6) ** 2) for distance, _ in neighbors]
    weighted_sum = sum(weight * value for weight, (_, value) in zip(weights, neighbors, strict=True))

    return weighted_sum / sum(weights)


def weighted_vote(neighbors: list[tuple[float, str]]) -> str:
    scores = {cup: 0.0 for cup in CUP_ORDER}

    for distance, cup in neighbors:
        scores[cup] += 1 / ((distance + 1e-6) ** 2)

    return max(CUP_ORDER, key=lambda cup: (scores[cup], -abs(CUP_ORDER.index(cup) - 3)))


def get_neighbors(
    feature_sets: list[list[float]],
    values: list[float] | list[str],
    target_index: int,
    neighbor_count: int,
    candidate_indices: list[int] | None = None,
) -> list[tuple[float, float]] | list[tuple[float, str]]:
    allowed_indices = (
        candidate_indices
        if candidate_indices is not None
        else list(range(len(feature_sets)))
    )
    neighbors = [
        (euclidean_distance(feature_sets[target_index], feature_sets[index]), values[index])
        for index in allowed_indices
        if index != target_index
    ]
    neighbors.sort(key=lambda item: item[0])

    return neighbors[:neighbor_count]


def build_ranked_neighbors(
    named_feature_sets: dict[str, list[list[float]]],
    values: list[float] | list[str],
    candidate_indices: list[int],
    feature_names: tuple[str, ...],
) -> dict[str, dict[int, list[tuple[float, float]] | list[tuple[float, str]]]]:
    return {
        feature_name: {
            index: get_neighbors(
                named_feature_sets[feature_name],
                values,
                index,
                len(candidate_indices) - 1,
                candidate_indices,
            )
            for index in candidate_indices
        }
        for feature_name in feature_names
    }


def percentile(values: list[float], ratio: float) -> float:
    if not values:
        return 0.0

    ordered = sorted(values)
    position = (len(ordered) - 1) * ratio
    lower_index = math.floor(position)
    upper_index = math.ceil(position)

    if lower_index == upper_index:
        return ordered[lower_index]

    lower = ordered[lower_index]
    upper = ordered[upper_index]

    return lower + (upper - lower) * (position - lower_index)


def error_bound_for_rate(values: list[float], ratio: float) -> float:
    if not values:
        return 0.0

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


def infer_silhouette(actual_height: float, cup: str) -> str:
    cup_value = CUP_ORDER.index(cup)

    if actual_height <= 158 and cup_value >= CUP_ORDER.index("E"):
        return "A"

    if actual_height >= 164 and cup_value <= CUP_ORDER.index("C"):
        return "I"

    return "X"


def build_pairwise_distance_stats(feature_sets: list[list[float]]) -> dict[str, float]:
    distances = [
        euclidean_distance(feature_sets[left_index], feature_sets[right_index])
        for left_index in range(len(feature_sets))
        for right_index in range(left_index + 1, len(feature_sets))
    ]

    return {
        "min": round(min(distances), 6),
        "max": round(max(distances), 6),
        "p10": round(percentile(distances, 0.10), 6),
        "p50": round(percentile(distances, 0.50), 6),
        "p90": round(percentile(distances, 0.90), 6),
    }


def build_pairwise_distance_stats_for_indices(
    feature_sets: list[list[float]], indices: list[int]
) -> dict[str, float]:
    return build_pairwise_distance_stats([feature_sets[index] for index in indices])


def median_rounded(values: list[float]) -> int:
    return js_round(statistics.median(values))


def vote_cups(predictions: list[str]) -> str:
    scores = {cup: 0 for cup in CUP_ORDER}

    for prediction in predictions:
        scores[prediction] += 1

    return max(CUP_ORDER, key=lambda cup: (scores[cup], -abs(CUP_ORDER.index(cup) - 3)))


def evaluate_height_models(
    ranked_neighbors: dict[str, dict[int, list[tuple[float, float]]]],
    heights: list[float],
    height_indices: list[int],
    models: tuple[tuple[str, int], ...],
) -> dict[str, float]:
    errors: list[float] = []

    for index in height_indices:
        predictions = [
            weighted_average(ranked_neighbors[feature_name][index][:neighbor_count])
            for feature_name, neighbor_count in models
        ]
        prediction = median_rounded(predictions)
        errors.append(abs(prediction - heights[index]))

    return {
        "mae": round(statistics.fmean(errors), 6),
        "exactRate": round(sum(error == 0 for error in errors) / len(errors), 6),
        "within2Rate": round(sum(error <= 2 for error in errors) / len(errors), 6),
        "coverage": build_error_coverage(errors, [0.7, 0.8]),
        "trainingCount": len(height_indices),
        "models": [
            {
                "featureSet": feature_name,
                "k": neighbor_count,
            }
            for feature_name, neighbor_count in models
        ],
    }


def evaluate_cup_models(
    ranked_neighbors: dict[str, dict[int, list[tuple[float, str]]]],
    cups: list[str],
    cup_indices: list[int],
    models: tuple[tuple[str, int], ...],
) -> dict[str, float]:
    errors: list[int] = []

    for index in cup_indices:
        predictions = [
            weighted_vote(ranked_neighbors[feature_name][index][:neighbor_count])
            for feature_name, neighbor_count in models
        ]
        prediction = vote_cups(predictions)
        errors.append(abs(CUP_ORDER.index(prediction) - CUP_ORDER.index(cups[index])))

    return {
        "mae": round(statistics.fmean(errors), 6),
        "exactRate": round(sum(error == 0 for error in errors) / len(errors), 6),
        "within1Rate": round(sum(error <= 1 for error in errors) / len(errors), 6),
        "coverage": build_error_coverage(errors, [0.7, 0.8]),
        "trainingCount": len(cup_indices),
        "models": [
            {
                "featureSet": feature_name,
                "k": neighbor_count,
            }
            for feature_name, neighbor_count in models
        ],
    }


def select_height_models(
    named_feature_sets: dict[str, list[list[float]]],
    heights: list[float],
    height_indices: list[int],
) -> tuple[tuple[tuple[str, int], ...], dict[str, float]]:
    ranked_neighbors = build_ranked_neighbors(
        named_feature_sets,
        heights,
        height_indices,
        HEIGHT_FEATURE_CANDIDATES,
    )
    best_models: tuple[tuple[str, int], ...] | None = None
    best_metrics: dict[str, float] | None = None
    best_score: tuple[float, float, float, float] | None = None

    for size in range(1, len(HEIGHT_FEATURE_CANDIDATES) + 1):
        for feature_names in combinations(HEIGHT_FEATURE_CANDIDATES, size):
            for ks in product(K_CANDIDATES, repeat=size):
                models = tuple(zip(feature_names, ks, strict=True))
                metrics = evaluate_height_models(
                    ranked_neighbors,
                    heights,
                    height_indices,
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
                    best_score = score

    if best_models is None or best_metrics is None:
        raise RuntimeError("Failed to select height models")

    return best_models, best_metrics


def select_cup_models(
    named_feature_sets: dict[str, list[list[float]]],
    cups: list[str],
    cup_indices: list[int],
) -> tuple[tuple[tuple[str, int], ...], dict[str, float]]:
    ranked_neighbors = build_ranked_neighbors(
        named_feature_sets,
        cups,
        cup_indices,
        CUP_FEATURE_CANDIDATES,
    )
    best_models: tuple[tuple[str, int], ...] | None = None
    best_metrics: dict[str, float] | None = None
    best_score: tuple[float, float, float, float] | None = None

    for size in range(1, len(CUP_FEATURE_CANDIDATES) + 1):
        for feature_names in combinations(CUP_FEATURE_CANDIDATES, size):
            for ks in product(K_CANDIDATES, repeat=size):
                models = tuple(zip(feature_names, ks, strict=True))
                metrics = evaluate_cup_models(
                    ranked_neighbors,
                    cups,
                    cup_indices,
                    models,
                )
                coverage70 = metrics["coverage"][0]["maxError"]
                score = (
                    metrics["within1Rate"],
                    -coverage70,
                    -metrics["mae"],
                    metrics["exactRate"],
                )

                if best_score is None or score > best_score:
                    best_models = models
                    best_metrics = metrics
                    best_score = score

    if best_models is None or best_metrics is None:
        raise RuntimeError("Failed to select cup models")

    return best_models, best_metrics


def evaluate_height(
    named_feature_sets: dict[str, list[list[float]]],
    heights: list[float],
    height_indices: list[int],
) -> dict[str, float]:
    _, metrics = select_height_models(named_feature_sets, heights, height_indices)
    return metrics


def evaluate_cup(
    named_feature_sets: dict[str, list[list[float]]],
    cups: list[str],
    cup_indices: list[int],
) -> dict[str, float]:
    _, metrics = select_cup_models(named_feature_sets, cups, cup_indices)
    return metrics


def build_model() -> dict[str, object]:
    profiles = load_profiles()
    gray_images = [
        Image.open(resolve_image_path(profile.image)).convert("L") for profile in profiles
    ]
    feature_sets = {
        feature_name: [
            extract_features(image, specs) for image in gray_images
        ]
        for feature_name, specs in FEATURE_SETS.items()
    }
    heights = [profile.actual_height for profile in profiles]
    cups = [profile.cup for profile in profiles]
    height_indices = [
        index for index, profile in enumerate(profiles) if profile.use_for_height
    ]
    cup_indices = [index for index, profile in enumerate(profiles) if profile.use_for_cup]
    similarity_indices = [
        index for index, profile in enumerate(profiles) if profile.use_for_similarity
    ]
    height_metrics = evaluate_height(feature_sets, heights, height_indices)
    cup_metrics = evaluate_cup(feature_sets, cups, cup_indices)

    return {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "metrics": {
            "trainingCount": len(profiles),
            "height": {
                "strategy": "auto-selected median ensemble of kNN regressors",
                **height_metrics,
            },
            "cup": {
                "strategy": "auto-selected vote ensemble of kNN classifiers",
                **cup_metrics,
            },
            "similarity": {
                "feature": "full grayscale 8x8 + top grayscale 8x8",
                "trainingCount": len(similarity_indices),
                "distance": build_pairwise_distance_stats_for_indices(
                    feature_sets["similarity"],
                    similarity_indices,
                ),
            },
        },
        "entries": [
            {
                "name": profile.name,
                "image": profile.image,
                "actualHeight": profile.actual_height,
                "cup": profile.cup,
                "silhouetteType": infer_silhouette(profile.actual_height, profile.cup),
                "availability": {
                    "height": profile.use_for_height,
                    "cup": profile.use_for_cup,
                    "similarity": profile.use_for_similarity,
                },
                "featureSets": {
                    feature_name: feature_sets[feature_name][index]
                    for feature_name in FEATURE_SETS
                },
            }
            for index, profile in enumerate(profiles)
        ],
    }


def main() -> None:
    model = build_model()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(model, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Wrote {OUTPUT_PATH} with {model['metrics']['trainingCount']} training images",
    )


if __name__ == "__main__":
    main()
