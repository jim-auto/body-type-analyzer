## タスク: バグ修正 + データ差別化

### バグ1（致命的）: bustToEstimatedCup が常にBカップを返す

lib/statistics.ts の bustToEstimatedCup 関数にバグがある:

```typescript
// 現在のコード（バグ）
const diff = bustCm - (bustCm - 12.5); // 常に12.5 → 常にBカップ
```

これは意味がない。正しくはアンダーバストを推定してトップバストとの差からカップを算出すべき。

修正方法: アンダーバストを推定する（バスト - 体格に応じた値）:

```typescript
export function bustToEstimatedCup(bustCm: number): string {
  // アンダーバストを推定（一般的にトップバスト - アンダーバスト差でカップが決まる）
  // 日本人女性の平均的なアンダーバストは約70cm
  // ただしバストが大きい人ほどアンダーも大きい傾向がある
  // アンダー推定: bust * 0.82 程度（経験的な係数）
  const estimatedUnder = Math.round(bustCm * 0.82);
  // 5cm刻みに丸める（65, 70, 75, 80...）
  const under = Math.round(estimatedUnder / 5) * 5;
  const diff = bustCm - under;
  
  // JIS規格: A=10, B=12.5, C=15, D=17.5, E=20, F=22.5, G=25
  if (diff < 11.25) return "A";
  if (diff < 13.75) return "B"; 
  if (diff < 16.25) return "C";
  if (diff < 18.75) return "D";
  if (diff < 21.25) return "E";
  if (diff < 23.75) return "F";
  return "G";
}
```

修正後にテストで確認:
- bust=94（原幹恵）→ Gカップ近辺が出ること
- bust=80（佐々木希）→ Cカップ近辺が出ること
- bust=88（綾瀬はるか）→ D〜Eカップ近辺が出ること
- 全員同じカップにならないこと

### バグ2: 男性の3カテゴリが完全に同一データ

男性は身長しかデータがないので、3カテゴリが全て同じ順位になっている。
差別化するために、各カテゴリで異なる計算を使う:

lib/ranking-builder.ts の男性スコア計算を変更:

- **シルエットバランス偏差値**: 身長の偏差値そのまま（現状通り）
- **上半身バランス偏差値**: 身長に名前seedベースの微調整を加える
  ```typescript
  const seed = getNameSeed(name);
  const adjustment = (seed % 7) - 3; // -3〜+3の調整
  score = calculateDeviation(actualHeight + adjustment, 171.0, 5.8);
  ```
- **プロポーション調和スコア**: 身長と推定身長の差が小さいほど高スコア
  ```typescript
  const estimatedHeight = getEstimatedHeight(actualHeight, name);
  const accuracy = 10 - Math.abs(estimatedHeight - actualHeight); // 推定精度
  score = calculateDeviation(actualHeight, 171.0, 5.8) + Math.round(accuracy / 2);
  ```

これで3カテゴリの順位が変わるようになる。

### 3. 推定カップ数ランキングの score 修正

現在 score が全員2（Bカップのインデックス）になっている。
bustToEstimatedCup 修正後、scoreを推定カップのインデックスに再計算:
A=1, B=2, C=3, D=4, E=5, F=6, G=7

ソートも推定カップの大きさ降順にする。

### 4. ranking.json を再生成

修正後に:
```bash
node scripts/generate-ranking.mjs
```

もしスクリプトが動かなければ手動でranking.jsonを修正してもOK。

### 5. テスト修正・追加

lib/__tests__/statistics.test.ts を更新:
1. bustToEstimatedCup(94) が "E"〜"G" の範囲であること（大きいカップ）
2. bustToEstimatedCup(80) が "B"〜"C" の範囲であること
3. bustToEstimatedCup(88) が "C"〜"E" の範囲であること
4. 異なるバストサイズで異なるカップが返ること
5. bustToEstimatedCup が常に同じ値を返さないこと（複数入力で確認）

app/__tests__/cup-data.test.ts を更新:
6. 推定カップ数ランキングの score が全員同じではないこと
7. 男性の3カテゴリの順位が全て同じではないこと（少なくとも1つは異なる）

### 6. 確認

- npm test で全テストパス
- npm run build で成功
