## タスク: 推定身長ランキングと推定カップ数ランキングを追加

### 概要
既存の3カテゴリに加えて、「AI推定」系のネタランキングを追加する:
- 女性: 「AI推定身長ランキング」「AI推定カップ数ランキング」を追加（合計5カテゴリ）
- 男性: 「AI推定身長ランキング」を追加（合計4カテゴリ）

推定値は lib/profile-estimates.ts の getEstimatedHeight / getEstimatedCupFromBust を使う。
実データとの乖離が面白いネタ要素になる。

---

### 1. lib/ranking-builder.ts を修正

ranking.json 生成時に新カテゴリを追加:

#### 女性に2カテゴリ追加:

```typescript
// AI推定身長ランキング
{
  category: "estimatedHeight",
  title: "AI推定身長ランキング",
  ranking: [/* 推定身長が高い順にソート、上位20人 */]
}

// AI推定カップ数ランキング  
{
  category: "estimatedCup",
  title: "AI推定カップ数ランキング",
  ranking: [/* 推定カップが大きい順にソート、上位20人 */]
}
```

推定身長ランキングの各エントリ:
```typescript
{
  name: profile.name,
  score: getEstimatedHeight(profile.actualHeight, profile.name), // 推定身長をscoreに
  image: profile.image,
  cup: profile.cup,
  actualHeight: profile.actualHeight,
  bust: profile.bust,
  estimatedHeight: getEstimatedHeight(profile.actualHeight, profile.name),
  heightDiff: getEstimatedHeight(profile.actualHeight, profile.name) - profile.actualHeight
}
```
scoreは推定身長の値そのまま（偏差値ではなく cm で表示）。降順ソート。

推定カップ数ランキングの各エントリ:
- bustがnullの人はスキップ
- getEstimatedCupFromBust(bust) で推定カップを算出
- カップの大きさ順（G>F>E>D>C>B>A）でソート
- scoreは表示用に使わない or カップのインデックス値（A=1, B=2, ...）
- 実際のcupとの乖離も表示したい

#### 男性に1カテゴリ追加:

```typescript
{
  category: "estimatedHeight", 
  title: "AI推定身長ランキング",
  ranking: [/* 推定身長が高い順にソート、上位20人 */]
}
```

### 2. app/page.tsx のUI調整

- タブが5つ（女性）/ 4つ（男性）になるので、タブを折り返し可能にする（flex-wrap で対応済みなら問題なし）
- 推定身長ランキングの場合:
  - scoreの表示を「{score}cm」にする（偏差値ではなくcm）
  - 「実際: {actualHeight}cm（差: {heightDiff}cm {emoji}）」を2行目に表示
- 推定カップ数ランキングの場合:
  - scoreの表示を「{estimatedCup}カップ」にする
  - 「実際: {actualCup}（差: {cupDiff}サイズ {emoji}）」を2行目に表示

カテゴリ判定方法:
```typescript
const isEstimatedHeightCategory = current.category === "estimatedHeight";
const isEstimatedCupCategory = current.category === "estimatedCup";
```

scoreの表示を分岐:
```typescript
{isEstimatedHeightCategory ? `${entry.score}cm` : 
 isEstimatedCupCategory ? `${entry.estimatedCup}カップ` : 
 entry.score}
```

### 3. ranking.json を再生成

lib/ranking-builder.ts を修正後、scripts/generate-ranking.mjs を実行してranking.jsonを再生成:

```bash
node scripts/generate-ranking.mjs
```

もしスクリプトが動かない場合は、直接ranking.jsonを手動で編集してもOK。

### 4. エントリに推定フィールドを追加

ranking.json の全エントリに以下のフィールドを追加（既存カテゴリも含む）:
- estimatedHeight: getEstimatedHeight(actualHeight, name) の結果
- heightDiff: estimatedHeight - actualHeight

女性エントリには追加で:
- estimatedCup: getEstimatedCupFromBust(bust) の結果（bustがnullならnull）
- cupDiff: 推定カップと実カップの差（getCupDifference）

### 5. テスト追加

app/__tests__/cup-data.test.ts に追加:
1. 女性に "AI推定身長ランキング" カテゴリが存在すること
2. 女性に "AI推定カップ数ランキング" カテゴリが存在すること
3. 男性に "AI推定身長ランキング" カテゴリが存在すること
4. 推定身長ランキングが推定身長の降順であること
5. 推定カップ数ランキングがカップの大きさ降順であること
6. 推定身長ランキングの各エントリに estimatedHeight があること
7. 推定カップ数ランキングの各エントリに estimatedCup があること
8. heightDiff が estimatedHeight - actualHeight と一致すること

app/__tests__/page.test.tsx に追加:
9. 推定身長タブをクリックすると cm 表示になること
10. 推定カップタブをクリックするとカップ表示になること

### 6. 確認

- npm test で全テストパス
- npm run build で成功
