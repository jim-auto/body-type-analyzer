# 芸能人スタイルランキング — プロジェクト計画書

## プロジェクト概要

GitHub Pagesで公開するネタ系Webアプリ「芸能人スタイルランキング」。
AIが芸能人のスタイル（身長・カップ数）を偏差値でランキング＋画像診断機能。

**公開URL:** https://jim-auto.github.io/body-type-analyzer/

---

## 技術スタック

| 技術 | 詳細 |
|------|------|
| フレームワーク | Next.js 16 (App Router) |
| スタイル | Tailwind CSS 4 |
| テスト | Jest 30 + React Testing Library |
| ホスティング | GitHub Pages (静的エクスポート) |
| CI/CD | GitHub Actions (.github/workflows/deploy.yml) |
| ビルド | `output: "export"`, `basePath: "/body-type-analyzer"` |

### 最重要制約
- GitHub Pagesで動作（完全静的サイト）
- サーバーサイド処理禁止 / API Route禁止
- `next export` でビルド可能
- すべてクライアントサイドで完結
- 画像はサーバーに送信しない

---

## 現在の状態（最終更新: 2026-04-08）

### テスト: 86件全パス（7スイート）
### ビルド: 成功（静的ページ: `/`, `/analyze`, `/_not-found`）
### データ: 女性100人 / 男性100人（source-profiles.ts）
### 画像: ランキング表示分は全員画像あり（0人欠け）

---

## ディレクトリ構成

```
app/
  page.tsx                    # トップページ（ランキング）
  analyze/page.tsx            # AI画像診断ページ
  layout.tsx                  # 共通レイアウト（Header + Footer）
  __tests__/
    page.test.tsx             # ランキングページテスト
    analyze.test.tsx          # 診断ページテスト
    cup-data.test.ts          # データ検証テスト
    cup-distribution-ranking.test.ts  # カップ分布ランキングテスト

components/
  Header.tsx                  # ヘッダー（ロゴ + AI診断リンク）
  __tests__/Header.test.tsx

lib/
  statistics.ts               # 統計関数（偏差値計算、カップ分布、probit変換）
  source-profiles.ts          # 有名人プロフィールデータ（女性100人 + 男性100人）
  ranking-builder.ts          # ranking.json生成ロジック
  ranking.ts                  # ランキング型定義
  image-analyzer.ts           # 画像診断（ハッシュ生成、seededRandom、diagnose）
  profile-estimates.ts        # AI推定（身長推定、カップ推定、乖離計算）
  profile-insights.ts         # プロフィール洞察
  __tests__/
    statistics.test.ts
    image-analyzer.test.ts

scripts/
  generate-ranking.mjs        # ranking.json再生成スクリプト
  fetch-source-profiles.mjs   # プロフィールデータ取得スクリプト
  fetch-wikipedia-ranking-images.mjs  # Wikipedia画像取得スクリプト

public/
  data/ranking.json            # ランキングデータ（ビルド済み）
  images/                      # 有名人画像（80枚以上）

docs/
  data-sources.md              # データ出典
  cup-sources.md               # カップ数出典
  additional-data-sources.md   # 追加データ出典
```

---

## 機能一覧

### 1. ランキングページ（`/`）

**男女切り替えタブ:**
- 女性（ピンク系）/ 男性（ブルー系）

**女性カテゴリ（3つ）:**
- スタイル偏差値ランキング（身長+カップの総合偏差値）
- AI推定身長ランキング（推定身長の高い順、cm表示）
- AI推定カップ数ランキング（推定カップの大きい順）

**男性カテゴリ（2つ）:**
- スタイル偏差値ランキング（身長偏差値）
- AI推定身長ランキング（推定身長の高い順）

**各エントリの表示:**
- 順位バッジ（1〜3位: 金銀銅メダル色）
- 有名人画像（丸いアバター）
- 名前
- カップ数バッジ（女性のみ、nullの場合は非表示）
- 身長
- スコア（偏差値 or cm or カップ）
- AI推定値と実データの乖離（2行目、顔文字付き）

**表示人数:** 各カテゴリ上位20人

**その他:**
- カップ分布参考表示（トリンプ2018年データ）
- 「あなたのスタイルも診断してみる？」CTA → /analyze

### 2. AI画像診断ページ（`/analyze`）

**フロー:**
1. 画像アップロード（ドラッグ&ドロップ対応）
2. ネタローディング演出（5段階メッセージ、約7.5秒）
3. 結果表示

**診断ロジック（lib/image-analyzer.ts）:**
- FileReaderで画像をArrayBufferに読み込み
- バイト列から簡易ハッシュ生成（hash * 31 + byte）
- ハッシュをseedにしたxorshift32疑似乱数
- Box-Muller変換で正規分布に沿った推定身長生成（平均158cm, σ5.4）
- CUP_DISTRIBUTIONの累積確率でカップ数生成
- 同じ画像 → 同じ結果（決定論的）

**結果表示:**
- 推定身長 + 偏差値
- 推定カップ + 偏差値
- シルエットタイプ（X/I/A）
- AI信頼度（15〜45%、低めでネタ）
- 似ている有名人

**シェア機能:**
- クリップボードコピー
- Xシェアボタン

**免責表示:**
- 「※ このAIは雰囲気で動いています」
- 「※ 画像はサーバーに送信されません」

### 3. 安全設計

- 「本人の画像のみ使用してください」注意文
- 「結果はエンタメ目的です」
- フッター: エンタメ目的免責 + 画像ブラウザ処理の明記

---

## データ設計

### 有名人プロフィール（lib/source-profiles.ts）

**女性（100人）:**
```typescript
type FemaleProfileSource = {
  name: string;
  image: string;          // "/images/xxx.jpg" or ui-avatars URL
  actualHeight: number;   // 身長(cm)
  bust: number | null;    // バスト(cm)
  cup: string | null;     // カップ数 (A〜H or null)
};
```

**男性（100人）:**
```typescript
type MaleProfileSource = {
  name: string;
  image: string;
  actualHeight: number;
};
```

### カップ数分布（lib/statistics.ts）

トリンプ2018年売上割合ベース:
```
A: 2.1%, B: 17.9%, C: 26.9%, D: 26.3%, E: 18.8%, F: 6.4%, G: 1.6%
```

### 偏差値計算

```typescript
// 身長偏差値
calculateDeviation(height, mean, stddev) = round(50 + 10 * (height - mean) / stddev)
// 女性: mean=158.0, stddev=5.4
// 男性: mean=171.0, stddev=5.8

// カップ偏差値
calculateCupDeviation(cup) // 累積分布 → probit変換 → 偏差値

// バストからカップ推定
bustToEstimatedCup(bust) // アンダー推定(bust*0.82) → JIS規格でカップ算出

// スタイル偏差値（女性）
style = cupがあれば (heightDev + cupDev) / 2、なければ heightDev

// スタイル偏差値（男性）
style = heightDev
```

### AI推定（lib/profile-estimates.ts）

```typescript
// 推定身長: 実身長 + 名前seedベースの誤差(±1〜8cm)
getEstimatedHeight(actualHeight, name)

// 推定カップ: bustからアンダー推定してカップ算出
getEstimatedCupFromBust(bust)

// 乖離の顔文字: 0=🎯, 1-2=😊, 3-5=🤔, 6+=😏
getMismatchEmoji(diff)
```

### ranking.json 構造

```json
{
  "female": [
    {
      "category": "style",
      "title": "スタイル偏差値ランキング",
      "ranking": [
        {
          "name": "名前",
          "score": 68,
          "image": "/images/xxx.jpg",
          "cup": "E",
          "actualHeight": 163,
          "bust": 86,
          "estimatedHeight": 170,
          "heightDiff": 7,
          "estimatedCup": "D",
          "cupDiff": -1
        }
      ]
    }
  ],
  "male": [...]
}
```

### ranking.json 再生成

```bash
node scripts/generate-ranking.mjs
```

---

## テスト一覧（86件、7スイート）

| ファイル | テスト数 | 内容 |
|----------|----------|------|
| app/__tests__/page.test.tsx | ~25 | ランキングページ（ローディング、タブ切り替え、男女切り替え、カップ表示、メダル色等） |
| app/__tests__/analyze.test.tsx | ~10 | 診断ページ（アップロードエリア、注意文） |
| app/__tests__/cup-data.test.ts | ~15 | データ検証（カテゴリ数、スコア降順、フィールド存在、範囲チェック） |
| app/__tests__/cup-distribution-ranking.test.ts | ~5 | カップ分布ランキング検証 |
| components/__tests__/Header.test.tsx | ~4 | ヘッダー（ロゴ、リンク） |
| lib/__tests__/statistics.test.ts | ~12 | 偏差値計算、カップ偏差値、bustToEstimatedCup |
| lib/__tests__/image-analyzer.test.ts | ~15 | ハッシュ生成、seededRandom、diagnose関数 |

---

## コミット履歴（新しい順）

```
85a2bef feat: all ranking celebrities now have real images (0 missing)
1fcb403 feat: download 53 celebrity images from Wikipedia (62->9 remaining)
86838e4 feat: expand to 100 female + 100 male celebrities with real data
7241636 feat: simplify categories + expand data (43F/28M, WIP toward 100)
c8a21b4 feat: AI image diagnosis page - estimate height & cup size
b0148fc feat: cup size distribution data + statistical deviation calculation
54c9599 feat: サイトタイトルを日本語化「芸能人スタイルランキング」
33baffa fix: bustToEstimatedCup always returning B + male categories identical
95b830c feat: add AI estimated height/cup ranking categories
da5ba78 feat: expand ranking to 20 per category with real data + deviation calc
e782e4b feat: real height/bust data, statistics-based deviation, AI estimation gap
514c57c feat: real cup size data from web research, upper body images, data tests
d07aa9c feat: add male ranking, cup size for females, 44 tests
94075b7 feat: Japanese category titles + celebrity photos from Wikimedia
220984b feat: change ranking data to Japanese celebrities
645733a refactor: convert site to celebrity ranking-only with avatar images
6e146d3 feat: complete body-type-analyzer app
```

---

## 既知の課題・改善候補

### データ品質
- ランキング表示は各カテゴリ20人だが、母集団は100人いる。表示人数を増やすか検討
- カップ数がnullの人が一部いる（公称値なし）
- 一部の有名人の身長・バストデータが推定値の可能性あり

### UI/UX
- モバイルでタブが多いと横スクロールになる可能性
- ランキングの2行目（AI推定表示）が情報過多になる場合がある
- ダークモード未対応

### 機能追加候補
- ランキング表示人数の拡大（20→50人等）
- 有名人詳細ページ
- 年代別・ジャンル別フィルター
- 身長分布・カップ分布のグラフ表示
- 男性にも体重・BMIデータ追加
- OGP画像の動的生成（シェア時のプレビュー）

---

## 開発環境セットアップ

```bash
git clone https://github.com/jim-auto/body-type-analyzer.git
cd body-type-analyzer
npm install
npm run dev     # 開発サーバー起動
npm test        # テスト実行
npm run build   # 本番ビルド（out/ ディレクトリに静的ファイル生成）
```

### ranking.json の再生成

```bash
node scripts/generate-ranking.mjs
```

### 有名人画像の一括取得

```bash
node scripts/fetch-wikipedia-ranking-images.mjs
```

---

## codex への引き継ぎ事項

### 重要なルール
1. **output: "export"** 必須（GitHub Pages）
2. **basePath: "/body-type-analyzer"** 必須
3. **API Route 禁止**（完全静的サイト）
4. **テストをたくさん書くこと**（ユーザーの強い要望）
5. **偏差値は calculateDeviation で統計的に計算**（テキトーな値禁止）
6. **カップ数は実データ**（Web検索で確認）
7. **画像ダウンロード時は429対策でsleep入れる**
8. **完了時刻は「何時何分」で具体的に伝える**

### ファイル変更時の注意
- lib/source-profiles.ts を変更したら `node scripts/generate-ranking.mjs` で ranking.json 再生成
- 画像追加したら source-profiles.ts の image パスも更新
- カテゴリ変更したら app/__tests__/page.test.tsx のモックデータも更新
- 必ず `npm test && npm run build` で確認

### 現在の next.config.ts
```typescript
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/body-type-analyzer",
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
};
export default nextConfig;
```
