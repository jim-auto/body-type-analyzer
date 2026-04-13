"""Batch add F-H cup celebrity profiles for training data improvement.

After running this script:
1. Place profile images in local-data/training-images/
2. Update imagePath for each entry in local-data/training-profiles.json
3. Run: npm run generate:diagnosis-model
4. Run: node scripts/generate-ranking.mjs
"""
from __future__ import annotations

import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
TRAINING_DATA_PATH = REPO_ROOT / "local-data" / "training-profiles.json"
TRAINING_IMAGES_DIR = REPO_ROOT / "local-data" / "training-images"

NEW_PROFILES = [
    # F cup (7)
    {"name": "熊田曜子", "height": 164, "bust": 92, "cup": "F"},
    {"name": "磯山さやか", "height": 155, "bust": 91, "cup": "F"},
    {"name": "鈴木聖", "height": 168, "bust": 87, "cup": "F"},
    {"name": "西原愛夏", "height": 161, "bust": 90, "cup": "F"},
    {"name": "平嶋夏海", "height": 154, "bust": 88, "cup": "F"},
    {"name": "中村静香", "height": 164, "bust": 88, "cup": "F"},
    {"name": "永野桃子", "height": 176, "bust": 89, "cup": "F"},
    # G cup (8)
    {"name": "MEGUMI", "height": 158, "bust": 94, "cup": "G"},
    {"name": "篠崎愛", "height": 160, "bust": 87, "cup": "G"},
    {"name": "杉原杏璃", "height": 157, "bust": 93, "cup": "G"},
    {"name": "小倉優香", "height": 167, "bust": 87, "cup": "G"},
    {"name": "橋本梨菜", "height": 158, "bust": 88, "cup": "G"},
    {"name": "川村那月", "height": 165, "bust": 89, "cup": "G"},
    {"name": "片山萌美", "height": 170, "bust": 92, "cup": "G"},
    {"name": "織田唯愛", "height": 155, "bust": 88, "cup": "G"},
    # H cup (7)
    {"name": "原幹恵", "height": 165, "bust": 95, "cup": "H"},
    {"name": "新垣優香", "height": 155, "bust": 90, "cup": "H"},
    {"name": "遠藤いつき", "height": 168, "bust": 100, "cup": "H"},
    {"name": "栗山ことね", "height": 159, "bust": 90, "cup": "H"},
    {"name": "吉田早希", "height": 164, "bust": 90, "cup": "H"},
    {"name": "瀬山しろ", "height": 166, "bust": 94, "cup": "H"},
    {"name": "天木じゅん", "height": 149, "bust": 95, "cup": "H"},
]


def main() -> None:
    if TRAINING_DATA_PATH.exists():
        records = json.loads(TRAINING_DATA_PATH.read_text(encoding="utf-8"))
    else:
        records = []

    existing_names = {r["name"] for r in records}
    added = 0
    skipped = 0
    needs_image = []

    for profile in NEW_PROFILES:
        if profile["name"] in existing_names:
            skipped += 1
            continue

        image_candidates = list(TRAINING_IMAGES_DIR.glob(f"*{profile['name']}*")) if TRAINING_IMAGES_DIR.exists() else []
        image_path = str(image_candidates[0]) if image_candidates else ""

        record = {
            "name": profile["name"],
            "imagePath": image_path,
            "actualHeight": float(profile["height"]),
            "bust": profile["bust"],
            "cup": profile["cup"],
            "source": "manual",
            "sourceUrl": "",
            "remoteImageUrl": "",
            "scrapedHeight": None,
            "scrapedBust": None,
            "scrapedWaist": None,
            "scrapedHip": None,
            "useForHeight": bool(image_path),
            "useForCup": bool(image_path),
            "useForSimilarity": False,
            "waist": None,
            "hip": None,
        }
        records.append(record)
        added += 1

        if not image_path:
            needs_image.append(profile["name"])

    TRAINING_DATA_PATH.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"Added: {added}, Skipped (already exists): {skipped}")
    print(f"Total profiles: {len(records)}")

    if needs_image:
        print(f"\n=== {len(needs_image)} profiles need images ===")
        print("Place images in: local-data/training-images/")
        print("Name the files to include the celebrity name, e.g.:")
        for name in needs_image:
            print(f"  {name}.jpg")
        print("\nThen re-run this script to auto-detect images,")
        print("or manually set imagePath in local-data/training-profiles.json")
        print("\nAfter adding images:")
        print("  npm run generate:diagnosis-model")
        print("  node scripts/generate-ranking.mjs")
    else:
        print("\nAll profiles have images! Run:")
        print("  npm run generate:diagnosis-model")
        print("  node scripts/generate-ranking.mjs")


if __name__ == "__main__":
    main()
