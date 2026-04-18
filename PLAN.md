# Copilot Handoff Plan

Updated: 2026-04-18 JST (afternoon session)

Repository: `body-type-analyzer`

Public site: `https://jim-auto.github.io/body-type-analyzer/`

Current live analyze page: `https://jim-auto.github.io/body-type-analyzer/analyze`

Latest deployed commit:

```text
fd628f3 Reweight cup voting by inverse class frequency
fd02fb9 Add low-mask warning and neighbor cup distribution chip
bc90a08 Add cup visualization QA harness script
df6b17e Stabilize cup visualization mask
0698caa Add cup estimate visualization overlay
```

Latest GitHub Pages workflow:

```text
Run id: 24599547865
Status: success
Commit: fd628f39f1d0fb40c1dcd1045f07dfc73482aa41
URL: https://github.com/jim-auto/body-type-analyzer/actions/runs/24599547865
```

Important local state:

- `.claude/settings.local.json` is intentionally ignored and must not be overwritten or reverted.
- `tmp-playwright-diagnose.mjs` is still untracked local debug material from a previous session. It pre-dates today's work and was not committed.
- `local-data/cup-visualization-qa/` contains 25 generated screenshots, manifest.json, report.md, and findings.md. All gitignored.
- `PLAN.md` and `.claude/HANDOFF.md` are kept updated as the running handoff.

## 0. Current Status (2026-04-18 afternoon): Cup QA + Bias Fix Shipped

Three commits shipped this session, in order:

1. **`bc90a08` Add cup visualization QA harness script.** New `scripts/verify-cup-visualization.mjs`. Playwright-driven, walks a curated 25-image set from `public/images/`, opens `/analyze`, captures screenshots and a per-image manifest into `local-data/cup-visualization-qa/`. Writes a `report.md` summarising Pose-ROI vs Crop-fallback, mask coverage, predicted cup, and neighbor cup distribution. Used to generate the rest of this session's evidence.

2. **`fd02fb9` Add low-mask warning and neighbor cup distribution chip.** Two UI changes in `app/analyze/page.tsx`:
   - When `visualization.bodyMaskCoverage <= 0.05`, an amber warning panel appears under the result heading: "上半身が十分に写っていません". Catches face-only crops where cup estimation is meaningless (3 of 25 in the QA set).
   - The cup card now shows a small chip "近傍カップ G:2 / J:1" computed from `result.similarCelebrities[].cup`. Surfaces uncertainty when neighbors disagree.
   - 7 new Jest tests cover both behaviors plus their negative cases.

3. **`fd628f3` Reweight cup voting by inverse class frequency.** Two changes in `lib/diagnosis-model.ts`:
   - `weightedCupVote` multiplies each neighbor's vote by `(totalCount / cupCount)^0.5` (square-root smoothing). This counter-balances training data that was 67% F-H.
   - `voteCups` no longer applies the explicit `+0.35` boost toward the largest predicted cup index.
   - `public/data/diagnosis-model.json` cup metrics were patched in-place from a fresh `evaluateDiagnosisModel()` run. Surgical text-level patch — only 6 lines changed, no formatting drift.
   - `public/data/ranking.json` regenerated to reflect the new estimatedCup values across 1,625 female + 1,000 male profiles.
   - 2 new Jest tests verify low-cup recovery and prediction diversity.

### QA Harness Cup Histogram Across The 25-Image Set

Before vs after the bias fix, on the same 25 publicity-image sample:

```text
Before: G=4 H=16 I=3 J=2                  (4 distinct cups, H = 64%)
After:  F=4 G=8 H=8 I=2 J=2 K=1           (6 distinct cups, H = 32%)
```

Leave-one-out cup MAE moved from 1.276 to 1.420. That is a real metric drift on the training distribution — it is the cost of removing the H-bias. On real-world inputs the spread is a clearer win than the score loss.

### Manual QA Bucket Tally (post-fix, before shipping the fix)

Re-judging `local-data/cup-visualization-qa/findings.md` after visually opening all 25 screenshots:

```text
OK 14 / Minor 8 / NG 3 / Unknown 0
```

The three NG cases are all face-only crops (`isoyama_sayaka`, `inoue_waka`, `sugihara_anri`). All three have mask coverage <= 5% and now trigger the new low-mask warning shipped in `fd02fb9`.

### What Was Verified With Playwright Against The Public URL

- `bc90a08`: smoke check on `fukada_kyoko` returned cup=H, conf=31%, mask=13%, Pose ROI.
- `fd02fb9`: `inoue_waka` (mask 5%) showed the new amber "上半身が十分に写っていません" warning. `baba_fumika` (mask 17%) did not.
- `fd628f3`: full 25-image rerun against production reproduced the new histogram (F=4 G=8 H=8 I=2 J=2 K=1).

### Verification Baseline At This Handoff

```text
npm run lint   0 errors, 12 warnings (existing baseline)
npm test       12 suites, 131 tests passed
npm run build  Compiled successfully, prerendered /, /analyze, /credits
```

`npx tsc --noEmit` still fails on pre-existing unrelated strictness issues in `app/__tests__/cup-data.test.ts`, `lib/diagnosis-model.ts`, `lib/profile-estimates.ts`. The build uses `typescript.ignoreBuildErrors: true` so deploy is unaffected.

## 0.1 Recommended Next Tasks (priority order)

1. **Fill more lower-rank `ui-avatar` profile images.** Pre-cup-QA priority that is still valid. 492 female + 499 male profile entries still use `ui-avatars` placeholders. PLAN section 9 has the bottom-up generation snippet and the `python scripts/fetch-bing-ranking-profile-images.py` flow. Visible quality win, low risk.
2. **Add stress-case images to the QA harness.** Current 25-image sample is dominated by publicity portraits. Adding seated, side-facing, multi-person, very low-resolution, and busy-background cases would test whether A-E cup predictions ever appear (none did in the current set, but it is also possible none should — most of these celebrities really are F+).
3. **Tune the class-prior exponent.** Currently `CUP_PRIOR_EXPONENT = 0.5`. If the user complains predictions are now too low, try 0.4. If still too H-heavy, try 0.6. Keep the regenerated `ranking.json` and patched metrics in lockstep with any change.
4. **Re-introduce a milder large-cup boost in `voteCups` if needed.** The previous `+= 0.35` was removed entirely. A smaller value (e.g., 0.10) could be added back if QA shows under-estimation on genuinely high-cup gravure samples.
5. **Run `node scripts/evaluate-diagnosis-model-benchmark.mjs`** to formally benchmark the new logic against the previous baseline. Note the script duplicates the inference logic in JS — it may need updating to mirror the new class-prior reweighting before its numbers are comparable.

## 0.2 Cup Visualization Section (legacy reference)

The cup visualization itself was added in `0698caa`/`df6b17e` (previous session). The original section 1 below described the QA harness as the next work — that work is now done as `bc90a08`, `fd02fb9`, `fd628f3`. Sections 1-8 below remain useful as background on what the visualization represents, how the QA harness was conceived, and how to extend it; do not treat them as outstanding tasks.

## 1. Original Cup Visualization Handoff Body (legacy)

The user asked whether the new "カップ推定の可視化" is truly valid. The honest answer is:

```text
Current visualization is useful as a debug / sanity-check overlay.
It is not yet proof that cup estimation is correct.
```

The latest shipped feature adds a result-page visualization for female image diagnosis:

- Original uploaded image.
- Focus crop used by the image feature extractor.
- Cup feature range projected back onto the original image.
- Chest ROI estimated from MediaPipe Pose landmarks when available.
- Fallback chest ROI from the upper-centered crop when Pose is not reliable.
- A generated "人物領域マスク" overlay.

The important nuance:

- The first deployed version at `0698caa` tried to use MediaPipe Pose segmentation masks.
- Playwright against the live GitHub Pages site caught a fatal Chromium/MediaPipe abort:

```text
F... image_frame.cc:415] Check failed: 1 == ChannelSize() (1 vs. 4)
Aborted()
```

- That happened when attempting to use the MediaPipe segmentation mask path.
- The follow-up commit `df6b17e` removed `outputSegmentationMasks` and replaced it with a safe generated body-region mask based on Pose torso landmarks or the focus crop.
- Therefore the UI copy was changed from "人物セグメンテーション" to "人物領域マスク".

This means the shipped overlay is intentionally conservative:

- It does not claim to be semantic segmentation.
- It shows where the model is looking and whether the ROI is obviously wrong.
- It should be treated as an inspection/debug tool, not as a validity proof.

### What Was Actually Verified With Playwright

Public URL tested:

```text
https://jim-auto.github.io/body-type-analyzer/analyze?v=df6b17e
```

Sample image used:

```text
public/images/fukada_kyoko.webp
```

Playwright public-site checks all passed:

```text
PASS complete
PASS height
PASS cup
PASS visualization
PASS sourceImageVisible
PASS bodyMaskVisible
PASS bodyMaskDataUrl
PASS roiLegend
PASS cupFeatureLegend
PASS bodyMaskLegend
PASS maskCoverageNumeric
PASS sourceBoxHasArea
PASS maskBoxMatchesSource
```

Observed visualization text:

```text
カップ推定の可視化
人物領域マスク、胸部ROI、実際にカップ特徴量を取る上半身範囲を重ねています。
枠やマスクが大きくずれる画像では推定を参考程度に見てください。
Pose ROI
胸部ROI
肩と腰のランドマークから胸まわりを推定した枠です。
カップ特徴量範囲
推定モデルがカップ用に参照する、フォーカスクロップ上部の範囲です。
人物領域マスク
マスク面積 13%
フォーカスクロップ
輪郭のエッジ量から人物が入りやすい範囲に寄せた前処理です。
```

The public Playwright run did report one harmless request failure:

```text
HEAD https://jim-auto.github.io/body-type-analyzer/ :: net::ERR_ABORTED
```

That did not affect the page flow. The important regression check is that there was no MediaPipe fatal abort after `df6b17e`.

### Current Verification Baseline

Latest local verification after `df6b17e`:

```text
npm run lint
0 errors
12 warnings
```

Warnings are existing/accepted warnings, mostly Next `<img>` warnings and unused script variables. They did not block deploy.

```text
npm test
Test Suites: 12 passed, 12 total
Tests: 121 passed, 121 total
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

Known type-check caveat:

```text
npx tsc --noEmit
```

still fails on existing unrelated type strictness issues around:

- `app/__tests__/cup-data.test.ts`
- `lib/diagnosis-model.ts`
- `lib/profile-estimates.ts`

The GitHub Pages build currently uses `typescript.ignoreBuildErrors: true`, so `npm run build` succeeds. Do not interpret a full `tsc --noEmit` failure as introduced by the cup visualization unless the error points to the changed visualization code.

## 1. Why One Sample Is Not Enough

The sample Playwright check proves that:

- the deployed page loads,
- file upload works,
- diagnosis can complete,
- the visualization section renders,
- the generated body mask renders as a PNG data URL,
- the overlay dimensions align with the original image,
- the dangerous MediaPipe segmentation crash is gone.

It does not prove that:

- the chest ROI is correct across real user photos,
- the cup estimate is accurate,
- the feature crop is causally explaining the predicted cup,
- the model is robust to pose, cropping, background, or multi-person images,
- the generated mask is equivalent to semantic segmentation.

Therefore the next meaningful task is not "add another single sample"; it is a small QA harness for many cases.

## 2. Recommended Next Task: Build A Cup Visualization QA Harness

Goal:

Create a repeatable way to inspect the overlay across many representative images and record whether the chest ROI / cup feature area is plausible.

Recommended shape:

1. Add a Playwright-based QA script, probably under `scripts/`.
2. Use a curated list of local images from `public/images`.
3. For each image:
   - open `/body-type-analyzer/analyze`;
   - upload the image;
   - wait for diagnosis completion;
   - capture a full-page screenshot;
   - capture text summary:
     - estimated height;
     - estimated cup;
     - confidence;
     - chestBoxSource (`Pose ROI` or `Crop fallback`);
     - mask coverage;
     - top similar celebrities;
   - write a manifest JSON/CSV.
4. Store generated QA screenshots under an ignored local folder such as:

```text
local-data/cup-visualization-qa/
```

`local-data/` is already ignored, so this avoids committing screenshots.

5. Add a short Markdown report template that the agent can fill manually:

```text
local-data/cup-visualization-qa/report.md
```

The report should summarize:

- total samples;
- pass/fail/unclear count;
- Pose ROI success rate;
- fallback rate;
- obvious off-target ROI cases;
- screenshots needing review.

Do not commit `local-data/` outputs unless the user explicitly asks. Commit the script and docs only.

### Suggested Initial QA Sample Set

Start with 20-30 images, not hundreds. Use images already present in `public/images`.

Suggested categories:

```text
正面/全身:
- fukada_kyoko.webp
- baba_fumika.webp
- asahina_aya.webp
- kakei_miwako.webp
- koike_eiko.webp

上半身寄り:
- shinozaki_ai.webp
- hara_mikie.webp
- hashimoto_manami.webp
- danmitsu.webp
- isoyama_sayaka.webp

細身/低カップ寄り:
- aragaki_yui.webp
- hamabe_minami.webp
- hashimoto_kanna.webp
- honda_tsubasa.webp
- kitagawa_keiko.webp

グラビア/高カップ寄り:
- inoue_waka.webp
- yanagi_yurina or similar if present
- yasuda_misako.webp
- sugihara_anri.webp
- yunocy.webp

Pose stress cases:
- seated image if present
- side-facing image if present
- cropped portrait if present
- busy background image if present
- low-resolution fallback-looking image if present
```

Before hardcoding names, check files with:

```powershell
Get-ChildItem public/images -Filter *.webp | Select-Object -ExpandProperty Name
```

Some names in the sample list may not exist exactly.

### What To Check Per Screenshot

Use a 4-level manual label:

```text
OK
  Chest ROI is centered on the chest/upper torso and cup feature region includes the relevant upper body.

Minor
  ROI is slightly wide/narrow/high/low but still usable for sanity checking.

NG
  ROI is on face, abdomen, arm, background, another person, or mostly outside the person.

Unknown
  Image is too cropped/ambiguous; cannot judge visually.
```

Also record:

```text
Pose ROI or Crop fallback
mask coverage %
estimated cup
confidence %
nearest neighbor cups
```

If the top similar celebrities have wildly different cup labels, that is useful uncertainty evidence even if the overlay looks acceptable.

## 3. Possible Script Design

Suggested file:

```text
scripts/verify-cup-visualization.mjs
```

Suggested command:

```bash
node scripts/verify-cup-visualization.mjs --url http://localhost:3001/body-type-analyzer/analyze --limit 30
node scripts/verify-cup-visualization.mjs --url https://jim-auto.github.io/body-type-analyzer/analyze?v=$(git rev-parse --short HEAD) --limit 30
```

Script behavior:

- Import `chromium` from `playwright`.
- Use local image paths.
- Reuse one browser instance.
- Open a fresh page per image to avoid leaked MediaPipe state.
- Wait for `networkidle` and then a short hydration delay before upload.
- Upload via `#diagnosis-image`.
- Wait for `Complete` with a generous timeout.
- Wait for region name `カップ推定の可視化`.
- Save screenshot as:

```text
local-data/cup-visualization-qa/screenshots/001_fukada_kyoko.png
```

- Save manifest as:

```text
local-data/cup-visualization-qa/manifest.json
```

Manifest entry shape:

```json
{
  "image": "public/images/fukada_kyoko.webp",
  "status": "passed",
  "estimatedHeight": "158cm",
  "estimatedCup": "Hカップ",
  "confidence": "31%",
  "chestBoxSource": "Pose ROI",
  "maskCoverage": "13%",
  "similarCelebrities": [
    "三苫うみ | 160cm / Hカップ | 89%",
    "神咲紗々 | 160cm / Iカップ | 86%",
    "塚田詩織 | 155cm / Jカップ | 85%"
  ],
  "screenshot": "local-data/cup-visualization-qa/screenshots/001_fukada_kyoko.png"
}
```

If a page crashes or times out:

- capture screenshot,
- capture body text if available,
- record console errors,
- continue to the next image.

Do not stop the whole run on the first failure unless running with `--fail-fast`.

## 4. UI/Product Interpretation Guidance

If QA shows many OK/Minor cases:

- Keep the current overlay as "debug transparency".
- Consider adding a short label such as:

```text
推定に使った上半身範囲の目安です。正確な身体計測ではありません。
```

If QA shows many NG cases:

- Hide the visualization behind a "debug" toggle or label it more cautiously.
- Use the ROI quality to lower confidence or show a warning:

```text
胸部ROIが不安定です。別の画像でお試しください。
```

If fallback rate is high:

- Pose is not robust enough for current images.
- Consider using a dedicated, stable segmentation library only if it can be verified in Playwright and production.
- Do not re-enable MediaPipe `outputSegmentationMasks` without a regression test because it already caused fatal abort in Chromium.

If nearest-neighbor cups are highly mixed:

- Add a "推定ばらつき" indicator.
- Example:

```text
近傍カップ分布: F 1件 / H 1件 / I 1件
```

That may explain uncertainty better than a single confidence percentage.

## 5. Current Implementation Details

Primary files:

```text
app/analyze/page.tsx
lib/image-analyzer.ts
app/__tests__/analyze.test.tsx
```

Important exported type:

```typescript
export type DiagnosisVisualizationOverlay = {
  imageWidth: number;
  imageHeight: number;
  focusBox: RatioBox;
  cupFeatureBox: RatioBox;
  chestBox: RatioBox;
  chestBoxSource: "pose" | "feature-crop";
  bodyMaskDataUrl: string | null;
  bodyMaskCoverage: number | null;
};
```

Important behavior:

- Female analysis returns `visualization`.
- Male analysis does not run the extra Pose/mask visualization path.
- `chestBoxSource` is shown as:
  - `Pose ROI` if Pose torso landmarks are available;
  - `Crop fallback` otherwise.
- The body mask is generated locally on canvas.
- The body mask is not a model segmentation output.

Important code path:

```text
extractDiagnosisFeatures(file)
  -> load image
  -> create source canvas
  -> create focused canvas and focus box
  -> build quality metrics
  -> extract Pose landmarks
  -> extract feature vectors
  -> buildDiagnosisVisualization(...)
```

Do not reintroduce:

```typescript
outputSegmentationMasks: true
```

unless you also add a Playwright regression that uploads an image and confirms no abort on the deployed build.

## 6. Deployment And Verification Commands

Standard pre-deploy:

```bash
npm run lint
npm test
npm run build
git diff --check
git status --short
```

Deploy:

```bash
git add <only relevant files>
git commit -m "<message>"
git push origin main
gh run list --branch main --limit 5 --json databaseId,headSha,status,conclusion,name,url,createdAt
gh run watch <run-id> --exit-status
```

Public smoke:

```powershell
$commit = git rev-parse --short HEAD
$url = "https://jim-auto.github.io/body-type-analyzer/analyze?v=$commit"
(Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30).StatusCode
```

Playwright public smoke should upload a real local image and check the result page, not just HTTP 200.

## 7. User Preference Notes For Next Agent

The user writes short Japanese/romaji commands.

Examples:

```text
yattekou
deploy site!
tyanto playwight de dousakakuni site
plan md wo naganaga to kousin .claude ni hikituguwa
```

Interpretation:

- `yattekou`: go ahead and execute.
- `tyanto playwight de dousakakuni site`: verify with Playwright properly, not only build/test.
- `plan md wo ... .claude ni hikituguwa`: update `PLAN.md` thoroughly and leave a Claude handoff.

The user values:

- deployed results,
- Playwright proof,
- honest caveats,
- not pretending sample verification proves model validity.

When the user asks if something is valid, be direct. In this case, the right answer was that one sample is not enough and the overlay is debug evidence, not proof of estimate accuracy.

## 8. Immediate Next Step If Work Continues

If the user says `yattekou` again, do this:

1. Create `scripts/verify-cup-visualization.mjs`.
2. Make it run against either localhost or public URL.
3. Generate local QA screenshots/manifest under `local-data/cup-visualization-qa/`.
4. Run it on 20-30 representative `public/images/*.webp`.
5. Summarize pass/minor/ng/unknown counts.
6. Only after reviewing the generated screenshots, decide whether the current visualization copy is acceptable or needs further caution.

Do not spend time trying another segmentation model first. The current risk is not "need fancier segmentation"; it is "need evidence across enough varied images."

---

Historical sections below are older handoff notes and may contain stale counts or priorities. Prefer the 2026-04-18 handoff above for current work.

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
