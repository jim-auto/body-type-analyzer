## タスク: ランキングに表示される全有名人の画像をダウンロード

### 概要
ランキングに表示される有名人のうち62人がui-avatars（文字アイコン）のまま。
全員の画像をWikipediaからダウンロードして差し替える。

### 画像なし62人

橋本マナミ, 小池栄子, 井上和香, 泉里香, おのののか, SHIHO, 筧美和子, 馬場ふみか, ケリー, 篠崎愛, 佐野ひなこ, あべみほ, 久松郁実, 稲森美優, しほの涼, インリン・オブ・ジョイトイ, MALIA., マギー, 葵井えりか, 朝比奈彩, 安井まゆ, 伊藤かな, 広瀬アリス, 菊地優里, 伊藤裕子, 衛藤美彩, 伊原六花, リア・ディゾン, フォンチー, 井上真央, yunocy, くぼたみか, 安枝瞳, 磯貝花音, こもりやさくら, 安田美沙子, 中村アン, 若槻千夏, 鎌倉美咲, 杉野遥亮, 竹内涼真, 目黒蓮, 鈴木伸之, Shen(Def Tech), 坂口健太郎, 渡辺謙, JP, 伊藤英明, 谷原章介, 町田啓太, 福士蒼汰, ROLAND, TAKURO(GLAY), 長谷川博己, 反町隆史, 綾野剛, 間宮祥太朗, 浅野忠信, アニマル浜口, 堤真一, DAIGO, SALU

### やること

1. 上記62人全員の画像をWikipedia APIからダウンロードして public/images/ に保存

ダウンロード方法:
```bash
# 各人物について
curl -s "https://ja.wikipedia.org/w/api.php?action=query&titles={名前}&prop=pageimages&format=json&pithumbsize=400"
# レスポンスの pages.*.thumbnail.source のURLから curl -o でダウンロード
```

**重要: 429エラー対策として、リクエスト間に2秒のスリープを入れること**
```bash
sleep 2
```

ファイル名は英語スネークケース（例: hashimoto_manami.jpg）。

Wikipediaに画像がない人は、英語版Wikipediaも試す:
```bash
curl -s "https://en.wikipedia.org/w/api.php?action=query&titles={英語名}&prop=pageimages&format=json&pithumbsize=400"
```

それでもダメな場合はui-avatarsのままでOK（仕方ない）。

2. lib/source-profiles.ts の該当エントリの image を "/images/{filename}.jpg" に更新

3. ranking.json を再生成
```bash
node scripts/generate-ranking.mjs
```

4. npm test と npm run build で確認
