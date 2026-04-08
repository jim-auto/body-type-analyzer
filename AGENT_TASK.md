## タスク: サイトタイトルを日本語に変更

### 変更箇所

以下の英語タイトルを全て日本語に変更してください。

#### 変更内容:

- "Body Balance Ranking" → "芸能人スタイルランキング"
- "Celebrity Body Balance Ranking" → "芸能人スタイルランキング"
- "有名人の体型バランスを偏差値でランキング" → "芸能人のスタイルをAIが偏差値で格付け！"

#### 対象ファイル:

1. **components/Header.tsx**: ロゴテキスト "Body Balance Ranking" → "芸能人スタイルランキング"
2. **app/page.tsx**: h1 の "Celebrity Body Balance Ranking" → "芸能人スタイルランキング"、サブタイトルも変更
3. **app/layout.tsx**: metadata の title と description を日本語に
   - title: "芸能人スタイルランキング | AIが偏差値で格付け"
   - description: "芸能人のスタイルをAIが偏差値で格付け！身長・カップ数の推定ランキングも"

#### テスト更新:

4. **app/__tests__/page.test.tsx**: "Celebrity Body Balance Ranking" を検索している箇所を新しい日本語に変更
5. **components/__tests__/Header.test.tsx**: "Body Balance Ranking" を検索している箇所を変更

### 確認

- npm test で全テストパス
- npm run build で成功
