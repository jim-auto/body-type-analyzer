# Handoff Plan For Claude

Updated: 2026-04-11 JST
Repo: `body-type-analyzer`
Public site: `https://jim-auto.github.io/body-type-analyzer/`
Current HEAD: `04fca3f` (`Add diagnosis experiment presets`)

This file is a clean handoff note for the next agent.
It replaces the older mojibake-heavy `PLAN.md` with an ASCII-only summary.

## 1. What The User Wants

The user wants to keep improving the image-based estimate quality.
The user explicitly prefers iterative experimentation over theory-only discussion:

- try multiple methods
- collect evidence
- keep the best changes
- continue pushing practical improvements

The current work has focused on:

- preprocessing variants
- source weighting
- stability checks
- worst-case inspection
- exact-feature collision diagnostics
- low-information image mitigation

## 2. Current Repository State

The working tree is dirty and contains meaningful local work that has not been pushed or deployed.
Do not revert these changes.

Modified files at handoff time:

- `docs/diagnosis-experiments.md`
- `lib/__tests__/diagnosis-model.test.ts`
- `lib/__tests__/image-analyzer.test.ts`
- `lib/diagnosis-model.ts`
- `lib/image-analyzer.ts`
- `public/data/diagnosis-model.json`
- `public/data/ranking.json`
- `scripts/generate-diagnosis-model.py`
- `scripts/run-diagnosis-experiments.py`

No `__pycache__` directory remains.

## 3. What Has Been Done Since The Last Deploy

The last pushed/deployed commit in this workspace session is still `04fca3f`.
Everything below is local-only at the moment.

### 3.1 Experiment framework expansion

The model generation and experiment scripts were extended to support:

- multiple preprocessing presets
- multiple source/quality/collision weighting presets
- fixed holdout evaluation
- 3-split stability snapshots
- worst-case extraction
- exact-feature collision diagnostics
- low-information quality diagnostics

Main files:

- `scripts/generate-diagnosis-model.py`
- `scripts/run-diagnosis-experiments.py`
- `docs/diagnosis-experiments.md`

### 3.2 Runtime weighting support

Runtime support was added so the shipped model can use:

- `featureWeights`
- zero-weight entry skipping
- safer weighted mean / vote fallbacks
- optional stability metadata in the model types

Main file:

- `lib/diagnosis-model.ts`

### 3.3 Runtime low-information gate

A new runtime-only gate was added in `lib/image-analyzer.ts`.

It computes image quality metrics on the focused crop and rejects images that look like the known low-information collision cluster.

Current thresholds:

- `brightnessMean > 0.88`
- `contrastStddev < 0.09`
- `edgeMean < 0.03`
- `entropy < 2.2`

Relevant exports now exist in `lib/image-analyzer.ts`:

- `DiagnosisInputQualityError`
- `DIAGNOSIS_INPUT_QUALITY_ERROR_MESSAGE`
- `buildDiagnosisImageQualityMetrics(...)`
- `isLowInformationDiagnosisImageQuality(...)`
- `isDiagnosisInputQualityError(...)`

Important: this gate currently affects runtime upload behavior only.
It does not regenerate the training metrics by itself.

## 4. Best Current Experimental Findings

The strongest current result for height is:

- preprocessing: `height-raw-focused-ensemble`
- weight preset: `height-quality-collision-gate`

The strongest current result for cup holdout MAE is:

- preprocessing: `focused-shared`
- weight preset: `uniform`

This is already documented in `docs/diagnosis-experiments.md`.

### 4.1 Current generated metrics

Taken from `public/data/diagnosis-model.json` at handoff time:

- `generatedAt`: `2026-04-11T06:26:05.899499+00:00`
- model version: `2` (z-score normalized features + histogram feature sets)
- height training/LOOCV MAE: `4.767241` (was `4.818966`)
- height fixed holdout MAE: `4.181818` (was `4.227273`)
- height fixed holdout within `+/-2cm`: `0.409091`
- cup training/LOOCV MAE: `1.0` (was `1.008621`)
- cup fixed holdout MAE: `0.681818`
- cup fixed holdout within `+/-1`: `0.909091`
- cup within1Rate (LOOCV): `0.75` (was `0.732759`)

Current model selections in `public/data/diagnosis-model.json`:

- height:
  - `heightPrimary k=5`
  - `heightEdgeFull k=15`
  - `heightEdgeCenter k=9`
- cup:
  - `cupSecondary k=3`
  - `cupCenter k=5`
  - `cupEdgeTop k=5`

### 4.2 Model improvements applied

- Z-score feature normalization per dimension per feature set
- Histogram features added: `heightHistFull` and `cupHistTop`
- Normalization stats stored in model JSON for runtime normalization
- Ranking AI weight increased: female 0.5 -> 0.7, male 0.15 -> 0.3

### 4.2 Important interpretation

The current default is good for height.
Cup still looks strong on the single fixed holdout, but the 3-split average is worse.
That means cup performance is probably flattered by the current 22-case holdout.

This is the main reason not to overclaim cup quality yet.

## 5. What The Diagnostics Show

The key learning is now very clear:

- source weighting alone does not move results much
- preprocessing matters more
- exact-feature collisions are real and large
- the worst offenders are low-information idolprof-family images

### 5.1 Collision pattern

From `docs/diagnosis-experiments.md`:

- there are collision groups of size `58`
- those groups span many distinct heights and multiple cup labels
- the main families are `idolprof`, `idolprof.com`, `idolprof-idolprof`, `idolprof-idolprof.com`

This means some images collapse to effectively the same feature vector while their labels differ heavily.

### 5.2 Worst-case quality pattern

The repeated bad cluster has metrics roughly like:

- brightness around `0.934`
- contrast around `0.061`
- edge mean around `0.015`
- entropy around `1.03`
- aspect ratio around `1.0`

These are extremely low-information images.
They look much closer to a flat placeholder/profile style crop than a useful body photograph.

### 5.3 Practical conclusion

The dominant next levers are:

- feature-collision mitigation
- input quality rejection or warning
- stronger feature design

The dominant next lever is not another small source-weight tweak.

## 6. What Is Already Verified

The following commands passed after the recent runtime gate work:

```bash
npm test -- lib/__tests__/image-analyzer.test.ts app/__tests__/analyze.test.tsx lib/__tests__/diagnosis-model.test.ts --runInBand
npm run build
```

Notes:

- `app/__tests__/analyze.test.tsx` passes
- `lib/__tests__/image-analyzer.test.ts` now includes helper coverage for low-information detection
- `lib/__tests__/diagnosis-model.test.ts` was already relaxed slightly earlier to allow current height LOOCV MAE

## 7. Important Known Gaps

### 7.1 Runtime gate is not surfaced cleanly in the UI yet

`lib/image-analyzer.ts` now throws `DiagnosisInputQualityError` for low-information uploads.
However, `app/analyze/page.tsx` still catches errors generically and shows the generic load-failure message.

So the user-facing UX is not finished.
Behaviorally the upload is blocked, but the explanation is still weak.

Recommended fix:

- update `app/analyze/page.tsx`
- detect `DiagnosisInputQualityError`
- show `DIAGNOSIS_INPUT_QUALITY_ERROR_MESSAGE`
- add a page test for that message

This is the first thing Claude should probably finish.

### 7.2 Generated JSON does not include top-level default strategy labels

When queried directly, `public/data/diagnosis-model.json` does not currently expose:

- `defaultHeightStrategy`
- `defaultCupStrategy`

The useful labels do exist under:

- `metrics.height.strategy`
- `metrics.cup.strategy`

If a top-level summary field is wanted, add it in `scripts/generate-diagnosis-model.py`.

### 7.3 Runtime gate is not yet reflected in evaluation numbers

The current holdout numbers are from the generated model and experiment scripts.
They do not represent "post-gate user-facing effective MAE" on uploads.

If you want to claim the gate improved practical quality, add an evaluation mode that excludes gated examples and reports before/after.

### 7.4 Avoid broad encoding cleanup unless explicitly asked

Some files render with mojibake in this terminal.
Do not do a repo-wide encoding conversion as a side task.

Only touch the exact file and lines you need.
The new `PLAN.md` is ASCII-only on purpose to avoid repeating that problem.

## 8. Recommended Next Actions For Claude

Priority order:

### Priority 1: Finish the low-quality UX

Goal:

- make the runtime gate understandable to the user

Suggested work:

1. Update `app/analyze/page.tsx` to recognize `DiagnosisInputQualityError`.
2. Show a dedicated message such as the exported `DIAGNOSIS_INPUT_QUALITY_ERROR_MESSAGE`.
3. Add a regression test in `app/__tests__/analyze.test.tsx`.
4. Keep the generic message for actual decoding failures.

Why this is first:

- the runtime protection already exists
- the product UX is incomplete
- this is a small, high-signal patch

### Priority 2: Quantify the effect of the quality gate

Goal:

- turn the gate from a heuristic into measured evidence

Suggested work:

1. Add an experiment mode in `scripts/generate-diagnosis-model.py` or `scripts/run-diagnosis-experiments.py`.
2. Report metrics with and without excluding gated low-information samples.
3. Separate the effect on:
   - height MAE
   - height within `+/-2cm`
   - cup MAE
   - cup within `+/-1`

This will answer whether the runtime gate should remain a hard reject, become a warning, or be softened into a confidence penalty.

### Priority 3: Reduce collision risk at the feature level

Goal:

- make the model less likely to collapse unrelated images into identical vectors

Concrete directions:

1. Add a small new feature family that is less collision-prone than the current gray/profile/edge mix.
2. Try normalized edge histograms or coarse directional gradients.
3. Try feature normalization per feature set before distance calculation.
4. Report whether the size-58 collision groups shrink.

Important:

- do not blindly add more weighting knobs before collision size actually changes

### Priority 4: Consider soft quality handling instead of hard reject

If the hard gate feels too aggressive, a softer path is:

- keep the upload valid
- lower confidence sharply
- show a warning banner
- optionally suppress "similar celebrities" when quality is too low

This may be a better product experience if the user dislikes outright blocking.

## 9. Exact Files To Look At First

If Claude resumes work, start here:

- `PLAN.md`
- `docs/diagnosis-experiments.md`
- `scripts/generate-diagnosis-model.py`
- `scripts/run-diagnosis-experiments.py`
- `lib/diagnosis-model.ts`
- `lib/image-analyzer.ts`
- `app/analyze/page.tsx`
- `app/__tests__/analyze.test.tsx`
- `lib/__tests__/image-analyzer.test.ts`

## 10. Useful Commands

General:

```bash
git status --short
git diff --name-only
```

Model generation:

```bash
npm run generate:diagnosis-model
node scripts/generate-ranking.mjs
```

Experiment report:

```bash
npm run experiment:diagnosis-model
```

Verification:

```bash
npm test -- --runInBand
npm run build
```

Focused verification:

```bash
npm test -- lib/__tests__/image-analyzer.test.ts app/__tests__/analyze.test.tsx lib/__tests__/diagnosis-model.test.ts --runInBand
```

## 11. Suggested Short-Term Exit Criteria

If Claude continues immediately, a good short-term stopping point is:

1. low-quality upload shows a dedicated message in the UI
2. analyze page test covers that path
3. build and tests pass
4. `PLAN.md` remains accurate
5. optionally push/deploy only after the user asks

## 12. One-Line Executive Summary

The strongest current height configuration is already identified, the largest remaining quality problem is low-information collision-heavy images, and the next sensible move is to finish the product-side low-quality handling before running the next round of collision-focused experiments.
