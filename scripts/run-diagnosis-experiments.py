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


def render_markdown(rows: list[dict[str, object]], default_preset_key: str) -> str:
    generated_at = datetime.now(timezone.utc).isoformat()
    best_height = min(rows, key=lambda row: (row["height_mae"], -row["height_within2"], row["height_cov80"]))
    best_cup = min(rows, key=lambda row: (row["cup_mae"], -row["cup_within1"], row["cup_cov80"]))
    lines = [
        "# Diagnosis Experiments",
        "",
        f"Generated at: `{generated_at}`",
        "",
        "固定 holdout を基準に、前処理 preset を横並び比較したメモです。",
        "",
        f"- Default preset: `{default_preset_key}`",
        f"- Best height holdout MAE: `{best_height['preset']}` ({format_number(best_height['height_mae'])}cm)",
        f"- Best cup holdout MAE: `{best_cup['preset']}` ({format_number(best_cup['cup_mae'])}カップ)",
        "",
        "## Holdout Summary",
        "",
        "| Preset | Description | Height MAE | Height ±2 | Height 80% | Cup MAE | Cup ±1 | Cup 80% |",
        "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]

    for row in rows:
        lines.append(
            "| "
            + " | ".join(
                [
                    f"`{row['preset']}`",
                    str(row["description"]),
                    f"`{format_number(row['height_mae'])}cm`",
                    f"`{format_rate(row['height_within2'])}`",
                    f"`±{format_number(row['height_cov80'])}cm`",
                    f"`{format_number(row['cup_mae'])}`",
                    f"`{format_rate(row['cup_within1'])}`",
                    f"`±{format_number(row['cup_cov80'])}`",
                ]
            )
            + " |"
        )

    lines.extend(
        [
            "",
            "## Notes",
            "",
            f"- `{best_height['preset']}` が身長 holdout では最良でした。",
            f"- `{best_cup['preset']}` がカップ holdout では最良でした。",
            "- `focused-shared` は一括前処理としては扱いやすいが、身長とカップで最適がずれる可能性があります。",
            "- 次は source 重み付けか multi-crop をこの表に追加すると比較しやすいです。",
            "",
        ]
    )

    return "\n".join(lines)


def main() -> None:
    generator = load_generator_module()
    rows: list[dict[str, object]] = []

    for preset_key, preset in generator.PREPROCESSING_PRESETS.items():
        model = generator.build_model(preset)
        height_holdout = model["metrics"]["height"]["generalization"]
        cup_holdout = model["metrics"]["cup"]["generalization"]
        rows.append(
            {
                "preset": preset_key,
                "description": preset.description,
                "height_mae": height_holdout["mae"],
                "height_within2": height_holdout["within2Rate"],
                "height_cov80": height_holdout["coverage"][1]["maxError"],
                "cup_mae": cup_holdout["mae"],
                "cup_within1": cup_holdout["within1Rate"],
                "cup_cov80": cup_holdout["coverage"][1]["maxError"],
            }
        )

    rows.sort(key=lambda row: (row["height_mae"], row["cup_mae"], row["preset"]))
    markdown = render_markdown(rows, generator.DEFAULT_PREPROCESSING_PRESET.key)
    REPORT_PATH.write_text(markdown, encoding="utf-8")

    print(f"Wrote {REPORT_PATH}")
    print()
    print(markdown)


if __name__ == "__main__":
    main()
