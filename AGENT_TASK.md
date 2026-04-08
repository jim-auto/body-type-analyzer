## タスク: 日本人女性のカップ数の分布データを調査し、偏差値計算に反映

### 概要
日本人女性のカップ数の割合（分布）をWebで調査し、その分布に基づいてカップ数の偏差値を正しく計算できるようにする。
現在のランキングの偏差値が実態の分布を反映していないので、統計データに基づいて修正する。

---

### 1. 日本人女性のカップ数分布をWebで調査

「日本人 カップ数 割合」「日本人 カップサイズ 分布」「日本人 ブラジャー サイズ 統計」等で検索。

トリンプやワコールなどの下着メーカーが公開している統計データや、調査会社のデータを探してください。

一般的に知られている分布（参考）:
- Aカップ: 約5〜8%
- Bカップ: 約20〜25%
- Cカップ: 約25〜28%
- Dカップ: 約20〜24%
- Eカップ: 約12〜16%
- Fカップ: 約5〜8%
- G以上: 約2〜4%

Webで見つけた実際のデータを使ってください。

### 2. lib/statistics.ts にカップ数分布データと偏差値計算を追加

```typescript
// 日本人女性のカップ数分布（Webで調査した実データを入れる）
export const CUP_DISTRIBUTION: Record<string, number> = {
  "A": 0.07,   // 7% ← 調査結果に合わせて修正
  "B": 0.22,
  "C": 0.26,
  "D": 0.22,
  "E": 0.13,
  "F": 0.06,
  "G": 0.03,
  "H": 0.01,
};

// カップ数から偏差値を算出
// 累積分布を使って正規分布上の位置を算出 → 偏差値に変換
export function calculateCupDeviation(cup: string): number {
  const cups = ["AA", "A", "B", "C", "D", "E", "F", "G", "H", "I"];
  const index = cups.indexOf(cup);
  if (index === -1) return 50; // 不明なら平均
  
  // 各カップの累積確率を計算
  let cumulative = 0;
  for (let i = 0; i <= index; i++) {
    cumulative += CUP_DISTRIBUTION[cups[i]] || 0;
  }
  // 累積確率の中間点
  const midpoint = cumulative - (CUP_DISTRIBUTION[cup] || 0) / 2;
  
  // 正規分布の逆関数で偏差値に変換
  // 簡易的な近似: 偏差値 = 50 + 10 * Φ^(-1)(p)
  // probit近似
  const p = Math.max(0.001, Math.min(0.999, midpoint));
  const z = probitApprox(p);
  return Math.round(50 + 10 * z);
}

// probit関数の近似（正規分布の逆累積分布関数）
function probitApprox(p: number): number {
  // Abramowitz and Stegun approximation
  const a1 = -3.969683028665376e+01;
  const a2 = 2.209460984245205e+02;
  const a3 = -2.759285104469687e+02;
  const a4 = 1.383577518672690e+02;
  const a5 = -3.066479806614716e+01;
  const a6 = 2.506628277459239e+00;
  const b1 = -5.447609879822406e+01;
  const b2 = 1.615858368580409e+02;
  const b3 = -1.556989798598866e+02;
  const b4 = 6.680131188771972e+01;
  const b5 = -1.328068155288572e+01;
  
  if (p < 0.5) {
    const t = Math.sqrt(-2 * Math.log(p));
    return -(((((a1*t+a2)*t+a3)*t+a4)*t+a5)*t+a6) / (((((b1*t+b2)*t+b3)*t+b4)*t+b5)*t+1);
  } else {
    const t = Math.sqrt(-2 * Math.log(1 - p));
    return (((((a1*t+a2)*t+a3)*t+a4)*t+a5)*t+a6) / (((((b1*t+b2)*t+b3)*t+b4)*t+b5)*t+1);
  }
}
```

### 3. lib/ranking-builder.ts を修正

「上半身バランス偏差値」カテゴリで、女性のscoreをカップ数偏差値で計算するように変更:

- cupがある場合: score = calculateCupDeviation(cup)
- cupがnullの場合: bustがあれば bustToEstimatedCup(bust) → calculateCupDeviation
- どちらもない場合: 身長偏差値にフォールバック

### 4. ranking.json を再生成

```bash
node scripts/generate-ranking.mjs
```

### 5. app/page.tsx にカップ数分布の表示を追加（オプション）

上半身バランス偏差値カテゴリ選択時に、日本人のカップ数分布を小さく表示すると参考になる:
```
日本人女性の分布: A(7%) B(22%) C(26%) D(22%) E(13%) F(6%) G(3%)
```
text-xs text-slate-400 で控えめに表示。

### 6. テスト追加

lib/__tests__/statistics.test.ts に追加:
1. CUP_DISTRIBUTION の全値の合計が約1.0（0.95〜1.05の範囲）であること
2. calculateCupDeviation("C") が 48〜52（平均付近）であること（Cカップが最頻値なので）
3. calculateCupDeviation("G") が 60以上であること（大きいカップは偏差値高い）
4. calculateCupDeviation("A") が 40以下であること（小さいカップは偏差値低い）
5. カップが大きいほど偏差値が高いこと（A < B < C < D < E < F < G の順）

app/__tests__/cup-data.test.ts に追加:
6. 上半身バランス偏差値のスコアがカップ分布に基づいていること（Gカップの人が上位にいること等）

### 7. 確認

- npm test で全テストパス
- npm run build で成功
