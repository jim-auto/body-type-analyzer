## タスク: ランキングデータを大量に増やす（偏差値が統計的に納得できるレベルに）

### 概要
現在各カテゴリ5人しかいないので、偏差値が説得力に欠ける。
各カテゴリ**20人**に増やす（女性20人×3カテゴリ、男性20人×3カテゴリ）。
※同じ人物が複数カテゴリに出てOK（実際のデータに基づいてソートするので順位は変わる）。

### 重要制約
- 個人利用なのでデータソースの制約なし。どのサイトからでも取得OK
- 身長・バスト・カップは複数サイトで検索して実データを使うこと
- 偏差値は lib/statistics.ts の calculateDeviation で算出（テキトーな値禁止）
- 画像はダウンロード不要。新規追加分は ui-avatars.com のURLを image に設定
  例: "/images/新規名前.jpg" ではなく、直接 "https://ui-avatars.com/api/?name=名前&size=300&background=random&color=fff&bold=true"

---

### 1. 女性有名人を大量追加

現在の15人に加えて以下を追加（合計で35人以上に）。Web検索で身長・バスト・カップを調べてください:

追加候補（必ずしもこの全員でなくてもいい。データが取れる人を優先）:
- 吉岡里帆、川口春奈、有村架純、白石麻衣、西野七瀬、齋藤飛鳥
- 泉里香、篠崎愛、杉原杏璃、磯山さやか
- 小嶋陽菜、指原莉乃、柏木由紀
- 土屋太鳳、吉田朱里、永野芽郁、森七菜
- 池田エライザ、みちょぱ（池田美優）、ゆきぽよ（木村有希）
- 本田翼、桐谷美玲、中村アン、ダレノガレ明美
- 安めぐみ、磯山さやか、原幹恵、MEGUMI
- 壇蜜、叶美香、叶恭子

各人物について:
```bash
# Web検索
"{名前} 身長 スリーサイズ カップ"
```

取得するデータ:
- actualHeight: 身長(cm)
- bust: バスト(cm) ※非公表なら null
- cup: カップ数(文字列) ※非公表なら null

### 2. 男性有名人を大量追加

現在の15人に加えて以下を追加（合計で35人以上に）:

追加候補:
- 菅田将暉、賀来賢人、成田凌、新田真剣佑、北村匠海
- 三浦春馬、窪田正孝、千葉雄大、志尊淳
- 長瀬智也、木村拓哉、岡田准一、二宮和也、相葉雅紀
- 妻夫木聡、小栗旬、山崎賢人、神木隆之介
- 高橋一生、星野源、ムロツヨシ
- EXILE TAKAHIRO、三代目 岩田剛典
- 大谷翔平、ダルビッシュ有（スポーツ選手も混ぜて身長バリエーション出す）

各人物について:
```bash
"{名前} 身長"
```

取得するデータ:
- actualHeight: 身長(cm)

### 3. ranking.json の更新

#### カテゴリ別のソート基準:

**女性:**
- "シルエットバランス偏差値": 身長の偏差値でソート（降順）
  score = calculateDeviation(actualHeight, 158.0, 5.4)
- "上半身バランス偏差値": bustがあればバスト偏差値、なければ身長偏差値でソート
  score = bust ? calculateDeviation(bust, 84.1, 4.5) : calculateDeviation(actualHeight, 158.0, 5.4)
- "プロポーション調和スコア": 身長偏差値でソート（同じ人が入ってもOK、全カテゴリ同じプールから）

**男性:**
- 全カテゴリ: 身長の偏差値でソート（降順）
  score = calculateDeviation(actualHeight, 171.0, 5.8)

各カテゴリの ranking 配列は score の降順でソートし、上位20人を入れること。

#### データ形式（既存と同じ）:

女性:
```json
{
  "name": "名前",
  "score": 偏差値（calculateDeviationで算出した整数）,
  "image": "https://ui-avatars.com/api/?name=名前&size=300&background=random&color=fff&bold=true",
  "cup": "E" or null,
  "actualHeight": 163,
  "bust": 88 or null
}
```

男性:
```json
{
  "name": "名前",
  "score": 偏差値,
  "image": "https://ui-avatars.com/api/?name=名前&size=300&background=random&color=fff&bold=true",
  "actualHeight": 179
}
```

※ 既存の15人（画像がpublic/imagesにある人）はimage パスをそのまま維持すること！

### 4. app/page.tsx の調整

20人表示になるので、UIを調整:
- スクロールで全員見られるようにする（特に変更不要かもしれないが確認）
- 4位以降のメダル色がなくても見やすいか確認

### 5. テスト更新

app/__tests__/cup-data.test.ts を更新:
- 各カテゴリが20人であること
- score が降順であること
- 女性全員に actualHeight があること
- 男性全員に actualHeight があること
- score の値が calculateDeviation の結果と一致すること（少なくとも5人分スポットチェック）
- 偏差値の分布が30〜80の範囲に収まること

### 6. 確認

- npm test で全テストパス
- npm run build で成功
