# Handoff Plan For Claude

Updated: 2026-04-14 JST
Repo: `body-type-analyzer`
Public site: `https://jim-auto.github.io/body-type-analyzer/`

## 1. Current Model Performance

Female (149 entries, 22+ feature sets):

- Height LOOCV MAE: `4.89cm`, 3-split: `~4.4cm`
- Cup G MAE: `1.07` (within1 71%), Cup F MAE: `0.81` (within1 81%)
- Cup distribution balanced: A:26, B:31, C:18, D:19, E:11, F:16, G:14, H:14
- Height models: `heightPrimary k=5 + heightHistFull k=9 + heightDctFull k=15`
- Cup models: `cupSecondary k=3 + cupHistTop k=13 + cupPose k=1`

Male (66 entries, 9 feature sets):

- Height LOOCV MAE: `4.15cm`

## 2. Key Architecture Changes in This Session

- Z-score normalization, histogram/LBP/DCT/HOG features, pose features
- Height-only horizontal flip augmentation
- Gender selection on AI diagnosis page (female/male)
- Soft quality handling (warning banner instead of hard reject)
- Cup ensemble: index averaging with large-cup boost (0.35 factor)
- 35 gravure/model images auto-collected via Playwright+Bing
- Gated entry exclusion from model JSON

## 3. Cup Prediction Architecture

Three models vote by averaging cup indices:
1. `cupSecondary k=3` - pixel features (good for A-E)
2. `cupHistTop k=13` - histogram features (style-semi-invariant)
3. `cupPose k=1` - body proportions from MediaPipe (style-invariant, good for F-H)

When any model predicts F+, a boost factor (0.35) pulls the average upward.
This prevents the A-D majority in training data from dominating large-cup predictions.

## 4. What Was Tried

- CNN features (MobileNetV2): worse than hand-crafted
- Expanding trusted data sources: quality too low
- Class-balanced kNN voting: too aggressive
- Regression-only cup prediction: hurt A-B accuracy
- Various pose weight ratios: trade-off between A-B and G-H

## 5. Image Collection Pipeline

```bash
# Playwright + Bing image search (automated)
python scripts/add-busty-profiles.py  # batch add profiles
# Images downloaded to local-data/training-images/ (gitignored)
```

## 6. Verification

```bash
npm test -- --runInBand   # 100 tests
npm run build
```

## 7. Useful Commands

```bash
npm run generate:diagnosis-model
python scripts/generate-male-ranking-model.py
node scripts/generate-ranking.mjs
```
