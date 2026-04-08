## タスク: カテゴリ統合 + 有名人データ100人×男女に拡大

### パート1: カテゴリ統合

現在5カテゴリ（女性）/ 4カテゴリ（男性）あるが多すぎるので統合:

**女性（3カテゴリ）:**
- 「スタイル偏差値」(category: "style") ← silhouette + upperBody + proportion を統合。score = cupがあれば (heightDev + cupDev) / 2、なければ heightDev
- 「AI推定身長」(category: "estimatedHeight") ← そのまま
- 「AI推定カップ数」(category: "estimatedCup") ← そのまま

**男性（2カテゴリ）:**
- 「スタイル偏差値」(category: "style") ← 統合。score = heightDev
- 「AI推定身長」(category: "estimatedHeight") ← そのまま

lib/ranking-builder.ts から silhouette, upperBody, proportion カテゴリの生成を削除し、style カテゴリを追加。

### パート2: データを100人×男女に拡大

lib/source-profiles.ts の femaleProfilePool を100人に、maleProfilePool を100人に拡大する。

各有名人のデータはWeb検索で取得:
- 「{名前} 身長 スリーサイズ カップ」で検索

**重要: 女性のカップ数分布が日本人平均に近づくように人選する**

目標分布（cup が判明している人の中で）:
- A: ~7%, B: ~22%, C: ~26%, D: ~22%, E: ~13%, F: ~6%, G+: ~4%

データ形式（既存と同じ）:
```typescript
// 女性
{ name: "名前", image: "https://ui-avatars.com/api/?name=名前&size=300&background=random&color=fff&bold=true", actualHeight: 163, bust: 86, cup: "E" }
// 男性
{ name: "名前", image: "https://ui-avatars.com/api/?name=名前&size=300&background=random&color=fff&bold=true", actualHeight: 179 }
```

※ 既存の人（public/imagesに画像がある人）のimageパスは変更しないこと

女性の追加候補（全部入れる必要なし、100人になればOK）:
桐谷美玲、河北麻友子、トリンドル玲奈、滝沢カレン、堀北真希、戸田恵梨香、水川あさみ、二階堂ふみ、石田ゆり子、松嶋菜々子、仲間由紀恵、常盤貴子、山本美月、高畑充希、波瑠、多部未華子、宮崎あおい、上戸彩、蒼井優、黒木華、吉高由里子、満島ひかり、長谷川潤、ローラ、道端ジェシカ、水原希子、紗栄子、真木よう子、天海祐希、米倉涼子、柴咲コウ、松本まりか、木村文乃、新木優子、広瀬アリス、馬場ふみか、小倉優子、若槻千夏、優木まおみ、久松郁実、佐野ひなこ、小池栄子、杉本彩、井上和香、篠崎愛、叶美香、叶恭子、板野友美、前田敦子、大島優子、渡辺麻友、生田絵梨花、与田祐希、遠藤さくら、山下美月、梅澤美波、平手友梨奈、長濱ねる

男性の追加候補:
大谷翔平、ダルビッシュ有、速水もこみち、阿部寛、要潤、伊藤英明、反町隆史、東出昌大、藤木直人、谷原章介、渡辺謙、坂口健太郎、竹内涼真、福士蒼汰、山下智久、松田翔太、瑛太、藤原竜也、綾野剛、長谷川博己、堺雅人、唐沢寿明、松本潤、櫻井翔、赤西仁、星野源、ムロツヨシ、神木隆之介、千葉雄大、大泉洋、香川照之、中井貴一、堤真一、濱田岳、池松壮亮、大野智、藤ヶ谷太輔、増田貴久、中島健人、道枝駿佑、目黒蓮、Snow Man ラウール、King & Prince 永瀬廉、なにわ男子 大西流星、平野紫耀、町田啓太、鹿賀丈史、佐藤浩市、役所広司、妻夫木聡、オダギリジョー、浅野忠信、加瀬亮、森田剛、松山ケンイチ、山田裕貴、杉野遥亮、鈴木伸之、間宮祥太朗、白濱亜嵐、片寄涼太、中条あやみ

### パート3: ranking.json 再生成

```bash
node scripts/generate-ranking.mjs
```

### パート4: テスト更新

app/__tests__/cup-data.test.ts:
1. 女性カテゴリが3つ（style, estimatedHeight, estimatedCup）であること
2. 男性カテゴリが2つ（style, estimatedHeight）であること
3. 女性のユニーク人数が90人以上
4. 男性のユニーク人数が90人以上
5. silhouette/upperBody/proportionカテゴリが存在しないこと

app/__tests__/page.test.tsx のモックデータも新カテゴリ構造に更新。

### パート5: 確認

- npm test で全テストパス
- npm run build で成功
