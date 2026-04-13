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

import numpy as np
from PIL import Image

POSE_MODEL_PATH = Path(__file__).resolve().parents[1] / "local-data" / "pose_landmarker_lite.task"

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
    "heightHistFull": [("full", 8, "gray_histogram"), ("full", 8, "edge_histogram")],
    "heightLbpFull": [("full", 8, "lbp"), ("fullCenter", 8, "lbp")],
    "heightDctFull": [("full", 12, "dct")],
    "heightHogFull": [("full", 8, "hog"), ("fullCenter", 8, "hog")],
    "heightPose": [],
    "cupPrimary": [("top", 8, "gray"), ("top", 12, "gray")],
    "cupSecondary": [("top", 8, "gray"), ("mid", 6, "gray")],
    "cupCenter": [("topCenter", 10, "gray"), ("torsoCenter", 8, "gray")],
    "cupProfile": [("topCenter", 12, "profile"), ("torsoCenter", 10, "profile")],
    "cupEdgeTop": [("top", 10, "edge")],
    "cupHistTop": [("top", 8, "gray_histogram"), ("top", 8, "edge_histogram")],
    "cupLbpTop": [("top", 8, "lbp"), ("topCenter", 8, "lbp")],
    "cupDctTop": [("top", 12, "dct")],
    "cupHogTop": [("top", 8, "hog"), ("topCenter", 8, "hog")],
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
    "heightHistFull",
    "heightLbpFull",
    "heightDctFull",
    "heightHogFull",
    "heightPose",
)
CUP_FEATURE_CANDIDATES = (
    "cupPrimary",
    "cupSecondary",
    "cupCenter",
    "cupProfile",
    "cupEdgeTop",
    "cupHistTop",
    "cupLbpTop",
    "cupDctTop",
    "cupHogTop",
)
K_CANDIDATES = (1, 3, 5, 7, 9, 11, 13, 15)
MAX_ENSEMBLE_SIZE = 3
HOLDOUT_RATIO = 0.2
MIN_HOLDOUT_BUCKET_SIZE = 4
GENERALIZATION_SPLIT_COUNT = 3
WORST_CASE_LIMIT = 5
NEIGHBOR_PREVIEW_COUNT = 3
FOCUS_SAMPLE_SIZE = 64
FOCUS_LOW_QUANTILE = 0.08
FOCUS_HIGH_QUANTILE = 0.92
FOCUS_MIN_WIDTH_RATIO = 0.68
FOCUS_MIN_HEIGHT_RATIO = 0.88
FOCUS_HORIZONTAL_PADDING_RATIO = 0.1
FOCUS_VERTICAL_PADDING_RATIO = 0.04
ROBUST_HEIGHT_MODELS = (
    ("heightPrimary", 5),
    ("heightHistFull", 9),
    ("heightDctFull", 15),
)
ROBUST_CUP_MODELS = (
    ("cupSecondary", 3),
    ("cupEdgeTop", 3),
    ("cupHistTop", 13),
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
    "manual",
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
class ImageVariant:
    key: str
    description: str
    focus_crop: FocusCropConfig | None


@dataclass(frozen=True)
class PreprocessingPreset:
    key: str
    description: str
    height_variants: tuple[str, ...]
    cup_variants: tuple[str, ...]
    similarity_variants: tuple[str, ...]


@dataclass(frozen=True)
class TaskSourceWeights:
    height: float = 1.0
    cup: float = 1.0
    similarity: float = 1.0


@dataclass(frozen=True)
class SourceWeightPreset:
    key: str
    description: str
    family_weights: dict[str, TaskSourceWeights]
    default_weights: TaskSourceWeights = TaskSourceWeights()
    quality_strength: float = 0.0
    collision_power: float = 0.0
    quality_gate_threshold: float = 0.0
    collision_gate_min_size: int = 0
    quality_groups: tuple[str, ...] = ("height", "cup", "similarity")
    collision_groups: tuple[str, ...] = ("height", "cup", "similarity")
    gate_groups: tuple[str, ...] = ("height", "cup", "similarity")


DEFAULT_FOCUS_CROP = FocusCropConfig()
WIDE_HEIGHT_FOCUS_CROP = FocusCropConfig(
    min_width_ratio=0.78,
    min_height_ratio=0.92,
    horizontal_padding_ratio=0.06,
    vertical_padding_ratio=0.02,
)
IMAGE_VARIANTS: dict[str, ImageVariant] = {
    "raw": ImageVariant(
        key="raw",
        description="raw image",
        focus_crop=None,
    ),
    "focused": ImageVariant(
        key="focused",
        description="focused crop",
        focus_crop=DEFAULT_FOCUS_CROP,
    ),
    "wide-height": ImageVariant(
        key="wide-height",
        description="wide focused crop",
        focus_crop=WIDE_HEIGHT_FOCUS_CROP,
    ),
}
PREPROCESSING_PRESETS: dict[str, PreprocessingPreset] = {
    "focused-shared": PreprocessingPreset(
        key="focused-shared",
        description="Focused crop for height, cup, and similarity",
        height_variants=("focused",),
        cup_variants=("focused",),
        similarity_variants=("focused",),
    ),
    "raw": PreprocessingPreset(
        key="raw",
        description="Raw image for height, cup, and similarity",
        height_variants=("raw",),
        cup_variants=("raw",),
        similarity_variants=("raw",),
    ),
    "focused-split-raw-height": PreprocessingPreset(
        key="focused-split-raw-height",
        description="Raw height, focused cup, focused similarity",
        height_variants=("raw",),
        cup_variants=("focused",),
        similarity_variants=("focused",),
    ),
    "focused-split-wide-height": PreprocessingPreset(
        key="focused-split-wide-height",
        description="Wide focused height, focused cup, focused similarity",
        height_variants=("wide-height",),
        cup_variants=("focused",),
        similarity_variants=("focused",),
    ),
    "height-raw-wide-ensemble": PreprocessingPreset(
        key="height-raw-wide-ensemble",
        description="Average raw and wide-focused height, focused cup, focused similarity",
        height_variants=("raw", "wide-height"),
        cup_variants=("focused",),
        similarity_variants=("focused",),
    ),
    "height-raw-focused-ensemble": PreprocessingPreset(
        key="height-raw-focused-ensemble",
        description="Average raw and focused height, focused cup, focused similarity",
        height_variants=("raw", "focused"),
        cup_variants=("focused",),
        similarity_variants=("focused",),
    ),
    "cup-raw-focused-ensemble": PreprocessingPreset(
        key="cup-raw-focused-ensemble",
        description="Raw height, average raw and focused cup, focused similarity",
        height_variants=("raw",),
        cup_variants=("raw", "focused"),
        similarity_variants=("focused",),
    ),
    "split-multicrop": PreprocessingPreset(
        key="split-multicrop",
        description="Average raw and wide-focused height, average raw and focused cup, focused similarity",
        height_variants=("raw", "wide-height"),
        cup_variants=("raw", "focused"),
        similarity_variants=("focused",),
    ),
}
DEFAULT_PREPROCESSING_PRESET = PREPROCESSING_PRESETS["height-raw-focused-ensemble"]
SOURCE_WEIGHT_PRESETS: dict[str, SourceWeightPreset] = {
    "uniform": SourceWeightPreset(
        key="uniform",
        description="Uniform source weighting",
        family_weights={},
    ),
    "trusted-soft": SourceWeightPreset(
        key="trusted-soft",
        description="Boost first-party and trusted sources, softly downweight derived sources",
        family_weights={
            "official": TaskSourceWeights(height=1.08, cup=1.08),
            "idolprof-primary": TaskSourceWeights(height=1.04, cup=1.04),
            "trusted-local": TaskSourceWeights(height=1.06, cup=1.06),
            "oricon": TaskSourceWeights(height=1.03, cup=1.0),
            "wikipedia": TaskSourceWeights(height=0.97, cup=0.97),
            "instagram": TaskSourceWeights(height=0.95, cup=0.95),
            "idolprof-derived": TaskSourceWeights(height=0.99, cup=0.99),
        },
    ),
    "trusted-strong": SourceWeightPreset(
        key="trusted-strong",
        description="Stronger boost for trusted sources and clearer downweight for derived sources",
        family_weights={
            "official": TaskSourceWeights(height=1.12, cup=1.12),
            "idolprof-primary": TaskSourceWeights(height=1.06, cup=1.06),
            "trusted-local": TaskSourceWeights(height=1.08, cup=1.08),
            "oricon": TaskSourceWeights(height=1.05, cup=1.0),
            "wikipedia": TaskSourceWeights(height=0.95, cup=0.95),
            "instagram": TaskSourceWeights(height=0.9, cup=0.9),
            "idolprof-derived": TaskSourceWeights(height=0.97, cup=0.97),
        },
    ),
    "quality-soft": SourceWeightPreset(
        key="quality-soft",
        description="Uniform source weights with low-information image penalty",
        family_weights={},
        quality_strength=0.7,
    ),
    "collision-soft": SourceWeightPreset(
        key="collision-soft",
        description="Uniform source weights with soft exact-collision penalty",
        family_weights={},
        collision_power=0.5,
    ),
    "quality-collision": SourceWeightPreset(
        key="quality-collision",
        description="Uniform source weights with low-information and exact-collision penalties",
        family_weights={},
        quality_strength=0.7,
        collision_power=1.0,
    ),
    "trusted-quality-collision": SourceWeightPreset(
        key="trusted-quality-collision",
        description="Trusted-source boost with low-information and exact-collision penalties",
        family_weights={
            "official": TaskSourceWeights(height=1.08, cup=1.08),
            "idolprof-primary": TaskSourceWeights(height=1.04, cup=1.04),
            "trusted-local": TaskSourceWeights(height=1.06, cup=1.06),
            "oricon": TaskSourceWeights(height=1.03, cup=1.0),
            "wikipedia": TaskSourceWeights(height=0.97, cup=0.97),
            "instagram": TaskSourceWeights(height=0.95, cup=0.95),
            "idolprof-derived": TaskSourceWeights(height=0.99, cup=0.99),
        },
        quality_strength=0.7,
        collision_power=1.0,
    ),
    "quality-collision-gate": SourceWeightPreset(
        key="quality-collision-gate",
        description="Uniform source weights with hard gate for low-information large collision groups",
        family_weights={},
        quality_strength=0.7,
        collision_power=1.0,
        quality_gate_threshold=0.25,
        collision_gate_min_size=8,
    ),
    "trusted-quality-gate": SourceWeightPreset(
        key="trusted-quality-gate",
        description="Trusted-source boost with hard gate for low-information large collision groups",
        family_weights={
            "official": TaskSourceWeights(height=1.08, cup=1.08),
            "idolprof-primary": TaskSourceWeights(height=1.04, cup=1.04),
            "trusted-local": TaskSourceWeights(height=1.06, cup=1.06),
            "oricon": TaskSourceWeights(height=1.03, cup=1.0),
            "wikipedia": TaskSourceWeights(height=0.97, cup=0.97),
            "instagram": TaskSourceWeights(height=0.95, cup=0.95),
            "idolprof-derived": TaskSourceWeights(height=0.99, cup=0.99),
        },
        quality_strength=0.7,
        collision_power=1.0,
        quality_gate_threshold=0.25,
        collision_gate_min_size=8,
    ),
    "height-quality-collision-gate": SourceWeightPreset(
        key="height-quality-collision-gate",
        description="Height-only hard gate for low-information large collision groups",
        family_weights={},
        quality_strength=0.7,
        collision_power=1.0,
        quality_gate_threshold=0.25,
        collision_gate_min_size=8,
        quality_groups=("height",),
        collision_groups=("height",),
        gate_groups=("height",),
    ),
    "height-gate-cup-soft": SourceWeightPreset(
        key="height-gate-cup-soft",
        description="Height hard gate with cup soft quality-collision penalties",
        family_weights={},
        quality_strength=0.7,
        collision_power=1.0,
        quality_gate_threshold=0.25,
        collision_gate_min_size=8,
        quality_groups=("height", "cup"),
        collision_groups=("height", "cup"),
        gate_groups=("height",),
    ),
}
DEFAULT_SOURCE_WEIGHT_PRESET = SOURCE_WEIGHT_PRESETS["height-gate-cup-soft"]


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


def source_family_for_profile(profile: Profile) -> str:
    source = profile.source

    if source == "public":
        return "public"

    if source == "talent-databank":
        return "official"

    if source == "oricon":
        return "oricon"

    if "wikipedia" in source:
        return "wikipedia"

    if "instagram" in source:
        return "instagram"

    if source in {"idolprof", "idolprof.com", "idolprof-idolprof", "idolprof-idolprof.com"}:
        return "idolprof-primary"

    if source.startswith("idolprof-"):
        return "idolprof-derived"

    if source in TRUSTED_LOCAL_SOURCES:
        return "trusted-local"

    return "other-local"


def get_profile_source_weights(
    profile: Profile,
    weight_preset: SourceWeightPreset,
) -> TaskSourceWeights:
    family = source_family_for_profile(profile)
    return weight_preset.family_weights.get(family, weight_preset.default_weights)


def clamp_unit(value: float) -> float:
    return max(0.0, min(1.0, value))


def compute_quality_signal(image_quality_metrics: dict[str, float]) -> float:
    brightness_balance = 1.0 - clamp_unit(
        abs(image_quality_metrics["brightnessMean"] - 0.55) / 0.4
    )
    contrast_score = clamp_unit(
        (image_quality_metrics["contrastStddev"] - 0.04) / 0.18
    )
    edge_score = clamp_unit(
        (image_quality_metrics["edgeMean"] - 0.01) / 0.12
    )
    entropy_score = clamp_unit(
        (image_quality_metrics["entropy"] - 1.0) / 6.0
    )

    return round(
        brightness_balance * 0.15
        + contrast_score * 0.3
        + edge_score * 0.25
        + entropy_score * 0.3,
        6,
    )


def compute_quality_factor(
    image_quality_metrics: dict[str, float],
    weight_preset: SourceWeightPreset,
) -> float:
    if weight_preset.quality_strength <= 0:
        return 1.0

    signal = compute_quality_signal(image_quality_metrics)
    return round(
        max(0.05, 1.0 - weight_preset.quality_strength * (1.0 - signal)),
        6,
    )


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


def average_feature_vectors(feature_vectors: list[list[float]]) -> list[float]:
    if len(feature_vectors) == 1:
        return feature_vectors[0]

    return [
        round(statistics.fmean(values), 4)
        for values in zip(*feature_vectors, strict=True)
    ]


def build_feature_sets(
    gray_images: list[Image.Image],
    preset: PreprocessingPreset,
) -> dict[str, list[list[float]]]:
    processed_images_by_variant: dict[str, list[Image.Image]] = {}
    variant_keys = sorted(
        {
            *preset.height_variants,
            *preset.cup_variants,
            *preset.similarity_variants,
        }
    )

    for variant_key in variant_keys:
        variant = IMAGE_VARIANTS[variant_key]

        if variant.focus_crop is None:
            processed_images_by_variant[variant_key] = gray_images
            continue

        processed_images_by_variant[variant_key] = [
            build_focused_image(image, variant.focus_crop) for image in gray_images
        ]

    variants_by_group = {
        "height": preset.height_variants,
        "cup": preset.cup_variants,
        "similarity": preset.similarity_variants,
    }

    flipped_images_by_variant: dict[str, list[Image.Image]] = {
        variant_key: [image.transpose(Image.Transpose.FLIP_LEFT_RIGHT) for image in images]
        for variant_key, images in processed_images_by_variant.items()
    }

    def build_vectors_for_feature(
        feature_name: str,
        specs: list[tuple[str, int, str]],
    ) -> list[list[float]]:
        group = feature_group_for_name(feature_name)
        use_flip = group == "height"

        return [
            average_feature_vectors(
                [
                    extract_features(
                        processed_images_by_variant[variant_key][index],
                        specs,
                    )
                    for variant_key in variants_by_group[group]
                ]
                + (
                    [
                        extract_features(
                            flipped_images_by_variant[variant_key][index],
                            specs,
                        )
                        for variant_key in variants_by_group[group]
                    ]
                    if use_flip
                    else []
                )
            )
            for index in range(len(gray_images))
        ]

    return {
        feature_name: build_vectors_for_feature(feature_name, specs)
        for feature_name, specs in FEATURE_SETS.items()
    }


def build_image_quality_metrics(gray_image: Image.Image) -> dict[str, float]:
    sample = gray_image.resize(
        (FOCUS_SAMPLE_SIZE, FOCUS_SAMPLE_SIZE),
        Image.Resampling.BILINEAR,
    )
    values = [round(pixel / 255, 4) for pixel in sample.get_flattened_data()]
    edge_values = edge_features(values, FOCUS_SAMPLE_SIZE)
    histogram = sample.histogram()
    total = sum(histogram)
    entropy = 0.0

    for count in histogram:
        if count == 0 or total == 0:
            continue

        probability = count / total
        entropy -= probability * math.log2(probability)

    return {
        "width": gray_image.width,
        "height": gray_image.height,
        "aspectRatio": round(gray_image.width / max(1, gray_image.height), 6),
        "brightnessMean": round(statistics.fmean(values), 6),
        "contrastStddev": round(statistics.pstdev(values), 6),
        "edgeMean": round(statistics.fmean(edge_values), 6),
        "edgeP90": round(percentile(edge_values, 0.90), 6),
        "entropy": round(entropy, 6),
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
    """Extract low-frequency 2D DCT coefficients as features."""
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
    """Simplified Histogram of Oriented Gradients."""
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


def lbp_features(values: list[float], size: int, bin_count: int = 16) -> list[float]:
    """Simplified Local Binary Pattern histogram."""
    patterns: list[int] = []
    offsets = [(-1, -1), (-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1)]

    for row in range(size):
        for col in range(size):
            center = values[row * size + col]
            code = 0

            for bit, (dr, dc) in enumerate(offsets):
                nr = max(0, min(size - 1, row + dr))
                nc = max(0, min(size - 1, col + dc))

                if values[nr * size + nc] >= center:
                    code |= 1 << bit

            patterns.append(code)

    bins = [0.0] * bin_count
    total = len(patterns) if patterns else 1

    for pattern in patterns:
        bin_index = min(pattern * bin_count // 256, bin_count - 1)
        bins[bin_index] += 1

    return [round(count / total, 4) for count in bins]


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


def extract_feature_block(gray_image: Image.Image, region_name: str, size: int, mode: str) -> list[float]:
    values = crop_and_resize(gray_image, region_name, size)

    if mode == "profile":
        return profile_features(values, size)

    if mode == "edge":
        return edge_features(values, size)

    if mode == "gray_histogram":
        return histogram_features(values)

    if mode == "edge_histogram":
        return edge_histogram_features(values, size)

    if mode == "lbp":
        return lbp_features(values, size)

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


def landmark_distance(landmarks, a: int, b: int) -> float:
    return math.sqrt(
        (landmarks[a].x - landmarks[b].x) ** 2
        + (landmarks[a].y - landmarks[b].y) ** 2
    )


def extract_pose_features_from_image(rgb_image: Image.Image, landmarker) -> list[float] | None:
    import mediapipe as mp_lib

    mp_image = mp_lib.Image(
        image_format=mp_lib.ImageFormat.SRGB,
        data=np.array(rgb_image),
    )
    result = landmarker.detect(mp_image)

    if not result.pose_landmarks:
        return None

    lm = result.pose_landmarks[0]
    shoulder_w = landmark_distance(lm, 11, 12)
    hip_w = landmark_distance(lm, 23, 24)
    torso_l = (landmark_distance(lm, 11, 23) + landmark_distance(lm, 12, 24)) / 2
    left_leg = landmark_distance(lm, 23, 25) + landmark_distance(lm, 25, 27)
    right_leg = landmark_distance(lm, 24, 26) + landmark_distance(lm, 26, 28)
    leg_l = (left_leg + right_leg) / 2
    arm_l = (landmark_distance(lm, 11, 13) + landmark_distance(lm, 12, 14)) / 2
    nose_y = lm[0].y
    ankle_y = (lm[27].y + lm[28].y) / 2
    body_span = max(0.001, ankle_y - nose_y)

    return [
        round(shoulder_w, 4),
        round(hip_w, 4),
        round(torso_l, 4),
        round(leg_l, 4),
        round(body_span, 4),
        round(shoulder_w / max(hip_w, 0.001), 4),
        round(leg_l / max(torso_l, 0.001), 4),
        round(torso_l / body_span, 4),
        round(leg_l / body_span, 4),
        round(arm_l, 4),
        round(shoulder_w / body_span, 4),
        round(hip_w / body_span, 4),
    ]


POSE_FEATURE_DIM = 12
POSE_ZERO_FEATURES = [0.0] * POSE_FEATURE_DIM


def build_pose_features(
    rgb_images: list[Image.Image],
) -> tuple[list[list[float]], list[bool]]:
    try:
        from mediapipe.tasks.python import vision as mp_vision, BaseOptions as MpBaseOptions
    except ImportError:
        print("mediapipe not available, skipping pose features")
        return (
            [list(POSE_ZERO_FEATURES) for _ in rgb_images],
            [False] * len(rgb_images),
        )

    if not POSE_MODEL_PATH.exists():
        print(f"Pose model not found at {POSE_MODEL_PATH}, skipping pose features")
        return (
            [list(POSE_ZERO_FEATURES) for _ in rgb_images],
            [False] * len(rgb_images),
        )

    options = mp_vision.PoseLandmarkerOptions(
        base_options=MpBaseOptions(model_asset_path=str(POSE_MODEL_PATH)),
        running_mode=mp_vision.RunningMode.IMAGE,
        min_pose_detection_confidence=0.2,
    )
    landmarker = mp_vision.PoseLandmarker.create_from_options(options)
    features: list[list[float]] = []
    detected: list[bool] = []

    for rgb_image in rgb_images:
        pose_feats = extract_pose_features_from_image(rgb_image, landmarker)

        if pose_feats is not None:
            features.append(pose_feats)
            detected.append(True)
        else:
            features.append(list(POSE_ZERO_FEATURES))
            detected.append(False)

    landmarker.close()
    detected_count = sum(detected)
    print(f"Pose detection: {detected_count}/{len(rgb_images)} ({detected_count * 100 // len(rgb_images)}%)")

    return features, detected


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


@dataclass(frozen=True)
class Neighbor:
    distance: float
    name: str
    source_weight: float
    value: float | str


def js_round(value: float) -> int:
    return math.floor(value + 0.5)


def neighbor_vote_weight(neighbor: Neighbor) -> float:
    return neighbor.source_weight / ((neighbor.distance + 1e-6) ** 2)


def weighted_average(neighbors: list[Neighbor]) -> float:
    if not neighbors:
        return 0.0

    weights = [neighbor_vote_weight(neighbor) for neighbor in neighbors]
    weighted_sum = sum(
        weight * float(neighbor.value)
        for weight, neighbor in zip(weights, neighbors, strict=True)
    )
    total_weight = sum(weights)

    if total_weight <= 1e-12:
        return statistics.fmean(float(neighbor.value) for neighbor in neighbors)

    return weighted_sum / total_weight


def weighted_vote(neighbors: list[Neighbor]) -> str:
    scores = {cup: 0.0 for cup in CUP_ORDER}

    for neighbor in neighbors:
        scores[str(neighbor.value)] += neighbor_vote_weight(neighbor)

    return max(CUP_ORDER, key=lambda cup: (scores[cup], -abs(CUP_ORDER.index(cup) - 3)))


def get_neighbors(
    feature_sets: list[list[float]],
    values: list[float] | list[str],
    names: list[str],
    source_weights: list[float],
    target_index: int,
    neighbor_count: int,
    candidate_indices: list[int] | None = None,
) -> list[Neighbor]:
    allowed_indices = (
        candidate_indices
        if candidate_indices is not None
        else list(range(len(feature_sets)))
    )
    neighbors = [
        (
            euclidean_distance(feature_sets[target_index], feature_sets[index]),
            names[index],
            source_weights[index],
            values[index],
        )
        for index in allowed_indices
        if index != target_index and source_weights[index] > 0
    ]
    neighbors.sort(key=lambda item: (item[0], item[1]))

    return [
        Neighbor(
            distance=distance,
            name=name,
            source_weight=source_weight,
            value=value,
        )
        for distance, name, source_weight, value in neighbors[:neighbor_count]
    ]


def build_ranked_neighbors(
    named_feature_sets: dict[str, list[list[float]]],
    values: list[float] | list[str],
    names: list[str],
    feature_weight_sets: dict[str, list[float]],
    candidate_indices: list[int],
    feature_names: tuple[str, ...],
) -> dict[str, dict[int, list[Neighbor]]]:
    return {
        feature_name: {
            index: get_neighbors(
                named_feature_sets[feature_name],
                values,
                names,
                feature_weight_sets[feature_name],
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
    salt: str = "",
) -> tuple[list[int], list[int]]:
    grouped: dict[str, list[int]] = {}

    for index in indices:
        bucket = str(bucket_for_index(index))
        grouped.setdefault(bucket, []).append(index)

    train_indices: list[int] = []
    holdout_indices: list[int] = []

    for bucket_indices in grouped.values():
        ordered = sorted(
            bucket_indices,
            key=lambda index: stable_index_hash(
                profiles[index].name
                if not salt
                else f"{salt}:{profiles[index].name}"
            ),
        )
        holdout_count = (
            max(1, round(len(ordered) * ratio))
            if len(ordered) >= MIN_HOLDOUT_BUCKET_SIZE
            else 0
        )

        holdout_indices.extend(ordered[:holdout_count])
        train_indices.extend(ordered[holdout_count:])

    return sorted(train_indices), sorted(holdout_indices)


def build_stratified_holdout_splits(
    indices: list[int],
    bucket_for_index,
    profiles: list[Profile],
    split_count: int = GENERALIZATION_SPLIT_COUNT,
    ratio: float = HOLDOUT_RATIO,
) -> list[tuple[list[int], list[int]]]:
    return [
        build_stratified_holdout(
            indices,
            bucket_for_index,
            profiles,
            ratio=ratio,
            salt=f"split-{split_index}",
        )
        for split_index in range(split_count)
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
    ranked_neighbors: dict[str, dict[int, list[Neighbor]]],
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
    ranked_neighbors: dict[str, dict[int, list[Neighbor]]],
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


def summarize_distribution(values: list[float]) -> dict[str, float]:
    return {
        "mean": round(statistics.fmean(values), 6),
        "stddev": round(statistics.pstdev(values), 6),
    }


def build_multi_split_summary(
    split_metrics: list[dict[str, object]],
    within_rate_key: str,
) -> dict[str, object]:
    coverage_rates = [coverage["rate"] for coverage in split_metrics[0]["coverage"]]

    return {
        "method": f"{len(split_metrics)} deterministic stratified holdouts",
        "splitCount": len(split_metrics),
        "mae": summarize_distribution([float(metrics["mae"]) for metrics in split_metrics]),
        "exactRate": summarize_distribution(
            [float(metrics["exactRate"]) for metrics in split_metrics]
        ),
        within_rate_key: summarize_distribution(
            [float(metrics[within_rate_key]) for metrics in split_metrics]
        ),
        "coverage": [
            {
                "rate": rate,
                "meanMaxError": summarize_distribution(
                    [
                        float(metrics["coverage"][coverage_index]["maxError"])
                        for metrics in split_metrics
                    ]
                )["mean"],
                "stddevMaxError": summarize_distribution(
                    [
                        float(metrics["coverage"][coverage_index]["maxError"])
                        for metrics in split_metrics
                    ]
                )["stddev"],
            }
            for coverage_index, rate in enumerate(coverage_rates)
        ],
        "holdoutCount": summarize_distribution(
            [float(metrics["holdoutCount"]) for metrics in split_metrics]
        ),
        "trainingCount": summarize_distribution(
            [float(metrics["trainingCount"]) for metrics in split_metrics]
        ),
    }


def predict_height_for_index(
    named_feature_sets: dict[str, list[list[float]]],
    heights: list[float],
    names: list[str],
    feature_weight_sets: dict[str, list[float]],
    candidate_indices: list[int],
    index: int,
    models: tuple[tuple[str, int], ...],
) -> tuple[int, list[tuple[str, list[Neighbor]]]]:
    model_neighbors: list[tuple[str, list[Neighbor]]] = []
    predictions: list[float] = []

    for feature_name, neighbor_count in models:
        neighbors = get_neighbors(
            named_feature_sets[feature_name],
            heights,
            names,
            feature_weight_sets[feature_name],
            index,
            neighbor_count,
            candidate_indices,
        )
        model_neighbors.append((feature_name, neighbors))
        predictions.append(weighted_average(neighbors))

    return median_rounded(predictions), model_neighbors


def predict_cup_for_index(
    named_feature_sets: dict[str, list[list[float]]],
    cups: list[str],
    names: list[str],
    feature_weight_sets: dict[str, list[float]],
    candidate_indices: list[int],
    index: int,
    models: tuple[tuple[str, int], ...],
) -> tuple[str, list[tuple[str, list[Neighbor]]]]:
    model_neighbors: list[tuple[str, list[Neighbor]]] = []
    predictions: list[str] = []

    for feature_name, neighbor_count in models:
        neighbors = get_neighbors(
            named_feature_sets[feature_name],
            cups,
            names,
            feature_weight_sets[feature_name],
            index,
            neighbor_count,
            candidate_indices,
        )
        model_neighbors.append((feature_name, neighbors))
        predictions.append(weighted_vote(neighbors))

    return vote_cups(predictions), model_neighbors


def build_neighbor_preview(
    model_neighbors: list[tuple[str, list[Neighbor]]],
    profiles: list[Profile],
    names: list[str],
    heights: list[float],
    cups: list[str],
    limit: int = NEIGHBOR_PREVIEW_COUNT,
) -> list[dict[str, object]]:
    index_by_name = {name: index for index, name in enumerate(names)}
    preview_by_name: dict[str, dict[str, object]] = {}

    for feature_name, neighbors in model_neighbors:
        for neighbor in neighbors:
            neighbor_index = index_by_name[neighbor.name]
            candidate = {
                "name": neighbor.name,
                "source": profiles[neighbor_index].source,
                "distance": round(neighbor.distance, 6),
                "sourceWeight": round(neighbor.source_weight, 4),
                "featureSet": feature_name,
                "actualHeight": heights[neighbor_index],
                "cup": cups[neighbor_index],
            }
            existing = preview_by_name.get(neighbor.name)

            if existing is None or (
                candidate["distance"],
                candidate["featureSet"],
            ) < (
                existing["distance"],
                existing["featureSet"],
            ):
                preview_by_name[neighbor.name] = candidate

    ordered = sorted(
        preview_by_name.values(),
        key=lambda item: (item["distance"], item["featureSet"], item["name"]),
    )

    return ordered[:limit]


def count_zero_distance_neighbors(model_neighbors: list[tuple[str, list[Neighbor]]]) -> int:
    return sum(
        1
        for _, neighbors in model_neighbors
        for neighbor in neighbors
        if neighbor.distance <= 1e-9
    )


def build_height_worst_cases_on_split(
    named_feature_sets: dict[str, list[list[float]]],
    heights: list[float],
    cups: list[str],
    names: list[str],
    profiles: list[Profile],
    image_quality_metrics: list[dict[str, float]],
    feature_weight_sets: dict[str, list[float]],
    train_indices: list[int],
    evaluation_indices: list[int],
    models: tuple[tuple[str, int], ...],
    limit: int = WORST_CASE_LIMIT,
) -> list[dict[str, object]]:
    cases: list[dict[str, object]] = []

    for index in evaluation_indices:
        prediction, model_neighbors = predict_height_for_index(
            named_feature_sets,
            heights,
            names,
            feature_weight_sets,
            train_indices,
            index,
            models,
        )
        actual_height = heights[index]
        error = abs(prediction - actual_height)
        cases.append(
            {
                "name": names[index],
                "source": profiles[index].source,
                "actualHeight": actual_height,
                "predictedHeight": prediction,
                "error": error,
                "cup": cups[index],
                "quality": image_quality_metrics[index],
                "zeroDistanceNeighborCount": count_zero_distance_neighbors(model_neighbors),
                "neighbors": build_neighbor_preview(
                    model_neighbors,
                    profiles,
                    names,
                    heights,
                    cups,
                ),
            }
        )

    return sorted(cases, key=lambda item: (-item["error"], item["name"]))[:limit]


def build_cup_worst_cases_on_split(
    named_feature_sets: dict[str, list[list[float]]],
    heights: list[float],
    cups: list[str],
    names: list[str],
    profiles: list[Profile],
    image_quality_metrics: list[dict[str, float]],
    feature_weight_sets: dict[str, list[float]],
    train_indices: list[int],
    evaluation_indices: list[int],
    models: tuple[tuple[str, int], ...],
    limit: int = WORST_CASE_LIMIT,
) -> list[dict[str, object]]:
    cases: list[dict[str, object]] = []

    for index in evaluation_indices:
        prediction, model_neighbors = predict_cup_for_index(
            named_feature_sets,
            cups,
            names,
            feature_weight_sets,
            train_indices,
            index,
            models,
        )
        actual_cup = cups[index]
        error = abs(CUP_ORDER.index(prediction) - CUP_ORDER.index(actual_cup))
        cases.append(
            {
                "name": names[index],
                "source": profiles[index].source,
                "actualCup": actual_cup,
                "predictedCup": prediction,
                "error": error,
                "actualHeight": heights[index],
                "quality": image_quality_metrics[index],
                "zeroDistanceNeighborCount": count_zero_distance_neighbors(model_neighbors),
                "neighbors": build_neighbor_preview(
                    model_neighbors,
                    profiles,
                    names,
                    heights,
                    cups,
                ),
            }
        )

    return sorted(cases, key=lambda item: (-item["error"], item["name"]))[:limit]


def build_collision_diagnostics(
    named_feature_sets: dict[str, list[list[float]]],
    names: list[str],
    profiles: list[Profile],
    candidate_indices: list[int],
    feature_names: tuple[str, ...],
    target_label: str,
    target_values: list[float] | list[str],
    limit: int = WORST_CASE_LIMIT,
) -> dict[str, object]:
    groups: list[dict[str, object]] = []
    collision_group_count = 0
    colliding_entry_count = 0
    ambiguous_group_count = 0

    for feature_name in feature_names:
        groups_by_signature: dict[tuple[float, ...], list[int]] = {}

        for index in candidate_indices:
            signature = tuple(named_feature_sets[feature_name][index])
            groups_by_signature.setdefault(signature, []).append(index)

        for indices in groups_by_signature.values():
            if len(indices) < 2:
                continue

            collision_group_count += 1
            colliding_entry_count += len(indices)
            targets = sorted({str(target_values[index]) for index in indices})

            if len(targets) > 1:
                ambiguous_group_count += 1

            groups.append(
                {
                    "featureSet": feature_name,
                    "size": len(indices),
                    "targetCount": len(targets),
                    "targets": targets,
                    "entries": [
                        {
                            "name": names[index],
                            "source": profiles[index].source,
                            target_label: target_values[index],
                        }
                        for index in indices
                    ],
                }
            )

    groups.sort(
        key=lambda item: (
            -item["size"],
            -item["targetCount"],
            item["featureSet"],
            item["entries"][0]["name"],
        )
    )

    return {
        "featureSetCount": len(feature_names),
        "collisionGroupCount": collision_group_count,
        "collidingEntryCount": colliding_entry_count,
        "ambiguousGroupCount": ambiguous_group_count,
        "topGroups": groups[:limit],
    }


def build_feature_collision_group_sizes(
    named_feature_sets: dict[str, list[list[float]]],
    candidate_indices: list[int],
    feature_names: tuple[str, ...],
) -> dict[str, list[int]]:
    group_sizes_by_feature: dict[str, list[int]] = {
        feature_name: [1 for _ in range(len(next(iter(named_feature_sets.values()))))]
        for feature_name in feature_names
    }

    for feature_name in feature_names:
        groups_by_signature: dict[tuple[float, ...], list[int]] = {}

        for index in candidate_indices:
            signature = tuple(named_feature_sets[feature_name][index])
            groups_by_signature.setdefault(signature, []).append(index)

        for indices in groups_by_signature.values():
            group_size = len(indices)
            if group_size < 2:
                continue

            for index in indices:
                group_sizes_by_feature[feature_name][index] = group_size

    return group_sizes_by_feature


def build_feature_collision_penalties(
    named_feature_sets: dict[str, list[list[float]]],
    candidate_indices: list[int],
    feature_names: tuple[str, ...],
    collision_power: float,
) -> dict[str, list[float]]:
    group_sizes_by_feature = build_feature_collision_group_sizes(
        named_feature_sets,
        candidate_indices,
        feature_names,
    )
    penalties_by_feature: dict[str, list[float]] = {
        feature_name: [1.0 for _ in range(len(next(iter(named_feature_sets.values()))))]
        for feature_name in feature_names
    }

    if collision_power <= 0:
        return penalties_by_feature

    for feature_name in feature_names:
        for index, group_size in enumerate(group_sizes_by_feature[feature_name]):
            if group_size < 2:
                continue

            penalties_by_feature[feature_name][index] = round(
                group_size ** (-collision_power),
                6,
            )

    return penalties_by_feature


def build_feature_training_weights(
    profiles: list[Profile],
    named_feature_sets: dict[str, list[list[float]]],
    heights: list[float],
    cups: list[str],
    image_quality_metrics: list[dict[str, float]],
    profile_source_weights: list[TaskSourceWeights],
    weight_preset: SourceWeightPreset,
) -> dict[str, list[float]]:
    feature_weight_sets: dict[str, list[float]] = {}
    height_indices = [
        index for index, profile in enumerate(profiles) if profile.use_for_height
    ]
    cup_indices = [index for index, profile in enumerate(profiles) if profile.use_for_cup]
    similarity_indices = [
        index for index, profile in enumerate(profiles) if profile.use_for_similarity
    ]
    collision_penalties = {
        "height": build_feature_collision_penalties(
            named_feature_sets,
            height_indices,
            HEIGHT_FEATURE_CANDIDATES,
            weight_preset.collision_power if "height" in weight_preset.collision_groups else 0.0,
        ),
        "cup": build_feature_collision_penalties(
            named_feature_sets,
            cup_indices,
            CUP_FEATURE_CANDIDATES,
            weight_preset.collision_power if "cup" in weight_preset.collision_groups else 0.0,
        ),
        "similarity": build_feature_collision_penalties(
            named_feature_sets,
            similarity_indices,
            ("similarity",),
            weight_preset.collision_power if "similarity" in weight_preset.collision_groups else 0.0,
        ),
    }
    collision_group_sizes = {
        "height": build_feature_collision_group_sizes(
            named_feature_sets,
            height_indices,
            HEIGHT_FEATURE_CANDIDATES,
        ),
        "cup": build_feature_collision_group_sizes(
            named_feature_sets,
            cup_indices,
            CUP_FEATURE_CANDIDATES,
        ),
        "similarity": build_feature_collision_group_sizes(
            named_feature_sets,
            similarity_indices,
            ("similarity",),
        ),
    }

    for feature_name in FEATURE_SETS:
        group_name = feature_group_for_name(feature_name)
        feature_weight_sets[feature_name] = []

        for index, profile in enumerate(profiles):
            if group_name == "height" and not profile.use_for_height:
                feature_weight_sets[feature_name].append(0.0)
                continue

            if group_name == "cup" and not profile.use_for_cup:
                feature_weight_sets[feature_name].append(0.0)
                continue

            if group_name == "similarity" and not profile.use_for_similarity:
                feature_weight_sets[feature_name].append(0.0)
                continue

            base_source_weights = profile_source_weights[index]
            base_weight = getattr(base_source_weights, group_name)
            quality_signal = compute_quality_signal(image_quality_metrics[index])
            quality_factor = (
                compute_quality_factor(
                    image_quality_metrics[index],
                    weight_preset,
                )
                if group_name in weight_preset.quality_groups
                else 1.0
            )
            collision_factor = collision_penalties[group_name][feature_name][index]
            collision_group_size = collision_group_sizes[group_name][feature_name][index]

            if (
                group_name in weight_preset.gate_groups
                and
                weight_preset.quality_gate_threshold > 0
                and weight_preset.collision_gate_min_size > 0
                and quality_signal < weight_preset.quality_gate_threshold
                and collision_group_size >= weight_preset.collision_gate_min_size
            ):
                feature_weight_sets[feature_name].append(0.0)
                continue

            feature_weight_sets[feature_name].append(
                round(base_weight * quality_factor * collision_factor, 6)
            )

    return feature_weight_sets


def evaluate_height_models_on_split(
    named_feature_sets: dict[str, list[list[float]]],
    heights: list[float],
    names: list[str],
    feature_weight_sets: dict[str, list[float]],
    train_indices: list[int],
    evaluation_indices: list[int],
    models: tuple[tuple[str, int], ...],
) -> dict[str, float]:
    errors: list[float] = []

    for index in evaluation_indices:
        prediction, _ = predict_height_for_index(
            named_feature_sets,
            heights,
            names,
            feature_weight_sets,
            train_indices,
            index,
            models,
        )
        errors.append(abs(prediction - heights[index]))

    return summarize_height_errors(errors, len(train_indices))


def evaluate_cup_models_on_split(
    named_feature_sets: dict[str, list[list[float]]],
    cups: list[str],
    names: list[str],
    feature_weight_sets: dict[str, list[float]],
    train_indices: list[int],
    evaluation_indices: list[int],
    models: tuple[tuple[str, int], ...],
) -> dict[str, float]:
    errors: list[int] = []

    for index in evaluation_indices:
        prediction, _ = predict_cup_for_index(
            named_feature_sets,
            cups,
            names,
            feature_weight_sets,
            train_indices,
            index,
            models,
        )
        errors.append(abs(CUP_ORDER.index(prediction) - CUP_ORDER.index(cups[index])))

    return summarize_cup_errors(errors, len(train_indices))


def select_height_models(
    named_feature_sets: dict[str, list[list[float]]],
    heights: list[float],
    names: list[str],
    feature_weight_sets: dict[str, list[float]],
    height_indices: list[int],
) -> tuple[tuple[tuple[str, int], ...], dict[str, float]]:
    ranked_neighbors = build_ranked_neighbors(
        named_feature_sets,
        heights,
        names,
        feature_weight_sets,
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
    feature_weight_sets: dict[str, list[float]],
    cup_indices: list[int],
) -> tuple[tuple[tuple[str, int], ...], dict[str, float]]:
    ranked_neighbors = build_ranked_neighbors(
        named_feature_sets,
        cups,
        names,
        feature_weight_sets,
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
    feature_weight_sets: dict[str, list[float]],
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
            feature_weight_sets,
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
            feature_weight_sets,
            train_indices,
            holdout_indices,
            models,
        ),
    }
    split_metrics = [
        {
            "holdoutCount": len(split_holdout_indices),
            **evaluate_height_models_on_split(
                named_feature_sets,
                heights,
                names,
                feature_weight_sets,
                split_train_indices,
                split_holdout_indices,
                models,
            ),
        }
        for split_train_indices, split_holdout_indices in build_stratified_holdout_splits(
            height_indices,
            lambda index: round(heights[index] / 5) * 5,
            profiles,
        )
    ]
    holdout_metrics["stability"] = build_multi_split_summary(
        split_metrics,
        "within2Rate",
    )

    return models, loocv_metrics, holdout_metrics


def select_cup_models_for_generalization(
    named_feature_sets: dict[str, list[list[float]]],
    cups: list[str],
    names: list[str],
    profiles: list[Profile],
    feature_weight_sets: dict[str, list[float]],
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
            feature_weight_sets,
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
            feature_weight_sets,
            train_indices,
            holdout_indices,
            models,
        ),
    }
    split_metrics = [
        {
            "holdoutCount": len(split_holdout_indices),
            **evaluate_cup_models_on_split(
                named_feature_sets,
                cups,
                names,
                feature_weight_sets,
                split_train_indices,
                split_holdout_indices,
                models,
            ),
        }
        for split_train_indices, split_holdout_indices in build_stratified_holdout_splits(
            cup_indices,
            lambda index: cups[index],
            profiles,
        )
    ]
    holdout_metrics["stability"] = build_multi_split_summary(
        split_metrics,
        "within1Rate",
    )

    return models, loocv_metrics, holdout_metrics


def describe_variant_keys(variant_keys: tuple[str, ...]) -> str:
    labels = [IMAGE_VARIANTS[variant_key].description for variant_key in variant_keys]

    if len(labels) == 1:
        return labels[0]

    return " + ".join(labels) + " averaged"


def describe_task_weighting(
    source_weight_preset: SourceWeightPreset,
    group_name: str,
) -> str:
    if (
        not source_weight_preset.family_weights
        and (
            group_name not in source_weight_preset.quality_groups
            or source_weight_preset.quality_strength <= 0
        )
        and (
            group_name not in source_weight_preset.collision_groups
            or source_weight_preset.collision_power <= 0
        )
        and (
            group_name not in source_weight_preset.gate_groups
            or source_weight_preset.quality_gate_threshold <= 0
            or source_weight_preset.collision_gate_min_size <= 0
        )
    ):
        return "uniform source weighting"

    return source_weight_preset.description.lower()


def build_strategy_label(
    prefix: str,
    variant_keys: tuple[str, ...],
    source_weight_preset: SourceWeightPreset,
    group_name: str,
) -> str:
    return (
        f"{describe_variant_keys(variant_keys)} / "
        f"{describe_task_weighting(source_weight_preset, group_name)} / "
        f"{prefix}"
    )


def build_similarity_label(
    variant_keys: tuple[str, ...],
    source_weight_preset: SourceWeightPreset,
) -> str:
    return (
        f"{describe_variant_keys(variant_keys)} / "
        f"{describe_task_weighting(source_weight_preset, 'similarity')} / "
        "full grayscale 8x8 + top grayscale 8x8"
    )


def prepare_model_inputs(
    preset: PreprocessingPreset,
    source_weight_preset: SourceWeightPreset,
) -> dict[str, object]:
    profiles = load_profiles()
    rgb_images = [
        Image.open(resolve_image_path(profile.image)).convert("RGB") for profile in profiles
    ]
    gray_images = [img.convert("L") for img in rgb_images]
    raw_feature_sets = build_feature_sets(gray_images, preset)
    pose_features, pose_detected = build_pose_features(rgb_images)
    raw_feature_sets["heightPose"] = pose_features
    normalization_stats = compute_normalization_stats(raw_feature_sets)
    feature_sets = normalize_feature_sets(raw_feature_sets, normalization_stats)
    profile_source_weights = [
        get_profile_source_weights(profile, source_weight_preset)
        for profile in profiles
    ]
    image_quality_metrics = [
        build_image_quality_metrics(image)
        for image in gray_images
    ]
    heights = [profile.actual_height for profile in profiles]
    cups = [profile.cup for profile in profiles]
    names = [profile.name for profile in profiles]
    feature_weight_sets = build_feature_training_weights(
        profiles,
        feature_sets,
        heights,
        cups,
        image_quality_metrics,
        profile_source_weights,
        source_weight_preset,
    )

    # Zero out pose weights for entries without detected pose
    for index, detected in enumerate(pose_detected):
        if not detected:
            feature_weight_sets["heightPose"][index] = 0.0

    return {
        "profiles": profiles,
        "feature_sets": feature_sets,
        "normalization_stats": normalization_stats,
        "profile_source_weights": profile_source_weights,
        "image_quality_metrics": image_quality_metrics,
        "heights": heights,
        "cups": cups,
        "names": names,
        "feature_weight_sets": feature_weight_sets,
    }


def build_model(
    preset: PreprocessingPreset = DEFAULT_PREPROCESSING_PRESET,
    source_weight_preset: SourceWeightPreset = DEFAULT_SOURCE_WEIGHT_PRESET,
) -> dict[str, object]:
    model_inputs = prepare_model_inputs(preset, source_weight_preset)
    profiles = model_inputs["profiles"]
    feature_sets = model_inputs["feature_sets"]
    normalization_stats = model_inputs["normalization_stats"]
    feature_weight_sets = model_inputs["feature_weight_sets"]
    profile_source_weights = model_inputs["profile_source_weights"]
    heights = model_inputs["heights"]
    cups = model_inputs["cups"]
    names = model_inputs["names"]
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
        feature_weight_sets,
        height_indices,
    )
    _, cup_metrics, cup_generalization = select_cup_models_for_generalization(
        feature_sets,
        cups,
        names,
        profiles,
        feature_weight_sets,
        cup_indices,
    )

    active_indices = [
        index
        for index in range(len(profiles))
        if max(
            feature_weight_sets[feature_name][index]
            for feature_name in FEATURE_SETS
        ) > 0.001
    ]

    return {
        "version": 2,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "normalization": normalization_stats,
        "metrics": {
            "trainingCount": len(active_indices),
            "height": {
                "strategy": build_strategy_label(
                    "robust edge-enhanced kNN regressors",
                    preset.height_variants,
                    source_weight_preset,
                    "height",
                ),
                **height_metrics,
                "generalization": height_generalization,
            },
            "cup": {
                "strategy": build_strategy_label(
                    "robust edge-enhanced kNN classifiers",
                    preset.cup_variants,
                    source_weight_preset,
                    "cup",
                ),
                **cup_metrics,
                "generalization": cup_generalization,
            },
            "similarity": {
                "feature": build_similarity_label(
                    preset.similarity_variants,
                    source_weight_preset,
                ),
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
                "sourceWeights": {
                    "height": profile_source_weights[index].height,
                    "cup": profile_source_weights[index].cup,
                    "similarity": profile_source_weights[index].similarity,
                },
                "featureWeights": {
                    feature_name: feature_weight_sets[feature_name][index]
                    for feature_name in FEATURE_SETS
                },
            }
            for index, profile in enumerate(profiles)
            if max(
                feature_weight_sets[feature_name][index]
                for feature_name in FEATURE_SETS
            ) > 0.001
        ],
    }


def build_experiment_diagnostics(
    preset: PreprocessingPreset = DEFAULT_PREPROCESSING_PRESET,
    source_weight_preset: SourceWeightPreset = DEFAULT_SOURCE_WEIGHT_PRESET,
) -> dict[str, object]:
    model_inputs = prepare_model_inputs(preset, source_weight_preset)
    profiles = model_inputs["profiles"]
    feature_sets = model_inputs["feature_sets"]
    image_quality_metrics = model_inputs["image_quality_metrics"]
    heights = model_inputs["heights"]
    cups = model_inputs["cups"]
    names = model_inputs["names"]
    feature_weight_sets = model_inputs["feature_weight_sets"]
    height_indices = [
        index for index, profile in enumerate(profiles) if profile.use_for_height
    ]
    cup_indices = [index for index, profile in enumerate(profiles) if profile.use_for_cup]
    height_train_indices, height_holdout_indices = build_stratified_holdout(
        height_indices,
        lambda index: round(heights[index] / 5) * 5,
        profiles,
    )
    cup_train_indices, cup_holdout_indices = build_stratified_holdout(
        cup_indices,
        lambda index: cups[index],
        profiles,
    )

    return {
        "height": {
            "holdoutCount": len(height_holdout_indices),
            "worstCases": build_height_worst_cases_on_split(
                feature_sets,
                heights,
                cups,
                names,
                profiles,
                image_quality_metrics,
                feature_weight_sets,
                height_train_indices,
                height_holdout_indices,
                ROBUST_HEIGHT_MODELS,
            ),
            "collisions": build_collision_diagnostics(
                feature_sets,
                names,
                profiles,
                height_indices,
                tuple(feature_name for feature_name, _ in ROBUST_HEIGHT_MODELS),
                "actualHeight",
                heights,
            ),
        },
        "cup": {
            "holdoutCount": len(cup_holdout_indices),
            "worstCases": build_cup_worst_cases_on_split(
                feature_sets,
                heights,
                cups,
                names,
                profiles,
                image_quality_metrics,
                feature_weight_sets,
                cup_train_indices,
                cup_holdout_indices,
                ROBUST_CUP_MODELS,
            ),
            "collisions": build_collision_diagnostics(
                feature_sets,
                names,
                profiles,
                cup_indices,
                tuple(feature_name for feature_name, _ in ROBUST_CUP_MODELS),
                "actualCup",
                cups,
            ),
        },
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--preset",
        choices=sorted(PREPROCESSING_PRESETS.keys()),
        default=DEFAULT_PREPROCESSING_PRESET.key,
        help="Preprocessing preset to use when generating the diagnosis model",
    )
    parser.add_argument(
        "--source-weighting",
        choices=sorted(SOURCE_WEIGHT_PRESETS.keys()),
        default=DEFAULT_SOURCE_WEIGHT_PRESET.key,
        help="Source weighting preset to use when generating the diagnosis model",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    preset = PREPROCESSING_PRESETS[args.preset]
    source_weight_preset = SOURCE_WEIGHT_PRESETS[args.source_weighting]
    model = build_model(preset, source_weight_preset)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(model, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        f"Wrote {OUTPUT_PATH} with {model['metrics']['trainingCount']} training images "
        f"using preset '{preset.key}' and source weighting '{source_weight_preset.key}'",
    )


if __name__ == "__main__":
    main()
