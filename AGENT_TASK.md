## タスク: 残り9人の画像を取得

### 画像なしの9人
井上和香, おのののか, しほの涼, 伊原六花, 磯貝花音, こもりやさくら, 杉野遥亮, 伊藤英明, 堤真一

### やること

この9人の画像をダウンロードして public/images/ に保存する。

Wikipedia以外のソースも使ってOK:
- Google画像検索で見つけたURL
- 所属事務所の公式サイト
- IMDb
- その他フリー画像

ダウンロード方法:
```bash
# Google等で画像URLを見つけて
curl -o public/images/{filename}.jpg "{画像URL}"
```

ファイル名:
- 井上和香 → inoue_waka.jpg
- おのののか → ono_nonoka.jpg
- しほの涼 → shihono_ryo.jpg
- 伊原六花 → ihara_rikka.jpg
- 磯貝花音 → isogai_kanon.jpg
- こもりやさくら → komoriya_sakura.jpg
- 杉野遥亮 → sugino_yosuke.jpg
- 伊藤英明 → ito_hideaki.jpg
- 堤真一 → tsutsumi_shinichi.jpg

どうしても画像が見つからない場合は、その人をsource-profiles.tsから削除して別の有名人に差し替えてもOK。
差し替え候補: 有名で画像が取りやすい人（例: 長澤まさみ系の知名度の人）

取得後:
1. lib/source-profiles.ts の image を更新
2. node scripts/generate-ranking.mjs
3. npm test && npm run build
