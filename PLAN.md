# Handoff Plan For Claude

Updated: 2026-04-13 JST
Repo: `body-type-analyzer`
Public site: `https://jim-auto.github.io/body-type-analyzer/`

## 1. Current Model Performance

Female (116 entries, 22 feature sets):

- Height LOOCV MAE: `4.560cm`, 3-split: `3.992cm`, 70% coverage: `+/-5.0cm`
- Cup LOOCV MAE: `1.017`, within1Rate: `78.4%`
- Height models: `heightPrimary k=5 + heightHistFull k=9 + heightDctFull k=15`
- Cup models: `cupSecondary k=3 + cupEdgeTop k=3 + cupHistTop k=13`

Male (66 entries, 9 feature sets):

- Height LOOCV MAE: `4.152cm`
- Height models: `heightProfile k=3 + heightHistFull k=15 + heightHogFull k=3`

## 2. Feature Extraction (9 modes)

`gray`, `profile`, `edge`, `gray_histogram`, `edge_histogram`, `lbp`, `dct`, `hog`, `pose`

## 3. Key Architecture

- Z-score normalization per feature dimension
- Height-only horizontal flip augmentation at training time
- Gated entry exclusion (low-quality entries removed from model JSON)
- Soft quality handling (warning banner instead of hard reject)
- Gender selection on AI diagnosis page (female: height+cup, male: height only)
- MediaPipe Pose features (Python + browser CDN lazy load)
- Weight preset: `height-gate-cup-soft`
- AI ranking weight: female 0.7, male 0.3
- Ranking UI shows AI accuracy info banner

## 4. What Was Tried And Did NOT Work

- Expanding trusted data sources (lower quality worsened metrics)
- CNN features / MobileNetV2 (generic ImageNet features worse than hand-crafted)
- Flip augmentation on cup features (asymmetric features matter)

## 5. What Would Move The Needle

1. High-quality training image curation (requires human judgment)
2. Domain-specific CNN fine-tuning (requires GPU + large dataset)

## 6. Verification

```bash
npm test -- --runInBand   # 100 tests pass
npm run build             # Static export succeeds
```

## 7. Useful Commands

```bash
npm run generate:diagnosis-model
python scripts/generate-male-ranking-model.py
node scripts/generate-ranking.mjs
npm run experiment:diagnosis-model
```
