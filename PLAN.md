# Handoff Plan For Claude

Updated: 2026-04-12 JST
Repo: `body-type-analyzer`
Public site: `https://jim-auto.github.io/body-type-analyzer/`
Current HEAD: `7819a13` (`Add DCT features and height-only flip augmentation`)

This file is a clean handoff note for the next agent.

## 1. What The User Wants

The user wants to keep improving the image-based estimate quality.
The user explicitly prefers iterative experimentation over theory-only discussion:

- try multiple methods
- collect evidence
- keep the best changes
- continue pushing practical improvements

## 2. Current Repository State

The working tree is clean. All changes have been pushed and deployed.

Recent commits (newest first):

- `7819a13` Add DCT features and height-only flip augmentation
- `2f19b38` Fix outdated description text and update CI to Node.js 22
- `62beb84` Add LBP features, soft quality handling, and ranking accuracy display
- `a3cd54d` Re-select robust models with histogram features for better stability
- `c692e0c` Improve AI estimation model with z-score normalization and histogram features

## 3. What Has Been Done In This Session

### 3.1 Z-score feature normalization

Per-dimension z-score normalization applied to all feature sets before kNN distance computation.
Normalization stats (mean/stddev) stored in model JSON for runtime normalization of user uploads.

### 3.2 New feature types added

Seven feature extraction modes now available:

- `gray` - raw grayscale pixel values
- `profile` - row/column mean projections
- `edge` - gradient-based edge detection
- `gray_histogram` - 16-bin pixel intensity histogram
- `edge_histogram` - 16-bin edge magnitude histogram
- `lbp` - Local Binary Pattern texture histogram (16 bins)
- `dct` - Discrete Cosine Transform frequency coefficients

19 feature sets total across height, cup, and similarity.

### 3.3 Model selection optimized

Auto-selection found the best LOOCV models including histogram features:

- Height: `(heightBalanced, 7) + (heightHistFull, 9)`
- Cup: `(cupSecondary, 3) + (cupEdgeTop, 3) + (cupHistTop, 13)`

LBP and DCT features are available as candidates but were not selected
by the auto-selection (histogram features are more effective for this data).

### 3.4 Training-time flip augmentation

Horizontal flip augmentation applied to height features only.
Cup features are NOT flipped because upper-body asymmetric features matter for cup estimation.

### 3.5 Weight preset optimization

New preset `height-gate-cup-soft`:

- Height: hard gate for low-information large collision groups (same as before)
- Cup: soft quality + collision penalties (improves cup holdout MAE)
- This is now the default preset

### 3.6 Gated entry exclusion

Entries with max feature weight < 0.001 are excluded from the model JSON.
This reduced entries from 192 to 116 (40% reduction) with no accuracy impact.

### 3.7 Soft quality handling

Low-quality images are no longer hard-rejected. Instead:

- The analysis runs normally
- A warning banner appears below the upload area
- The user sees both the warning and the results

### 3.8 Ranking improvements

- AI model weight increased: female 0.5 -> 0.7, male 0.15 -> 0.3
- AI accuracy info banner shown on estimated height/cup ranking categories
- Old "seed" description text replaced with accurate AI model description

### 3.9 Infrastructure

- GitHub Actions updated to Node.js 22 with FORCE_JAVASCRIPT_ACTIONS_TO_NODE24
- Male ranking model regenerated with normalization + histogram features

## 4. Current Metrics

From `public/data/diagnosis-model.json`:

- `generatedAt`: latest
- model version: `2` (z-score normalized)
- model entries: `116` (active only, gated entries excluded)
- feature sets per entry: `19`

Height:

- LOOCV MAE: `4.586` (started at `4.819`)
- 3-split MAE mean: `4.053` (started at `4.144`)
- 70% coverage: `+/-5.5cm` (started at `+/-6.0cm`)
- Holdout MAE: `4.455`

Cup:

- LOOCV MAE: `1.017`
- LOOCV within1Rate: `0.784` (started at `0.733`)
- Holdout MAE: `0.818`
- Holdout within1Rate: `0.864`

## 5. What Was Tried And Did NOT Work

### 5.1 Expanding trusted data sources

Added idolprof-wikipedia, oricon, ja.wikipedia.org etc. to trusted sources.
Result: ALL metrics worsened. The new sources have lower image quality.
Reverted to original curated sources.

### 5.2 CNN features (MobileNetV2)

Extracted 1000-dim logits from MobileNetV2, reduced to 32 via PCA.
kNN with CNN features: Height MAE 4.67 (worse than pixel-based 4.59).
Generic ImageNet CNN features are not suited for body shape analysis.
A body-specific CNN would need fine-tuning with more data + GPU.

### 5.3 Flip augmentation on cup features

Horizontal flip on cup features worsened cup metrics significantly.
Cup estimation relies on asymmetric upper-body characteristics.
Fix: apply flip only to height features.

## 6. Known Remaining Issues

### 6.1 Collision groups still exist

58-entry collision groups persist in edge/gray feature sets from low-information
idolprof images. The quality gate zeros their weight, and histogram/LBP features
avoid the collision, but the root images are still low quality.

### 6.2 Cup 3-split vs holdout discrepancy

Cup holdout MAE (0.818) is better than 3-split mean (~1.0).
This suggests the fixed 22-case holdout may flatter cup performance.
Do not overclaim cup quality based on holdout alone.

## 7. What Is Verified

All of the following pass:

```bash
npm test -- --runInBand   # 97 tests pass
npm run build             # Static export succeeds
```

Deployed at: `https://jim-auto.github.io/body-type-analyzer/`

## 8. Recommended Next Actions For Claude

### Priority 1: More training data (manual curation needed)

The biggest remaining lever is adding high-quality training images.
The automated source expansion failed (quality too low).
Manual selection of good images from reliable sources would help most.
This requires human judgment, not code changes.

### Priority 2: Domain-specific CNN

If a GPU and more data become available:

1. Fine-tune MobileNet/EfficientNet on body shape images
2. Use body-specific features instead of generic ImageNet features
3. This could significantly outperform hand-crafted features

### Priority 3: Pose estimation features

Use a pre-trained pose estimation model (e.g., MediaPipe Pose) to extract
body landmarks. Landmark positions and ratios would be highly discriminative
for height estimation and could work well with small training sets.

### Priority 4: Further feature engineering

Possible new directions:

- Gabor filter banks (oriented texture features)
- Multi-scale features (extract at multiple resolutions)
- Color features (if color images are available)
- Aspect ratio / proportion features from silhouette extraction

## 9. Useful Commands

```bash
npm run generate:diagnosis-model          # Regenerate female model
python scripts/generate-male-ranking-model.py  # Regenerate male model
node scripts/generate-ranking.mjs         # Regenerate ranking
npm run experiment:diagnosis-model        # Full experiment report
npm test -- --runInBand                   # All tests
npm run build                            # Production build
```

## 10. One-Line Executive Summary

The model has been improved from MAE 4.82 to 4.59 (height) through z-score normalization, histogram/LBP/DCT features, flip augmentation, and optimized model selection; further gains require higher-quality training data or domain-specific deep learning.
