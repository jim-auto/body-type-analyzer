from __future__ import annotations

import argparse
import hashlib
import io
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageOps
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright

try:
    from bs4 import BeautifulSoup
except ImportError as exc:
    raise SystemExit("beautifulsoup4 is required. Install it with `pip install beautifulsoup4`.") from exc

REPO_ROOT = Path(__file__).resolve().parents[1]
TRAINING_DATA_PATH = REPO_ROOT / "local-data" / "training-profiles.json"
TRAINING_IMAGES_DIR = REPO_ROOT / "local-data" / "training-images"
DEFAULT_CUP_PAGES = ("f", "g", "h", "i", "j", "k")
QUERY_SUFFIXES = ("グラビア", "水着", "グラビア 全身")
MIN_BYTES = 20 * 1024
MIN_WIDTH = 200
MIN_HEIGHT = 250
REQUEST_HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
ORIG_CUP_ORDER = {cup: index for index, cup in enumerate(("A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"))}


@dataclass(frozen=True)
class Candidate:
    name: str
    search_name: str
    height: int
    bust: int
    cup: str
    original_cup: str
    source_url: str


def normalize_name(name: str) -> str:
    return re.sub(r"[\s\u3000\u200b]+", "", name)


def name_variants(name: str) -> set[str]:
    cleaned = normalize_name(name)
    variants = {cleaned} if cleaned else set()
    for open_char, close_char in (("（", "）"), ("(", ")")):
        if open_char in name and close_char in name:
            base = name.split(open_char, 1)[0]
            alias = name.split(open_char, 1)[1].split(close_char, 1)[0]
            for value in (base, alias, f"{base}{alias}"):
                normalized = normalize_name(value)
                if normalized:
                    variants.add(normalized)
    return variants


def search_name_for(name: str) -> str:
    for open_char, close_char in (("（", "）"), ("(", ")")):
        if open_char in name and close_char in name:
            return name.split(open_char, 1)[0].strip()
    return name.strip()


def filename_safe_name(name: str) -> str:
    return re.sub(r'[<>:"/\\|?*]', "_", normalize_name(name))


def load_records() -> list[dict]:
    if not TRAINING_DATA_PATH.exists():
        return []
    return json.loads(TRAINING_DATA_PATH.read_text(encoding="utf-8"))


def existing_name_index(records: list[dict]) -> set[str]:
    variants: set[str] = set()
    for record in records:
        variants.update(name_variants(record.get("name", "")))
    return variants


def fetch_candidates(cup_pages: tuple[str, ...]) -> list[Candidate]:
    deduped: dict[str, Candidate] = {}

    for page_cup in cup_pages:
        url = f"https://www.gravurefit.info/style/cup-{page_cup}/"
        request = urllib.request.Request(url, headers=REQUEST_HEADERS)
        with urllib.request.urlopen(request, timeout=30) as response:
            html = response.read().decode("utf-8", "ignore")

        soup = BeautifulSoup(html, "html.parser")
        for table in soup.find_all("table"):
            values: list[str] = []
            for row in table.find_all("tr"):
                cells = row.find_all(["th", "td"])
                if len(cells) >= 2:
                    values.append(cells[1].get_text(" ", strip=True))

            if len(values) < 5:
                continue

            name = values[0].strip().replace("\u200b", "")
            height_text = values[3]
            sizes_text = values[4]

            height_match = re.search(r"(\d+)", height_text)
            bust_match = re.search(r"B\s*(\d+)", sizes_text)
            cup_match = re.search(r"\(([A-Z])\)", sizes_text)
            if not (name and height_match and bust_match and cup_match):
                continue

            original_cup = cup_match.group(1)
            candidate = Candidate(
                name=name,
                search_name=search_name_for(name),
                height=int(height_match.group(1)),
                bust=int(bust_match.group(1)),
                cup=original_cup,
                original_cup=original_cup,
                source_url=url,
            )

            key = normalize_name(name)
            current = deduped.get(key)
            if current is None or candidate_priority(candidate) > candidate_priority(current):
                deduped[key] = candidate

    return list(deduped.values())


def candidate_priority(candidate: Candidate) -> tuple[int, int]:
    return (ORIG_CUP_ORDER.get(candidate.original_cup, -1), candidate.bust)


def extract_image_urls(page, query: str) -> list[str]:
    encoded = urllib.parse.quote_plus(query)
    page.goto(f"https://www.bing.com/images/search?q={encoded}", timeout=20000)
    page.wait_for_timeout(2200)
    page.evaluate("window.scrollTo(0, 300)")
    page.wait_for_timeout(800)
    urls = page.evaluate(
        """() => {
            return Array.from(document.querySelectorAll('a.iusc'))
                .slice(0, 16)
                .map((node) => {
                    try {
                        return JSON.parse(node.getAttribute('m')).murl;
                    } catch {
                        return null;
                    }
                })
                .filter(Boolean);
        }"""
    )
    deduped: list[str] = []
    seen: set[str] = set()
    for url in urls:
        if url in seen:
            continue
        seen.add(url)
        deduped.append(url)
    return deduped


def image_download_candidates(page, candidate: Candidate) -> list[str]:
    urls: list[str] = []
    seen: set[str] = set()
    for suffix in QUERY_SUFFIXES:
        query = f"{candidate.search_name} {suffix}"
        try:
            for url in extract_image_urls(page, query):
                if "explicit" in url.lower() or url in seen:
                    continue
                seen.add(url)
                urls.append(url)
        except PlaywrightTimeoutError:
            continue
        if urls:
            break
    return urls


def validate_and_save_image(image_bytes: bytes, destination: Path) -> bool:
    if len(image_bytes) < MIN_BYTES:
        return False

    with Image.open(io.BytesIO(image_bytes)) as image:
        image.load()
        image = ImageOps.exif_transpose(image)
        width, height = image.size
        if width < MIN_WIDTH or height < MIN_HEIGHT or height < width:
            return False
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")
        elif image.mode == "L":
            image = image.convert("RGB")
        destination.parent.mkdir(parents=True, exist_ok=True)
        image.save(destination, format="JPEG", quality=92)
    return destination.exists() and destination.stat().st_size >= MIN_BYTES


def normalize_remote_url(url: str) -> str:
    return url.strip().replace(" ", "%20")


def download_candidate_image(page, candidate: Candidate) -> tuple[Path | None, str]:
    file_hash = hashlib.md5(candidate.name.encode("utf-8")).hexdigest()[:8]
    filename = f"manual_{filename_safe_name(candidate.name)}_{file_hash}.jpg"
    destination = TRAINING_IMAGES_DIR / filename
    if destination.exists() and destination.stat().st_size >= MIN_BYTES:
        return destination, "existing"

    for image_url in image_download_candidates(page, candidate):
        normalized_url = normalize_remote_url(image_url)
        request = urllib.request.Request(
            normalized_url,
            headers={
                **REQUEST_HEADERS,
                "Referer": "https://www.bing.com/",
            },
        )
        try:
            with urllib.request.urlopen(request, timeout=12) as response:
                image_bytes = response.read()
        except Exception:
            continue

        try:
            if validate_and_save_image(image_bytes, destination):
                return destination, normalized_url
        except OSError:
            if destination.exists():
                destination.unlink(missing_ok=True)
            continue

    if destination.exists():
        destination.unlink(missing_ok=True)
    return None, ""


def append_record(records: list[dict], candidate: Candidate, image_path: Path) -> None:
    records.append(
        {
            "name": candidate.name,
            "imagePath": str(image_path.relative_to(REPO_ROOT)),
            "actualHeight": float(candidate.height),
            "bust": candidate.bust,
            "cup": candidate.cup,
            "displayCup": candidate.original_cup,
            "source": "manual",
            "sourceUrl": candidate.source_url,
            "remoteImageUrl": "",
            "scrapedHeight": None,
            "scrapedBust": None,
            "scrapedWaist": None,
            "scrapedHip": None,
            "useForHeight": True,
            "useForCup": True,
            "useForSimilarity": False,
            "waist": None,
            "hip": None,
        }
    )


def save_records(records: list[dict]) -> None:
    TRAINING_DATA_PATH.write_text(
        json.dumps(records, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def collect_candidates(limit: int | None, cup_pages: tuple[str, ...]) -> list[Candidate]:
    records = load_records()
    existing_names = existing_name_index(records)
    all_candidates = fetch_candidates(cup_pages)
    fresh_candidates = [candidate for candidate in all_candidates if not (name_variants(candidate.name) & existing_names)]
    if limit is not None:
        return fresh_candidates[:limit]
    return fresh_candidates


def main() -> None:
    parser = argparse.ArgumentParser(description="Collect F-K cup gravurefit profiles and download Bing images")
    parser.add_argument("--limit", type=int, default=None, help="Maximum number of new profiles to add")
    parser.add_argument("--delay", type=float, default=0.8, help="Delay between Bing searches in seconds")
    parser.add_argument("--dry-run", action="store_true", help="Only print candidate metadata without downloading")
    parser.add_argument(
        "--cups",
        default=",".join(DEFAULT_CUP_PAGES),
        help="Comma-separated gravurefit cup pages to scrape, e.g. f,g,h,i,j,k",
    )
    args = parser.parse_args()

    cup_pages = tuple(part.strip().lower() for part in args.cups.split(",") if part.strip())
    records = load_records()
    existing_names = existing_name_index(records)
    candidates = fetch_candidates(cup_pages)
    candidates = [candidate for candidate in candidates if not (name_variants(candidate.name) & existing_names)]
    if args.limit is not None:
        candidates = candidates[: args.limit]

    print(f"Found {len(candidates)} new gravurefit candidates across cups: {', '.join(cup_pages)}")
    if args.dry_run:
        for candidate in candidates:
            print(
                json.dumps(
                    {
                        "name": candidate.name,
                        "searchName": candidate.search_name,
                        "height": candidate.height,
                        "bust": candidate.bust,
                        "cup": candidate.cup,
                        "originalCup": candidate.original_cup,
                        "sourceUrl": candidate.source_url,
                    },
                    ensure_ascii=False,
                )
            )
        return

    added = 0
    failed: list[str] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page(user_agent=REQUEST_HEADERS["User-Agent"])

        try:
            for index, candidate in enumerate(candidates, start=1):
                image_path, resolved_source = download_candidate_image(page, candidate)
                if image_path is None:
                    failed.append(candidate.name)
                    print(f"[{index}/{len(candidates)}] FAILED  {candidate.name}")
                    time.sleep(args.delay)
                    continue

                append_record(records, candidate, image_path)
                existing_names.update(name_variants(candidate.name))
                save_records(records)
                added += 1
                print(
                    f"[{index}/{len(candidates)}] ADDED   {candidate.name} "
                    f"({candidate.height}cm, {candidate.bust}cm, {candidate.cup}) <- {resolved_source}"
                )
                time.sleep(args.delay)
        finally:
            browser.close()

    save_records(records)
    print()
    print(f"Added {added} profiles.")
    print(f"Failed {len(failed)} profiles.")
    if failed:
        print("Failed names:")
        for name in failed:
            print(f"  - {name}")


if __name__ == "__main__":
    main()
