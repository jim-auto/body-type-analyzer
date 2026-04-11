from __future__ import annotations

import importlib.util
import sys
from datetime import datetime, timezone
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
GENERATOR_PATH = REPO_ROOT / "scripts" / "generate-diagnosis-model.py"
REPORT_PATH = REPO_ROOT / "docs" / "diagnosis-experiments.md"


def load_generator_module():
    spec = importlib.util.spec_from_file_location("diagnosis_model_generator", GENERATOR_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Failed to load generator module from {GENERATOR_PATH}")

    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def format_rate(rate: float) -> str:
    return f"{rate * 100:.1f}%"


def format_number(value: float) -> str:
    return f"{value:.3f}".rstrip("0").rstrip(".")


def weight_complexity(weight_key: str) -> int:
    if weight_key == "uniform":
        return 0

    if weight_key == "trusted-soft":
        return 1

    return 2


def config_key(row: dict[str, object]) -> tuple[str, str]:
    return (str(row["preprocessing"]), str(row["source_weighting"]))


def config_label(row: dict[str, object]) -> str:
    return f"`{row['preprocessing']}` + `{row['source_weighting']}`"


def select_best_height_row(rows: list[dict[str, object]]) -> dict[str, object]:
    return min(
        rows,
        key=lambda row: (
            row["height_mae"],
            -row["height_within2"],
            row["height_cov80"],
            row["variant_count"],
            row["weight_complexity"],
            row["preprocessing"],
            row["source_weighting"],
        ),
    )


def select_best_cup_row(rows: list[dict[str, object]]) -> dict[str, object]:
    return min(
        rows,
        key=lambda row: (
            row["cup_mae"],
            -row["cup_within1"],
            row["cup_cov80"],
            row["variant_count"],
            row["weight_complexity"],
            row["preprocessing"],
            row["source_weighting"],
        ),
    )


def render_neighbor_summary(neighbors: list[dict[str, object]]) -> str:
    return ", ".join(
        (
            f"{neighbor['name']} ({neighbor['source']}, "
            f"d={format_number(float(neighbor['distance']))}, "
            f"h={format_number(float(neighbor['actualHeight']))}cm, "
            f"cup={neighbor['cup']})"
        )
        for neighbor in neighbors
    )


def render_quality_summary(quality: dict[str, object]) -> str:
    return (
        f"brightness={format_number(float(quality['brightnessMean']))}, "
        f"contrast={format_number(float(quality['contrastStddev']))}, "
        f"edgeMean={format_number(float(quality['edgeMean']))}, "
        f"edgeP90={format_number(float(quality['edgeP90']))}, "
        f"entropy={format_number(float(quality['entropy']))}, "
        f"aspect={format_number(float(quality['aspectRatio']))}"
    )


def render_height_cases(cases: list[dict[str, object]]) -> list[str]:
    lines: list[str] = []

    for case in cases:
        lines.append(
            "- "
            f"`{case['name']}` ({case['source']}): "
            f"`{format_number(float(case['actualHeight']))}cm -> "
            f"{format_number(float(case['predictedHeight']))}cm`, "
            f"error `{format_number(float(case['error']))}cm`, "
            f"cup `{case['cup']}`, "
            f"zero-distance neighbors `{case['zeroDistanceNeighborCount']}`"
        )
        lines.append(f"  quality: {render_quality_summary(case['quality'])}")
        lines.append(f"  neighbors: {render_neighbor_summary(case['neighbors'])}")

    return lines


def render_cup_cases(cases: list[dict[str, object]]) -> list[str]:
    lines: list[str] = []

    for case in cases:
        lines.append(
            "- "
            f"`{case['name']}` ({case['source']}): "
            f"`{case['actualCup']} -> {case['predictedCup']}`, "
            f"error `{format_number(float(case['error']))} cups`, "
            f"height `{format_number(float(case['actualHeight']))}cm`, "
            f"zero-distance neighbors `{case['zeroDistanceNeighborCount']}`"
        )
        lines.append(f"  quality: {render_quality_summary(case['quality'])}")
        lines.append(f"  neighbors: {render_neighbor_summary(case['neighbors'])}")

    return lines


def render_collision_groups(groups: list[dict[str, object]]) -> list[str]:
    lines: list[str] = []

    for group in groups:
        target_preview = ", ".join(str(target) for target in group["targets"])
        member_preview = ", ".join(
            f"{entry['name']} ({entry['source']})" for entry in group["entries"][:4]
        )
        lines.append(
            "- "
            f"`{group['featureSet']}` size `{group['size']}`, "
            f"distinct targets `{group['targetCount']}` [{target_preview}]"
        )
        lines.append(f"  entries: {member_preview}")

    return lines


def render_collision_section(
    label: str,
    collisions: dict[str, object],
) -> list[str]:
    lines = [
        (
            f"- {label}: collision groups `{collisions['collisionGroupCount']}`, "
            f"colliding entries `{collisions['collidingEntryCount']}`, "
            f"ambiguous groups `{collisions['ambiguousGroupCount']}`"
        )
    ]

    top_groups = collisions["topGroups"]
    if top_groups:
        lines.extend(render_collision_groups(top_groups))
    else:
        lines.append("- no exact-feature collisions found")

    return lines


def render_markdown(
    rows: list[dict[str, object]],
    default_preset_key: str,
    default_source_weighting_key: str,
    best_height: dict[str, object],
    best_cup: dict[str, object],
    diagnostics_by_config: dict[tuple[str, str], dict[str, object]],
) -> str:
    generated_at = datetime.now(timezone.utc).isoformat()
    best_height_diagnostics = diagnostics_by_config[config_key(best_height)]["height"]
    best_cup_diagnostics = diagnostics_by_config[config_key(best_cup)]["cup"]
    lines = [
        "# Diagnosis Experiments",
        "",
        f"Generated at: `{generated_at}`",
        "",
        "This report compares preprocessing presets and weight presets on the fixed holdout.",
        "It also includes 3-split stability, worst cases, and exact-feature collision snapshots.",
        "",
        f"- Default preset: `{default_preset_key}`",
        f"- Default weight preset: `{default_source_weighting_key}`",
        (
            f"- Best height holdout MAE: {config_label(best_height)} "
            f"({format_number(float(best_height['height_mae']))}cm)"
        ),
        (
            f"- Best cup holdout MAE: {config_label(best_cup)} "
            f"({format_number(float(best_cup['cup_mae']))} cups)"
        ),
        "",
        "## Holdout Summary",
        "",
        "| Preprocessing | Source Weighting | Description | Height MAE | Height +/-2 | Height 80% | Cup MAE | Cup +/-1 | Cup 80% |",
        "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]

    for row in rows:
        lines.append(
            "| "
            + " | ".join(
                [
                    f"`{row['preprocessing']}`",
                    f"`{row['source_weighting']}`",
                    str(row["description"]),
                    f"`{format_number(float(row['height_mae']))}cm`",
                    f"`{format_rate(float(row['height_within2']))}`",
                    f"`+/-{format_number(float(row['height_cov80']))}cm`",
                    f"`{format_number(float(row['cup_mae']))}`",
                    f"`{format_rate(float(row['cup_within1']))}`",
                    f"`+/-{format_number(float(row['cup_cov80']))}`",
                ]
            )
            + " |"
        )

    lines.extend(
        [
            "",
            "## Stability Snapshot",
            "",
            (
                f"- Height best {config_label(best_height)}: "
                f"fixed holdout `{format_number(float(best_height['height_mae']))}cm`, "
                f"3-split mean `{format_number(float(best_height['height_stability_mae_mean']))}cm`, "
                f"stddev `{format_number(float(best_height['height_stability_mae_stddev']))}cm`, "
                f"within +/-2 `{format_rate(float(best_height['height_stability_within_mean']))}`"
            ),
            (
                f"- Cup best {config_label(best_cup)}: "
                f"fixed holdout `{format_number(float(best_cup['cup_mae']))} cups`, "
                f"3-split mean `{format_number(float(best_cup['cup_stability_mae_mean']))} cups`, "
                f"stddev `{format_number(float(best_cup['cup_stability_mae_stddev']))}`, "
                f"within +/-1 `{format_rate(float(best_cup['cup_stability_within_mean']))}`"
            ),
            "",
            "## Collision Snapshot",
            "",
            *render_collision_section(
                f"Height best {config_label(best_height)}",
                best_height_diagnostics["collisions"],
            ),
            *render_collision_section(
                f"Cup best {config_label(best_cup)}",
                best_cup_diagnostics["collisions"],
            ),
            "",
            "## Height Worst Cases",
            "",
            f"Config: {config_label(best_height)} / holdout `{best_height_diagnostics['holdoutCount']}` cases",
            "",
            *render_height_cases(best_height_diagnostics["worstCases"]),
            "",
            "## Cup Worst Cases",
            "",
            f"Config: {config_label(best_cup)} / holdout `{best_cup_diagnostics['holdoutCount']}` cases",
            "",
            *render_cup_cases(best_cup_diagnostics["worstCases"]),
            "",
            "## Notes",
            "",
            f"- Height holdout winner: {config_label(best_height)}.",
            f"- Cup holdout winner: {config_label(best_cup)}.",
            "- If source weighting moves very little, preprocessing or feature design is still the dominant lever.",
            "- If worst cases repeatedly show zero-distance neighbors, feature collisions are a stronger priority than more tuning.",
            "- If worst cases repeatedly show low contrast or low edge scores, an input-quality gate is worth testing next.",
            "",
        ]
    )

    return "\n".join(lines)


def main() -> None:
    generator = load_generator_module()
    rows: list[dict[str, object]] = []

    for preset_key, preset in generator.PREPROCESSING_PRESETS.items():
        for source_weighting_key, source_weighting in generator.SOURCE_WEIGHT_PRESETS.items():
            model = generator.build_model(preset, source_weighting)
            height_holdout = model["metrics"]["height"]["generalization"]
            cup_holdout = model["metrics"]["cup"]["generalization"]
            height_stability = height_holdout["stability"]
            cup_stability = cup_holdout["stability"]
            rows.append(
                {
                    "preprocessing": preset_key,
                    "source_weighting": source_weighting_key,
                    "description": f"{preset.description}; {source_weighting.description}",
                    "height_mae": height_holdout["mae"],
                    "height_within2": height_holdout["within2Rate"],
                    "height_cov80": height_holdout["coverage"][1]["maxError"],
                    "cup_mae": cup_holdout["mae"],
                    "cup_within1": cup_holdout["within1Rate"],
                    "cup_cov80": cup_holdout["coverage"][1]["maxError"],
                    "height_stability_mae_mean": height_stability["mae"]["mean"],
                    "height_stability_mae_stddev": height_stability["mae"]["stddev"],
                    "height_stability_within_mean": height_stability["within2Rate"]["mean"],
                    "cup_stability_mae_mean": cup_stability["mae"]["mean"],
                    "cup_stability_mae_stddev": cup_stability["mae"]["stddev"],
                    "cup_stability_within_mean": cup_stability["within1Rate"]["mean"],
                    "variant_count": (
                        len(preset.height_variants)
                        + len(preset.cup_variants)
                        + len(preset.similarity_variants)
                    ),
                    "weight_complexity": weight_complexity(source_weighting_key),
                }
            )

    rows.sort(
        key=lambda row: (
            row["height_mae"],
            row["cup_mae"],
            row["variant_count"],
            row["weight_complexity"],
            row["preprocessing"],
            row["source_weighting"],
        )
    )
    best_height = select_best_height_row(rows)
    best_cup = select_best_cup_row(rows)
    diagnostics_by_config: dict[tuple[str, str], dict[str, object]] = {}

    for row in [best_height, best_cup]:
        key = config_key(row)
        if key in diagnostics_by_config:
            continue

        diagnostics_by_config[key] = generator.build_experiment_diagnostics(
            generator.PREPROCESSING_PRESETS[key[0]],
            generator.SOURCE_WEIGHT_PRESETS[key[1]],
        )

    markdown = render_markdown(
        rows,
        generator.DEFAULT_PREPROCESSING_PRESET.key,
        generator.DEFAULT_SOURCE_WEIGHT_PRESET.key,
        best_height,
        best_cup,
        diagnostics_by_config,
    )
    REPORT_PATH.write_text(markdown, encoding="utf-8")

    print(f"Wrote {REPORT_PATH}")
    print()
    print(markdown)


if __name__ == "__main__":
    main()
