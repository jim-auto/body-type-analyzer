# Claude Handoff: Cup QA + Bias Fix Shipped

Updated: 2026-04-18 JST (afternoon session, after `fd628f3`)

Repository: `local checkout of body-type-analyzer (path varies by workstation)`

Public site: `https://jim-auto.github.io/body-type-analyzer/`

Analyze page: `https://jim-auto.github.io/body-type-analyzer/analyze`

Latest deployed commit:

```text
fd628f3 Reweight cup voting by inverse class frequency
fd02fb9 Add low-mask warning and neighbor cup distribution chip
bc90a08 Add cup visualization QA harness script
df6b17e Stabilize cup visualization mask
0698caa Add cup estimate visualization overlay
```

Latest successful GitHub Pages workflow:

```text
Run id: 24599547865
Status: success
Commit: fd628f39f1d0fb40c1dcd1045f07dfc73482aa41
URL: https://github.com/jim-auto/body-type-analyzer/actions/runs/24599547865
```

## What Just Happened (this session)

The session opened with PLAN.md asking the next agent to build a cup-visualization QA harness. That work was completed and shipped, plus two follow-ups suggested by what the harness revealed.

### `bc90a08` Cup visualization QA harness

`scripts/verify-cup-visualization.mjs` is a Playwright harness that walks a curated 25-image set from `public/images/`, opens the analyze page (defaults to localhost dev server, override with `--url`), uploads each image, captures a screenshot, and writes a per-image manifest plus a Markdown report into `local-data/cup-visualization-qa/` (gitignored).

CLI:

```bash
node scripts/verify-cup-visualization.mjs \
  --url https://jim-auto.github.io/body-type-analyzer/analyze \
  --limit 25
```

Useful flags: `--only fukada_kyoko,inoue_waka` to spot-check, `--headed` for a visible browser, `--fail-fast` to stop on first error, `--out <dir>` to redirect output.

### `fd02fb9` Low-mask warning + neighbor cup chip

Two UI additions in `app/analyze/page.tsx`:

1. When `visualization.bodyMaskCoverage <= 0.05`, an amber warning panel appears under the result heading: "上半身が十分に写っていません". Catches face-only crops where the cup estimate is meaningless.
2. The cup card now shows a small chip "近傍カップ G:2 / J:1" computed from `result.similarCelebrities[].cup`. Surfaces uncertainty when the 3 nearest neighbors disagree.

Tests: 7 new Jest cases in `app/__tests__/analyze.test.tsx` cover both behaviors plus their negative cases (male mode, mask null, mask above threshold).

### `fd628f3` Class-frequency cup vote reweighting

The QA harness revealed that all 25 publicity-image samples produced G-J cup. Inspecting `public/data/diagnosis-model.json` showed the training data is heavily skewed: 951 entries total, F-H = 639 / 67%, A-E = 80 / 8%. Combined with an explicit `+0.35` boost in `voteCups` toward the largest predicted index, real-world cup output was always going to land high.

Two changes in `lib/diagnosis-model.ts`:

1. `weightedCupVote` multiplies each neighbor's vote by `(totalCount / cupCount)^0.5` (square-root smoothing). Constant: `CUP_PRIOR_EXPONENT = 0.5`. Adjust if QA shows over- or under-correction.
2. `voteCups` no longer applies the explicit `+0.35` boost.

Pre-computed metrics in `public/data/diagnosis-model.json` were patched in-place from a fresh `evaluateDiagnosisModel()` run. The patch was done as a 6-line surgical text replace, NOT a full rewrite of the 1.8M-line file — that would have created a noise diff of ~87K lines from `0.0` vs `0` and `3.8e-05` vs `0.000038` formatting differences. The script that did the patch was deleted after use; if metrics need to be re-derived, run a one-shot Jest test that calls `evaluateDiagnosisModel()` and prints the values.

`public/data/ranking.json` was regenerated via `node scripts/generate-ranking.mjs` to reflect the new estimatedCup values across 1,625 female + 1,000 male profiles.

Tests: 2 new Jest cases in `lib/__tests__/diagnosis-model.test.ts` verify low-cup recovery (>= 20% of true-low-cup entries are now predicted in A-E range) and prediction diversity (>= 5 distinct cups appear across leave-one-out predictions).

## QA Cup Histogram (proof on the same 25-image sample)

```text
Before fd628f3:  G=4 H=16 I=3 J=2                  (4 distinct cups, H = 64%)
After fd628f3:   F=4 G=8 H=8 I=2 J=2 K=1           (6 distinct cups, H = 32%)
```

Leave-one-out cup MAE moved from 1.276 to 1.420. That is a real metric drift on training distribution and is the cost of removing the H-bias. On real-world inputs the spread is the bigger win.

## Verification Baseline

```text
npm run lint   0 errors, 12 warnings (existing baseline only)
npm test       12 suites, 131 tests passed
npm run build  Compiled successfully, prerendered /, /analyze, /credits
```

Public smoke (post-deploy of `fd628f3`):

```text
node scripts/verify-cup-visualization.mjs \
  --url https://jim-auto.github.io/body-type-analyzer/analyze
→ 25 passed / 0 failed, histogram matches localhost
```

`npx tsc --noEmit` still fails on pre-existing strictness issues in `app/__tests__/cup-data.test.ts`, `lib/diagnosis-model.ts`, `lib/profile-estimates.ts`. The build uses `typescript.ignoreBuildErrors: true` so deploy is unaffected.

## Important Local State

- `.claude/settings.local.json` — intentionally ignored, do not overwrite or revert.
- `tmp-playwright-diagnose.mjs` — untracked debug material from a previous session, do not commit.
- `local-data/cup-visualization-qa/` — 25 generated screenshots + manifest.json + report.md + findings.md. All gitignored. `findings.md` contains the manual judgement bucket tally (OK 14 / Minor 8 / NG 3 / Unknown 0) with per-image notes.
- `PLAN.md` — has a fresh top section (0, 0.1, 0.2) summarizing this session's work and next priorities. Sections 1-8 below 0.2 are legacy from earlier handoffs and clearly labeled as such.

## Recommended Next Tasks (priority order)

1. **Refetch flagged low-quality ranking images.** ui-avatars filling is already DONE (0 ui-avatars across 1625 female + 1000 male as of this handoff — PLAN section 9's "492 female / 499 male" count is stale). The remaining quality gap surfaces from `python scripts/generate-ranking-image-qa.py --top-n 500`: 406 of 1401 unique profiles are flagged, mostly for `small-dimension` (396), `tiny-file` (351), or `small-file` (52). Use `python scripts/fetch-bing-ranking-profile-images.py --refresh-existing` to refetch better-quality versions of the worst offenders.
2. **Add stress-case images to the QA harness.** Current 25-image set is dominated by publicity portraits where the chest is mostly outside the frame. Adding seated, side-facing, multi-person, low-resolution, busy-background cases would test whether A-E predictions ever appear.
3. **Tune `CUP_PRIOR_EXPONENT`.** Currently 0.5 (sqrt smoothing). If the user complains predictions are now too low for genuinely high-cup gravure samples, try 0.4. If still too H-heavy on average people, try 0.6.
4. **Re-introduce a milder large-cup boost in `voteCups` if needed.** Removed entirely in `fd628f3`. A small value (e.g., 0.10) could be added back if QA shows under-estimation on genuine gravure inputs.
5. **Run `node scripts/evaluate-diagnosis-model-benchmark.mjs`** to formally benchmark new vs old. Note the script duplicates the inference logic in JS and may need updating to mirror the new class-prior reweighting before its numbers are comparable.

## User Preferences (recap)

The user writes short Japanese/romaji ("yattekou", "deploy site!", "tsugi nanisuru?", "tyanto playwight de dousakakuni site"). Pragmatic execution beats long discussion. Values:

- deployed results
- Playwright proof against the public URL, not just build/test
- honest caveats (do not pretend a single sample proves model validity)
- terse responses

Always re-run the cup-visualization QA harness after any change to `lib/diagnosis-model.ts` or `public/data/diagnosis-model.json` and report the new histogram alongside the lint/test/build status.
