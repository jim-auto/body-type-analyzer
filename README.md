# Body Type Analyzer

公開ページ: [https://jim-auto.github.io/body-type-analyzer/](https://jim-auto.github.io/body-type-analyzer/)

日本の著名人プロフィールの公開データをもとに、スタイルランキングと画像ベースの簡易体型診断を提供する Next.js 16 アプリです。GitHub Pages 向けに静的エクスポートしており、公開版は https://jim-auto.github.io/body-type-analyzer/ で確認できます。

## 主な機能

- 女性 300 件、男性 200 件のプロフィールを使ったランキング表示
- 女性: スタイル偏差値、AI 推定身長、AI 推定カップのランキング
- 男性: スタイル偏差値、AI 推定身長のランキング
- 画像 1 枚から推定身長、推定カップ、シルエットタイプ、類似有名人を表示
- 公開データと推定データの分布比較
- 画像クレジットページ (`/credits`)

## 技術スタック

- Next.js 16.2.2 / React 19 / TypeScript
- App Router + static export (`output: "export"`)
- Jest + Testing Library
- ランキングデータ: `lib/source-profiles.ts` と `public/data/ranking.json`
- 診断モデル: `public/data/diagnosis-model.json`

## 診断モデルの前提

- 画像診断はブラウザ内で特徴抽出を行う構成で、アプリ専用サーバーへ画像を送信しません
- コミット済みモデルは 192 件の学習プロフィールから生成
- 固定ホールドアウト 22 件で検証
- 身長は 70% が ±6cm 以内
- カップは 70% が ±1 カップ以内
- エンタメ用途の簡易診断であり、医学的・身体計測的な正確性を保証するものではありません

## セットアップ

前提:

- Node.js 20.9 以上
- 診断モデルを再生成する場合のみ Python 3 と `Pillow`

```bash
npm install
npm run dev
```

開発サーバー: `http://localhost:3000/body-type-analyzer`

## テストとビルド

```bash
npm run lint
npm test
npm run build
```

`npm run build` を実行すると、静的サイトが `out/` に出力されます。本リポジトリは static export 前提のため、デプロイ時は `out/` を GitHub Pages などの静的ホスティングへ配置します。

## データ構成

- `lib/source-profiles.ts`: ランキング用の公開プロフィール母集団
- `public/data/ranking.json`: ランキング画面で使う生成済みデータ
- `public/data/diagnosis-model.json`: 画像診断用の生成済みモデル
- `public/data/image-credits.json`: 配布画像のクレジット情報
- `local-data/training-profiles.json`: 追加収集したローカルトレーニングデータ
- `docs/data-sources.md`: 公開プロフィールの出典
- `docs/cup-sources.md`: カップ推定の根拠メモ
- `docs/additional-data-sources.md`: 追加収集ソース

## データ更新フロー

アプリを動かすだけなら、コミット済みの JSON データをそのまま使えます。データやモデルを更新したい場合は次の順で実行します。

1. `lib/source-profiles.ts` を更新する
2. 必要に応じて `npm run fetch:local-training` で `local-data/` を補完する
3. `node scripts/generate-ranking.mjs` で `public/data/ranking.json` を再生成する
4. `npm run generate:diagnosis-model` で `public/data/diagnosis-model.json` を再生成する
5. `npm test` で整合性を確認する

`npm run fetch:local-training` は外部サイトから追加候補を収集し、学習画像とプロフィールを `local-data/` に保存します。必要に応じて `ONLY_NAMES`, `THROTTLE_MS`, `BROAD_POOL`, `MAX_BROAD_NEW` を使って対象や収集量を絞れます。
