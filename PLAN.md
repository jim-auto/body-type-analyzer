# Copilot Handoff Plan

Updated: 2026-04-16 JST

Repository: `body-type-analyzer`

Public site: `https://jim-auto.github.io/body-type-analyzer/`

Latest deployed commit before this handoff document: `f778e56 Add estimated ranking weights`

Important local state: `.claude/settings.local.json` is modified locally and is unrelated. Do not stage, overwrite, or revert it unless the user explicitly asks.

## 1. Executive Summary

This is a Next.js 16 static GitHub Pages app for celebrity body-style/ranking and image-based AI style diagnosis.

The user has been iterating quickly on the ranking page. The current priorities have been:

1. Show the full ranking set, not only the top 100.
2. Add pagination and search so lower ranks are usable.
3. Expand female profile coverage, especially AV actresses and gravure idols.
4. Add occupation labels and occupation filters.
5. Fill missing profile images, preferably starting from lower ranks now that top/mid ranks have been improved.
6. Avoid "weight unknown" by showing estimated weights when public weights are missing.
7. Keep pushing and deploying after meaningful chunks.

The current live deployment already includes the latest estimated-weight work:

- Female ranking profiles: 1,625 unique people.
- Male ranking profiles: 1,000 unique people.
- Female `estimatedWeight` missing: 0.
- Male `estimatedWeight` missing: 0.
- Female images still using `ui-avatars`: 492.
- Male images still using `ui-avatars`: 499.

The best next task is probably to continue filling missing lower-rank profile images, using the existing Bing image fetch script with a bottom-up target list.

## 2. User Preferences And Working Style

The user writes in Japanese and romaji Japanese, usually in short commands.

Typical intent examples:

- `yattekou` means "go ahead and do it."
- `tugi nanisuru?` means "what should we do next?"
- `push!` means commit and push.
- `deploy sita? sitenainarasite!` means verify deployment; deploy if not deployed.
- `plan md wo ... push` means update `PLAN.md`, commit, push, and leave a clear handoff.

Prefer pragmatic execution over long discussion. If a reasonable assumption is safe, make it and proceed. Give short progress updates in Japanese. The user values visible progress, deployed results, and concrete counts.

## 3. Repository And Runtime Notes

This repo has `AGENTS.md` instructions:

- This is not the Next.js you know.
- Before editing Next.js app code, read the relevant guide in `node_modules/next/dist/docs/`.
- For Client Components, the relevant file already checked during recent work was:
  `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`

Runtime:

- Next.js: `16.2.2`
- React: `19.2.4`
- Static pages are deployed to GitHub Pages.
- `npm run build` uses Turbopack and prerenders `/`, `/analyze`, and `/credits`.

Common commands:

```bash
npm test -- --runInBand
npm run build
npm run lint
node scripts/generate-ranking.mjs
npm run generate:diagnosis-model
python scripts/generate-ranking-image-qa.py --top-n 500
git diff --check
gh run list --limit 5
gh run watch <run-id> --exit-status
```

Line-ending warnings from Git on Windows are expected. They are not failures.

## 4. Current Git/Deploy State At Handoff

Latest pushed code before this handoff:

```text
f778e56 Add estimated ranking weights
60dab25 Fill bottom ranking profile images
1465e3e Fill top 500 ranking profile images
7bf257c Fill top 400 ranking profile images
ce57d3c Fill lower ranking profile images
4a26664 Add ranking weight filter
4f7a3c4 Tune DMM thumbnail source weighting
f4e9300 Import public DMM high-cup training targets
```

The GitHub Pages workflow for `f778e56` completed successfully:

```text
Deploy to GitHub Pages: success
Run id: 24500155346
```

Live JSON was verified with:

```powershell
$url='https://jim-auto.github.io/body-type-analyzer/data/ranking.json?v=f778e56'
```

Live result:

```text
female total=1625 actualNull=1381 estimatedNull=0 range=32-75
male total=1000 actualNull=1000 estimatedNull=0 range=56-73
```

After this `PLAN.md` handoff commit is pushed, check the new commit and workflow again.

## 5. Data Snapshot

Generated from `public/data/ranking.json` on 2026-04-16.

Female categories:

```text
style        1625 entries, local images 1133, ui-avatar 492, remote 0
publicHeight 1625 entries, local images 1133, ui-avatar 492, remote 0
publicCup    1625 entries, local images 1133, ui-avatar 492, remote 0
```

Female unique profile summary:

```text
unique profiles: 1625
actualWeight null: 1381
estimatedWeight null: 0
display weight range: 32-75 kg
local images: 1133
ui-avatar fallback images: 492
```

Male categories:

```text
style        1000 entries, local images 501, ui-avatar 499, remote 0
publicHeight 1000 entries, local images 501, ui-avatar 499, remote 0
```

Male unique profile summary:

```text
unique profiles: 1000
actualWeight null: 1000
estimatedWeight null: 0
display weight range: 56-73 kg
local images: 501
ui-avatar fallback images: 499
```

Generated model/data sizes:

```text
public/data/diagnosis-model.json       33.98 MB, 951 entries
public/data/male-diagnosis-model.json   8.29 MB
public/data/ranking.json                2.87 MB
public/data/profile-occupations.json    0.10 MB
```

Current `public/images` file count:

```text
2249 files
```

## 6. Female Occupation Coverage

Source: `public/data/profile-coverage.json`.

Current female pool:

```text
total: 1625
tagged: 1556
untagged: 69
```

Occupation counts:

```text
gravure     712 / target 800
av          500 / target 500
actress     886 / target 950
model       241 / target 300
talent      585 / target 650
idol        682 / target 750
racequeen    73 / target 100
cosplayer    18 / target 40
announcer    17 / target 25
singer      112 / target 120
wrestler      9 / target 15
```

Reference coverage:

```text
gravurefit F-K cup referenceTotal: 275
matchedProfiles: 134
coverageRate: 48.7%
```

Targets are defined in `lib/profile-occupations.ts`:

- Total female profile goal: 1,800.
- AV target is currently met at 500.
- Gravure, actress, idol, talent, model, racequeen, cosplayer, announcer, singer, and wrestler still have remaining target gaps.

If the user asks "AV女優少なくない?" again, the current answer is: the explicit target of 500 AV actresses has been reached, but more can be added if the product goal changes. The next broad-profile target is total female pool 1,800, with gravure/actress/idol/talent still below target.

## 7. Recent Feature: Estimated Ranking Weights

Commit: `f778e56 Add estimated ranking weights`

Problem:

- Ranking had many `actualWeight: null`, so weight chips and filters were sparse.
- Male ranking had no weight filtering.
- One source outlier had impossible public weight data and needed sanitizing.

Solution:

- Add `estimatedWeight` to both `FemaleRankingEntry` and `MaleRankingEntry`.
- Keep `actualWeight` when valid.
- Treat `actualWeight < 25` or `actualWeight > 95` as invalid and display estimated weight instead.
- Show chips as:
  - `公表xxkg` when public weight exists.
  - `推定xxkg` when public weight is missing.
- Use displayed weight for weight filters.
- Show weight filters for both genders.

Touched files:

```text
lib/ranking.ts
lib/profile-estimates.ts
lib/ranking-builder.ts
components/HomePageClient.tsx
app/__tests__/page.test.tsx
app/__tests__/cup-data.test.ts
public/data/ranking.json
```

Core functions:

```text
getValidActualWeight()
getEstimatedFemaleWeight()
getEstimatedMaleWeight()
getDisplayedWeight()
getWeightChipLabel()
```

Female estimated weight:

- Uses actual height when valid.
- Uses bust when available.
- Uses public/display cup or estimated cup fallback.
- Uses a simple fitted linear formula plus deterministic name jitter.
- Clamp: 35-78 kg.

Male estimated weight:

- Uses height-based BMI with deterministic name jitter.
- BMI base currently `20.5`, intentionally leaner than general-population BMI because this ranking is celebrity-heavy.
- Clamp: 50-98 kg.

Validation before push:

```text
npm test -- --runInBand: 12 suites, 119 tests passed
npm run build: success
npm run lint: success, existing warnings only
git diff --check: no whitespace errors
```

Existing lint warnings are unrelated, mostly unused variables and `<img>` warnings.

## 8. Ranking Page Behavior

Main client component:

```text
components/HomePageClient.tsx
```

Default category:

- Female default: `publicCup`.
- Male default: `style`.

Available categories:

- Female: `style`, `publicHeight`, `publicCup`.
- Male: `style`, `publicHeight`.

Ranking page features now include:

- Full ranking display with pagination.
- 20 profiles per page.
- Page number controls such as `1, 2, 3, 4...`.
- Search by name.
- Female occupation chips on cards.
- Female occupation filter.
- Weight filter for both genders.
- Weight chips with `公表` or `推定`.
- Cup data scarcity warning for very large cups when the training sample is thin.
- Ranking cards show images from `public/images` when available, else `ui-avatars`.

Relevant tests:

```text
app/__tests__/page.test.tsx
app/__tests__/cup-data.test.ts
```

## 9. Ranking Image Pipeline

The remaining image issue is straightforward:

- Female profiles still using `ui-avatars`: 492.
- Male profiles still using `ui-avatars`: 499.
- User specifically noticed lower-rank missing images and preferred filling from lower ranks instead of only top ranks.

Primary script:

```bash
python scripts/fetch-bing-ranking-profile-images.py --help
```

Options:

```text
--only-names
--only-names-file
--top-n
--refresh-existing
--gender {female,male,all}
--limit
--preserve-names-order
--min-bytes
--min-side
--min-ratio
--max-ratio
```

The script:

- Reads `public/data/ranking.json`.
- Targets entries with `ui-avatars`.
- Downloads candidate images from Bing.
- Saves images under `public/images`.
- Updates `lib/source-profiles.ts`.
- Updates `scripts/fetch-source-profiles.mjs` image path mapping.
- Updates `public/data/image-credits.json`.

Current limitation:

- `--top-n` naturally works top-down.
- For bottom-up filling, generate an `--only-names-file` ordered from low ranks upward, then run with `--preserve-names-order`.

Suggested bottom-up target generation command:

```powershell
@'
import json
from pathlib import Path

ranking = json.loads(Path("public/data/ranking.json").read_text(encoding="utf-8"))
targets = []

for gender in ("female", "male"):
    style = next(category for category in ranking[gender] if category["category"] == "style")
    for index, entry in reversed(list(enumerate(style["ranking"], start=1))):
        if "ui-avatars" in entry["image"]:
            targets.append((gender, index, entry["name"]))

Path("local-data").mkdir(exist_ok=True)
with Path("local-data/bottom-ui-avatar-targets.txt").open("w", encoding="utf-8") as file:
    for gender, rank, name in targets:
        file.write(f"{name}\n")

print("targets", len(targets))
print("first 20 bottom-up:")
for row in targets[:20]:
    print(row)
'@ | python -
```

Then fetch in small batches:

```bash
python scripts/fetch-bing-ranking-profile-images.py \
  --only-names-file local-data/bottom-ui-avatar-targets.txt \
  --preserve-names-order \
  --gender all \
  --limit 50 \
  --min-bytes 12000 \
  --min-side 220
```

After fetching:

```bash
node scripts/generate-ranking.mjs
python scripts/generate-ranking-image-qa.py --top-n 500
npm test -- --runInBand
npm run build
git diff --check
```

Then commit and push relevant files:

```bash
git add lib/source-profiles.ts scripts/fetch-source-profiles.mjs public/data/image-credits.json public/data/ranking.json public/images
git commit -m "Fill more lower ranking profile images"
git push origin main
```

Do not use `git add .` because `.claude/settings.local.json` is dirty and unrelated.

## 10. Ranking Image QA

Use:

```bash
python scripts/generate-ranking-image-qa.py --top-n 500
```

Outputs:

```text
local-data/qa/ranking-image-qa-top500.json
local-data/qa/ranking-image-qa-top500.html
```

The QA report flags:

- `ui-avatar`
- `missing-file`
- `tiny-file`
- `small-file`
- `small-dimension`
- `odd-ratio`
- `duplicate-image`
- `inconsistent-image`

Use this to catch wrong-person images, bad crops, duplicate images, and placeholder files before committing.

## 11. Diagnosis Model Status

The diagnosis model work predates the latest ranking work but remains important.

Main files:

```text
scripts/generate-diagnosis-model.py
scripts/generate-male-ranking-model.py
lib/diagnosis-model.ts
lib/image-analyzer.ts
app/analyze/page.tsx
public/data/diagnosis-model.json
public/data/male-diagnosis-model.json
```

Current female diagnosis model:

- `public/data/diagnosis-model.json`
- 33.98 MB
- 951 entries

Current male diagnosis model:

- `public/data/male-diagnosis-model.json`
- 8.29 MB

The app has an `/analyze` page:

- Client-side image analysis.
- Does not upload user images to a server.
- Female analysis estimates height and cup.
- Male analysis estimates height.
- Model performance section has been moved to the bottom of the analyze page.
- User requested wording as "AIスタイル診断", not generic "AI診断".

Important: if editing `/analyze` UI, preserve the current product wording and privacy messaging.

## 12. Diagnosis Training Data Pipeline

Local training data is gitignored:

```text
local-data/training-profiles.json
local-data/training-images/
local-data/pose_landmarker_lite.task
```

Generated model JSON is committed:

```text
public/data/diagnosis-model.json
public/data/male-diagnosis-model.json
```

Useful scripts:

```bash
npm run generate:diagnosis-model
python scripts/generate-male-ranking-model.py
npm run experiment:diagnosis-model
node scripts/evaluate-diagnosis-model-benchmark.mjs
```

Known model notes from prior work:

- Hand-crafted features and pose features worked better than generic CNN features.
- Index-averaging cup ensemble worked better than majority vote.
- Large-cup boost improved F+ support.
- MediaPipe pose features are used in both Python generation and browser runtime.
- Very large cup ranges still have data scarcity warnings in ranking UI.

If retraining, run full tests and build afterward. Also watch model JSON size; GitHub Pages can serve it, but the file is already large.

## 13. Source Profile Data

Primary profile source file:

```text
lib/source-profiles.ts
```

Ranking generation:

```text
node scripts/generate-ranking.mjs
```

Ranking builder:

```text
lib/ranking-builder.ts
```

Occupation generated data:

```text
public/data/profile-occupations.json
public/data/profile-coverage.json
```

Occupation generator:

```text
scripts/generate-profile-occupations.mjs
```

If adding profiles:

1. Update source data or run the relevant collector script.
2. Regenerate occupation data if occupations changed.
3. Regenerate ranking JSON.
4. Run tests/build.
5. Commit generated JSON together with source changes.

## 14. Known Data Quality Issues

Images:

- There are still 991 total unique ranking profiles using `ui-avatars` fallbacks across female and male.
- Some local images may still be wrong-person or low-quality; use QA report.
- Recent work filled a lot of top and bottom images, but not all.

Weights:

- Most female public weights are still missing; display now uses estimates.
- All male weights are estimated because public male weight source data is absent.
- Estimated weights are useful for filtering/display, not authoritative.

Cup data:

- Ranking is based on public cup when available.
- Very large cup categories can be sparse, so UI warns "data insufficient" for scarce cup sizes.
- If the user complains that H or larger cups look overrepresented, check training coverage before changing model logic.

Occupation labels:

- Female occupation tagging is broad and multi-label.
- Some profiles are still untagged.
- AV target is met at 500, but the user may still want more.

Encoding:

- Some older files/tests may look mojibake in PowerShell output due terminal encoding.
- The actual app strings and tests are UTF-8. Avoid "fixing" strings just because console output looks garbled.

## 15. Testing Baseline

Last verified before this handoff:

```text
npm test -- --runInBand
Test Suites: 12 passed, 12 total
Tests: 119 passed, 119 total
```

```text
npm run build
Compiled successfully
Routes:
/
/_not-found
/analyze
/credits
```

```text
npm run lint
0 errors
14 warnings
```

Known lint warnings at that time:

- `formatCoverageText` unused in analyze test/page.
- `maleResult` unused in `app/analyze/page.tsx`.
- Several `<img>` warnings from Next.js.
- `_cupSortValue` unused in `lib/ranking-builder.ts`.
- `clamp` unused in `lib/ranking-estimates.ts`.
- Some script-local unused variables.

These warnings existed before the handoff and did not block deployment.

## 16. Deployment Workflow

Use this standard flow:

```bash
npm test -- --runInBand
npm run build
npm run lint
git diff --check
git status --short
git add <only relevant files>
git commit -m "<message>"
git push origin main
gh run list --limit 5
gh run watch <run-id> --exit-status
```

After deploy, verify live static JSON with a cache-busting query:

```powershell
$commit = git rev-parse --short HEAD
$url = "https://jim-auto.github.io/body-type-analyzer/data/ranking.json?v=$commit"
(Invoke-WebRequest -Uri $url -UseBasicParsing).StatusCode
```

For data-specific checks, parse the JSON from the live URL and print counts. This avoids relying only on GitHub Actions status.

## 17. Suggested Next Tasks

Recommended next task:

1. Generate a bottom-up list of profiles still using `ui-avatars`.
2. Fetch 50 lower-rank images with `scripts/fetch-bing-ranking-profile-images.py`.
3. Regenerate `ranking.json`.
4. Generate image QA and inspect obvious flags.
5. Run tests/build/lint.
6. Commit, push, deploy.

Why this is best:

- The user specifically complained that lower ranks still lack images.
- Weight unknown is already solved with estimated weights.
- AV actress count is at the target of 500.
- The biggest visible quality gap now is profile images.

Alternative next tasks:

- Increase total female pool from 1,625 toward 1,800, focusing on gravure/actress/idol/talent.
- Add more racequeen/cosplayer/announcer/wrestler entries because they are below target.
- Improve image QA by adding a manual wrong-person review list.
- Clean existing lint warnings if the user wants maintenance, but this is lower priority than visible data quality.
- Add UI copy explaining `公表` vs `推定` weight if users may misunderstand the estimates.

## 18. Do Not Do Without Asking

Do not:

- Revert `.claude/settings.local.json`.
- Run destructive Git commands such as `git reset --hard`.
- Stage all files blindly.
- Remove generated data without regenerating it.
- Change Next.js app patterns without checking local Next docs.
- Replace `public/data/ranking.json` manually; use `node scripts/generate-ranking.mjs`.
- Treat estimated weight as public fact in UI copy.
- Use adult/explicit source images for AV profiles. The current image fetch script rejects obvious explicit URLs; keep that behavior.

## 19. Quick Health Commands

Ranking count and image fallback check:

```powershell
@'
import json
from pathlib import Path

ranking = json.loads(Path("public/data/ranking.json").read_text(encoding="utf-8"))

for gender in ("female", "male"):
    seen = {}
    for category in ranking[gender]:
        for entry in category["ranking"]:
            seen.setdefault(entry["name"], entry)

    weights = [
        entry.get("actualWeight")
        if entry.get("actualWeight") is not None
        else entry.get("estimatedWeight")
        for entry in seen.values()
    ]

    print(
        gender,
        "unique", len(seen),
        "ui-avatar", sum("ui-avatars" in entry["image"] for entry in seen.values()),
        "estimatedWeight null", sum(entry.get("estimatedWeight") is None for entry in seen.values()),
        "weight range", (min(weights), max(weights)),
    )
'@ | python -
```

Occupation coverage check:

```powershell
@'
import json
from pathlib import Path

coverage = json.loads(Path("public/data/profile-coverage.json").read_text(encoding="utf-8"))["female"]
print("total", coverage["total"], "tagged", coverage["tagged"], "untagged", coverage["untagged"])
for entry in coverage["occupations"]:
    print(entry["occupation"], entry["count"], entry["percentage"])
'@ | python -
```

Latest workflow:

```bash
gh run list --limit 5
```

## 20. One-Line Handoff

The site is deployed with full 1,625 female / 1,000 male rankings, pagination/search/occupation/weight filters, and estimated weights for all missing public weights; the next visible quality win is to fill the remaining 492 female and 499 male `ui-avatar` profile images, preferably bottom-up using `fetch-bing-ranking-profile-images.py` plus QA.
