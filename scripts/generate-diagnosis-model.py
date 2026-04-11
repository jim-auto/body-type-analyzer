from __future__ import annotations

import argparse
import json
import math
import statistics
import subprocess
import hashlib
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
    "full": (0.0, 0.0, 1.0, 1.0),
    "top": (0.0, 0.0, 1.0, 0.45),
    "mid": (0.0, 0.25, 1.0, 0.75),
    "low": (0.0, 0.45, 1.0, 1.0),
    "fullCenter": (0.16, 0.0, 0.84, 1.0),
    "topCenter": (0.18, 0.02, 0.82, 0.55),
    "torsoCenter": (0.18, 0.16, 0.82, 0.72),
    "lowCenter": (0.16, 0.45, 0.84, 1.0),
}
FEATURE_SETS = {
    "heightPrimary": [("full", 6, "gray"), ("full", 8, "gray")],
    "heightBalanced": [("full", 6, "gray"), ("top", 6, "gray"), ("low", 6, "gray")],
    "heightWide": [("full", 14, "gray")],
    "heightCenter": [("fullCenter", 8, "gray"), ("lowCenter", 8, "gray")],
    "heightProfile": [("fullCenter", 12, "profile"), ("lowCenter", 10, "profile")],
    "heightEdgeFull": [("full", 8, "edge")],
    "heightEdgeCenter": [("fullCenter", 8, "edge"), ("lowCenter", 8, "edge")],
    "cupPrimary": [("top", 8, "gray"), ("top", 12, "gray")],
    "cupSecondary": [("top", 8, "gray"), ("mid", 6, "gray")],
    "cupCenter": [("topCenter", 10, "gray"), ("torsoCenter", 8, "gray")],
    "cupProfile": [("topCenter", 12, "profile"), ("torsoCenter", 10, "profile")],
    "cupEdgeTop": [("top", 10, "edge")],
    "similarity": [("full", 8, "gray"), ("top", 8, "gray")],
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
HEIGHT_FEATURE_CANDIDATES = (
    "heightPrimary",
    "heightBalanced",
    "heightWide",
    "heightCenter",
    "heightProfile",
    "heightEdgeFull",
    "heightEdgeCenter",
)
CUP_FEATURE_CANDIDATES = (
    "cupPrimary",
    "cupSecondary",
    "cupCenter",
    "cupProfile",
    "cupEdgeTop",
)
K_CANDIDATES = (1, 3, 5, 7, 9, 11, 13, 15)
MAX_ENSEMBLE_SIZE = 3
HOLDOUT_RATIO = 0.2
MIN_HOLDOUT_BUCKET_SIZE = 4
FOCUS_SAMPLE_SIZE = 64
FOCUS_LOW_QUANTILE = 0.08
FOCUS_HIGH_QUANTILE = 0.92
FOCUS_MIN_WIDTH_RATIO = 0.68
FOCUS_MIN_HEIGHT_RATIO = 0.88
FOCUS_HORIZONTAL_PADDING_RATIO = 0.1
FOCUS_VERTICAL_PADDING_RATIO = 0.04
ROBUST_HEIGHT_MODELS = (
    ("heightPrimary", 5),
    ("heightEdgeFull", 15),
    ("heightEdgeCenter", 9),
)
ROBUST_CUP_MODELS = (
    ("cupSecondary", 3),
    ("cupCenter", 5),
    ("cupEdgeTop", 5),
)
TRUSTED_LOCAL_SOURCES = {
    "talent-databank",
    "idolprof",
    "idolprof.com",
    "idolprof-idolprof",
    "idolprof-idolprof.com",
    "amic-e.com",
    "media-iz.com",
    "mache.tv",
    "y6nvocam.gdl-entertainment.tokyo",
}
CURATED_LOCAL_HEIGHT_SOURCES = set(TRUSTED_LOCAL_SOURCES)
CURATED_LOCAL_CUP_SOURCES = set(TRUSTED_LOCAL_SOURCES)


@dataclass(frozen=True)
class Profile:
    name: str
    image: str
    actual_height: float
    cup: str
    source: str = "public"
    use_for_height: bool = True
    use_for_cup: bool = True
    use_for_similarity: bool = True


@dataclass(frozen=True)
class FocusCropConfig:
    sample_size: int = FOCUS_SAMPLE_SIZE
    low_quantile: float = FOCUS_LOW_QUANTILE
    high_quantile: float = FOCUS_HIGH_QUANTILE
    min_width_ratio: float = FOCUS_MIN_WIDTH_RATIO
    min_height_ratio: float = FOCUS_MIN_HEIGHT_RATIO
    horizontal_padding_ratio: float = FOCUS_HORIZONTAL_PADDING_RATIO
    vertical_padding_ratio: float = FOCUS_VERTICAL_PADDING_RATIO


@dataclass(frozen=True)
class PreprocessingPreset:
    key: str
    description: str
    height_focus: FocusCropConfig | None
    cup_focus: FocusCropConfig | None
    similarity_focus: FocusCropConfig | None


DEFAULT_FOCUS_CROP = FocusCropConfig()
WIDE_HEIGHT_FOCUS_CROP = FocusCropConfig(
    min_width_ratio=0.78,
    min_height_ratio=0.92,
    horizontal_padding_ratio=0.06,
    vertical_padding_ratio=0.02,
)
PREPROCESSING_PRESETS: dict[str, PreprocessingPreset] = {
    "focused-shared": PreprocessingPreset(
        key="focused-shared",
        description="Focused crop for height, cup, and similarity",
        height_focus=DEFAULT_FOCUS_CROP,
        cup_focus=DEFAULT_FOCUS_CROP,
        similarity_focus=DEFAULT_FOCUS_CROP,
    ),
    "raw": PreprocessingPreset(
        key="raw",
        description="Raw image for height, cup, and similarity",
        height_focus=None,
        cup_focus=None,
        similarity_focus=None,
    ),
    "focused-split-raw-height": PreprocessingPreset(
        key="focused-split-raw-height",
        description="Raw height, focused cup, focused similarity",
        height_focus=None,
        cup_focus=DEFAULT_FOCUS_CROP,
        similarity_focus=DEFAULT_FOCUS_CROP,
    ),
    "focused-split-wide-height": PreprocessingPreset(
        key="focused-split-wide-height",
        description="Wide focused height, focused cup, focused similarity",
        height_focus=WIDE_HEIGHT_FOCUS_CROP,
        cup_focus=DEFAULT_FOCUS_CROP,
        similarity_focus=DEFAULT_FOCUS_CROP,
    ),
}
DEFAULT_PREPROCESSING_PRESET = PREPROCESSING_PRESETS["focused-split-raw-height"]


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
            source="public",
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

    profiles: list[Profile] = []

    for record in records:
        if not record.get("imagePath") or record.get("cup") not in CUP_ORDER:
            continue

        source = record.get("source", "local")
        use_for_height = bool(
            record.get(
                "useForHeight",
                source == "talent-databank",
            )
        ) and source in CURATED_LOCAL_HEIGHT_SOURCES
        use_for_cup = bool(record.get("useForCup", False)) and source in CURATED_LOCAL_CUP_SOURCES

        profiles.append(
            Profile(
                name=record["name"],
                image=record["imagePath"],
                actual_height=float(record["actualHeight"]),
                cup=record["cup"],
                source=source,
                use_for_height=use_for_height,
                use_for_cup=use_for_cup,
                use_for_similarity=bool(record.get("useForSimilarity", False)),
            )
        )

    return profiles


def resolve_image_path(image_path: str) -> Path:
    if image_path.startswith("/images/"):
        return REPO_ROOT / "public" / image_path.lstrip("/")

    return REPO_ROOT / image_path


def crop_and_resize(gray_image: Image.Image, region_name: str, size: int) -> list[float]:
    left_ratio, top_ratio, right_ratio, bottom_ratio = REGIONS[region_name]
    left = int(gray_image.width * left_ratio)
    top = int(gray_image.height * top_ratio)
    right = max(left + 1, int(gray_image.width * right_ratio))
    bottom = max(top + 1, int(gray_image.height * bottom_ratio))
    cropped = gray_image.crop((left, top, right, bottom))
    resized = cropped.resize((size, size), Image.Resampling.BILINEAR)

    return [round(pixel / 255, 4) for pixel in resized.get_flattened_data()]


def get_weighted_bounds(weights: list[float], low_quantile: float, high_quantile: float) -> tuple[int, int]:
    total = sum(weights)

    if total <= 1e-9:
        return 0, len(weights) - 1

    low_target = total * low_quantile
    high_target = total * high_quantile
    cumulative = 0.0
    start = 0
    end = len(weights) - 1
    found_start = False

    for index, weight in enumerate(weights):
        cumulative += weight

        if not found_start and cumulative >= low_target:
            start = index
            found_start = True

        if cumulative >= high_target:
            end = index
            break

    return start, max(start, end)


def expand_focus_range(
    start: float,
    end: float,
    min_span: float,
    padding_ratio: float,
) -> tuple[float, float]:
    center = (start + end) / 2
    span = max(min_span, (end - start) * (1 + padding_ratio * 2))
    next_start = max(0.0, center - span / 2)
    next_end = min(1.0, center + span / 2)

    if next_end - next_start < span:
        if next_start == 0.0:
            next_end = min(1.0, span)
        else:
            next_start = max(0.0, 1.0 - span)

    return next_start, next_end


def build_focused_image(gray_image: Image.Image, focus_crop: FocusCropConfig) -> Image.Image:
    sample = gray_image.resize(
        (focus_crop.sample_size, focus_crop.sample_size),
        Image.Resampling.BILINEAR,
    )
    values = [round(pixel / 255, 4) for pixel in sample.get_flattened_data()]
    edge_values = edge_features(values, focus_crop.sample_size)
    row_weights = [0.0 for _ in range(focus_crop.sample_size)]
    column_weights = [0.0 for _ in range(focus_crop.sample_size)]

    for row_index in range(focus_crop.sample_size):
        for column_index in range(focus_crop.sample_size):
            energy = edge_values[row_index * focus_crop.sample_size + column_index]
            row_weights[row_index] += energy
            column_weights[column_index] += energy

    top, bottom = get_weighted_bounds(
        row_weights,
        focus_crop.low_quantile,
        focus_crop.high_quantile,
    )
    left, right = get_weighted_bounds(
        column_weights,
        focus_crop.low_quantile,
        focus_crop.high_quantile,
    )
    focus_top, focus_bottom = expand_focus_range(
        top / focus_crop.sample_size,
        (bottom + 1) / focus_crop.sample_size,
        focus_crop.min_height_ratio,
        focus_crop.vertical_padding_ratio,
    )
    focus_left, focus_right = expand_focus_range(
        left / focus_crop.sample_size,
        (right + 1) / focus_crop.sample_size,
        focus_crop.min_width_ratio,
        focus_crop.horizontal_padding_ratio,
    )
    crop_left = int(gray_image.width * focus_left)
    crop_top = int(gray_image.height * focus_top)
    crop_right = max(crop_left + 1, math.ceil(gray_image.width * focus_right))
    crop_bottom = max(crop_top + 1, math.ceil(gray_image.height * focus_bottom))

    return gray_image.crop((crop_left, crop_top, crop_right, crop_bottom))


def feature_group_for_name(feature_name: str) -> str:
    if feature_name.startswith("height"):
        return "height"

    if feature_name.startswith("cup"):
        return "cup"

    return "similarity"


def build_feature_sets(
    gray_images: list[Image.Image],
    preset: PreprocessingPreset,
) -> dict[str, list[list[float]]]:
    processed_images_by_group: dict[str, list[Image.Image]] = {}

    for group_name, focus_crop in (
        ("height", preset.height_focus),
        ("cup", preset.cup_focus),
        ("similarity", preset.similarity_focus),
    ):
        if focus_crop is None:
            processed_images_by_group[group_name] = gray_images
            continue

        processed_images_by_group[group_name] = [
            build_focused_image(image, focus_crop) for image in gray_images
        ]

    return {
        feature_name: [
            extract_features(
                processed_images_by_group[feature_group_for_name(feature_name)][index],
                specs,
            )
            for index in range(len(gray_images))
        ]
        for feature_name, specs in FEATURE_SETS.items()
    }


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


def extract_feature_block(gray_image: Image.Image, region_name: str, size: int, mode: str) -> list[float]:
    values = crop_and_resize(gray_image, region_name, size)

    if mode == "profile":
        return profile_features(values, size)

    if mode == "edge":
        return edge_features(values, size)

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


def weighted_vote(neighbors: list[tuple[float, str]]) -> str:
    scores = {cup: 0.0 for cup in CUP_ORDER}

    for distance, cup in neighbors:
        scores[cup] += 1 / ((distance + 1e-6) ** 2)

    return max(CUP_ORDER, key=lambda cup: (scores[cup], -abs(CUP_ORDER.index(cup) - 3)))


def get_neighbors(
    feature_sets: list[list[float]],
    values: list[float] | list[str],
    names: list[str],
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
        (
            euclidean_distance(feature_sets[target_index], feature_sets[index]),
            names[index],
            values[index],
        )
        for index in allowed_indices
        if index != target_index
    ]
    neighbors.sort(key=lambda item: (item[0], item[1]))

    return [(distance, value) for distance, _, value in neighbors[:neighbor_count]]


def build_ranked_neighbors(
    named_feature_sets: dict[str, list[list[float]]],
    values: list[float] | list[str],
    names: list[str],
    candidate_indices: list[int],
    feature_names: tuple[str, ...],
) -> dict[str, dict[int, list[tuple[float, float]] | list[tuple[float, str]]]]:
    return {
        feature_name: {
            index: get_neighbors(
                named_feature_sets[feature_name],
                values,
                names,
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


def stable_index_hash(value: str) -> int:
    return int(hashlib.sha1(value.encode("utf-8")).hexdigest()[:8], 16)


def build_stratified_holdout(
    indices: list[int],
    bucket_for_index,
    profiles: list[Profile],
    ratio: float = HOLDOUT_RATIO,
) -> tuple[list[int], list[int]]:
    grouped: dict[str, list[int]] = {}

    for index in indices:
        bucket = str(bucket_for_index(index))
        grouped.setdefault(bucket, []).append(index)

    train_indices: list[int] = []
    holdout_indices: list[int] = []

    for bucket_indices in grouped.values():
        ordered = sorted(bucket_indices, key=lambda index: stable_index_hash(profiles[index].name))
        holdout_count = (
            max(1, round(len(ordered) * ratio))
            if len(ordered) >= MIN_HOLDOUT_BUCKET_SIZE
            else 0
        )

        holdout_indices.extend(ordered[:holdout_count])
        train_indices.extend(ordered[holdout_count:])

    return sorted(train_indices), sorted(holdout_indices)


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


def summarize_height_errors(errors: list[float], train_count: int) -> dict[str, float]:
    return {
        "mae": round(statistics.fmean(errors), 6),
        "exactRate": round(sum(error == 0 for error in errors) / len(errors), 6),
        "within2Rate": round(sum(error <= 2 for error in errors) / len(errors), 6),
        "coverage": build_error_coverage(errors, [0.7, 0.8]),
        "trainingCount": train_count,
    }


def summarize_cup_errors(errors: list[int], train_count: int) -> dict[str, float]:
    return {
        "mae": round(statistics.fmean(errors), 6),
        "exactRate": round(sum(error == 0 for error in errors) / len(errors), 6),
        "within1Rate": round(sum(error <= 1 for error in errors) / len(errors), 6),
        "coverage": build_error_coverage(errors, [0.7, 0.8]),
        "trainingCount": train_count,
    }


def evaluate_height_models_on_split(
    named_feature_sets: dict[str, list[list[float]]],
    heights: list[float],
    names: list[str],
    train_indices: list[int],
    evaluation_indices: list[int],
    models: tuple[tuple[str, int], ...],
) -> dict[str, float]:
    errors: list[float] = []

    for index in evaluation_indices:
        predictions = [
            weighted_average(
                get_neighbors(
                    named_feature_sets[feature_name],
                    heights,
                    names,
                    index,
                    neighbor_count,
                    train_indices,
                )
            )
            for feature_name, neighbor_count in models
        ]
        prediction = median_rounded(predictions)
        errors.append(abs(prediction - heights[index]))

    return summarize_height_errors(errors, len(train_indices))


def evaluate_cup_models_on_split(
    named_feature_sets: dict[str, list[list[float]]],
    cups: list[str],
    names: list[str],
    train_indices: list[int],
    evaluation_indices: list[int],
    models: tuple[tuple[str, int], ...],
) -> dict[str, float]:
    errors: list[int] = []

    for index in evaluation_indices:
        predictions = [
            weighted_vote(
                get_neighbors(
                    named_feature_sets[feature_name],
                    cups,
                    names,
                    index,
                    neighbor_count,
                    train_indices,
                )
            )
            for feature_name, neighbor_count in models
        ]
        prediction = vote_cups(predictions)
        errors.append(abs(CUP_ORDER.index(prediction) - CUP_ORDER.index(cups[index])))

    return summarize_cup_errors(errors, len(train_indices))


def select_height_models(
    named_feature_sets: dict[str, list[list[float]]],
    heights: list[float],
    names: list[str],
    height_indices: list[int],
) -> tuple[tuple[tuple[str, int], ...], dict[str, float]]:
    ranked_neighbors = build_ranked_neighbors(
        named_feature_sets,
        heights,
        names,
        height_indices,
        HEIGHT_FEATURE_CANDIDATES,
    )
    best_models: tuple[tuple[str, int], ...] | None = None
    best_metrics: dict[str, float] | None = None
    best_score: tuple[float, float, float, float, float] | None = None

    for size in range(1, min(len(HEIGHT_FEATURE_CANDIDATES), MAX_ENSEMBLE_SIZE) + 1):
        for feature_names in combinations(HEIGHT_FEATURE_CANDIDATES, size):
            for ks in product(K_CANDIDATES, repeat=size):
                models = tuple(zip(feature_names, ks, strict=True))
                metrics = evaluate_height_models(
                    ranked_neighbors,
                    heights,
                    height_indices,
                    models,
                )
                coverage70 = metrics["coverage"][0]["maxError"]
                coverage80 = metrics["coverage"][1]["maxError"]
                score = (
                    -coverage70,
                    -coverage80,
                    -metrics["mae"],
                    metrics["exactRate"],
                    metrics["within2Rate"],
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
    names: list[str],
    cup_indices: list[int],
) -> tuple[tuple[tuple[str, int], ...], dict[str, float]]:
    ranked_neighbors = build_ranked_neighbors(
        named_feature_sets,
        cups,
        names,
        cup_indices,
        CUP_FEATURE_CANDIDATES,
    )
    best_models: tuple[tuple[str, int], ...] | None = None
    best_metrics: dict[str, float] | None = None
    best_score: tuple[float, float, float, float] | None = None

    for size in range(1, min(len(CUP_FEATURE_CANDIDATES), MAX_ENSEMBLE_SIZE) + 1):
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


def select_height_models_for_generalization(
    named_feature_sets: dict[str, list[list[float]]],
    heights: list[float],
    names: list[str],
    profiles: list[Profile],
    height_indices: list[int],
) -> tuple[tuple[tuple[str, int], ...], dict[str, float], dict[str, float]]:
    train_indices, holdout_indices = build_stratified_holdout(
        height_indices,
        lambda index: round(heights[index] / 5) * 5,
        profiles,
    )
    models = ROBUST_HEIGHT_MODELS
    loocv_metrics = evaluate_height_models(
        build_ranked_neighbors(
            named_feature_sets,
            heights,
            names,
            height_indices,
            HEIGHT_FEATURE_CANDIDATES,
        ),
        heights,
        height_indices,
        models,
    )
    holdout_metrics = {
        "method": "fixed trusted-source holdout",
        "holdoutCount": len(holdout_indices),
        **evaluate_height_models_on_split(
            named_feature_sets,
            heights,
            names,
            train_indices,
            holdout_indices,
            models,
        ),
    }

    return models, loocv_metrics, holdout_metrics


def select_cup_models_for_generalization(
    named_feature_sets: dict[str, list[list[float]]],
    cups: list[str],
    names: list[str],
    profiles: list[Profile],
    cup_indices: list[int],
) -> tuple[tuple[tuple[str, int], ...], dict[str, float], dict[str, float]]:
    train_indices, holdout_indices = build_stratified_holdout(
        cup_indices,
        lambda index: cups[index],
        profiles,
    )
    models = ROBUST_CUP_MODELS
    loocv_metrics = evaluate_cup_models(
        build_ranked_neighbors(
            named_feature_sets,
            cups,
            names,
            cup_indices,
            CUP_FEATURE_CANDIDATES,
        ),
        cups,
        cup_indices,
        models,
    )
    holdout_metrics = {
        "method": "fixed trusted-source holdout",
        "holdoutCount": len(holdout_indices),
        **evaluate_cup_models_on_split(
            named_feature_sets,
            cups,
            names,
            train_indices,
            holdout_indices,
            models,
        ),
    }

    return models, loocv_metrics, holdout_metrics


def build_strategy_label(prefix: str, focus_crop: FocusCropConfig | None) -> str:
    mode = "focused" if focus_crop is not None else "raw"
    return f"{mode} {prefix}"


def build_similarity_label(focus_crop: FocusCropConfig | None) -> str:
    mode = "focused" if focus_crop is not None else "raw"
    return f"{mode} full grayscale 8x8 + top grayscale 8x8"


def build_model(preset: PreprocessingPreset = DEFAULT_PREPROCESSING_PRESET) -> dict[str, object]:
    profiles = load_profiles()
    gray_images = [
        Image.open(resolve_image_path(profile.image)).convert("L") for profile in profiles
    ]
    feature_sets = build_feature_sets(gray_images, preset)
    heights = [profile.actual_height for profile in profiles]
    cups = [profile.cup for profile in profiles]
    names = [profile.name for profile in profiles]
    height_indices = [
        index for index, profile in enumerate(profiles) if profile.use_for_height
    ]
    cup_indices = [index for index, profile in enumerate(profiles) if profile.use_for_cup]
    similarity_indices = [
        index for index, profile in enumerate(profiles) if profile.use_for_similarity
    ]
    _, height_metrics, height_generalization = select_height_models_for_generalization(
        feature_sets,
        heights,
        names,
        profiles,
        height_indices,
    )
    _, cup_metrics, cup_generalization = select_cup_models_for_generalization(
        feature_sets,
        cups,
        names,
        profiles,
        cup_indices,
    )

    return {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "metrics": {
            "trainingCount": len(profiles),
            "height": {
                "strategy": build_strategy_label(
                    "robust edge-enhanced kNN regressors",
                    preset.height_focus,
                ),
                **height_metrics,
                "generalization": height_generalization,
            },
            "cup": {
                "strategy": build_strategy_label(
                    "robust edge-enhanced kNN classifiers",
                    preset.cup_focus,
                ),
                **cup_metrics,
                "generalization": cup_generalization,
            },
            "similarity": {
                "feature": build_similarity_label(preset.similarity_focus),
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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--preset",
        choices=sorted(PREPROCESSING_PRESETS.keys()),
        default=DEFAULT_PREPROCESSING_PRESET.key,
        help="Preprocessing preset to use when generating the diagnosis model",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    preset = PREPROCESSING_PRESETS[args.preset]
    model = build_model(preset)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(model, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Wrote {OUTPUT_PATH} with {model['metrics']['trainingCount']} training images using preset '{preset.key}'",
    )


if __name__ == "__main__":
    main()
