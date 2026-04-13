# Handoff Plan For Claude

Updated: 2026-04-12 JST
Repo: `body-type-analyzer`
Public site: `https://jim-auto.github.io/body-type-analyzer/`
Current HEAD: `c2b9f21`

## 1. Current Model Performance

Height:

- LOOCV MAE: `4.560cm`
- 3-split MAE: `3.992cm`
- 70% coverage: `+/-5.0cm`
- LOOCV within2: `38.8%`

Cup:

- LOOCV MAE: `1.017`
- LOOCV within1Rate: `78.4%`
- Holdout MAE: `0.818`

Model: `116` active entries, `22` feature sets, `9` extraction modes.

## 2. Feature Extraction Modes

- `gray` - raw grayscale pixel values
- `profile` - row/column mean projections
- `edge` - gradient-based edge detection
- `gray_histogram` - 16-bin pixel intensity histogram
- `edge_histogram` - 16-bin edge magnitude histogram
- `lbp` - Local Binary Pattern texture histogram
- `dct` - Discrete Cosine Transform frequency coefficients
- `hog` - Histogram of Oriented Gradients (8 directions)
- `pose` - MediaPipe Pose body proportions (12 dims)

## 3. Active Model Configuration

Height models: `heightPrimary k=5`, `heightHistFull k=9`, `heightDctFull k=15`
Cup models: `cupSecondary k=3`, `cupEdgeTop k=3`, `cupHistTop k=13`
Weight preset: `height-gate-cup-soft`
Preprocessing: `height-raw-focused-ensemble` with height-only horizontal flip augmentation

## 4. Architecture

- Z-score normalization per feature dimension (stored in model JSON)
- Gated entries excluded from model JSON (192 total profiles, 116 active)
- Soft quality handling (warning banner instead of hard reject)
- AI ranking weight: female 0.7, male 0.3
- Ranking UI shows AI accuracy info banner
- MediaPipe Pose: Python mediapipe for training, browser @mediapipe/tasks-vision via CDN

## 5. What Was Tried And Did NOT Work

- **Expanding trusted data sources**: lower quality images worsened all metrics
- **CNN features (MobileNetV2)**: generic ImageNet features worse than hand-crafted
- **Flip augmentation on cup features**: asymmetric upper-body features matter
- **LBP/Pose in auto-selection**: not selected over histogram/DCT combinations

## 6. What Would Actually Move The Needle

1. **High-quality training image curation** (requires human judgment)
2. **Domain-specific CNN fine-tuning** (requires GPU + large dataset)
3. **Pose estimation with higher detection rate** (current 59%, need better images)

## 7. Useful Commands

```bash
npm run generate:diagnosis-model
python scripts/generate-male-ranking-model.py
node scripts/generate-ranking.mjs
npm run experiment:diagnosis-model
npm test -- --runInBand
npm run build
```
