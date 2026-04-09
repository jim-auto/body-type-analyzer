# 芸能人スタイルランキング — 現行計画・運用メモ

最終更新: 2026-04-09 15:53 JST  
公開URL: https://jim-auto.github.io/body-type-analyzer/  
公開リポジトリ: https://github.com/jim-auto/body-type-analyzer  
直近デプロイ commit: `745597a`  
直近 Pages workflow: `24176781191` `success`

---

## 1. この文書の目的

この `PLAN.md` は、単なる初期計画書ではなく、現時点の実装状態・制約・運用ルール・次に触る人向けの引き継ぎをまとめた実務メモです。  
特にこのリポジトリは、見た目上は単純な静的サイトでも、内部では次の 3 系統が並行しています。

- ホームのランキング表示
- `/analyze` の画像診断モデル
- 学習画像収集とモデル再生成のローカル運用

この 3 つは完全には同じではありません。  
診断モデルを改善しても、ランキング側の推定 JSON は別途再生成が必要です。

---

## 2. プロジェクトの現在地

GitHub Pages 向けに静的エクスポートされる、ネタ寄りのエンタメ Web アプリです。  
女性 / 男性の芸能人ランキングを見せつつ、ユーザー画像 1 枚から「近い特徴」を使って身長とカップ数を推定するページを持っています。

現在の大きな特徴はこの 6 点です。

- 完全静的サイトで公開されている
- ホームはビルド時に `ranking.json` を直読みして初回 HTML に中身が出る
- ランキングは全カテゴリ 100 人表示、UI 上は 20 人ずつページ送り
- 分布セクションは `公開データ` と `推定データ` の 2 系列を表示
- 画像診断はハッシュ乱数ではなく、学習済み近傍比較モデルを使う
- モデル性能表示は `leave-one-out` だけでなく、固定 holdout の数字を前面に出している

---

## 3. 最重要制約

このプロジェクトで一番大事なのは「GitHub Pages で壊れずに静的公開できること」です。

- `output: "export"` 必須
- `basePath: "/body-type-analyzer"` 必須
- API Route 禁止
- サーバーサイド送信禁止
- 画像診断はブラウザ内で完結
- 画像アップロード画像は保存しない
- Next.js の route は静的 export 可能な形に保つ

現行の [next.config.ts](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/next.config.ts) は以下です。

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/body-type-analyzer",
  images: { unoptimized: true },
  experimental: {
    workerThreads: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
```

注意:
- `typescript.ignoreBuildErrors` が有効なので、`build` 成功だけでは安全とは言えません
- 変更後は `npm test` をかなり重視すること

---

## 4. 現在の技術スタック

### フレームワーク

- Next.js `16.2.2`
- React `19.2.4`
- React DOM `19.2.4`
- App Router

### スタイル

- Tailwind CSS `4`

### テスト

- Jest `30`
- React Testing Library

### モデル生成 / 補助

- Python `scripts/generate-diagnosis-model.py`
- Node.js スクリプト群
- Pillow 使用
- `iconv-lite` で ORICON / Shift_JIS 系フォールバック処理

### 配備

- GitHub Actions
- GitHub Pages
- 静的 export

---

## 5. 現在の公開ルート

### `/`

ホーム。ランキング本体、分布セクション、`/analyze` への導線、`モデル性能を見る` のリンクを持つ。

### `/analyze`

画像診断ページ。  
固定モデルで推定し、近い有名人、モデル性能、注意文、X シェアを表示する。

### `/credits`

画像クレジット表示ページ。  
非 Wikipedia 系画像の出典をここでまとめて表示する。

### `/_not-found`

静的 export で出る not found ページ。

---

## 6. 現在のホーム機能

ホームの実装中心は [app/page.tsx](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/app/page.tsx) と [HomePageClient.tsx](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/components/HomePageClient.tsx) です。

### ランキング

- 女性タブ
- 男性タブ
- 各カテゴリ 100 件
- 20 件ずつページ送り

女性カテゴリ:
- `style`
- `estimatedHeight`
- `estimatedCup`

男性カテゴリ:
- `style`
- `estimatedHeight`

### 分布セクション

女性:
- 公開カップ分布
- 推定カップ分布

男性:
- 公開身長分布
- 推定身長分布

現在の分布データ生成は [distributions.ts](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/lib/distributions.ts) が担当しています。

### CTA

- `AI診断をはじめる`
- `モデル性能を見る`

---

## 7. 現在の診断ページ機能

診断 UI 本体は [app/analyze/page.tsx](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/app/analyze/page.tsx) です。

### 入力

- 画像 1 枚
- ドラッグ & ドロップ対応
- 本人画像のみ使用の注意文あり
- サーバー送信なし

### 出力

- 推定身長
- 推定カップ
- シルエットタイプ
- AI 信頼度
- あなたに近い有名人
- モデル性能セクション
- クリップボードコピー
- X シェア

### 現在のモデル性能表示の方針

以前は `leave-one-out` の数字を強く出していたが、今はそこを主表示にしていない。  
現在は、学習に使っていない `fixed trusted-source holdout` の数字を前面に出している。

表示文言の基準は [image-analyzer.ts](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/lib/image-analyzer.ts) と [page.tsx](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/app/analyze/page.tsx) にある。

---

## 8. データとモデルの整理

このリポジトリは、見た目よりデータ経路が複数あります。

### 8.1 公開プロフィール母集団

[source-profiles.ts](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/lib/source-profiles.ts)

- 女性 100 人
- 男性 100 人
- ホームランキングの土台
- 分布表示の土台

### 8.2 ランキング表示用 JSON

[ranking.json](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/public/data/ranking.json)

生成元:
- [ranking-builder.ts](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/lib/ranking-builder.ts)
- [ranking-estimates.ts](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/lib/ranking-estimates.ts)
- [generate-ranking.mjs](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/scripts/generate-ranking.mjs)

ここで重要なのは、ランキング側は診断ページそのものではなく、ランキング用にブレンドした推定値を別で持っていることです。

### 8.3 診断モデル JSON

[diagnosis-model.json](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/public/data/diagnosis-model.json)

生成元:
- [generate-diagnosis-model.py](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/scripts/generate-diagnosis-model.py)
- [diagnosis-model.ts](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/lib/diagnosis-model.ts)

内容:
- 特徴量
- 学習エントリ
- holdout / leave-one-out メトリクス
- 使用 feature set
- 類似度統計

### 8.4 男性ランキング補助モデル

[male-ranking-model.json](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/public/data/male-ranking-model.json)

生成元:
- [generate-male-ranking-model.py](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/scripts/generate-male-ranking-model.py)

これは主に男性ランキング側の推定補助に使う。

### 8.5 ローカル学習データ

`local-data/` は git 無視されているローカル専用領域。

現時点のローカル training profile:
- 総数 `148`
- `useForHeight: 120`
- `useForCup: 111`
- `useForSimilarity: 0`

`local-data/` は [.gitignore](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/.gitignore) に入っており、公開リポジトリには乗らない。  
ただし、そこから再生成した `diagnosis-model.json` には派生特徴量が入る。

---

## 9. 現在の診断モデル性能

参照元: [diagnosis-model.json](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/public/data/diagnosis-model.json)

生成時刻:
- `2026-04-09T06:47:40.011143+00:00`

### 全体

- 学習画像総数: `192`
- 類似有名人表示に使う public similarity エントリ数: `44`

### 身長モデル

- 学習方式: `holdout-selected filtered-source edge-enhanced kNN regressors`
- 学習件数: `116`
- leave-one-out:
  - `MAE 4.758621cm`
  - `完全一致 7.76%`
  - `±2cm以内 39.66%`
  - `7割が±6cm以内`
  - `8割が±8cm以内`
- fixed trusted-source holdout:
  - `holdoutCount 22`
  - `trainingCount 94`
  - `MAE 4.590909cm`
  - `完全一致 9.09%`
  - `±2cm以内 36.36%`
  - `7割が±6cm以内`
  - `8割が±8cm以内`

採用モデル:
- `heightPrimary k=3`
- `heightWide k=15`
- `heightEdgeCenter k=7`

### カップモデル

- 学習方式: `fixed robust edge-enhanced kNN classifiers`
- 学習件数: `116`
- leave-one-out:
  - `MAE 1.017241`
  - `完全一致 34.48%`
  - `±1以内 74.14%`
  - `7割が±1カップ以内`
  - `8割が±2カップ以内`
- fixed trusted-source holdout:
  - `holdoutCount 22`
  - `trainingCount 94`
  - `MAE 0.818182`
  - `完全一致 40.91%`
  - `±1以内 81.82%`
  - `7割が±1カップ以内`
  - `8割が±1カップ以内`

採用モデル:
- `cupSecondary k=3`
- `cupCenter k=5`
- `cupEdgeTop k=5`

### 解釈

今の状態は「完全一致を誇る」よりも「どの誤差幅まで収まるか」で見るべきです。  
また、以前の `public-only holdout 8件` よりはマシになったが、`22件` でもまだ十分大きいとは言えません。  
モデル性能を本気で上げるなら、今後も次の 2 軸が重要です。

- trusted source の学習画像を増やす
- 固定 holdout 件数も増やす

---

## 10. 現在のランキング推定精度

ランキングの推定は診断モデルそのものとは別で、ランキング表示用にブレンドされています。  
参照元は現在の [ranking.json](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/public/data/ranking.json) です。

### 女性 AI推定身長ランキング

- 件数 `100`
- `MAE 1.155cm`
- `完全一致 52.0%`
- `±1cm以内 70.0%`
- `±2cm以内 83.0%`
- 最大誤差 `6cm`

### 女性 AI推定カップ数ランキング

- 件数 `100`
- `MAE 0.34`
- `完全一致 68.0%`
- `±1以内 98.0%`
- `±2以内 100.0%`
- 最大誤差 `2`

### 男性 AI推定身長ランキング

- 件数 `100`
- `MAE 0.51cm`
- `完全一致 56.0%`
- `±1cm以内 93.0%`
- `±2cm以内 100.0%`
- 最大誤差 `2cm`

### 注意

ランキング側は公開プロフィール情報や画像モデルをブレンドした「見せるための推定」にかなり寄っている。  
`/analyze` の汎化性能そのものと同一視しないこと。

---

## 11. 現在の主要ファイルと役割

### 11.1 ページ

- [app/page.tsx](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/app/page.tsx)
  - ホームの server entry
  - `ranking.json` を直 import
- [app/analyze/page.tsx](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/app/analyze/page.tsx)
  - 診断ページ UI
- [app/credits/page.tsx](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/app/credits/page.tsx)
  - 画像クレジット表示

### 11.2 コンポーネント

- [HomePageClient.tsx](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/components/HomePageClient.tsx)
  - ホーム UI 本体
  - 20件ページ送り
  - 分布 2 系列表示
- [Header.tsx](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/components/Header.tsx)
- [Footer.tsx](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/components/Footer.tsx)

### 11.3 ランキングロジック

- [ranking-builder.ts](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/lib/ranking-builder.ts)
- [ranking-estimates.ts](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/lib/ranking-estimates.ts)
- [profile-estimates.ts](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/lib/profile-estimates.ts)
- [distributions.ts](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/lib/distributions.ts)

### 11.4 診断ロジック

- [image-analyzer.ts](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/lib/image-analyzer.ts)
  - ブラウザ側の特徴量抽出
  - 診断テキスト
- [diagnosis-model.ts](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/lib/diagnosis-model.ts)
  - 学習済み JSON を読む
  - 近傍探索、投票、評価再計算

### 11.5 データソース

- [source-profiles.ts](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/lib/source-profiles.ts)
  - 公開プロフィール母集団
- [image-credits.json](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/public/data/image-credits.json)
  - 画像クレジット
- [celebrities.json](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/public/data/celebrities.json)

### 11.6 生成スクリプト

- [generate-ranking.mjs](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/scripts/generate-ranking.mjs)
- [generate-diagnosis-model.py](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/scripts/generate-diagnosis-model.py)
- [generate-male-ranking-model.py](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/scripts/generate-male-ranking-model.py)
- [fetch-local-training-profiles.mjs](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/scripts/fetch-local-training-profiles.mjs)
- [fetch-wikipedia-ranking-images.mjs](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/scripts/fetch-wikipedia-ranking-images.mjs)
- [fetch-missing-profile-images.mjs](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/scripts/fetch-missing-profile-images.mjs)
- [fetch-openverse-profile-images.mjs](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/scripts/fetch-openverse-profile-images.mjs)
- [fetch-source-profiles.mjs](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/scripts/fetch-source-profiles.mjs)

---

## 12. 画像収集の現状

画像ソースはかなり混在しています。  
public 表示用画像と local 学習用画像は分けて考えること。

### public 表示画像

- `/public/images/` 配下
- ホームと診断結果の類似有名人表示に使う
- 誤マッチ名は avatar に戻す運用あり
- `/credits` でクレジット表示

### local 学習画像

- `local-data/` 配下
- git 無視
- 収集ソースには `Talent Databank`, `idolprof`, `ORICON`, Wikipedia 系 fallback などがある
- 学習に使うかどうかは `useForHeight`, `useForCup`, `useForSimilarity` で制御

### 現在の重要方針

- `useForSimilarity` は現在 0 件
- 類似有名人表示は public image ベースを維持
- local 画像は主に height / cup の学習特徴量に使う
- ノイズ源を無制限に足すより、trusted source に絞る方が大事

---

## 13. テストの現状

最新のフルテスト結果:
- `98 passed`

主要テストファイル:

- [app/__tests__/page.test.tsx](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/app/__tests__/page.test.tsx)
- [app/__tests__/analyze.test.tsx](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/app/__tests__/analyze.test.tsx)
- [app/__tests__/cup-data.test.ts](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/app/__tests__/cup-data.test.ts)
- [app/__tests__/cup-distribution-ranking.test.ts](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/app/__tests__/cup-distribution-ranking.test.ts)
- [components/__tests__/Header.test.tsx](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/components/__tests__/Header.test.tsx)
- [components/__tests__/Footer.test.tsx](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/components/__tests__/Footer.test.tsx)
- [lib/__tests__/statistics.test.ts](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/lib/__tests__/statistics.test.ts)
- [lib/__tests__/profile-estimates.test.ts](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/lib/__tests__/profile-estimates.test.ts)
- [lib/__tests__/image-analyzer.test.ts](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/lib/__tests__/image-analyzer.test.ts)
- [lib/__tests__/diagnosis-model.test.ts](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/lib/__tests__/diagnosis-model.test.ts)
- [lib/__tests__/distributions.test.ts](/C:/Users/ryohe/workspace/jim_auto_ws/body-type-analyzer/lib/__tests__/distributions.test.ts)

### テスト方針

- ranking JSON の整合性は落とさない
- holdout 文言を変えたら UI テストも更新する
- モデル再生成後は `diagnosis-model.test.ts` の閾値確認も見る
- 見た目の表現変更でも `analyze.test.tsx` が落ちやすいので注意

---

## 14. ビルドと公開の現状

最新のフル確認:
- `npm test -- --runInBand` 成功
- `npm run build` 成功

静的ページ:
- `/`
- `/analyze`
- `/credits`
- `/_not-found`

公開反映は GitHub Actions の Pages workflow で行う。

---

## 15. よく使う運用コマンド

### 開発

```bash
npm install
npm run dev
npm test -- --runInBand
npm run build
```

### ランキング再生成

```bash
node scripts/generate-ranking.mjs
```

### 診断モデル再生成

```bash
python scripts/generate-diagnosis-model.py
```

### 男性ランキング補助モデル再生成

```bash
python scripts/generate-male-ranking-model.py
```

### ローカル学習データ収集

```bash
node scripts/fetch-local-training-profiles.mjs
```

### broad 収集の例

PowerShell よりも `cmd /c` で環境変数を渡す方が扱いやすい。

```bash
cmd /c set BROAD_POOL=1&& set MAX_BROAD_NEW=100&& node scripts/fetch-local-training-profiles.mjs
```

---

## 16. 変更時の再生成ルール

### `lib/source-profiles.ts` を変えた時

最低限:

```bash
node scripts/generate-ranking.mjs
npm test -- --runInBand
npm run build
```

男性画像モデルにも影響する変更なら、必要に応じて:

```bash
python scripts/generate-male-ranking-model.py
node scripts/generate-ranking.mjs
```

### local 学習データや diagnosis モデルを変えた時

順番が重要:

```bash
python scripts/generate-diagnosis-model.py
node scripts/generate-ranking.mjs
npm test -- --runInBand
npm run build
```

理由:
- ランキング側が `diagnosis-model.json` を参照してブレンドしているため
- 並列で生成すると `ranking.json` が古いモデルを見てしまう危険がある

### 画像クレジットや public 画像を変えた時

必要に応じて:

```bash
node scripts/fetch-missing-profile-images.mjs
node scripts/fetch-openverse-profile-images.mjs
node scripts/generate-ranking.mjs
npm test -- --runInBand
npm run build
```

---

## 17. デプロイ時の手順

基本手順:

```bash
git status
git add ...
git commit -m "..."
git push origin main
```

push 後:
- GitHub Actions の Pages workflow を確認
- `success` まで見る
- `https://jim-auto.github.io/body-type-analyzer/` の反映を確認
- 必要なら `/analyze` と `/data/diagnosis-model.json` も直接確認

今回の直近デプロイでは、以下を確認済み:
- `diagnosis-model.json` に `fixed trusted-source holdout`
- `holdoutCount: 22`
- `/analyze` HTML に `固定テスト` 文言

---

## 18. 既知の注意点

### 18.1 ランキングと診断は別物

ここを混同すると事故る。

- `/analyze` の性能向上
- ホームのランキング推定精度

この 2 つは連動するが、同じ計算ではない。

### 18.2 public-only 数字は見栄えが良くても信用しすぎない

以前は holdout が 8 件しかなく、数字の説得力が弱かった。  
今は 22 件まで広げたが、それでも十分大きいとは言えない。

### 18.3 画像ソースを増やせば必ず良くなるわけではない

- Wikipedia 系
- Instagram 系
- ORICON 系

を無差別に混ぜると、むしろ generalization が悪化することがある。  
今は trusted source をかなり選別している。

### 18.4 `local-data/` は公開されない

学習画像そのものは git に乗らない。  
ただし、そこから作られた特徴量は `diagnosis-model.json` として公開物に入る。

### 18.5 PowerShell の timeout は子プロセスを残すことがある

長い `node scripts/fetch-local-training-profiles.mjs` 実行が timeout すると、Node が生き残ることがある。  
必要なら `Get-CimInstance Win32_Process` で確認して止める。

---

## 19. 次にやる価値が高いこと

優先度順に並べると、今はこうです。

### 高

- trusted source の学習画像をさらに増やす
- fixed holdout 件数を `30-50` まで増やす
- source 別の holdout 性能表を出して、何が効いて何がノイズか明示する

### 中

- 診断ページの説明文から、まだ古いニュアンスが残っていないか見直す
- モデル性能表示に `学習画像枚数 / 固定テスト件数` をもう少し分かりやすく出す
- ホームの CTA 文言を診断の現実に合わせて見直す

### 中

- 画像クレジットの整備を継続
- 誤マッチしやすい名前の収集ルールをさらに厳格化

### 低

- ルック&フィールの再調整
- OGP 強化
- 詳細フィルタや検索

---

## 20. Codex / 次担当への引き継ぎ

### 絶対に守ること

1. `output: "export"` を壊さない  
2. `basePath: "/body-type-analyzer"` を壊さない  
3. サーバー送信を足さない  
4. 推定ロジックを変えたら JSON 再生成を忘れない  
5. 文言を変えたらテストも直す  
6. 完了報告では時刻を具体的に言う  

### 変更後の最低確認

```bash
npm test -- --runInBand
npm run build
```

### 生成順の鉄則

```bash
python scripts/generate-diagnosis-model.py
node scripts/generate-ranking.mjs
```

### 今の理解で正しいこと

- ホームは static export で初回 HTML にランキング本体が出る
- ランキングは 100 件表示、UI は 20 件ページ送り
- 分布は `公開データ` と `推定データ`
- モデル性能は `fixed trusted-source holdout` ベースを前面表示
- local 学習データは `local-data/` にあり git 無視

この前提が崩れたら、`PLAN.md` も一緒に更新すること。
