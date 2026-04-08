## タスク: AI画像診断機能を追加（身長・カップサイズ推定）

### 概要
画像をアップロードすると、AIっぽく身長とカップサイズを推定する診断機能を追加。
ランキングページのヘッダーから「診断する」ボタンで遷移。
完全にクライアントサイドで動作（画像はサーバーに送信しない）。

---

### 1. app/analyze/page.tsx を新規作成（診断ページ）

"use client" コンポーネント

#### 画面構成:

**ステップ1: 画像アップロード**
- ドラッグ&ドロップ対応のアップロードエリア
- input[type="file"] accept="image/*"
- プレビュー表示（URL.createObjectURL）
- 注意文: "⚠ 本人の画像のみ使用してください" "結果はエンタメ目的です"

**ステップ2: ネタローディング演出**
画像選択後、以下のメッセージを1.5秒間隔で表示:
```
const messages = [
  "骨格をなんとなく解析中…",
  "AIが雰囲気で判断しています…",
  "体型バランスを数値化中…",
  "偏差値をフィーリングで算出中…",
  "もっともらしい結果を生成中…",
];
```
プログレスバー（偽）も表示。

**ステップ3: 結果表示**

#### 結果の生成ロジック:

画像からハッシュを生成し、seedベースで決定論的に結果を出す:

```typescript
// lib/image-analyzer.ts を新規作成

export async function hashFromImage(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(buffer);
      let hash = 0;
      for (let i = 0; i < bytes.length; i++) {
        hash = (hash * 31 + bytes[i]) & 0xFFFFFFFF;
      }
      resolve(hash);
    };
    reader.readAsArrayBuffer(file);
  });
}

export function seededRandom(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

export type DiagnosisResult = {
  estimatedHeight: number;    // 推定身長 (cm)
  estimatedCup: string;       // 推定カップ
  heightDeviation: number;    // 身長偏差値
  cupDeviation: number;       // カップ偏差値
  silhouetteType: "X" | "I" | "A";
  confidence: number;         // AI信頼度 (15〜45%)
  similarCelebrity: string;   // 近い有名人
};

export function diagnose(hash: number): DiagnosisResult {
  const rand = seededRandom(hash);
  
  // 日本人女性の分布に沿った推定身長を生成
  // 正規分布に従うように Box-Muller 変換
  const u1 = rand();
  const u2 = rand();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const estimatedHeight = Math.round(158 + 5.4 * z); // 平均158cm, 標準偏差5.4
  
  // カップ数を日本人分布に沿って生成
  // CUP_DISTRIBUTION の累積確率を使ってランダム選択
  const cupRand = rand();
  // ... CUP_DISTRIBUTION を使って累積確率でカップを決定
  
  // 偏差値計算
  // calculateDeviation, calculateCupDeviation を使用
  
  // シルエットタイプ
  const silhouetteType = rand() < 0.33 ? "X" : rand() < 0.5 ? "I" : "A";
  
  // AI信頼度（低めでネタ）
  const confidence = Math.floor(rand() * 30) + 15;
  
  // 近い有名人（ranking.jsonから身長が近い人を選択）
  // ...
  
  return { estimatedHeight, estimatedCup, heightDeviation, cupDeviation, silhouetteType, confidence, similarCelebrity };
}
```

#### 結果画面の表示内容:

カード形式で表示:
- **推定身長**: 大きな数字で "163cm"、偏差値バッジ
- **推定カップサイズ**: 大きな文字で "Dカップ"、偏差値バッジ
- **シルエットタイプ**: X / I / A バッジ
- **AI信頼度**: プログレスバー（低いので赤〜黄色、ネタ）
- **あなたに近い有名人**: ランキングから1〜3人表示（名前 + 画像 + 類似度%）

免責表示:
- "※ このAIは雰囲気で動いています"
- "※ 結果はAIの気分で算出されています"
- "※ 画像はサーバーに送信されません。全てブラウザ内で処理されます"

#### シェア機能:

- 結果テキストコピーボタン
- Xシェアボタン

シェアテキスト例:
```
【芸能人スタイルランキング AI診断】
推定身長: 163cm（偏差値59）
推定カップ: Dカップ（偏差値54）
似ている有名人: 石原さとみ
AI信頼度: 28%（雰囲気で判定）

#芸能人スタイルランキング
https://jim-auto.github.io/body-type-analyzer/
```

### 2. components/Header.tsx に「診断する」リンク追加

```typescript
<Link href="/analyze" className="rounded-full bg-pink-500 text-white px-4 py-2 text-sm font-medium hover:bg-pink-600 transition">
  AI診断
</Link>
```

### 3. ランキングページ（app/page.tsx）にもCTAを追加

ランキングの上か下に:
```
「あなたのスタイルも診断してみる？」ボタン → /analyze へ
```

### 4. テスト

#### lib/__tests__/image-analyzer.test.ts（新規、15テスト以上）
1. hashFromImage: 同じファイルで同じハッシュ
2. hashFromImage: 異なるファイルで異なるハッシュ
3. seededRandom: 同じseedで同じ乱数列
4. seededRandom: 異なるseedで異なる乱数列
5. seededRandom: 返り値が0〜1の範囲
6. diagnose: 同じhashで同じ結果（冪等性）
7. diagnose: 異なるhashで異なる結果
8. diagnose: estimatedHeight が 140〜190 の範囲
9. diagnose: estimatedCup が A〜H のいずれか
10. diagnose: heightDeviation が 20〜80 の範囲
11. diagnose: cupDeviation が 20〜80 の範囲
12. diagnose: confidence が 15〜44 の範囲
13. diagnose: silhouetteType が "X" | "I" | "A" のいずれか
14. diagnose: similarCelebrity が空文字でないこと
15. 100個のhashでループして全て範囲内か確認

#### app/__tests__/analyze.test.tsx（新規、10テスト以上）
1. アップロードエリアが表示されること
2. 注意文が表示されること
3. 「AI診断」ページタイトルが表示されること

#### components/__tests__/Header.test.tsx 更新
4. AI診断リンクが存在すること

### 5. 確認

- npm test で全テストパス
- npm run build で成功（/analyze ページが静的エクスポートされること）
