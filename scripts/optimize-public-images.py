from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageOps

REPO_ROOT = Path(__file__).resolve().parent.parent
IMAGES_DIR = REPO_ROOT / "public" / "images"
REFERENCE_DIRECTORIES = (
    REPO_ROOT / "app",
    REPO_ROOT / "components",
    REPO_ROOT / "lib",
    REPO_ROOT / "public" / "data",
    REPO_ROOT / "scripts",
)
REFERENCE_FILES = (REPO_ROOT / "package.json",)
SKIP_REFERENCE_FILES = {
    REPO_ROOT / "public" / "data" / "diagnosis-model.json",
}
TEXT_EXTENSIONS = {".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".md", ".py"}
@dataclass(frozen=True)
class ConversionResult:
    source_path: Path
    output_path: Path
    source_bytes: int
    output_bytes: int


def iter_reference_files() -> list[Path]:
    files: list[Path] = []

    for directory in REFERENCE_DIRECTORIES:
        if not directory.exists():
            continue

        for path in directory.rglob("*"):
            if not path.is_file():
                continue
            if path in SKIP_REFERENCE_FILES:
                continue
            if path.suffix.lower() not in TEXT_EXTENSIONS:
                continue
            files.append(path)

    files.extend(path for path in REFERENCE_FILES if path.exists())
    return sorted(set(files))


def build_output_path(source_path: Path) -> Path:
    return source_path.with_suffix(".webp")


def normalize_image(image: Image.Image) -> Image.Image:
    image = ImageOps.exif_transpose(image)
    if image.mode in ("RGBA", "LA"):
        return image.convert("RGBA")
    if image.mode != "RGB":
        return image.convert("RGB")
    return image


def resize_image(image: Image.Image, max_edge: int) -> Image.Image:
    width, height = image.size
    longest_edge = max(width, height)

    if longest_edge <= max_edge:
        return image

    resampling = getattr(Image, "Resampling", Image)
    scale = max_edge / longest_edge
    return image.resize(
        (max(1, round(width * scale)), max(1, round(height * scale))),
        resampling.LANCZOS,
    )


def convert_image(source_path: Path, max_edge: int, quality: int) -> ConversionResult:
    output_path = build_output_path(source_path)
    temp_output_path = output_path.with_suffix(".tmp.webp")
    source_bytes = source_path.stat().st_size

    with Image.open(source_path) as image:
        normalized = normalize_image(image)
        normalized = resize_image(normalized, max_edge)
        normalized.save(temp_output_path, format="WEBP", quality=quality, method=6)

    temp_output_path.replace(output_path)

    return ConversionResult(
        source_path=source_path,
        output_path=output_path,
        source_bytes=source_bytes,
        output_bytes=output_path.stat().st_size,
    )


def replace_image_paths(path: Path, replacements: dict[str, str]) -> bool:
    text = path.read_text(encoding="utf-8")
    updated = text

    for old_path, new_path in replacements.items():
        if old_path in updated:
            updated = updated.replace(old_path, new_path)

    if updated == text:
        return False

    path.write_text(updated, encoding="utf-8")
    return True


def find_remaining_local_jpg_refs(
    reference_files: list[Path], replacements: dict[str, str]
) -> dict[Path, list[str]]:
    remaining: dict[Path, list[str]] = {}

    for path in reference_files:
        text = path.read_text(encoding="utf-8")
        matches = [old_path for old_path in replacements if old_path in text]
        if matches:
            remaining[path] = sorted(set(matches))

    return remaining


def delete_sources(conversions: list[ConversionResult]) -> None:
    for conversion in conversions:
        conversion.source_path.unlink()


def format_bytes(value: int) -> str:
    return f"{value / (1024 * 1024):.2f} MB"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Convert public profile images to WebP and rewrite local references."
    )
    parser.add_argument("--max-edge", type=int, default=960)
    parser.add_argument("--quality", type=int, default=82)
    args = parser.parse_args()

    source_images = sorted(IMAGES_DIR.glob("*.jpg")) + sorted(IMAGES_DIR.glob("*.jpeg"))

    if not source_images:
        print("No JPEG images found in public/images.")
        return 0

    conversions = [
        convert_image(source_path, max_edge=args.max_edge, quality=args.quality)
        for source_path in source_images
    ]
    replacements = {
        f"/images/{conversion.source_path.name}": f"/images/{conversion.output_path.name}"
        for conversion in conversions
    }

    reference_files = iter_reference_files()
    updated_files = [
        path for path in reference_files if replace_image_paths(path, replacements)
    ]
    remaining = find_remaining_local_jpg_refs(reference_files, replacements)

    if remaining:
        print("Found remaining local JPEG references:")
        for path, matches in remaining.items():
            print(f"- {path.relative_to(REPO_ROOT)}")
            for match in matches:
                print(f"  {match}")
        return 1

    delete_sources(conversions)

    total_before = sum(conversion.source_bytes for conversion in conversions)
    total_after = sum(conversion.output_bytes for conversion in conversions)

    print(
        "\n".join(
            [
                f"Converted: {len(conversions)} images",
                f"Updated refs: {len(updated_files)} files",
                f"Before: {format_bytes(total_before)}",
                f"After: {format_bytes(total_after)}",
                f"Saved: {format_bytes(total_before - total_after)}",
            ]
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
