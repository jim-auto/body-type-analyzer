"""Add a new training profile with image download.

Usage:
  python scripts/add-training-profile.py \
    --name "MEGUMI" \
    --height 158 \
    --cup G \
    --bust 89 \
    --image-url "https://example.com/megumi.jpg" \
    --source "manual"

The image is downloaded and saved to local-data/training-images/.
The profile is appended to local-data/training-profiles.json.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
TRAINING_DATA_PATH = REPO_ROOT / "local-data" / "training-profiles.json"
TRAINING_IMAGES_DIR = REPO_ROOT / "local-data" / "training-images"
CUP_ORDER = [chr(code) for code in range(ord("A"), ord("Z") + 1)]


def main() -> None:
    parser = argparse.ArgumentParser(description="Add a training profile")
    parser.add_argument("--name", required=True, help="Celebrity name")
    parser.add_argument("--height", type=float, required=True, help="Height in cm")
    parser.add_argument("--cup", required=True, choices=CUP_ORDER, help="Cup size")
    parser.add_argument("--bust", type=int, default=None, help="Bust in cm")
    parser.add_argument("--waist", type=int, default=None, help="Waist in cm")
    parser.add_argument("--hip", type=int, default=None, help="Hip in cm")
    parser.add_argument("--image-url", required=True, help="URL to download image from")
    parser.add_argument("--image-path", default=None, help="Local image path (skip download)")
    parser.add_argument("--source", default="manual", help="Data source")
    parser.add_argument("--source-url", default="", help="Source URL")
    args = parser.parse_args()

    # Load existing data
    if TRAINING_DATA_PATH.exists():
        records = json.loads(TRAINING_DATA_PATH.read_text(encoding="utf-8"))
    else:
        records = []

    # Check duplicate
    if any(r["name"] == args.name for r in records):
        print(f"Already exists: {args.name}")
        return

    # Download or use local image
    TRAINING_IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    if args.image_path:
        image_path = args.image_path
    else:
        name_hash = hashlib.md5(args.name.encode("utf-8")).hexdigest()[:8]
        ext = Path(args.image_url.split("?")[0]).suffix or ".jpg"
        filename = f"manual_{args.name}_{name_hash}{ext}"
        image_path = str(TRAINING_IMAGES_DIR / filename)

        print(f"Downloading {args.image_url} ...")
        urllib.request.urlretrieve(args.image_url, image_path)
        print(f"Saved to {image_path}")

    # Add record
    record = {
        "name": args.name,
        "imagePath": image_path,
        "actualHeight": args.height,
        "bust": args.bust,
        "cup": args.cup,
        "displayCup": args.cup,
        "source": args.source,
        "sourceUrl": args.source_url,
        "remoteImageUrl": args.image_url,
        "scrapedHeight": None,
        "scrapedBust": None,
        "scrapedWaist": None,
        "scrapedHip": None,
        "useForHeight": True,
        "useForCup": True,
        "useForSimilarity": False,
        "waist": args.waist,
        "hip": args.hip,
    }
    records.append(record)

    TRAINING_DATA_PATH.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Added {args.name} ({args.height}cm, {args.cup} cup) to training data")
    print(f"Total profiles: {len(records)}")
    print()
    print("Next steps:")
    print("  1. Run: npm run generate:diagnosis-model")
    print("  2. Run: node scripts/generate-ranking.mjs")
    print("  3. Run: npm test -- --runInBand")


if __name__ == "__main__":
    main()
