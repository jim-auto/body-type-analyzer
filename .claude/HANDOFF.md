# Claude Handoff: Cup QA + Pose Gate + Mask Fix + Image Refresh

Updated: 2026-04-19 JST (extended session, after `b1d1fab`)

Repository: local checkout of `body-type-analyzer` (path varies by workstation)

Public site: `https://jim-auto.github.io/body-type-analyzer/`

Analyze page: `https://jim-auto.github.io/body-type-analyzer/analyze`

Latest deployed commits (top is newest):

```text
3b34158 Reword cup feature box legend to acknowledge multi-region extraction
107c740 Refresh 47 more lowest-quality ranking profile images (batch 4)
095041f Final handoff refresh covering mask fix and image batches 2-3
b1d1fab Refresh 47 more lowest-quality ranking profile images (batch 3)
d927dac Fix body mask polygon drawing inward instead of outward
8e769d3 Record CUP_PRIOR_EXPONENT tuning result in handoff docs
a3bba51 Surface Pose keypoint state in visualization legend
cbd5c7f Refresh 47 more lowest-quality ranking profile images (batch 2)
3b6d45c Refresh handoff docs after pose gate and warning rework
d3c7056 Switch low-mask warning to direct shoulder-position signal
007ebdf Gate Pose ROI on torso landmarks being inside frame
a3873ee Show pose keypoint dots on cup visualization
49208cc Refresh 48 lowest-quality ranking profile images (batch 1)
96adf78 Correct stale ui-avatars count in handoff docs
2b768d6 Update handoff for cup QA + bias fix session
fd628f3 Reweight cup voting by inverse class frequency
fd02fb9 Add low-mask warning and neighbor cup distribution chip
bc90a08 Add cup visualization QA harness script
```

Latest successful GitHub Pages workflow:

```text
Run id: 24616569527
Commit: 3b34158
URL: https://github.com/jim-auto/body-type-analyzer/actions/runs/24616569527
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

10. **`cbd5c7f` + `b1d1fab` Two more image refresh batches.** Same recipe as `49208cc` (batch 1): generate a worst-N list sorted by image area, fetch via Bing with `--top-n 0 --refresh-existing --preserve-names-order`, run `npm run optimize:images` for webp conversion, regenerate ranking. Cumulative flag count across all three batches: 406 → 358 → 318 → 273 (142 reduction = ~35 % of the starting flag pool fixed). Three names keep failing in every batch (Bing returns no candidate passing the `--min-side 300` floor); they likely need a manual source.

11. **`a3bba51` Pose keypoint visibility polish.** Pose dots were rendering but hard to see — off-canvas landmarks were silently clipped, so users concluded pose wasn't running. Fix: in-frame dots grow to 16 px with stronger ring, off-frame dots are clamped to the image edge with a dashed outline and `data-in-frame="false"`, and the Poseランドマーク legend now shows a three-row text summary (検出 N / 5, 画像内 names, 画像外 names) with a closing sentence explaining whether the chest ROI used Pose or Crop fallback.

12. **`8e769d3` Tuning exponent tested; 0.5 kept.** Swept `CUP_PRIOR_EXPONENT` ∈ {0.3, 0.5, 0.7} against the 25-image QA set. 0.7 adds two rare-class predictions (E=1, L=1) at a 3 pp leave-one-out accuracy cost; 0.3 narrows the output without gain. 0.5 is Pareto-optimal. Recorded so the next agent doesn't repeat the sweep.

13. **`d927dac` Body mask polygon direction bug fix.** MediaPipe labels shoulders and hips anatomically (subject-relative), so on a forward-facing portrait `leftShoulder.x > rightShoulder.x` (anatomical left = screen right). The old polygon code applied padding as `leftShoulder.x - pad` and `rightShoulder.x + pad`, which pulls both edges INWARD toward the torso center, producing a thin vertical strip down the chest instead of a shoulder-to-shoulder trapezoid. Fix: resolve screen-space left/right via `Math.min` / `Math.max`, then pad outward. Measured impact on Pose ROI cases: mask 8-10 % → 17-22 %. Sample.jpg: 10 % → 24 %. `buildChestBoxFromPose`, `detectUpperBodyMissing`, `computePoseFeatures`, and `areTorsoLandmarksInFrame` were audited and confirmed orientation-independent; no further L/R bugs in `lib/`.

## QA Signals Before vs After

On the 25 publicity-portrait sample set:

```text
Cup histogram:
  start           :  G=4 H=16 I=3 J=2              (H = 64%)
  after fd628f3   :  F=4 G=8 H=8 I=2 J=2 K=1       (H = 32%)

Pose ROI vs Crop fallback:
  start           :  25 / 0   (often extrapolated, silent failure)
  after 007ebdf   :   3 / 22  (Pose only when hips actually visible)

Mask coverage avg:
  start           :  ~12 %
  after 007ebdf   :  ~74 % (Crop fallback rectangles)
  after d927dac   :  ~75 % (Pose polygons now drawn outward correctly)

Mask coverage for Pose ROI subset (3 images):
  start           :   8-10 %  (thin strip down chest)
  after d927dac   :  17-22 %  (full shoulder-to-hip trapezoid)

Manual judgement bucket (OK / Minor / NG / Unknown):
  after everything:  OK 14 / Minor 8 / NG 3 / Unknown 0
```

Leave-one-out cup MAE went from 1.276 to 1.420 after `fd628f3`. That is the cost of removing the H-bias on the training distribution, and is accepted.

Ranking-image-qa flag count:

```text
start               : 406 flagged of 1401 profiles (29 %)
after 49208cc (48)  : 358
after cbd5c7f (47)  : 318
after b1d1fab (47)  : 273
after 107c740 (47)  : 226  (total −180, ~44 % fixed)
```

Cup feature box visualization caveat (added in `3b34158`): the rose
dashed box on the result page is the primary `top` region of the
focus crop only. The actual cup model also pulls features from
`mid`, `topCenter`, and `torsoCenter`. The legend now spells this
out so users do not assume only the visible band feeds the model.

## Verification Baseline

```text
npm run lint   0 errors, 11 warnings (existing baseline only; one fewer than last handoff because tmp-playwright-diagnose.mjs was deleted this session)
npm test       12 suites, 145 tests passed
npm run build  Compiled successfully, prerendered /, /analyze, /credits
```

`npx tsc --noEmit` still fails on pre-existing strictness issues in `app/__tests__/cup-data.test.ts`, `lib/diagnosis-model.ts`, `lib/profile-estimates.ts`. The build uses `typescript.ignoreBuildErrors: true`.

## Important Local State

- `.claude/settings.local.json` — intentionally ignored, do not overwrite.
- `local-data/cup-visualization-qa/` — 25 screenshots + manifest + report + findings, gitignored.
- `local-data/__check_sample.mjs` — ad-hoc Playwright script for a single image; handy for user-supplied samples.
- `tmp-playwright-diagnose.mjs` was deleted this session (was an unused debug script with a leaked path).

## Recommended Next Tasks (priority order)

1. **Continue the image-quality refresh.** After 4 batches (48+47+47+47 fetched), `ranking-image-qa` flag count is down from 406 → 226. Continue with the same recipe: generate next-50 target list from `local-data/qa/ranking-image-qa-top500.json` sorted by `width × height`, run `python scripts/fetch-bing-ranking-profile-images.py --only-names-file <list> --refresh-existing --top-n 0 --preserve-names-order --gender all --limit 50 --min-bytes 12000 --min-side 300`, then `npm run optimize:images`, then `node scripts/generate-ranking.mjs`. `--top-n 0` is mandatory — default 100 silently limits the scan. About 3 names fail every batch (`八木あずさ`, `堀川奈美`, etc.) and need either a manual source or a wider `--min-side` floor.

2. **Add stress-case images to the QA harness.** Current 25-sample set is all standard publicity portraits. Adding seated, side-facing, multi-person, very-low-resolution, and busy-background cases would let the next person verify whether A-E predictions ever appear (they didn't in the current sample, but it's plausibly fine).

3. **Tune `CUP_PRIOR_EXPONENT`.** Done in this session. 0.5 is Pareto-optimal versus 0.3 and 0.7 (see commit `8e769d3`). Re-tune only if the training distribution or user feedback changes.

4. **Consider a mild large-cup boost in `voteCups`.** Previously `+0.35`, now `0`. A small value like `0.10` could be safe if genuinely high-cup gravure images start under-predicting after real-world feedback.

5. **Lint warnings cleanup.** 11 existing warnings, mostly Next.js `<img>` hints and unused variables. Low priority maintenance.

6. **Python pose-feature parity.** `scripts/generate-diagnosis-model.py` computes pose features for the training set. The browser `computePoseFeatures` this session was audited and is orientation-symmetric (uses distances + averages, no L/R assumption), so there is no parity bug, but next time the model is regenerated it is worth re-confirming both sides produce identical feature vectors on the same MediaPipe output.

## User Preferences

Short Japanese/romaji ("yattekou", "tugi nanisuru?", "tyanto playwight de dousakakuni site"). Pragmatic execution over long discussion. Values:

- deployed results, not plans
- Playwright proof against the public URL, not just build/test
- honest caveats (one sample is not validation of model accuracy)
- terse responses

Always re-run `scripts/verify-cup-visualization.mjs` after any change to `lib/diagnosis-model.ts`, `lib/image-analyzer.ts`, or `public/data/diagnosis-model.json`, and report the new histogram alongside lint/test/build.

Never include local filesystem paths that contain a real username. Anything resembling `C:\Users\<name>\...` belongs in `.claude/settings.local.json` or untracked scratch files, never in tracked docs or commit messages.
