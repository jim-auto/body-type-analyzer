from __future__ import annotations

import argparse
import hashlib
import html
import json
import os
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image

REPO_ROOT = Path(__file__).resolve().parents[1]
RANKING_PATH = REPO_ROOT / "public" / "data" / "ranking.json"
IMAGE_CREDITS_PATH = REPO_ROOT / "public" / "data" / "image-credits.json"
DEFAULT_OUTPUT_DIR = REPO_ROOT / "local-data" / "qa"
TINY_FILE_BYTES = 4_000
SMALL_FILE_BYTES = 10_000
SMALL_DIMENSION = 220
ODD_RATIO_LOW = 0.65
ODD_RATIO_HIGH = 2.8


@dataclass
class RankPlacement:
    category: str
    rank: int
    score: int | None


@dataclass
class QaEntry:
    name: str
    gender: str
    image: str
    placements: list[RankPlacement] = field(default_factory=list)
    flags: list[str] = field(default_factory=list)
    width: int | None = None
    height: int | None = None
    file_bytes: int | None = None
    ratio: float | None = None
    sha1: str | None = None
    duplicate_names: list[str] = field(default_factory=list)
    credit: dict[str, str | None] | None = None

    @property
    def best_rank(self) -> int:
        return min(placement.rank for placement in self.placements)


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def build_credit_lookup() -> dict[tuple[str, str], dict[str, str | None]]:
    if not IMAGE_CREDITS_PATH.exists():
        return {}

    lookup: dict[tuple[str, str], dict[str, str | None]] = {}

    for credit in load_json(IMAGE_CREDITS_PATH):
        key = (str(credit.get("name", "")), str(credit.get("image", "")))
        lookup[key] = {
            "provider": credit.get("provider"),
            "source": credit.get("source"),
            "foreignLandingUrl": credit.get("foreignLandingUrl"),
            "creator": credit.get("creator"),
        }

    return lookup


def aggregate_entries(top_n: int) -> list[QaEntry]:
    ranking = load_json(RANKING_PATH)
    entry_map: dict[tuple[str, str], QaEntry] = {}

    for gender in ("female", "male"):
        for category in ranking[gender]:
            for index, entry in enumerate(category["ranking"][:top_n], start=1):
                key = (gender, entry["name"])
                qa_entry = entry_map.setdefault(
                    key,
                    QaEntry(
                        name=entry["name"],
                        gender=gender,
                        image=entry["image"],
                    ),
                )

                if qa_entry.image != entry["image"] and "inconsistent-image" not in qa_entry.flags:
                    qa_entry.flags.append("inconsistent-image")

                qa_entry.placements.append(
                    RankPlacement(
                        category=category["title"],
                        rank=index,
                        score=entry.get("score"),
                    )
                )

    return list(entry_map.values())


def analyze_images(entries: list[QaEntry]) -> None:
    hash_to_entries: defaultdict[str, list[QaEntry]] = defaultdict(list)

    for entry in entries:
        if not entry.image.startswith("/images/"):
            entry.flags.append("ui-avatar")
            continue

        image_path = REPO_ROOT / "public" / entry.image.lstrip("/")

        if not image_path.exists():
            entry.flags.append("missing-file")
            continue

        file_bytes = image_path.stat().st_size
        entry.file_bytes = file_bytes

        if file_bytes < TINY_FILE_BYTES:
            entry.flags.append("tiny-file")
        elif file_bytes < SMALL_FILE_BYTES:
            entry.flags.append("small-file")

        with image_path.open("rb") as file:
            entry.sha1 = hashlib.sha1(file.read()).hexdigest()

        with Image.open(image_path) as image:
            entry.width, entry.height = image.size

        if entry.width is not None and entry.height is not None:
            if entry.width < SMALL_DIMENSION or entry.height < SMALL_DIMENSION:
                entry.flags.append("small-dimension")

            entry.ratio = round(entry.height / entry.width, 3)

            if entry.ratio < ODD_RATIO_LOW or entry.ratio > ODD_RATIO_HIGH:
                entry.flags.append("odd-ratio")

        if entry.sha1:
            hash_to_entries[entry.sha1].append(entry)

    for dup_entries in hash_to_entries.values():
        names = sorted({entry.name for entry in dup_entries})

        if len(names) < 2:
            continue

        for entry in dup_entries:
            entry.flags.append("duplicate-image")
            entry.duplicate_names = [name for name in names if name != entry.name]


def attach_credits(entries: list[QaEntry], credit_lookup: dict[tuple[str, str], dict[str, str | None]]) -> None:
    for entry in entries:
        credit = credit_lookup.get((entry.name, entry.image))

        if credit:
            entry.credit = credit


def local_image_src(image: str, output_dir: Path) -> str:
    if not image.startswith("/images/"):
        return image

    image_path = REPO_ROOT / "public" / image.lstrip("/")
    return Path(os.path.relpath(image_path, output_dir)).as_posix()


def format_bytes(value: int | None) -> str:
    if value is None:
        return "-"
    if value >= 1024 * 1024:
        return f"{value / (1024 * 1024):.2f} MB"
    if value >= 1024:
        return f"{value / 1024:.1f} KB"
    return f"{value} B"


def sort_entries(entries: list[QaEntry]) -> list[QaEntry]:
    return sorted(
        entries,
        key=lambda entry: (
            -int(bool(entry.flags)),
            entry.best_rank,
            entry.gender,
            entry.name,
        ),
    )


def build_summary(entries: list[QaEntry], top_n: int) -> dict[str, object]:
    flag_counts = Counter(flag for entry in entries for flag in entry.flags)
    flagged_entries = [entry for entry in entries if entry.flags]

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "topN": top_n,
        "uniqueProfiles": len(entries),
        "flaggedProfiles": len(flagged_entries),
        "flagCounts": dict(sorted(flag_counts.items())),
        "byGender": {
            "female": {
                "profiles": sum(1 for entry in entries if entry.gender == "female"),
                "flagged": sum(
                    1 for entry in flagged_entries if entry.gender == "female"
                ),
            },
            "male": {
                "profiles": sum(1 for entry in entries if entry.gender == "male"),
                "flagged": sum(
                    1 for entry in flagged_entries if entry.gender == "male"
                ),
            },
        },
    }


def entry_to_json(entry: QaEntry) -> dict[str, object]:
    return {
        "name": entry.name,
        "gender": entry.gender,
        "image": entry.image,
        "bestRank": entry.best_rank,
        "placements": [
            {
                "category": placement.category,
                "rank": placement.rank,
                "score": placement.score,
            }
            for placement in sorted(entry.placements, key=lambda item: item.rank)
        ],
        "flags": sorted(set(entry.flags)),
        "width": entry.width,
        "height": entry.height,
        "ratio": entry.ratio,
        "fileBytes": entry.file_bytes,
        "duplicateNames": entry.duplicate_names,
        "credit": entry.credit,
    }


def build_html(entries: list[QaEntry], summary: dict[str, object], output_dir: Path, top_n: int) -> str:
    rows: list[str] = []

    for entry in entries:
        flags = sorted(set(entry.flags))
        flag_text = ", ".join(flags) if flags else "ok"
        placements = "<br>".join(
            html.escape(f"{placement.rank}. {placement.category}")
            for placement in sorted(entry.placements, key=lambda item: item.rank)
        )
        duplicate_names = (
            html.escape(", ".join(entry.duplicate_names)) if entry.duplicate_names else "-"
        )
        credit_text = "-"

        if entry.credit:
            provider = entry.credit.get("provider") or "-"
            source = entry.credit.get("source") or "-"
            credit_text = html.escape(f"{provider} / {source}")

        image_src = local_image_src(entry.image, output_dir)

        rows.append(
            "\n".join(
                [
                    f'<tr data-gender="{html.escape(entry.gender)}" data-flagged="{str(bool(flags)).lower()}" data-flags="{html.escape(" ".join(flags))}">',
                    f'  <td><img src="{html.escape(image_src)}" alt="{html.escape(entry.name)}" loading="lazy"></td>',
                    f"  <td><strong>{html.escape(entry.name)}</strong><br><span>{html.escape(entry.gender)}</span></td>",
                    f"  <td>{entry.best_rank}</td>",
                    f"  <td>{placements}</td>",
                    f"  <td>{html.escape(flag_text)}</td>",
                    f"  <td>{entry.width or '-'} x {entry.height or '-'}</td>",
                    f"  <td>{format_bytes(entry.file_bytes)}</td>",
                    f"  <td>{entry.ratio if entry.ratio is not None else '-'}</td>",
                    f"  <td>{duplicate_names}</td>",
                    f"  <td>{credit_text}</td>",
                    f"  <td><code>{html.escape(entry.image)}</code></td>",
                    "</tr>",
                ]
            )
        )

    flag_count_items = "".join(
        f"<li><code>{html.escape(flag)}</code>: {count}</li>"
        for flag, count in summary["flagCounts"].items()
    )

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ranking Image QA Top {top_n}</title>
  <style>
    :root {{
      color-scheme: light;
      --bg: #f4f1e8;
      --panel: #fffdf8;
      --ink: #1f1a17;
      --muted: #6f655d;
      --accent: #8d2b2b;
      --line: #d9d0c6;
      --warn: #fff2cf;
      --bad: #fde3df;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      background: linear-gradient(180deg, #ebe4d6 0%, var(--bg) 100%);
      color: var(--ink);
      font: 14px/1.45 "Segoe UI", sans-serif;
    }}
    header {{
      position: sticky;
      top: 0;
      z-index: 10;
      padding: 16px 20px;
      background: rgba(255, 253, 248, 0.95);
      border-bottom: 1px solid var(--line);
      backdrop-filter: blur(8px);
    }}
    h1 {{ margin: 0 0 8px; font-size: 24px; }}
    .meta {{ color: var(--muted); display: flex; gap: 16px; flex-wrap: wrap; }}
    .controls {{
      margin-top: 12px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }}
    button, input {{
      border: 1px solid var(--line);
      background: white;
      color: var(--ink);
      padding: 8px 10px;
      border-radius: 999px;
      font: inherit;
    }}
    button.active {{
      background: var(--accent);
      border-color: var(--accent);
      color: white;
    }}
    main {{ padding: 20px; }}
    .summary {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }}
    .card {{
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 14px;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 18px;
      overflow: hidden;
    }}
    thead {{
      background: #efe8de;
      position: sticky;
      top: 112px;
      z-index: 5;
    }}
    th, td {{
      text-align: left;
      border-bottom: 1px solid var(--line);
      padding: 10px;
      vertical-align: top;
    }}
    tbody tr.flagged {{ background: var(--warn); }}
    tbody tr[data-flags*="missing-file"],
    tbody tr[data-flags*="duplicate-image"],
    tbody tr[data-flags*="tiny-file"] {{ background: var(--bad); }}
    img {{
      width: 88px;
      height: 88px;
      object-fit: cover;
      border-radius: 12px;
      background: #ddd;
      display: block;
    }}
    code {{
      font: 12px/1.4 Consolas, monospace;
      white-space: normal;
      word-break: break-all;
    }}
    ul {{
      margin: 0;
      padding-left: 18px;
    }}
    .hidden {{ display: none; }}
    @media (max-width: 960px) {{
      thead {{ top: 156px; }}
      th:nth-child(4), td:nth-child(4),
      th:nth-child(9), td:nth-child(9),
      th:nth-child(10), td:nth-child(10) {{ display: none; }}
    }}
  </style>
</head>
<body>
  <header>
    <h1>Ranking Image QA Top {top_n}</h1>
    <div class="meta">
      <span>Generated: {html.escape(summary["generatedAt"])}</span>
      <span>Unique profiles: {summary["uniqueProfiles"]}</span>
      <span>Flagged: {summary["flaggedProfiles"]}</span>
      <span>Female: {summary["byGender"]["female"]["profiles"]}</span>
      <span>Male: {summary["byGender"]["male"]["profiles"]}</span>
    </div>
    <div class="controls">
      <button class="filter active" data-filter="all">All</button>
      <button class="filter" data-filter="flagged">Flagged</button>
      <button class="filter" data-filter="female">Female</button>
      <button class="filter" data-filter="male">Male</button>
      <input id="search" type="search" placeholder="Search name or flag">
    </div>
  </header>
  <main>
    <section class="summary">
      <article class="card">
        <strong>Flag counts</strong>
        <ul>{flag_count_items or "<li>No flags</li>"}</ul>
      </article>
      <article class="card">
        <strong>How to use</strong>
        <p>Start with <code>Flagged</code>, then scan top ranks and duplicate-image groups.</p>
        <p>Typical bad cases are wrong person, poster/artwork, tiny files, or extremely cropped images.</p>
      </article>
    </section>
    <table>
      <thead>
        <tr>
          <th>Image</th>
          <th>Name</th>
          <th>Best</th>
          <th>Ranks</th>
          <th>Flags</th>
          <th>Size</th>
          <th>Bytes</th>
          <th>Ratio</th>
          <th>Duplicate</th>
          <th>Credit</th>
          <th>Path</th>
        </tr>
      </thead>
      <tbody>
        {"".join(rows)}
      </tbody>
    </table>
  </main>
  <script>
    const rows = [...document.querySelectorAll("tbody tr")];
    const buttons = [...document.querySelectorAll(".filter")];
    const search = document.getElementById("search");
    let currentFilter = "all";

    function applyFilters() {{
      const term = search.value.trim().toLowerCase();

      for (const row of rows) {{
        const matchesFilter =
          currentFilter === "all" ||
          (currentFilter === "flagged" && row.dataset.flagged === "true") ||
          row.dataset.gender === currentFilter;
        const matchesSearch =
          !term || row.textContent.toLowerCase().includes(term);

        row.classList.toggle("hidden", !(matchesFilter && matchesSearch));
        row.classList.toggle("flagged", row.dataset.flagged === "true");
      }}
    }}

    for (const button of buttons) {{
      button.addEventListener("click", () => {{
        currentFilter = button.dataset.filter;
        for (const candidate of buttons) {{
          candidate.classList.toggle("active", candidate === button);
        }}
        applyFilters();
      }});
    }}

    search.addEventListener("input", applyFilters);
    applyFilters();
  </script>
</body>
</html>
"""


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate a local QA report for top ranking profile images."
    )
    parser.add_argument("--top-n", type=int, default=500)
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR))
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    entries = aggregate_entries(args.top_n)
    analyze_images(entries)
    attach_credits(entries, build_credit_lookup())
    entries = sort_entries(entries)
    summary = build_summary(entries, args.top_n)

    json_payload = {
        "summary": summary,
        "entries": [entry_to_json(entry) for entry in entries],
    }

    json_path = output_dir / f"ranking-image-qa-top{args.top_n}.json"
    html_path = output_dir / f"ranking-image-qa-top{args.top_n}.html"

    json_path.write_text(
        json.dumps(json_payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    html_path.write_text(
        build_html(entries, summary, output_dir, args.top_n),
        encoding="utf-8",
    )

    print(
        json.dumps(
            {
                "topN": args.top_n,
                "json": str(json_path),
                "html": str(html_path),
                **summary,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
