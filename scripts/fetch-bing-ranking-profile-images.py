from __future__ import annotations

import argparse
import hashlib
import importlib.util
import io
import json
import re
import sys
import urllib.request
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageOps

REPO_ROOT = Path(__file__).resolve().parents[1]
RANKING_PATH = REPO_ROOT / "public" / "data" / "ranking.json"
SOURCE_PROFILES_PATH = REPO_ROOT / "lib" / "source-profiles.ts"
FETCH_SOURCE_PROFILES_PATH = REPO_ROOT / "scripts" / "fetch-source-profiles.mjs"
IMAGE_CREDITS_PATH = REPO_ROOT / "public" / "data" / "image-credits.json"
IMAGES_DIR = REPO_ROOT / "public" / "images"

FEMALE_QUERY_SUFFIXES = ("グラビア", "プロフィール", "モデル", "宣材写真")
MALE_QUERY_SUFFIXES = ("俳優", "プロフィール", "宣材写真", "アー写")
QUERY_OVERRIDES = {
    "じろう": ["シソンヌ じろう", "じろう シソンヌ"],
    "清水みさと": ["清水みさと 女優", "清水みさと タレント", "清水みさと グラビア"],
    "高橋茂雄": ["高橋茂雄 サバンナ", "サバンナ 高橋茂雄", "高橋茂雄 芸人"],
    "榎木孝明": ["榎木孝明 俳優"],
    "原口あきまさ": ["原口あきまさ ものまね", "原口あきまさ タレント"],
    "梨花": ["梨花 モデル", "モデル 梨花", "梨花 タレント"],
    "KURO": [
        "KURO HOME MADE 家族 プロフィール",
        "HOME MADE 家族 KURO プロフィール",
        "クロ HOME MADE 家族 プロフィール",
    ],
    "宮地れな": ["宮地れな グラビア", "宮地れな アイドル", "宮地れな タレント"],
    "哀川翔": ["哀川翔 俳優", "哀川翔 プロフィール", "哀川翔 宣材写真"],
    "三浦貴大": ["三浦貴大 俳優", "三浦貴大 プロフィール", "三浦貴大 宣材写真"],
    "玲音": ["玲音 グラビアアイドル", "玲音 グラビア プロフィール", "玲音 タレント"],
    "リリー": ["見取り図 リリー", "リリー 見取り図", "見取り図 リリー 芸人"],
    "ビル・ゲイツ": ["Bill Gates portrait", "Bill Gates profile", "ビル・ゲイツ 顔写真"],
    "瀬下豊": ["天竺鼠 瀬下豊", "瀬下豊 天竺鼠", "瀬下豊 芸人"],
    "川瀬名人": ["ゆにばーす 川瀬名人", "川瀬名人 ゆにばーす", "川瀬名人 芸人"],
    "トシ": ["タカアンドトシ トシ", "トシ タカアンドトシ", "タカトシ トシ 芸人"],
}
MIN_BYTES = 10 * 1024
MIN_SIDE = 180
MIN_RATIO = 0.9
MAX_RATIO = 2.8
FLUSH_EVERY = 25


@dataclass(frozen=True)
class Target:
    name: str
    gender: str


def load_collector():
    script_path = REPO_ROOT / "scripts" / "collect-gravurefit-busty-profiles.py"
    spec = importlib.util.spec_from_file_location("gravurefit_collect", script_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


collector = load_collector()


def make_filename(name: str) -> str:
    normalized = name.strip()
    ascii_stem = (
        normalized.encode("ascii", "ignore").decode("ascii").lower()
    )
    ascii_stem = re.sub(r"[^a-z0-9]+", "_", ascii_stem).strip("_")
    digest = hashlib.sha1(normalized.encode("utf-8")).hexdigest()[:8]

    if ascii_stem:
        return f"{ascii_stem}_{digest}"

    hex_stem = normalized.encode("utf-8").hex()[:12]
    return f"jp_{hex_stem}_{digest}"


def load_targets(
    only_names: set[str], top_n: int, gender_filter: str, refresh_existing: bool = False
) -> list[Target]:
    ranking = json.loads(RANKING_PATH.read_text(encoding="utf-8"))
    female_categories = ranking["female"] if gender_filter in ("female", "all") else []
    male_categories = ranking["male"] if gender_filter in ("male", "all") else []
    female_limit = top_n if top_n > 0 else None
    male_limit = top_n if top_n > 0 else None
    include_existing_named_entries = refresh_existing and bool(only_names)
    female = [
        entry
        for category in female_categories
        for entry in category["ranking"][:female_limit]
        if "ui-avatars" in entry["image"]
        or (
            include_existing_named_entries and entry["name"] in only_names
        )
    ]
    male = [
        entry
        for category in male_categories
        for entry in category["ranking"][:male_limit]
        if "ui-avatars" in entry["image"]
        or (
            include_existing_named_entries and entry["name"] in only_names
        )
    ]

    deduped: list[Target] = []
    seen: set[str] = set()

    for gender, entries in (("female", female), ("male", male)):
        for entry in entries:
            name = entry["name"]
            if name in seen:
                continue
            if only_names and name not in only_names:
                continue
            seen.add(name)
            deduped.append(Target(name=name, gender=gender))

    return deduped


def load_only_names(raw_names: str, names_file: str) -> set[str]:
    names = {name.strip() for name in raw_names.split(",") if name.strip()}

    if names_file:
        file_path = Path(names_file)
        file_names = {
            name.strip()
            for name in file_path.read_text(encoding="utf-8").splitlines()
            if name.strip()
        }
        names.update(file_names)

    return names


def build_queries(target: Target) -> list[str]:
    override_queries = QUERY_OVERRIDES.get(target.name)

    if override_queries:
        return list(dict.fromkeys(override_queries))

    search_name = collector.search_name_for(target.name)
    suffixes = FEMALE_QUERY_SUFFIXES if target.gender == "female" else MALE_QUERY_SUFFIXES
    queries = [search_name]
    queries.extend(f"{search_name} {suffix}" for suffix in suffixes)
    return queries


def image_download_candidates(page, target: Target) -> list[str]:
    urls: list[str] = []
    seen: set[str] = set()

    for query in build_queries(target):
        try:
            for url in collector.extract_image_urls(page, query):
                normalized_url = collector.normalize_remote_url(url)
                if normalized_url in seen:
                    continue
                seen.add(normalized_url)
                urls.append(normalized_url)
        except Exception:
            continue

        if urls:
            break

    return urls


def is_rejected_bing_image_url(image_url: str) -> bool:
    lower = image_url.lower()

    return any(
        marker in lower
        for marker in (
            "storage.ko-fi.com",
            "1girl",
            "masterpiece",
            "illustration",
            "ai-generated",
            "ai_generated",
            "radiko.jp",
            "logo",
            "pixabay.com",
            "deviantart.net",
            "wixmp.com",
            "zhimg.com",
            "zhihu.com",
            "ssl-images-amazon.com",
            "mercdn.net",
            "pexels.com",
            "microcms-assets.io",
            "bookwalker.jp",
        )
    )


def validate_and_save_image(image_bytes: bytes, destination: Path) -> bool:
    return validate_and_save_image_with_thresholds(
        image_bytes,
        destination,
        min_bytes=MIN_BYTES,
        min_side=MIN_SIDE,
        min_ratio=MIN_RATIO,
        max_ratio=MAX_RATIO,
    )


def validate_and_save_image_with_thresholds(
    image_bytes: bytes,
    destination: Path,
    *,
    min_bytes: int,
    min_side: int,
    min_ratio: float,
    max_ratio: float,
) -> bool:
    if len(image_bytes) < min_bytes:
        return False

    with Image.open(io.BytesIO(image_bytes)) as image:
        image.load()
        image = ImageOps.exif_transpose(image)
        width, height = image.size

        if width < min_side or height < min_side:
            return False

        ratio = height / width
        if ratio < min_ratio or ratio > max_ratio:
            return False

        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")
        elif image.mode == "L":
            image = image.convert("RGB")

        destination.parent.mkdir(parents=True, exist_ok=True)
        image.save(destination, format="JPEG", quality=90)

    return destination.exists() and destination.stat().st_size >= MIN_BYTES


def download_target_image(
    page,
    target: Target,
    refresh_existing: bool = False,
    *,
    min_bytes: int = MIN_BYTES,
    min_side: int = MIN_SIDE,
    min_ratio: float = MIN_RATIO,
    max_ratio: float = MAX_RATIO,
) -> tuple[Path | None, str]:
    output_path = IMAGES_DIR / f"{make_filename(target.name)}.jpg"

    if (
        not refresh_existing
        and output_path.exists()
        and output_path.stat().st_size >= min_bytes
    ):
        return output_path, "cached"

    for image_url in image_download_candidates(page, target):
        if is_rejected_bing_image_url(image_url):
            continue

        request = urllib.request.Request(
            image_url,
            headers={
                **collector.REQUEST_HEADERS,
                "Referer": "https://www.bing.com/",
            },
        )

        try:
            with urllib.request.urlopen(request, timeout=12) as response:
                image_bytes = response.read()
        except Exception:
            continue

        try:
            if validate_and_save_image_with_thresholds(
                image_bytes,
                output_path,
                min_bytes=min_bytes,
                min_side=min_side,
                min_ratio=min_ratio,
                max_ratio=max_ratio,
            ):
                return output_path, image_url
        except OSError:
            output_path.unlink(missing_ok=True)

    output_path.unlink(missing_ok=True)
    return None, ""


def update_source_profiles(replacements: dict[str, str]) -> None:
    source = SOURCE_PROFILES_PATH.read_text(encoding="utf-8")

    for name, image_path in replacements.items():
        pattern = re.compile(
            rf'(name: "{re.escape(name)}",\r?\n\s*image: ")[^"]+(")',
            re.MULTILINE,
        )
        if not pattern.search(source):
            raise RuntimeError(f"Could not find source profile entry for {name}")
        source = pattern.sub(rf"\1{image_path}\2", source, count=1)

    write_text_atomic(SOURCE_PROFILES_PATH, source)


def parse_image_path_entries(block: str) -> dict[str, str]:
    entries: dict[str, str] = {}
    pattern = re.compile(
        r'^\s{2}((?:"(?:\\.|[^"\\])*")|[^:]+):\s+"([^"]+)",$',
        re.MULTILINE,
    )

    for match in pattern.finditer(block):
        raw_key = match.group(1).strip()
        key = json.loads(raw_key) if raw_key.startswith('"') else raw_key
        entries[normalize_image_path_key(key)] = match.group(2)

    return entries


def normalize_image_path_key(key: str) -> str:
    normalized = key.strip()

    for _ in range(4):
        if not (normalized.startswith('"') and normalized.endswith('"')):
            break

        try:
            parsed = json.loads(normalized)
        except json.JSONDecodeError:
            break

        if not isinstance(parsed, str) or parsed == normalized:
            break

        normalized = parsed

    return normalized


def render_image_paths(entries: dict[str, str]) -> str:
    lines = [
        f"  {json.dumps(name, ensure_ascii=False)}: \"{image_path}\","
        for name, image_path in sorted(entries.items(), key=lambda item: item[0])
    ]
    return "const IMAGE_PATHS = {\n" + "\n".join(lines) + "\n};"


def update_fetch_source_profiles(replacements: dict[str, str]) -> None:
    source = FETCH_SOURCE_PROFILES_PATH.read_text(encoding="utf-8")
    match = re.search(r"const IMAGE_PATHS = \{[\s\S]*?\n\};", source)

    if not match:
        raise RuntimeError("Could not locate IMAGE_PATHS in fetch-source-profiles.mjs")

    entries = parse_image_path_entries(match.group(0))
    entries.update(replacements)
    updated = source.replace(match.group(0), render_image_paths(entries))
    write_text_atomic(FETCH_SOURCE_PROFILES_PATH, updated)


def write_text_atomic(path: Path, content: str) -> None:
    temp_path = path.with_suffix(f"{path.suffix}.tmp")
    temp_path.write_text(content, encoding="utf-8")
    temp_path.replace(path)


def read_existing_credits() -> list[dict[str, object]]:
    try:
        return json.loads(IMAGE_CREDITS_PATH.read_text(encoding="utf-8"))
    except Exception:
        return []


def update_image_credits(credits_by_name: dict[str, dict[str, object]]) -> None:
    current_credits = read_existing_credits()
    merged: dict[str, dict[str, object]] = {
        str(entry.get("name", "")): entry for entry in current_credits
    }

    for name, credit in credits_by_name.items():
        merged[name] = credit

    next_credits = sorted(merged.values(), key=lambda entry: str(entry.get("name", "")))
    write_text_atomic(
        IMAGE_CREDITS_PATH,
        json.dumps(next_credits, ensure_ascii=False, indent=2) + "\n",
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Fetch Bing profile images for top-ranking entries"
    )
    parser.add_argument("--only-names", default="", help="Comma-separated target names")
    parser.add_argument("--only-names-file", default="", help="Path to a newline-delimited target-name file")
    parser.add_argument(
        "--top-n",
        type=int,
        default=100,
        help="Collect target entries from the top N rows of each ranking",
    )
    parser.add_argument(
        "--refresh-existing",
        action="store_true",
        help="Ignore any cached JPEG for the targeted names and download again",
    )
    parser.add_argument(
        "--gender",
        choices=("female", "male", "all"),
        default="all",
        help="Which ranking gender buckets to scan",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Only process the first N selected targets",
    )
    parser.add_argument(
        "--min-bytes",
        type=int,
        default=MIN_BYTES,
        help="Minimum downloaded source size in bytes",
    )
    parser.add_argument(
        "--min-side",
        type=int,
        default=MIN_SIDE,
        help="Minimum source width and height in pixels",
    )
    parser.add_argument(
        "--min-ratio",
        type=float,
        default=MIN_RATIO,
        help="Minimum allowed height/width ratio",
    )
    parser.add_argument(
        "--max-ratio",
        type=float,
        default=MAX_RATIO,
        help="Maximum allowed height/width ratio",
    )
    args = parser.parse_args()

    only_names = load_only_names(args.only_names, args.only_names_file)
    targets = load_targets(
        only_names, args.top_n, args.gender, refresh_existing=args.refresh_existing
    )
    if args.limit > 0:
        targets = targets[: args.limit]
    replacements: dict[str, str] = {}
    credits: dict[str, dict[str, object]] = {}
    failures: list[dict[str, str]] = []

    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    with collector.sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(user_agent=collector.REQUEST_HEADERS["User-Agent"])

        for target in targets:
            try:
                output_path, source = download_target_image(
                    page,
                    target,
                    refresh_existing=args.refresh_existing,
                    min_bytes=args.min_bytes,
                    min_side=args.min_side,
                    min_ratio=args.min_ratio,
                    max_ratio=args.max_ratio,
                )
                if output_path is None:
                    failures.append({"name": target.name, "reason": "no-image-found"})
                    print(f"{target.name} -> failed")
                    continue

                image_path = f"/images/{output_path.name}"
                replacements[target.name] = image_path
                credits[target.name] = {
                    "name": target.name,
                    "image": image_path,
                    "title": target.name,
                    "creator": None,
                    "creatorUrl": None,
                    "source": source,
                    "provider": "bing",
                    "license": "",
                    "licenseVersion": "",
                    "licenseUrl": "",
                    "foreignLandingUrl": source,
                    "attribution": "",
                }

                if len(replacements) % FLUSH_EVERY == 0:
                    update_source_profiles(replacements)
                    update_fetch_source_profiles(replacements)
                    update_image_credits(credits)

                print(f"{target.name} -> {source}")
            except Exception as exc:
                failures.append({"name": target.name, "reason": str(exc)})
                print(f"{target.name} -> failed")

        browser.close()

    if replacements:
        update_source_profiles(replacements)
        update_fetch_source_profiles(replacements)
        update_image_credits(credits)

    print(
        json.dumps(
            {
                "requested": len(targets),
                "updated": len(replacements),
                "failed": len(failures),
                "failures": failures,
            },
            ensure_ascii=False,
            indent=2,
        )
    )

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
