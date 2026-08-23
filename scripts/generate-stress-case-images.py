"""Generate stress-case images for the cup visualization QA harness.

The base harness sample set (scripts/verify-cup-visualization.mjs) is all
standard publicity portraits. This script derives harder inputs from existing
public/images files so the harness can be exercised against:

- multi-person compositions (two portraits side by side)
- very low resolution thumbnails
- busy / cluttered backgrounds
- face-only crops (known trigger for the upper-body-missing warning)
- tilted and off-center compositions

Outputs are written to local-data/cup-visualization-qa/stress/ as
stress_<category>_<nn>.jpg. That directory is gitignored. The QA harness
discovers stress_*.jpg|png|webp files there at runtime.

Real seated or side-facing photos cannot be synthesized from frontal
portraits. To add real shots, drop files named like:

    stress_seated_01.jpg
    stress_side-facing_01.jpg

into the same stress/ folder and re-run the harness; no code change needed.

Usage:

    python scripts/generate-stress-case-images.py

The script is deterministic: same sources produce the same outputs.
"""

from __future__ import annotations

import io
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps

REPO_ROOT = Path(__file__).resolve().parent.parent
IMAGES_DIR = REPO_ROOT / "public" / "images"
OUT_DIR = REPO_ROOT / "local-data" / "cup-visualization-qa" / "stress"

JPEG_QUALITY = 90


def load(name: str) -> Image.Image:
    path = IMAGES_DIR / f"{name}.webp"
    if not path.exists():
        raise SystemExit(f"missing source image: {path}")
    image = Image.open(path)
    image.load()
    return ImageOps.exif_transpose(image.convert("RGB"))


def save(image: Image.Image, name: str) -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / name
    image.save(out_path, format="JPEG", quality=JPEG_QUALITY)
    return out_path


def center_square(image: Image.Image, size: int | None = None) -> Image.Image:
    width, height = image.size
    side = min(width, height)
    left = (width - side) // 2
    top = (height - side) // 2
    cropped = image.crop((left, top, left + side, top + side))
    if size is not None:
        cropped = cropped.resize((size, size), Image.LANCZOS)
    return cropped


def fit_height(image: Image.Image, height: int) -> Image.Image:
    scale = height / image.height
    width = max(1, round(image.width * scale))
    return image.resize((width, height), Image.LANCZOS)


def make_multi_person(left_name: str, right_name: str, filename: str) -> None:
    left = fit_height(center_square(load(left_name)), 640)
    right = fit_height(center_square(load(right_name)), 640)
    canvas = Image.new("RGB", (left.width + right.width, 640), "white")
    canvas.paste(left, (0, 0))
    canvas.paste(right, (left.width, 0))
    save(canvas, filename)


def make_low_resolution(name: str, filename: str, side: int) -> None:
    tiny = center_square(load(name), side)
    save(tiny, filename)


def make_busy_background(target_name: str, backdrop_names: list[str], filename: str) -> None:
    tiles = [center_square(load(name), 320) for name in backdrop_names]
    collage = Image.new("RGB", (640, 640))
    for index, tile in enumerate(tiles[:4]):
        collage.paste(tile, ((index % 2) * 320, (index // 2) * 320))
    busy = collage.filter(ImageFilter.GaussianBlur(4))

    portrait = load(target_name)
    portrait = fit_height(portrait, 520)
    x = (busy.width - portrait.width) // 2
    y = (busy.height - portrait.height) // 2
    busy.paste(portrait, (x, y))
    save(busy, filename)


def make_face_crop(name: str, filename: str, top_ratio: float) -> None:
    image = load(name)
    width, height = image.size
    crop_height = max(1, round(height * top_ratio))
    save(image.crop((0, 0, width, crop_height)), filename)


def make_tilted(name: str, filename: str, angle: float) -> None:
    image = center_square(load(name), 560)
    rotated = image.rotate(angle, resample=Image.BICUBIC, expand=False, fillcolor="white")
    save(rotated, filename)


def make_off_center(name: str, filename: str) -> None:
    portrait = fit_height(center_square(load(name)), 600)
    canvas = Image.new("RGB", (portrait.width * 3, 600), "white")
    canvas.paste(portrait, (40, 0))
    save(canvas, filename)


def main() -> None:
    generated: list[Path] = []

    make_multi_person("fukada_kyoko", "aragaki_yui", "stress_multi-person_01.jpg")
    make_multi_person("shinozaki_ai", "inoue_waka", "stress_multi-person_02.jpg")
    generated.append(OUT_DIR / "stress_multi-person_01.jpg")
    generated.append(OUT_DIR / "stress_multi-person_02.jpg")

    make_low_resolution("fukada_kyoko", "stress_low-resolution_01.jpg", 96)
    make_low_resolution("aragaki_yui", "stress_low-resolution_02.jpg", 72)
    generated.append(OUT_DIR / "stress_low-resolution_01.jpg")
    generated.append(OUT_DIR / "stress_low-resolution_02.jpg")

    make_busy_background(
        "baba_fumika",
        ["hamabe_minami", "kitagawa_keiko", "hashimoto_manami", "danmitsu"],
        "stress_busy-background_01.jpg",
    )
    generated.append(OUT_DIR / "stress_busy-background_01.jpg")

    make_face_crop("shinozaki_ai", "stress_face-crop_01.jpg", 0.38)
    make_face_crop("yasuda_misako", "stress_face-crop_02.jpg", 0.34)
    generated.append(OUT_DIR / "stress_face-crop_01.jpg")
    generated.append(OUT_DIR / "stress_face-crop_02.jpg")

    make_tilted("kakei_miwako", "stress_tilted_01.jpg", 14.0)
    generated.append(OUT_DIR / "stress_tilted_01.jpg")

    make_off_center("hara_mikie", "stress_off-center_01.jpg")
    generated.append(OUT_DIR / "stress_off-center_01.jpg")

    print(f"generated {len(generated)} stress images in {OUT_DIR}")
    for path in generated:
        print(f"  {path.name}  {path.stat().st_size} bytes")


if __name__ == "__main__":
    main()
