# Diagnosis Experiments

Generated at: `2026-04-11T07:52:41.773794+00:00`

This report compares preprocessing presets and weight presets on the fixed holdout.
It also includes 3-split stability, worst cases, and exact-feature collision snapshots.

- Default preset: `height-raw-focused-ensemble`
- Default weight preset: `height-quality-collision-gate`
- Best height holdout MAE: `height-raw-focused-ensemble` + `height-quality-collision-gate` (4.182cm)
- Best cup holdout MAE: `focused-shared` + `quality-collision` (0.636 cups)

## Holdout Summary

| Preprocessing | Source Weighting | Description | Height MAE | Height +/-2 | Height 80% | Cup MAE | Cup +/-1 | Cup 80% |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `height-raw-focused-ensemble` | `height-quality-collision-gate` | Average raw and focused height, focused cup, focused similarity; Height-only hard gate for low-information large collision groups | `4.182cm` | `40.9%` | `+/-7cm` | `0.682` | `90.9%` | `+/-1` |
| `height-raw-focused-ensemble` | `quality-collision-gate` | Average raw and focused height, focused cup, focused similarity; Uniform source weights with hard gate for low-information large collision groups | `4.182cm` | `40.9%` | `+/-7cm` | `0.818` | `86.4%` | `+/-1` |
| `height-raw-focused-ensemble` | `trusted-quality-gate` | Average raw and focused height, focused cup, focused similarity; Trusted-source boost with hard gate for low-information large collision groups | `4.182cm` | `40.9%` | `+/-7cm` | `0.818` | `86.4%` | `+/-1` |
| `focused-split-raw-height` | `height-quality-collision-gate` | Raw height, focused cup, focused similarity; Height-only hard gate for low-information large collision groups | `4.273cm` | `36.4%` | `+/-7cm` | `0.682` | `90.9%` | `+/-1` |
| `cup-raw-focused-ensemble` | `height-quality-collision-gate` | Raw height, average raw and focused cup, focused similarity; Height-only hard gate for low-information large collision groups | `4.273cm` | `36.4%` | `+/-7cm` | `0.727` | `86.4%` | `+/-1` |
| `focused-split-raw-height` | `quality-collision-gate` | Raw height, focused cup, focused similarity; Uniform source weights with hard gate for low-information large collision groups | `4.273cm` | `36.4%` | `+/-7cm` | `0.818` | `86.4%` | `+/-1` |
| `focused-split-raw-height` | `trusted-quality-gate` | Raw height, focused cup, focused similarity; Trusted-source boost with hard gate for low-information large collision groups | `4.273cm` | `36.4%` | `+/-7cm` | `0.818` | `86.4%` | `+/-1` |
| `raw` | `height-quality-collision-gate` | Raw image for height, cup, and similarity; Height-only hard gate for low-information large collision groups | `4.273cm` | `36.4%` | `+/-7cm` | `0.818` | `81.8%` | `+/-1` |
| `cup-raw-focused-ensemble` | `quality-collision-gate` | Raw height, average raw and focused cup, focused similarity; Uniform source weights with hard gate for low-information large collision groups | `4.273cm` | `36.4%` | `+/-7cm` | `1.136` | `63.6%` | `+/-2` |
| `cup-raw-focused-ensemble` | `trusted-quality-gate` | Raw height, average raw and focused cup, focused similarity; Trusted-source boost with hard gate for low-information large collision groups | `4.273cm` | `36.4%` | `+/-7cm` | `1.136` | `63.6%` | `+/-2` |
| `raw` | `quality-collision-gate` | Raw image for height, cup, and similarity; Uniform source weights with hard gate for low-information large collision groups | `4.273cm` | `36.4%` | `+/-7cm` | `1.227` | `59.1%` | `+/-2` |
| `raw` | `trusted-quality-gate` | Raw image for height, cup, and similarity; Trusted-source boost with hard gate for low-information large collision groups | `4.273cm` | `36.4%` | `+/-7cm` | `1.227` | `59.1%` | `+/-2` |
| `focused-split-wide-height` | `height-quality-collision-gate` | Wide focused height, focused cup, focused similarity; Height-only hard gate for low-information large collision groups | `4.318cm` | `36.4%` | `+/-7cm` | `0.682` | `90.9%` | `+/-1` |
| `focused-split-wide-height` | `quality-collision-gate` | Wide focused height, focused cup, focused similarity; Uniform source weights with hard gate for low-information large collision groups | `4.318cm` | `36.4%` | `+/-7cm` | `0.818` | `86.4%` | `+/-1` |
| `focused-split-wide-height` | `trusted-quality-gate` | Wide focused height, focused cup, focused similarity; Trusted-source boost with hard gate for low-information large collision groups | `4.318cm` | `36.4%` | `+/-7cm` | `0.818` | `86.4%` | `+/-1` |
| `focused-shared` | `height-quality-collision-gate` | Focused crop for height, cup, and similarity; Height-only hard gate for low-information large collision groups | `4.364cm` | `40.9%` | `+/-7cm` | `0.682` | `90.9%` | `+/-1` |
| `height-raw-wide-ensemble` | `height-quality-collision-gate` | Average raw and wide-focused height, focused cup, focused similarity; Height-only hard gate for low-information large collision groups | `4.364cm` | `36.4%` | `+/-7cm` | `0.682` | `90.9%` | `+/-1` |
| `split-multicrop` | `height-quality-collision-gate` | Average raw and wide-focused height, average raw and focused cup, focused similarity; Height-only hard gate for low-information large collision groups | `4.364cm` | `36.4%` | `+/-7cm` | `0.727` | `86.4%` | `+/-1` |
| `focused-shared` | `quality-collision-gate` | Focused crop for height, cup, and similarity; Uniform source weights with hard gate for low-information large collision groups | `4.364cm` | `40.9%` | `+/-7cm` | `0.818` | `86.4%` | `+/-1` |
| `focused-shared` | `trusted-quality-gate` | Focused crop for height, cup, and similarity; Trusted-source boost with hard gate for low-information large collision groups | `4.364cm` | `40.9%` | `+/-7cm` | `0.818` | `86.4%` | `+/-1` |
| `height-raw-wide-ensemble` | `quality-collision-gate` | Average raw and wide-focused height, focused cup, focused similarity; Uniform source weights with hard gate for low-information large collision groups | `4.364cm` | `36.4%` | `+/-7cm` | `0.818` | `86.4%` | `+/-1` |
| `height-raw-wide-ensemble` | `trusted-quality-gate` | Average raw and wide-focused height, focused cup, focused similarity; Trusted-source boost with hard gate for low-information large collision groups | `4.364cm` | `36.4%` | `+/-7cm` | `0.818` | `86.4%` | `+/-1` |
| `split-multicrop` | `quality-collision-gate` | Average raw and wide-focused height, average raw and focused cup, focused similarity; Uniform source weights with hard gate for low-information large collision groups | `4.364cm` | `36.4%` | `+/-7cm` | `1.136` | `63.6%` | `+/-2` |
| `split-multicrop` | `trusted-quality-gate` | Average raw and wide-focused height, average raw and focused cup, focused similarity; Trusted-source boost with hard gate for low-information large collision groups | `4.364cm` | `36.4%` | `+/-7cm` | `1.136` | `63.6%` | `+/-2` |
| `height-raw-focused-ensemble` | `quality-collision` | Average raw and focused height, focused cup, focused similarity; Uniform source weights with low-information and exact-collision penalties | `4.455cm` | `36.4%` | `+/-7cm` | `0.636` | `90.9%` | `+/-1` |
| `height-raw-focused-ensemble` | `quality-soft` | Average raw and focused height, focused cup, focused similarity; Uniform source weights with low-information image penalty | `4.455cm` | `36.4%` | `+/-7cm` | `0.636` | `90.9%` | `+/-1` |
| `height-raw-focused-ensemble` | `trusted-quality-collision` | Average raw and focused height, focused cup, focused similarity; Trusted-source boost with low-information and exact-collision penalties | `4.455cm` | `36.4%` | `+/-7cm` | `0.636` | `90.9%` | `+/-1` |
| `height-raw-focused-ensemble` | `uniform` | Average raw and focused height, focused cup, focused similarity; Uniform source weighting | `4.455cm` | `36.4%` | `+/-7cm` | `0.682` | `90.9%` | `+/-1` |
| `height-raw-focused-ensemble` | `trusted-soft` | Average raw and focused height, focused cup, focused similarity; Boost first-party and trusted sources, softly downweight derived sources | `4.455cm` | `36.4%` | `+/-7cm` | `0.682` | `90.9%` | `+/-1` |
| `height-raw-focused-ensemble` | `collision-soft` | Average raw and focused height, focused cup, focused similarity; Uniform source weights with soft exact-collision penalty | `4.455cm` | `36.4%` | `+/-7cm` | `0.682` | `90.9%` | `+/-1` |
| `height-raw-focused-ensemble` | `trusted-strong` | Average raw and focused height, focused cup, focused similarity; Stronger boost for trusted sources and clearer downweight for derived sources | `4.455cm` | `36.4%` | `+/-7cm` | `0.682` | `90.9%` | `+/-1` |
| `height-raw-wide-ensemble` | `uniform` | Average raw and wide-focused height, focused cup, focused similarity; Uniform source weighting | `4.5cm` | `36.4%` | `+/-7cm` | `0.682` | `90.9%` | `+/-1` |
| `height-raw-wide-ensemble` | `collision-soft` | Average raw and wide-focused height, focused cup, focused similarity; Uniform source weights with soft exact-collision penalty | `4.5cm` | `36.4%` | `+/-7cm` | `0.682` | `90.9%` | `+/-1` |
| `split-multicrop` | `uniform` | Average raw and wide-focused height, average raw and focused cup, focused similarity; Uniform source weighting | `4.5cm` | `36.4%` | `+/-7cm` | `0.727` | `86.4%` | `+/-1` |
| `split-multicrop` | `collision-soft` | Average raw and wide-focused height, average raw and focused cup, focused similarity; Uniform source weights with soft exact-collision penalty | `4.5cm` | `36.4%` | `+/-7cm` | `0.818` | `81.8%` | `+/-1` |
| `focused-split-raw-height` | `quality-collision` | Raw height, focused cup, focused similarity; Uniform source weights with low-information and exact-collision penalties | `4.545cm` | `31.8%` | `+/-7cm` | `0.636` | `90.9%` | `+/-1` |
| `focused-split-raw-height` | `quality-soft` | Raw height, focused cup, focused similarity; Uniform source weights with low-information image penalty | `4.545cm` | `31.8%` | `+/-7cm` | `0.636` | `90.9%` | `+/-1` |
| `focused-split-raw-height` | `trusted-quality-collision` | Raw height, focused cup, focused similarity; Trusted-source boost with low-information and exact-collision penalties | `4.545cm` | `31.8%` | `+/-7cm` | `0.636` | `90.9%` | `+/-1` |
| `focused-split-raw-height` | `uniform` | Raw height, focused cup, focused similarity; Uniform source weighting | `4.545cm` | `31.8%` | `+/-7cm` | `0.682` | `90.9%` | `+/-1` |
| `focused-split-raw-height` | `trusted-soft` | Raw height, focused cup, focused similarity; Boost first-party and trusted sources, softly downweight derived sources | `4.545cm` | `31.8%` | `+/-7cm` | `0.682` | `90.9%` | `+/-1` |
| `focused-split-raw-height` | `collision-soft` | Raw height, focused cup, focused similarity; Uniform source weights with soft exact-collision penalty | `4.545cm` | `31.8%` | `+/-7cm` | `0.682` | `90.9%` | `+/-1` |
| `focused-split-raw-height` | `trusted-strong` | Raw height, focused cup, focused similarity; Stronger boost for trusted sources and clearer downweight for derived sources | `4.545cm` | `31.8%` | `+/-7cm` | `0.682` | `90.9%` | `+/-1` |
| `height-raw-wide-ensemble` | `trusted-soft` | Average raw and wide-focused height, focused cup, focused similarity; Boost first-party and trusted sources, softly downweight derived sources | `4.545cm` | `31.8%` | `+/-7cm` | `0.682` | `90.9%` | `+/-1` |
| `height-raw-wide-ensemble` | `trusted-strong` | Average raw and wide-focused height, focused cup, focused similarity; Stronger boost for trusted sources and clearer downweight for derived sources | `4.545cm` | `31.8%` | `+/-7cm` | `0.682` | `90.9%` | `+/-1` |
| `cup-raw-focused-ensemble` | `uniform` | Raw height, average raw and focused cup, focused similarity; Uniform source weighting | `4.545cm` | `31.8%` | `+/-7cm` | `0.727` | `86.4%` | `+/-1` |
| `cup-raw-focused-ensemble` | `trusted-soft` | Raw height, average raw and focused cup, focused similarity; Boost first-party and trusted sources, softly downweight derived sources | `4.545cm` | `31.8%` | `+/-7cm` | `0.727` | `86.4%` | `+/-1` |
| `cup-raw-focused-ensemble` | `trusted-strong` | Raw height, average raw and focused cup, focused similarity; Stronger boost for trusted sources and clearer downweight for derived sources | `4.545cm` | `31.8%` | `+/-7cm` | `0.727` | `86.4%` | `+/-1` |
| `split-multicrop` | `trusted-soft` | Average raw and wide-focused height, average raw and focused cup, focused similarity; Boost first-party and trusted sources, softly downweight derived sources | `4.545cm` | `31.8%` | `+/-7cm` | `0.727` | `86.4%` | `+/-1` |
| `split-multicrop` | `trusted-strong` | Average raw and wide-focused height, average raw and focused cup, focused similarity; Stronger boost for trusted sources and clearer downweight for derived sources | `4.545cm` | `31.8%` | `+/-7cm` | `0.727` | `86.4%` | `+/-1` |
| `raw` | `uniform` | Raw image for height, cup, and similarity; Uniform source weighting | `4.545cm` | `31.8%` | `+/-7cm` | `0.818` | `81.8%` | `+/-1` |
| `raw` | `trusted-soft` | Raw image for height, cup, and similarity; Boost first-party and trusted sources, softly downweight derived sources | `4.545cm` | `31.8%` | `+/-7cm` | `0.818` | `81.8%` | `+/-1` |
| `raw` | `collision-soft` | Raw image for height, cup, and similarity; Uniform source weights with soft exact-collision penalty | `4.545cm` | `31.8%` | `+/-7cm` | `0.818` | `81.8%` | `+/-1` |
| `cup-raw-focused-ensemble` | `collision-soft` | Raw height, average raw and focused cup, focused similarity; Uniform source weights with soft exact-collision penalty | `4.545cm` | `31.8%` | `+/-7cm` | `0.818` | `81.8%` | `+/-1` |
| `cup-raw-focused-ensemble` | `quality-collision` | Raw height, average raw and focused cup, focused similarity; Uniform source weights with low-information and exact-collision penalties | `4.545cm` | `31.8%` | `+/-7cm` | `0.818` | `81.8%` | `+/-1` |
| `cup-raw-focused-ensemble` | `quality-soft` | Raw height, average raw and focused cup, focused similarity; Uniform source weights with low-information image penalty | `4.545cm` | `31.8%` | `+/-7cm` | `0.818` | `81.8%` | `+/-1` |
| `cup-raw-focused-ensemble` | `trusted-quality-collision` | Raw height, average raw and focused cup, focused similarity; Trusted-source boost with low-information and exact-collision penalties | `4.545cm` | `31.8%` | `+/-7cm` | `0.818` | `81.8%` | `+/-1` |
| `raw` | `trusted-strong` | Raw image for height, cup, and similarity; Stronger boost for trusted sources and clearer downweight for derived sources | `4.545cm` | `31.8%` | `+/-7cm` | `0.864` | `81.8%` | `+/-1` |
| `raw` | `quality-collision` | Raw image for height, cup, and similarity; Uniform source weights with low-information and exact-collision penalties | `4.545cm` | `31.8%` | `+/-7cm` | `0.909` | `77.3%` | `+/-2` |
| `raw` | `quality-soft` | Raw image for height, cup, and similarity; Uniform source weights with low-information image penalty | `4.545cm` | `31.8%` | `+/-7cm` | `0.909` | `77.3%` | `+/-2` |
| `raw` | `trusted-quality-collision` | Raw image for height, cup, and similarity; Trusted-source boost with low-information and exact-collision penalties | `4.545cm` | `31.8%` | `+/-7cm` | `0.909` | `77.3%` | `+/-2` |
| `focused-shared` | `uniform` | Focused crop for height, cup, and similarity; Uniform source weighting | `4.591cm` | `40.9%` | `+/-7cm` | `0.682` | `90.9%` | `+/-1` |
| `focused-shared` | `collision-soft` | Focused crop for height, cup, and similarity; Uniform source weights with soft exact-collision penalty | `4.591cm` | `40.9%` | `+/-7cm` | `0.682` | `90.9%` | `+/-1` |
| `focused-shared` | `quality-collision` | Focused crop for height, cup, and similarity; Uniform source weights with low-information and exact-collision penalties | `4.636cm` | `36.4%` | `+/-7cm` | `0.636` | `90.9%` | `+/-1` |
| `focused-shared` | `quality-soft` | Focused crop for height, cup, and similarity; Uniform source weights with low-information image penalty | `4.636cm` | `36.4%` | `+/-7cm` | `0.636` | `90.9%` | `+/-1` |
| `focused-shared` | `trusted-quality-collision` | Focused crop for height, cup, and similarity; Trusted-source boost with low-information and exact-collision penalties | `4.636cm` | `36.4%` | `+/-7cm` | `0.636` | `90.9%` | `+/-1` |
| `height-raw-wide-ensemble` | `quality-collision` | Average raw and wide-focused height, focused cup, focused similarity; Uniform source weights with low-information and exact-collision penalties | `4.636cm` | `31.8%` | `+/-7cm` | `0.636` | `90.9%` | `+/-1` |
| `height-raw-wide-ensemble` | `quality-soft` | Average raw and wide-focused height, focused cup, focused similarity; Uniform source weights with low-information image penalty | `4.636cm` | `31.8%` | `+/-7cm` | `0.636` | `90.9%` | `+/-1` |
| `height-raw-wide-ensemble` | `trusted-quality-collision` | Average raw and wide-focused height, focused cup, focused similarity; Trusted-source boost with low-information and exact-collision penalties | `4.636cm` | `31.8%` | `+/-7cm` | `0.636` | `90.9%` | `+/-1` |
| `focused-shared` | `trusted-soft` | Focused crop for height, cup, and similarity; Boost first-party and trusted sources, softly downweight derived sources | `4.636cm` | `40.9%` | `+/-8cm` | `0.682` | `90.9%` | `+/-1` |
| `focused-shared` | `trusted-strong` | Focused crop for height, cup, and similarity; Stronger boost for trusted sources and clearer downweight for derived sources | `4.636cm` | `40.9%` | `+/-8cm` | `0.682` | `90.9%` | `+/-1` |
| `split-multicrop` | `quality-collision` | Average raw and wide-focused height, average raw and focused cup, focused similarity; Uniform source weights with low-information and exact-collision penalties | `4.636cm` | `31.8%` | `+/-7cm` | `0.818` | `81.8%` | `+/-1` |
| `split-multicrop` | `quality-soft` | Average raw and wide-focused height, average raw and focused cup, focused similarity; Uniform source weights with low-information image penalty | `4.636cm` | `31.8%` | `+/-7cm` | `0.818` | `81.8%` | `+/-1` |
| `split-multicrop` | `trusted-quality-collision` | Average raw and wide-focused height, average raw and focused cup, focused similarity; Trusted-source boost with low-information and exact-collision penalties | `4.636cm` | `31.8%` | `+/-7cm` | `0.818` | `81.8%` | `+/-1` |
| `focused-split-wide-height` | `quality-soft` | Wide focused height, focused cup, focused similarity; Uniform source weights with low-information image penalty | `4.682cm` | `31.8%` | `+/-7cm` | `0.636` | `90.9%` | `+/-1` |
| `focused-split-wide-height` | `uniform` | Wide focused height, focused cup, focused similarity; Uniform source weighting | `4.682cm` | `31.8%` | `+/-7cm` | `0.682` | `90.9%` | `+/-1` |
| `focused-split-wide-height` | `collision-soft` | Wide focused height, focused cup, focused similarity; Uniform source weights with soft exact-collision penalty | `4.682cm` | `31.8%` | `+/-7cm` | `0.682` | `90.9%` | `+/-1` |
| `focused-split-wide-height` | `quality-collision` | Wide focused height, focused cup, focused similarity; Uniform source weights with low-information and exact-collision penalties | `4.727cm` | `31.8%` | `+/-7cm` | `0.636` | `90.9%` | `+/-1` |
| `focused-split-wide-height` | `trusted-quality-collision` | Wide focused height, focused cup, focused similarity; Trusted-source boost with low-information and exact-collision penalties | `4.727cm` | `31.8%` | `+/-7cm` | `0.636` | `90.9%` | `+/-1` |
| `focused-split-wide-height` | `trusted-soft` | Wide focused height, focused cup, focused similarity; Boost first-party and trusted sources, softly downweight derived sources | `4.727cm` | `31.8%` | `+/-7cm` | `0.682` | `90.9%` | `+/-1` |
| `focused-split-wide-height` | `trusted-strong` | Wide focused height, focused cup, focused similarity; Stronger boost for trusted sources and clearer downweight for derived sources | `4.727cm` | `31.8%` | `+/-7cm` | `0.682` | `90.9%` | `+/-1` |

## Stability Snapshot

- Height best `height-raw-focused-ensemble` + `height-quality-collision-gate`: fixed holdout `4.182cm`, 3-split mean `4.129cm`, stddev `0.316cm`, within +/-2 `39.4%`
- Cup best `focused-shared` + `quality-collision`: fixed holdout `0.636 cups`, 3-split mean `1.121 cups`, stddev `0.119`, within +/-1 `65.2%`

## Collision Snapshot

- Height best `height-raw-focused-ensemble` + `height-quality-collision-gate`: collision groups `6`, colliding entries `180`, ambiguous groups `6`
- `heightEdgeCenter` size `58`, distinct targets `29` [145.0, 148.0, 150.0, 151.0, 152.0, 153.0, 154.0, 154.5, 155.0, 156.0, 157.0, 158.0, 159.0, 160.0, 161.0, 162.0, 163.0, 164.0, 165.0, 166.0, 167.0, 168.0, 169.0, 170.0, 172.0, 173.0, 174.0, 175.0, 179.0]
  entries: 菊地優里 (idolprof-idolprof), 伊藤裕子 (idolprof-idolprof.com), AKINA (idolprof-idolprof.com), MAHO (idolprof-idolprof)
- `heightEdgeFull` size `58`, distinct targets `29` [145.0, 148.0, 150.0, 151.0, 152.0, 153.0, 154.0, 154.5, 155.0, 156.0, 157.0, 158.0, 159.0, 160.0, 161.0, 162.0, 163.0, 164.0, 165.0, 166.0, 167.0, 168.0, 169.0, 170.0, 172.0, 173.0, 174.0, 175.0, 179.0]
  entries: 菊地優里 (idolprof-idolprof), 伊藤裕子 (idolprof-idolprof.com), AKINA (idolprof-idolprof.com), MAHO (idolprof-idolprof)
- `heightPrimary` size `58`, distinct targets `29` [145.0, 148.0, 150.0, 151.0, 152.0, 153.0, 154.0, 154.5, 155.0, 156.0, 157.0, 158.0, 159.0, 160.0, 161.0, 162.0, 163.0, 164.0, 165.0, 166.0, 167.0, 168.0, 169.0, 170.0, 172.0, 173.0, 174.0, 175.0, 179.0]
  entries: 菊地優里 (idolprof-idolprof), 伊藤裕子 (idolprof-idolprof.com), AKINA (idolprof-idolprof.com), MAHO (idolprof-idolprof)
- `heightEdgeCenter` size `2`, distinct targets `2` [154.0, 155.0]
  entries: 高岡未來 (idolprof-idolprof), 青山りか (idolprof-idolprof)
- `heightEdgeFull` size `2`, distinct targets `2` [154.0, 155.0]
  entries: 高岡未來 (idolprof-idolprof), 青山りか (idolprof-idolprof)
- Cup best `focused-shared` + `quality-collision`: collision groups `6`, colliding entries `180`, ambiguous groups `3`
- `cupCenter` size `58`, distinct targets `5` [A, B, C, D, E]
  entries: 菊地優里 (idolprof-idolprof), 伊藤裕子 (idolprof-idolprof.com), AKINA (idolprof-idolprof.com), MAHO (idolprof-idolprof)
- `cupEdgeTop` size `58`, distinct targets `5` [A, B, C, D, E]
  entries: 菊地優里 (idolprof-idolprof), 伊藤裕子 (idolprof-idolprof.com), AKINA (idolprof-idolprof.com), MAHO (idolprof-idolprof)
- `cupSecondary` size `58`, distinct targets `5` [A, B, C, D, E]
  entries: 菊地優里 (idolprof-idolprof), 伊藤裕子 (idolprof-idolprof.com), AKINA (idolprof-idolprof.com), MAHO (idolprof-idolprof)
- `cupCenter` size `2`, distinct targets `1` [B]
  entries: 高岡未來 (idolprof-idolprof), 青山りか (idolprof-idolprof)
- `cupEdgeTop` size `2`, distinct targets `1` [B]
  entries: 高岡未來 (idolprof-idolprof), 青山りか (idolprof-idolprof)

## Height Worst Cases

Config: `height-raw-focused-ensemble` + `height-quality-collision-gate` / holdout `22` cases

- `中村明花` (idolprof-idolprof): `175cm -> 158cm`, error `17cm`, cup `A`, zero-distance neighbors `0`
  quality: brightness=0.934, contrast=0.061, edgeMean=0.015, edgeP90=0.043, entropy=1.03, aspect=1
  neighbors: ソラ豆琴美 (amic-e.com, d=2.758, h=159cm, cup=C), 青山りか (idolprof-idolprof, d=2.806, h=155cm, cup=B), 高岡未來 (idolprof-idolprof, d=2.806, h=154cm, cup=B)
- `あおい夢叶` (idolprof): `148cm -> 158cm`, error `10cm`, cup `A`, zero-distance neighbors `0`
  quality: brightness=0.934, contrast=0.061, edgeMean=0.015, edgeP90=0.043, entropy=1.03, aspect=1
  neighbors: ソラ豆琴美 (amic-e.com, d=2.758, h=159cm, cup=C), 青山りか (idolprof-idolprof, d=2.806, h=155cm, cup=B), 高岡未來 (idolprof-idolprof, d=2.806, h=154cm, cup=B)
- `しほの涼` (public): `172cm -> 162cm`, error `10cm`, cup `C`, zero-distance neighbors `0`
  quality: brightness=0.633, contrast=0.22, edgeMean=0.097, edgeP90=0.241, entropy=7.297, aspect=0.668
  neighbors: 筧美和子 (public, d=6.235, h=164cm, cup=F), 為近あんな (public, d=6.439, h=159cm, cup=D), くぼたみか (public, d=6.656, h=153cm, cup=E)
- `安井まゆ` (public): `168cm -> 160cm`, error `8cm`, cup `B`, zero-distance neighbors `0`
  quality: brightness=0.756, contrast=0.136, edgeMean=0.048, edgeP90=0.141, entropy=6.918, aspect=0.667
  neighbors: 為近あんな (public, d=4.066, h=159cm, cup=D), スザンヌ (public, d=4.581, h=166cm, cup=D), くぼたみか (public, d=5.179, h=153cm, cup=E)
- `伊藤裕子` (idolprof-idolprof.com): `165cm -> 158cm`, error `7cm`, cup `C`, zero-distance neighbors `0`
  quality: brightness=0.934, contrast=0.061, edgeMean=0.015, edgeP90=0.043, entropy=1.03, aspect=1
  neighbors: ソラ豆琴美 (amic-e.com, d=2.758, h=159cm, cup=C), 青山りか (idolprof-idolprof, d=2.806, h=155cm, cup=B), 高岡未來 (idolprof-idolprof, d=2.806, h=154cm, cup=B)

## Cup Worst Cases

Config: `focused-shared` + `quality-collision` / holdout `22` cases

- `なるせるな` (idolprof): `D -> B`, error `2 cups`, height `163cm`, zero-distance neighbors `13`
  quality: brightness=0.934, contrast=0.061, edgeMean=0.015, edgeP90=0.043, entropy=1.03, aspect=1
  neighbors: AKINA (idolprof-idolprof.com, d=0, h=152cm, cup=A), MAHO (idolprof-idolprof, d=0, h=158cm, cup=A), イリィ (idolprof.com, d=0, h=156cm, cup=E)
- `前田敦子` (public): `B -> D`, error `2 cups`, height `161cm`, zero-distance neighbors `0`
  quality: brightness=0.27, contrast=0.238, edgeMean=0.074, edgeP90=0.222, entropy=7.072, aspect=0.667
  neighbors: 菜々緒 (public, d=7.252, h=172cm, cup=B), 井上真央 (public, d=8.676, h=158cm, cup=D), インリン・オブ・ジョイトイ (public, d=9.015, h=163cm, cup=E)
- `あおい夢叶` (idolprof): `A -> B`, error `1 cups`, height `148cm`, zero-distance neighbors `13`
  quality: brightness=0.934, contrast=0.061, edgeMean=0.015, edgeP90=0.043, entropy=1.03, aspect=1
  neighbors: AKINA (idolprof-idolprof.com, d=0, h=152cm, cup=A), MAHO (idolprof-idolprof, d=0, h=158cm, cup=A), イリィ (idolprof.com, d=0, h=156cm, cup=E)
- `しほの涼` (public): `C -> D`, error `1 cups`, height `172cm`, zero-distance neighbors `0`
  quality: brightness=0.633, contrast=0.22, edgeMean=0.097, edgeP90=0.241, entropy=7.297, aspect=0.668
  neighbors: 筧美和子 (public, d=7.982, h=164cm, cup=F), ビビアン・スー (public, d=7.991, h=161cm, cup=C), 逢沢りな (talent-databank, d=8.511, h=163cm, cup=A)
- `ケリー` (idolprof): `C -> B`, error `1 cups`, height `174cm`, zero-distance neighbors `13`
  quality: brightness=0.934, contrast=0.061, edgeMean=0.015, edgeP90=0.043, entropy=1.03, aspect=1
  neighbors: AKINA (idolprof-idolprof.com, d=0, h=152cm, cup=A), MAHO (idolprof-idolprof, d=0, h=158cm, cup=A), イリィ (idolprof.com, d=0, h=156cm, cup=E)

## Notes

- Height holdout winner: `height-raw-focused-ensemble` + `height-quality-collision-gate`.
- Cup holdout winner: `focused-shared` + `quality-collision`.
- If source weighting moves very little, preprocessing or feature design is still the dominant lever.
- If worst cases repeatedly show zero-distance neighbors, feature collisions are a stronger priority than more tuning.
- If worst cases repeatedly show low contrast or low edge scores, an input-quality gate is worth testing next.
