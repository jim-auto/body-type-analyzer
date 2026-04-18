# Claude Handoff: Cup QA + Pose Gate + Image Refresh

Updated: 2026-04-18 JST (late session, after `d3c7056`)

Repository: local checkout of `body-type-analyzer` (path varies by workstation)

Public site: `https://jim-auto.github.io/body-type-analyzer/`

Analyze page: `https://jim-auto.github.io/body-type-analyzer/analyze`

Latest deployed commits (top is newest):

```text
d3c7056 Switch low-mask warning to direct shoulder-position signal
007ebdf Gate Pose ROI on torso landmarks being inside frame
a3873ee Show pose keypoint dots on cup visualization
49208cc Refresh 48 lowest-quality ranking profile images
96adf78 Correct stale ui-avatars count in handoff docs
2b768d6 Update handoff for cup QA + bias fix session
fd628f3 Reweight cup voting by inverse class frequency
fd02fb9 Add low-mask warning and neighbor cup distribution chip
bc90a08 Add cup visualization QA harness script
```

Latest successful GitHub Pages workflow:

```text
Run id: 24604146453
Commit: d3c7056
URL: https://github.com/jim-auto/body-type-analyzer/actions/runs/24604146453
```

## What This Session Produced

Nine commits in order. Each is a focused, deployable step.

1. **`bc90a08` Cup visualization QA harness.** `scripts/verify-cup-visualization.mjs` walks a curated 25-image sample set, uploads each to the analyze page, captures screenshots plus a per-image manifest, and writes `local-data/cup-visualization-qa/{manifest.json,report.md}` (gitignored). Accepts `--url`, `--limit`, `--only`, `--headed`, `--fail-fast`, `--timeout-ms`, `--out`. Later extended to also export pose keypoint coordinates and per-image pose stats.

2. **`fd02fb9` Low-mask warning + neighbor cup chip.** `app/analyze/page.tsx` gained an amber warning when mask coverage ≤ 5% and a chip on the cup card showing the 3-nearest-neighbor cup distribution. The mask-coverage warning was later replaced in `d3c7056` with a shoulder-based signal; the neighbor chip stays.

3. **`fd628f3` Class-frequency cup vote reweighting.** Training data is 67% F-H. Previous inference piled on with a `+0.35` bias toward the largest cup. Both reversed: `weightedCupVote` multiplies by `(totalCount / cupCount)^0.5`, and `voteCups` no longer boosts large cups. Cup metrics in `public/data/diagnosis-model.json` patched surgically (6 lines; no formatting drift). `public/data/ranking.json` regenerated.

4. **`2b768d6` + `96adf78` Handoff doc refresh.** Fresh section on top of PLAN.md / HANDOFF.md. The "492 female + 499 male ui-avatars" figure in PLAN section 9 was found to be stale (actual = 0) and replaced with the real quality gap from `ranking-image-qa`.

5. **`49208cc` Refresh 48 lowest-quality ranking images.** The 50 smallest-dimension flagged ranking images (all 120–125 px, 2–3 KB thumbnails) were re-fetched via `scripts/fetch-bing-ranking-profile-images.py`, converted to webp, and re-ranked. Flag count 406 → 358. Two names returned no usable Bing candidate and were left alone. `--top-n` defaults to 100 and must be set to `0` when targeting bottom-rank names.

6. **`a3873ee` Pose keypoint dots.** Five colored dots (nose=emerald, shoulders=cyan, hips=fuchsia) now overlay the cup-visualization image, populated from MediaPipe Pose landmarks. `DiagnosisVisualizationOverlay.poseKeypoints` is the new exported field. Legend entry explains that misplaced hip dots mean misplaced chest ROI.

7. **`007ebdf` Pose hip-visibility gate.** The QA harness showed 22 of 25 publicity portraits had MediaPipe hip landmarks extrapolated below the image frame (y values 1.06–2.57). The extrapolated hips pulled the chest ROI box too low and produced tiny mask polygons. `buildChestBoxFromPose` and `buildBodyMaskVisualization` now require all four torso landmarks to lie within `[0, 1]`; otherwise the chest box falls back to a focus-crop rectangle. Post-fix QA: Pose ROI 25 → 3, Crop fallback 0 → 22, avg mask coverage 12% → 74%.

8. **`d3c7056` Shoulder-based upper-body warning.** The old `bodyMaskCoverage ≤ 0.05` warning stopped firing once the hip gate made fallback masks large. Replaced with `detectUpperBodyMissing(landmarks)`: true when shoulders are out of frame or shoulder y > 0.8. Flag plumbed through `DiagnosisVisualizationOverlay.isUpperBodyMissing` and consumed directly by the analyze page. Also removed a leaked local-machine path from HANDOFF.md at the same time.

9. **History rewrite (filter-repo).** One earlier commit briefly contained a `C:\Users\<name>\...` path in HANDOFF.md. `git filter-repo --replace-text` stripped it from every reachable commit, after a `backup/before-strip` tag was placed. Origin was re-added and `git push --force` published the rewrite. Verified: `git log --all -p` now contains zero hits for the user-path pattern. (The only remaining "<redacted>" substring in all history is the image filename `suzuki_ryohei.webp`, i.e. 鈴木亮平, which is an unrelated celebrity name.)

## QA Signals Before vs After

On the 25 publicity-portrait sample set:

```text
Cup histogram:
  before fd628f3:  G=4 H=16 I=3 J=2               (H = 64%)
  after  fd628f3:  F=4 G=8 H=8 I=2 J=2 K=1       (H = 32%)
  after  007ebdf:  same distribution (unrelated)

Pose ROI:
  before 007ebdf:  25 of 25 (often extrapolated and wrong)
  after  007ebdf:  3 of 25 (only when hips actually visible)

Mask coverage avg:
  before 007ebdf:  ~12%
  after  007ebdf:  ~74%

Manual judgement bucket (OK / Minor / NG / Unknown):
  after everything:  OK 14 / Minor 8 / NG 3 / Unknown 0
```

Leave-one-out cup MAE went from 1.276 to 1.420 after `fd628f3`. That is the cost of removing the H-bias on the training distribution, and is accepted.

## Verification Baseline

```text
npm run lint   0 errors, 12 warnings (existing baseline only)
npm test       12 suites, 143 tests passed
npm run build  Compiled successfully, prerendered /, /analyze, /credits
```

`npx tsc --noEmit` still fails on pre-existing strictness issues in `app/__tests__/cup-data.test.ts`, `lib/diagnosis-model.ts`, `lib/profile-estimates.ts`. The build uses `typescript.ignoreBuildErrors: true`.

## Important Local State

- `.claude/settings.local.json` — intentionally ignored, do not overwrite.
- `local-data/cup-visualization-qa/` — 25 screenshots + manifest + report + findings, gitignored.
- `local-data/__check_sample.mjs` — ad-hoc Playwright script for a single image; handy for user-supplied samples.
- `tmp-playwright-diagnose.mjs` was deleted this session (was an unused debug script with a leaked path).

## Recommended Next Tasks (priority order)

1. **Another image-quality batch.** `ranking-image-qa` still flags 358 profiles mostly for `small-dimension` + `tiny-file`. Fetch the next 50 worst with the same `scripts/fetch-bing-ranking-profile-images.py --only-names-file <list> --refresh-existing --top-n 0 --preserve-names-order` recipe, then `npm run optimize:images`, then `node scripts/generate-ranking.mjs`. Remember `--top-n` default is 100 — must be `0` for full-list coverage.

2. **Add stress-case images to the QA harness.** Current 25-sample set is all standard publicity portraits. Adding seated, side-facing, multi-person, very-low-resolution, and busy-background cases would let the next person verify whether A-E predictions ever appear (they didn't in the current sample, but it's plausibly fine).

3. **Tune `CUP_PRIOR_EXPONENT`.** Currently 0.5 (sqrt smoothing). Try 0.4 or 0.6 and re-run QA. Too low and the large-cup bias comes back; too high and honest gravure images under-predict.

4. **Consider a mild large-cup boost in `voteCups` if tuning 3 doesn't suffice.** Previously `+0.35`, now `0`. A small value like `0.10` could be safe.

5. **Lint warnings cleanup.** 12 existing warnings, mostly Next.js `<img>` hints and unused variables. Low priority, pure maintenance.

## User Preferences

Short Japanese/romaji ("yattekou", "tugi nanisuru?", "tyanto playwight de dousakakuni site"). Pragmatic execution over long discussion. Values:

- deployed results, not plans
- Playwright proof against the public URL, not just build/test
- honest caveats (one sample is not validation of model accuracy)
- terse responses

Always re-run `scripts/verify-cup-visualization.mjs` after any change to `lib/diagnosis-model.ts`, `lib/image-analyzer.ts`, or `public/data/diagnosis-model.json`, and report the new histogram alongside lint/test/build.

Never include local filesystem paths that contain a real username. Anything resembling `C:\Users\<name>\...` belongs in `.claude/settings.local.json` or untracked scratch files, never in tracked docs or commit messages.
