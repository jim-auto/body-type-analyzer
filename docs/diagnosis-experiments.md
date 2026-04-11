# Diagnosis Experiments

Generated at: `2026-04-11T00:59:23.664397+00:00`

固定 holdout を基準に、前処理 preset を横並び比較したメモです。

- Default preset: `focused-split-raw-height`
- Best height holdout MAE: `focused-split-raw-height` (4.5cm)
- Best cup holdout MAE: `focused-split-raw-height` (0.682カップ)

## Holdout Summary

| Preset | Description | Height MAE | Height ±2 | Height 80% | Cup MAE | Cup ±1 | Cup 80% |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `focused-split-raw-height` | Raw height, focused cup, focused similarity | `4.5cm` | `31.8%` | `±7cm` | `0.682` | `90.9%` | `±1` |
| `focused-split-wide-height` | Wide focused height, focused cup, focused similarity | `4.5cm` | `31.8%` | `±7cm` | `0.682` | `90.9%` | `±1` |
| `raw` | Raw image for height, cup, and similarity | `4.5cm` | `31.8%` | `±7cm` | `0.818` | `81.8%` | `±1` |
| `focused-shared` | Focused crop for height, cup, and similarity | `4.591cm` | `36.4%` | `±7cm` | `0.682` | `90.9%` | `±1` |

## Notes

- `focused-split-raw-height` が身長 holdout では最良でした。
- `focused-split-raw-height` がカップ holdout では最良でした。
- `focused-shared` は一括前処理としては扱いやすいが、身長とカップで最適がずれる可能性があります。
- 次は source 重み付けか multi-crop をこの表に追加すると比較しやすいです。
