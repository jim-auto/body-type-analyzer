const FEMALE_CUP_PAGE_SLUGS = {
  A: "a%e3%82%ab%e3%83%83%e3%83%97",
  B: "b%e3%82%ab%e3%83%83%e3%83%97",
  C: "c%e3%82%ab%e3%83%83%e3%83%97",
  D: "d%e3%82%ab%e3%83%83%e3%83%97",
  E: "e%e3%82%ab%e3%83%83%e3%83%97",
  F: "f%e3%82%ab%e3%83%83%e3%83%97",
  G: "g%e3%82%ab%e3%83%83%e3%83%97",
  H: "h%e3%82%ab%e3%83%83%e3%83%97",
};

const FEMALE_CUP_ORDER = ["A", "B", "C", "D", "E", "F", "G", "H"];

const FEMALE_PREFERRED_NAMES = [
  "新垣結衣",
  "佐々木希",
  "綾瀬はるか",
  "深田恭子",
  "石原さとみ",
  "長澤まさみ",
  "本田翼",
  "川口春奈",
  "北川景子",
  "菜々緒",
  "中条あやみ",
  "今田美桜",
  "藤田ニコル",
  "小嶋陽菜",
  "佐野ひなこ",
  "小倉優子",
  "若槻千夏",
  "優木まおみ",
  "小池栄子",
  "杉本彩",
  "井上和香",
  "篠崎愛",
  "板野友美",
  "前田敦子",
  "大島優子",
  "渡辺麻友",
  "生田絵梨花",
  "与田祐希",
  "山下美月",
  "遠藤さくら",
  "上戸彩",
  "蒼井優",
  "石田ゆり子",
  "松嶋菜々子",
  "仲間由紀恵",
  "常盤貴子",
  "山本美月",
  "高畑充希",
  "波瑠",
  "多部未華子",
  "宮崎あおい",
  "吉高由里子",
  "長谷川潤",
  "ローラ",
  "道端ジェシカ",
  "水原希子",
  "紗栄子",
  "真木よう子",
  "米倉涼子",
  "柴咲コウ",
  "松本まりか",
  "木村文乃",
  "戸田恵梨香",
  "水川あさみ",
  "黒木華",
  "広瀬アリス",
  "馬場ふみか",
  "久松郁実",
  "叶美香",
  "河北麻友子",
  "トリンドル玲奈",
  "滝沢カレン",
  "堀北真希",
  "高橋メアリージュン",
  "高橋ユウ",
  "田中みな実",
  "中村アン",
  "内田理央",
  "泉里香",
  "森香澄",
  "森星",
  "朝比奈彩",
  "筧美和子",
  "橋本マナミ",
  "小芝風花",
  "鷲見玲奈",
  "伊原六花",
  "岡崎紗絵",
  "池田エライザ",
  "生見愛瑠",
  "王林",
];

const FEMALE_EXCLUDED_NAMES = new Set(["AKINA", "MAHO"]);

// These profiles are not covered by the idolprof A-H cup index, but they already
// exist in the vetted local training set with explicit height / bust / cup data.
const FEMALE_AV_ADDITIONAL_PROFILES = [
  { name: "MEW", actualHeight: 162, bust: 86, cup: "F" },
  { name: "あべみかこ", actualHeight: 144, bust: 78, cup: "G" },
  { name: "あやみ旬果", actualHeight: 155, bust: 95, cup: "H" },
  { name: "葵つかさ", actualHeight: 163, bust: 89, cup: "G" },
  { name: "安齋らら", actualHeight: 155, bust: 100, cup: "H" },
  { name: "伊東ちなみ", actualHeight: 156, bust: 90, cup: "G" },
  { name: "永井すみれ", actualHeight: 155, bust: 86, cup: "G" },
  { name: "益坂美亜", actualHeight: 150, bust: 105, cup: "H" },
  { name: "園田みおん", actualHeight: 159, bust: 88, cup: "G" },
  { name: "奥田咲", actualHeight: 162, bust: 100, cup: "G" },
  { name: "架乃ゆら", actualHeight: 155, bust: 88, cup: "H" },
  { name: "河合あすな", actualHeight: 157, bust: 95, cup: "G" },
  { name: "希崎ジェシカ", actualHeight: 160, bust: 86, cup: "G" },
  { name: "吉沢明歩", actualHeight: 161, bust: 86, cup: "G" },
  { name: "月野りさ", actualHeight: 156, bust: 90, cup: "G" },
  { name: "工藤まなみ", actualHeight: 160, bust: 95, cup: "H" },
  { name: "高橋しょう子", actualHeight: 160, bust: 90, cup: "G" },
  { name: "佐倉絆", actualHeight: 152, bust: 86, cup: "H" },
  { name: "桜ここみ", actualHeight: 155, bust: 92, cup: "H" },
  { name: "桜井彩", actualHeight: 163, bust: 96, cup: "H" },
  { name: "桜空もも", actualHeight: 155, bust: 90, cup: "G" },
  { name: "三上悠亜", actualHeight: 159, bust: 88, cup: "F" },
  { name: "市川まさみ", actualHeight: 163, bust: 82, cup: "G" },
  { name: "七海ティナ", actualHeight: 168, bust: 92, cup: "H" },
  { name: "篠田ゆう", actualHeight: 163, bust: 95, cup: "H" },
  { name: "紗倉まな", actualHeight: 155, bust: 89, cup: "G" },
  { name: "若宮はずき", actualHeight: 158, bust: 95, cup: "H" },
  { name: "若菜奈央", actualHeight: 160, bust: 95, cup: "H" },
  { name: "秋山祥子", actualHeight: 160, bust: 86, cup: "F" },
  { name: "春菜はな", actualHeight: 163, bust: 103, cup: "H" },
  { name: "春野ゆこ", actualHeight: 158, bust: 95, cup: "H" },
  { name: "初川みなみ", actualHeight: 158, bust: 84, cup: "G" },
  { name: "初美沙希", actualHeight: 163, bust: 88, cup: "H" },
  { name: "小早川怜子", actualHeight: 168, bust: 93, cup: "H" },
  { name: "松岡ちな", actualHeight: 157, bust: 93, cup: "H" },
  { name: "松本菜奈実", actualHeight: 163, bust: 100, cup: "H" },
  { name: "上原亜衣", actualHeight: 155, bust: 88, cup: "H" },
  { name: "深田ナナ", actualHeight: 158, bust: 99, cup: "H" },
  { name: "神咲詩織", actualHeight: 161, bust: 95, cup: "H" },
  { name: "水城奈緒", actualHeight: 162, bust: 90, cup: "H" },
  { name: "水沢のの", actualHeight: 159, bust: 86, cup: "F" },
  { name: "水卜さくら", actualHeight: 158, bust: 97, cup: "H" },
  { name: "水野朝陽", actualHeight: 162, bust: 98, cup: "H" },
  { name: "星美りか", actualHeight: 157, bust: 85, cup: "F" },
  { name: "跡美しゅり", actualHeight: 155, bust: 83, cup: "G" },
  { name: "蒼井そら", actualHeight: 155, bust: 90, cup: "H" },
  { name: "大場ゆい", actualHeight: 158, bust: 93, cup: "H" },
  { name: "朝倉ことみ", actualHeight: 150, bust: 88, cup: "H" },
  { name: "朝田ひまり", actualHeight: 147, bust: 84, cup: "F" },
  { name: "辻本杏", actualHeight: 160, bust: 90, cup: "H" },
  { name: "天海つばさ", actualHeight: 162, bust: 93, cup: "H" },
  { name: "天使もえ", actualHeight: 155, bust: 82, cup: "G" },
  { name: "田中瞳", actualHeight: 150, bust: 95, cup: "H" },
  { name: "波多野結衣", actualHeight: 163, bust: 88, cup: "G" },
  { name: "白石茉莉奈", actualHeight: 158, bust: 88, cup: "G" },
  { name: "妃乃ひかり", actualHeight: 165, bust: 93, cup: "H" },
  { name: "美竹すず", actualHeight: 155, bust: 85, cup: "H" },
  { name: "風間ゆみ", actualHeight: 158, bust: 98, cup: "H" },
  { name: "保坂えり", actualHeight: 160, bust: 98, cup: "H" },
  { name: "宝来みゆき", actualHeight: 155, bust: 95, cup: "H" },
  { name: "北条麻妃", actualHeight: 163, bust: 90, cup: "H" },
  { name: "麻美ゆま", actualHeight: 160, bust: 90, cup: "G" },
  { name: "岬ななみ", actualHeight: 155, bust: 95, cup: "H" },
  { name: "湊莉久", actualHeight: 155, bust: 84, cup: "G" },
  { name: "夢見るぅ", actualHeight: 156, bust: 102, cup: "H" },
  { name: "霧島さくら", actualHeight: 165, bust: 97, cup: "H" },
  { name: "明日花キララ", actualHeight: 163, bust: 86, cup: "G" },
  { name: "有村千佳", actualHeight: 154, bust: 86, cup: "H" },
  { name: "立花はるみ", actualHeight: 160, bust: 98, cup: "H" },
  { name: "涼森れむ", actualHeight: 165, bust: 93, cup: "H" },
  { name: "凰かなめ", actualHeight: 160, bust: 88, cup: "G" },
  { name: "澁谷果歩", actualHeight: 155, bust: 97, cup: "H" },
  { name: "成海うるみ", actualHeight: 155, bust: 97, cup: "H" },
  { name: "Hitomi", actualHeight: 160, bust: 110, cup: "H" },
  { name: "JULIA", actualHeight: 160, bust: 101, cup: "H" },
  { name: "みひろ", actualHeight: 157, bust: 84, cup: "H" },
  { name: "水谷ケイ", actualHeight: 165, bust: 93, cup: "H" },
];

const MALE_HEIGHTS = Array.from({ length: 31 }, (_, index) => index + 165);

const MALE_PREFERRED_NAMES = [
  "斎藤工",
  "向井理",
  "福山雅治",
  "玉木宏",
  "竹野内豊",
  "鈴木亮平",
  "松坂桃李",
  "西島秀俊",
  "佐藤健",
  "山田孝之",
  "田中圭",
  "岩田剛典",
  "横浜流星",
  "吉沢亮",
  "中村倫也",
  "大谷翔平",
  "ダルビッシュ有",
  "速水もこみち",
  "阿部寛",
  "要潤",
  "伊藤英明",
  "反町隆史",
  "東出昌大",
  "藤木直人",
  "谷原章介",
  "渡辺謙",
  "坂口健太郎",
  "竹内涼真",
  "福士蒼汰",
  "山下智久",
  "松田翔太",
  "永山瑛太",
  "藤原竜也",
  "綾野剛",
  "長谷川博己",
  "堺雅人",
  "唐沢寿明",
  "松本潤",
  "櫻井翔",
  "赤西仁",
  "星野源",
  "ムロツヨシ",
  "神木隆之介",
  "千葉雄大",
  "大泉洋",
  "香川照之",
  "中井貴一",
  "堤真一",
  "濱田岳",
  "池松壮亮",
  "大野智",
  "藤ヶ谷太輔",
  "増田貴久",
  "中島健人",
  "道枝駿佑",
  "目黒蓮",
  "ラウール",
  "永瀬廉",
  "大西流星",
  "平野紫耀",
  "町田啓太",
  "鹿賀丈史",
  "佐藤浩市",
  "役所広司",
  "妻夫木聡",
  "オダギリジョー",
  "浅野忠信",
  "加瀬亮",
  "森田剛",
  "松山ケンイチ",
  "山田裕貴",
  "杉野遥亮",
  "鈴木伸之",
  "間宮祥太朗",
  "白濱亜嵐",
  "片寄涼太",
];

const IMAGE_PATHS = {
  "BOSS THE MC": "/images/boss_the_mc_69aab9e8.webp",
  "Hitomi": "/images/hitomi_6f38ac9f.webp",
  "JP": "/images/jp_1920a565.webp",
  "JULIA": "/images/julia_dcfafd1e.webp",
  "MALIA.": "/images/malia_a5223763.webp",
  "MEGUMI": "/images/megumi_14481fc7.webp",
  "RaMu": "/images/ramu_a2dfbcf1.webp",
  "SALU": "/images/salu_d9a79df2.webp",
  "SHIHO": "/images/shiho_a1fbfb6f.webp",
  "Shen(Def Tech)": "/images/shen_def_tech_77af5e2f.webp",
  "Zeebra": "/images/zeebra_db95427d.webp",
  "missha": "/images/missha_28756abc.webp",
  "あいだあい": "/images/jp_e38182e38184_49a10c40.webp",
  "あのん": "/images/jp_e38182e381ae_e5a6b409.webp",
  "あべみかこ": "/images/jp_e38182e381b9_332d02a1.webp",
  "あやみ旬果": "/images/jp_e38182e38284_1b7a871e.webp",
  "おしの沙羅": "/images/jp_e3818ae38197_132c67f1.webp",
  "おのののか": "/images/jp_e3818ae381ae_50fc7d23.webp",
  "かでなれおん": "/images/jp_e3818be381a7_fcc0e4d3.webp",
  "さわち店長": "/images/jp_e38195e3828f_1bb36095.webp",
  "しほの涼": "/images/jp_e38197e381bb_03d5b5b0.webp",
  "たしろさやか": "/images/jp_e3819fe38197_a5b01fe9.webp",
  "ちとせよしの": "/images/jp_e381a1e381a8_55c8aa51.webp",
  "ななせ結衣": "/images/jp_e381aae381aa_5370a385.webp",
  "ほしのあき": "/images/jp_e381bbe38197_f298f5ac.webp",
  "ましろ碧乃": "/images/jp_e381bee38197_0ed605f2.webp",
  "まなせゆうな": "/images/jp_e381bee381aa_8c5ad9ed.webp",
  "みひろ": "/images/jp_e381bfe381b2_c8b4c93a.webp",
  "わちみなみ": "/images/jp_e3828fe381a1_91263773.webp",
  "クリスチャン・ベール": "/images/jp_e382afe383aa_943d3d25.webp",
  "ケビン・コスナー": "/images/jp_e382b1e38393_006d8276.webp",
  "ケリー": "/images/jp_e382b1e383aa_1218fbde.webp",
  "ジェシー(SixTONES)": "/images/sixtones_b3310cf5.webp",
  "セイン・カミュ": "/images/jp_e382bbe382a4_cf45129c.webp",
  "タイガー・ウッズ": "/images/jp_e382bfe382a4_5ed6c9b8.webp",
  "ダレノガレ明美": "/images/jp_e38380e383ac_b44f2260.webp",
  "ドクター・ドレー": "/images/jp_e38389e382af_2753edf3.webp",
  "ニック・カーター": "/images/jp_e3838be38383_7059e98b.webp",
  "ハリー杉山": "/images/jp_e3838fe383aa_ce597b12.webp",
  "パトリック・ハーラン/パックン": "/images/jp_e38391e38388_3b745e89.webp",
  "ブラッドリー・クーパー": "/images/jp_e38396e383a9_6f0a86e0.webp",
  "ホラン千秋": "/images/jp_e3839be383a9_3a8053c9.webp",
  "ポール・スタンレー(キッス)": "/images/jp_e3839de383bc_063a4c49.webp",
  "マギー": "/images/jp_e3839ee382ae_26b278b1.webp",
  "マリウス葉(元 Sexy Zone)": "/images/sexy_zone_ce3b8d5e.webp",
  "マリリン・マンソン": "/images/jp_e3839ee383aa_b51a7df5.webp",
  "ユージ": "/images/jp_e383a6e383bc_b40aea26.webp",
  "レイザーラモンHG": "/images/hg_50912a72.webp",
  "七海": "/images/jp_e4b883e6b5b7_1f1886e6.webp",
  "七海ティナ": "/images/jp_e4b883e6b5b7_32532018.webp",
  "三上悠亜": "/images/jp_e4b889e4b88a_56ac8723.webp",
  "三島ゆう": "/images/jp_e4b889e5b3b6_518dde86.webp",
  "三橋くん": "/images/jp_e4b889e6a98b_8348d5ad.webp",
  "三田悠貴": "/images/jp_e4b889e794b0_6dd5cfb8.webp",
  "三葉ゆあ": "/images/jp_e4b889e89189_a7b3eb2f.webp",
  "上原亜衣": "/images/jp_e4b88ae58e9f_20f5de62.webp",
  "上原理生": "/images/jp_e4b88ae58e9f_a354991d.webp",
  "上杉智世": "/images/jp_e4b88ae69d89_321e7e2e.webp",
  "上杉柊平": "/images/jp_e4b88ae69d89_cd091724.webp",
  "下村明香": "/images/jp_e4b88be69d91_376a4ad7.webp",
  "中原未來": "/images/jp_e4b8ade58e9f_5fa1a26f.webp",
  "中島愛里": "/images/jp_e4b8ade5b3b6_ee13fefe.webp",
  "中川大輔": "/images/jp_e4b8ade5b79d_b8b5ad02.webp",
  "中川知香": "/images/jp_e4b8ade5b79d_23c294cf.webp",
  "中村優": "/images/jp_e4b8ade69d91_bc95f5b4.webp",
  "中村明花": "/images/jp_e4b8ade69d91_0616b591.webp",
  "中村航輔": "/images/jp_e4b8ade69d91_1c545508.webp",
  "中村葵": "/images/jp_e4b8ade69d91_91136dfb.webp",
  "中沢元紀": "/images/jp_e4b8ade6b2a2_526384d3.webp",
  "中畑清": "/images/jp_e4b8ade79591_07d07b46.webp",
  "中野由貴": "/images/jp_e4b8ade9878e_bf944db9.webp",
  "乙葉": "/images/jp_e4b999e89189_9d476806.webp",
  "五城せのん": "/images/jp_e4ba94e59f8e_45992b04.webp",
  "井上うらら": "/images/jp_e4ba95e4b88a_51f3a164.webp",
  "井上和香": "/images/jp_e4ba95e4b88a_24a60c95.webp",
  "井上晴菜": "/images/jp_e4ba95e4b88a_15803144.webp",
  "井上茉倫": "/images/jp_e4ba95e4b88a_9bd93b69.webp",
  "井浦新": "/images/jp_e4ba95e6b5a6_7f91791a.webp",
  "仁藤みさき": "/images/jp_e4bb81e897a4_4ed4ca03.webp",
  "今井雅之": "/images/jp_e4bb8ae4ba95_b8acb782.webp",
  "今野杏南": "/images/jp_e4bb8ae9878e_8be4b5fd.webp",
  "仲原ちえ": "/images/jp_e4bbb2e58e9f_14456c77.webp",
  "仲村トオル": "/images/jp_e4bbb2e69d91_90b7d912.webp",
  "伊東ちなみ": "/images/jp_e4bc8ae69db1_162b9a48.webp",
  "伊織もえ": "/images/jp_e4bc8ae7b994_93844235.webp",
  "伊藤しほ乃": "/images/jp_e4bc8ae897a4_4d4ac165.webp",
  "伊藤英明": "/images/jp_e4bc8ae897a4_56a678ec.webp",
  "似鳥沙也加": "/images/jp_e4bcbce9b3a5_e6b8e413.webp",
  "佐々木希": "/images/jp_e4bd90e38085_8cedb319.webp",
  "佐々木麻衣": "/images/jp_e4bd90e38085_9b882314.webp",
  "佐倉絆": "/images/jp_e4bd90e58089_62ac4817.webp",
  "佐藤さくら": "/images/jp_e4bd90e897a4_ff73f24e.webp",
  "佐藤寛子": "/images/jp_e4bd90e897a4_f02d9b39.webp",
  "佐藤栞里": "/images/jp_e4bd90e897a4_3b2f972c.webp",
  "佐藤江梨子": "/images/jp_e4bd90e897a4_c6b9411f.webp",
  "佐藤美希": "/images/jp_e4bd90e897a4_5ca29906.webp",
  "佐藤聖羅": "/images/jp_e4bd90e897a4_7ff85ace.webp",
  "佐野なぎさ": "/images/jp_e4bd90e9878e_e160ad94.webp",
  "佐野マリア": "/images/jp_e4bd90e9878e_19bf0618.webp",
  "保坂えり": "/images/jp_e4bf9de59d82_7e5c6469.webp",
  "保﨑麗": "/images/jp_e4bf9defa891_87615ed9.webp",
  "倉田夏希": "/images/jp_e58089e794b0_95fbd8d0.webp",
  "優木まおみ": "/images/jp_e584aae69ca8_c4595208.webp",
  "優香": "/images/jp_e584aae9a699_809adf98.webp",
  "入山法子": "/images/jp_e585a5e5b1b1_f0b3f4d9.webp",
  "入江甚儀": "/images/jp_e585a5e6b19f_7267c555.webp",
  "兵頭功海": "/images/jp_e585b5e9a0ad_5e133a36.webp",
  "内田瑞穂": "/images/jp_e58685e794b0_c766faeb.webp",
  "冨永愛": "/images/jp_e586a8e6b0b8_cd155a63.webp",
  "冴木柚葉": "/images/jp_e586b4e69ca8_a9118f9a.webp",
  "凰かなめ": "/images/jp_e587b0e3818b_f89251c6.webp",
  "出口亜梨沙": "/images/jp_e587bae58fa3_a133c9ae.webp",
  "初川みなみ": "/images/jp_e5889de5b79d_15b1eee1.webp",
  "初美沙希": "/images/jp_e5889de7be8e_279b2078.webp",
  "副島美咲": "/images/jp_e589afe5b3b6_10da8874.webp",
  "加藤紗里": "/images/jp_e58aa0e897a4_15d0119d.webp",
  "勝矢": "/images/jp_e58b9de79fa2_43e10f52.webp",
  "北向珠夕": "/images/jp_e58c97e59091_3d487ff1.webp",
  "北条麻妃": "/images/jp_e58c97e69da1_3fb04a66.webp",
  "十枝梨菜": "/images/jp_e58d81e69e9d_19219f02.webp",
  "南みゆか": "/images/jp_e58d97e381bf_b9f273bc.webp",
  "南ゆうき": "/images/jp_e58d97e38286_34c44ac1.webp",
  "南圭介": "/images/jp_e58d97e59cad_45706cc7.webp",
  "原つむぎ": "/images/jp_e58e9fe381a4_7d0bb2a2.webp",
  "原口あきまさ": "/images/jp_e58e9fe58fa3_f3b9a0c0.webp",
  "原愛実": "/images/jp_e58e9fe6849b_4642565f.webp",
  "原紀舟": "/images/jp_e58e9fe7b480_4fb9d0b7.webp",
  "古屋呂敏": "/images/jp_e58fa4e5b18b_1928b4e7.webp",
  "古川優奈": "/images/jp_e58fa4e5b79d_4c80083a.webp",
  "古川真奈美": "/images/jp_e58fa4e5b79d_8ee94373.webp",
  "合田雅吏": "/images/jp_e59088e794b0_6eb679f1.webp",
  "吉川綾乃": "/images/jp_e59089e5b79d_9bee9c82.webp",
  "吉沢明歩": "/images/jp_e59089e6b2a2_c5e3b276.webp",
  "吉澤玲菜": "/images/jp_e59089e6bea4_b283891a.webp",
  "吉田早希": "/images/jp_e59089e794b0_d1d91ff9.webp",
  "吹石一恵": "/images/jp_e590b9e79fb3_fe27e8c8.webp",
  "喜多愛": "/images/jp_e5969ce5a49a_95e73477.webp",
  "園田みおん": "/images/jp_e59c92e794b0_ab2d9d9c.webp",
  "團遥香": "/images/jp_e59c98e981a5_75d0a076.webp",
  "土肥洋一": "/images/jp_e59c9fe882a5_d812301f.webp",
  "坂口健太郎": "/images/jp_e59d82e58fa3_020f5168.webp",
  "坂地久美": "/images/jp_e59d82e59cb0_01a63d57.webp",
  "坂東彌十郎": "/images/jp_e59d82e69db1_3736dd1e.webp",
  "堀まゆみ": "/images/jp_e5a080e381be_7dca06cc.webp",
  "堀みなみ": "/images/jp_e5a080e381bf_6176d884.webp",
  "堀江りほ": "/images/jp_e5a080e6b19f_5987be41.webp",
  "堂林翔太": "/images/jp_e5a082e69e97_f80ebcda.webp",
  "塩地美澄": "/images/jp_e5a1a9e59cb0_9cf6a787.webp",
  "塩見きら": "/images/jp_e5a1a9e8a68b_f869800d.webp",
  "夏佳しお": "/images/jp_e5a48fe4bdb3_eeac0844.webp",
  "夏来唯": "/images/jp_e5a48fe69da5_2d1aafe4.webp",
  "多田あさみ": "/images/jp_e5a49ae794b0_ec0ee23a.webp",
  "夢見るぅ": "/images/jp_e5a4a2e8a68b_ab91a5f2.webp",
  "大場ゆい": "/images/jp_e5a4a7e5a0b4_1a8bdaef.webp",
  "大嶋みく": "/images/jp_e5a4a7e5b68b_4c05e913.webp",
  "大川藍": "/images/jp_e5a4a7e5b79d_3ffa81e7.webp",
  "大條美唯": "/images/jp_e5a4a7e6a29d_8d0bf867.webp",
  "大槻りこ": "/images/jp_e5a4a7e6a7bb_7c71a3d7.webp",
  "大澤玲美": "/images/jp_e5a4a7e6bea4_c22b7718.webp",
  "大矢真夕": "/images/jp_e5a4a7e79fa2_1906122d.webp",
  "大石絵理": "/images/jp_e5a4a7e79fb3_af956950.webp",
  "大空愛": "/images/jp_e5a4a7e7a9ba_1c38e762.webp",
  "大迫勇也": "/images/jp_e5a4a7e8bfab_8ae74cab.webp",
  "天使もえ": "/images/jp_e5a4a9e4bdbf_54888198.webp",
  "天海つばさ": "/images/jp_e5a4a9e6b5b7_494827f4.webp",
  "天羽希純": "/images/jp_e5a4a9e7bebd_68e67970.webp",
  "天羽結愛": "/images/jp_e5a4a9e7bebd_5977448d.webp",
  "天野ちよ": "/images/jp_e5a4a9e9878e_1d358383.webp",
  "天野麻菜": "/images/jp_e5a4a9e9878e_957af00d.webp",
  "太田和さくら": "/images/jp_e5a4aae794b0_036eb36d.webp",
  "太田莉菜": "/images/jp_e5a4aae794b0_6596b1f1.webp",
  "奈月セナ": "/images/jp_e5a588e69c88_5151f217.webp",
  "奥田咲": "/images/jp_e5a5a5e794b0_6d838e60.webp",
  "如月はるな": "/images/jp_e5a682e69c88_f29ad977.webp",
  "妃乃ひかり": "/images/jp_e5a683e4b983_0394f347.webp",
  "宇佐木にの": "/images/jp_e5ae87e4bd90_da84cbae.webp",
  "安久澤ユノ": "/images/jp_e5ae89e4b985_99cec25d.webp",
  "安位薫": "/images/jp_e5ae89e4bd8d_f7c2e645.webp",
  "安座間美優": "/images/jp_e5ae89e5baa7_ad3cbef6.webp",
  "安枝瞳": "/images/jp_e5ae89e69e9d_331c57da.webp",
  "安齋らら": "/images/jp_e5ae89e9bd8b_7a615502.webp",
  "宝来みゆき": "/images/jp_e5ae9de69da5_7e5e5525.webp",
  "宮地真緒": "/images/jp_e5aeaee59cb0_3d005315.webp",
  "宮尾俊太郎": "/images/jp_e5aeaee5b0be_29a0ec0e.webp",
  "宮川みやび": "/images/jp_e5aeaee5b79d_85a62a53.webp",
  "宮永薫": "/images/jp_e5aeaee6b0b8_be7e0d31.webp",
  "宮沢氷魚": "/images/jp_e5aeaee6b2a2_5b2efdb2.webp",
  "宮瀬なこ": "/images/jp_e5aeaee780ac_9dfe561f.webp",
  "寺田御子": "/images/jp_e5afbae794b0_f73f9bc6.webp",
  "小倉あずさ": "/images/jp_e5b08fe58089_b0a4ccba.webp",
  "小倉ゆうか": "/images/jp_e5b08fe58089_7cbe016d.webp",
  "小向美奈子": "/images/jp_e5b08fe59091_bc1af46c.webp",
  "小島みゆ": "/images/jp_e5b08fe5b3b6_4e83f94c.webp",
  "小島瑠璃子": "/images/jp_e5b08fe5b3b6_01db3ed0.webp",
  "小日向ななせ": "/images/jp_e5b08fe697a5_43df30ee.webp",
  "小日向ゆか": "/images/jp_e5b08fe697a5_a039249f.webp",
  "小日向ゆり": "/images/jp_e5b08fe697a5_cc0fc3ca.webp",
  "小早川怜子": "/images/jp_e5b08fe697a9_70512316.webp",
  "小林マイカ": "/images/jp_e5b08fe69e97_33db102a.webp",
  "小林ユリ": "/images/jp_e5b08fe69e97_7b160370.webp",
  "小林宏之": "/images/jp_e5b08fe69e97_8a98758c.webp",
  "小林恵美": "/images/jp_e5b08fe69e97_56f4a5df.webp",
  "小柳歩": "/images/jp_e5b08fe69fb3_f1170150.webp",
  "小栗旬": "/images/jp_e5b08fe6a097_ef033428.webp",
  "小森ゆきの": "/images/jp_e5b08fe6a3ae_1f747fda.webp",
  "小泉深雪": "/images/jp_e5b08fe6b389_aa01f885.webp",
  "小泉麻耶": "/images/jp_e5b08fe6b389_41c6138c.webp",
  "小瀬田麻由": "/images/jp_e5b08fe780ac_c2b6e08b.webp",
  "小熊絵理": "/images/jp_e5b08fe7868a_f83d0623.webp",
  "小阪由佳": "/images/jp_e5b08fe998aa_7ae23ef7.webp",
  "尾崎礼香": "/images/jp_e5b0bee5b48e_642db32c.webp",
  "山下真司": "/images/jp_e5b1b1e4b88b_3c1ae3ce.webp",
  "山中知恵": "/images/jp_e5b1b1e4b8ad_8300067f.webp",
  "山之内すず": "/images/jp_e5b1b1e4b98b_a5936d33.webp",
  "山咲まりな": "/images/jp_e5b1b1e592b2_73d2e85b.webp",
  "山川紗弥": "/images/jp_e5b1b1e5b79d_58ce01b1.webp",
  "山田かな": "/images/jp_e5b1b1e794b0_04b2e36c.webp",
  "山﨑賢人": "/images/jp_e5b1b1efa891_051c3340.webp",
  "岡本杷奈": "/images/jp_e5b2a1e69cac_73b7b5de.webp",
  "岡田紗佳": "/images/jp_e5b2a1e794b0_c31647b3.webp",
  "岩上愛美": "/images/jp_e5b2a9e4b88a_900f16da.webp",
  "岩﨑名美": "/images/jp_e5b2a9efa891_85dfde1d.webp",
  "岬ななみ": "/images/jp_e5b2ace381aa_f6124f32.webp",
  "川上さり": "/images/jp_e5b79de4b88a_1108455f.webp",
  "川岡大次郎": "/images/jp_e5b79de5b2a1_5fdd55ee.webp",
  "川島永嗣": "/images/jp_e5b79de5b3b6_dfda1299.webp",
  "川村那月": "/images/jp_e5b79de69d91_8c676d07.webp",
  "川瀬もえ": "/images/jp_e5b79de780ac_20ae3b8e.webp",
  "工藤まなみ": "/images/jp_e5b7a5e897a4_d64f9dad.webp",
  "巻誠一郎": "/images/jp_e5b7bbe8aaa0_0f1d6a74.webp",
  "市川まさみ": "/images/jp_e5b882e5b79d_7a9f249d.webp",
  "市川みき": "/images/jp_e5b882e5b79d_2419f00b.webp",
  "市川知宏": "/images/jp_e5b882e5b79d_e84013c1.webp",
  "希崎ジェシカ": "/images/jp_e5b88ce5b48e_167d114d.webp",
  "幣原あやの": "/images/jp_e5b9a3e58e9f_62977c4f.webp",
  "平井堅": "/images/jp_e5b9b3e4ba95_310dd9e1.webp",
  "平塚千瑛": "/images/jp_e5b9b3e5a19a_49e60acf.webp",
  "平山祐介": "/images/jp_e5b9b3e5b1b1_c0aa918b.webp",
  "平岳大": "/images/jp_e5b9b3e5b2b3_5c390b6d.webp",
  "平田梨奈": "/images/jp_e5b9b3e794b0_86fdb676.webp",
  "平田裕香": "/images/jp_e5b9b3e794b0_a12fc956.webp",
  "広瀬晏夕": "/images/jp_e5ba83e780ac_d7d8501f.webp",
  "後藤真桜": "/images/jp_e5be8ce897a4_a441ef05.webp",
  "徳江かな": "/images/jp_e5beb3e6b19f_23640a0b.webp",
  "志崎ひなた": "/images/jp_e5bf97e5b48e_3c66b60c.webp",
  "愛川ゆず季": "/images/jp_e6849be5b79d_3e2dd344.webp",
  "成海うるみ": "/images/jp_e68890e6b5b7_2799a851.webp",
  "成海舞": "/images/jp_e68890e6b5b7_4a59453c.webp",
  "戸塚こはる": "/images/jp_e688b8e5a19a_4e3346e1.webp",
  "戸田れい": "/images/jp_e688b8e794b0_9e79f336.webp",
  "戸田恵梨香": "/images/jp_e688b8e794b0_ef825ecd.webp",
  "斎藤工": "/images/jp_e6968ee897a4_c1d6317a.webp",
  "斎藤恭代": "/images/jp_e6968ee897a4_1079f216.webp",
  "新井萌花": "/images/jp_e696b0e4ba95_0079f733.webp",
  "新井遥": "/images/jp_e696b0e4ba95_ac83fdf7.webp",
  "新海まき": "/images/jp_e696b0e6b5b7_d5ce0a45.webp",
  "新田ゆう": "/images/jp_e696b0e794b0_21981381.webp",
  "新田妃奈": "/images/jp_e696b0e794b0_918a42e6.webp",
  "新谷姫加": "/images/jp_e696b0e8b0b7_7a681916.webp",
  "日向亘": "/images/jp_e697a5e59091_3378ef32.webp",
  "日向泉": "/images/jp_e697a5e59091_719161d8.webp",
  "日向葵衣": "/images/jp_e697a5e59091_bcbf282a.webp",
  "早瀬あや": "/images/jp_e697a9e780ac_acfb80d8.webp",
  "明日花キララ": "/images/jp_e6988ee697a5_b76c38c0.webp",
  "星名美津紀": "/images/jp_e6989fe5908d_80260034.webp",
  "星美りか": "/images/jp_e6989fe7be8e_c479be1c.webp",
  "星那美月": "/images/jp_e6989fe982a3_1c892efc.webp",
  "星野琴": "/images/jp_e6989fe9878e_1d831a17.webp",
  "春名美波": "/images/jp_e698a5e5908d_d7f4ffbb.webp",
  "春菜はな": "/images/jp_e698a5e88f9c_639dbb03.webp",
  "春輝": "/images/jp_e698a5e8bc9d_13946a89.webp",
  "春野ゆこ": "/images/jp_e698a5e9878e_bca7fe55.webp",
  "月城まゆ": "/images/jp_e69c88e59f8e_54ef77e3.webp",
  "月花めもり": "/images/jp_e69c88e88ab1_8b10a99d.webp",
  "月野りさ": "/images/jp_e69c88e9878e_52a146e7.webp",
  "有村千佳": "/images/jp_e69c89e69d91_ee21aa0b.webp",
  "有馬あかり": "/images/jp_e69c89e9a6ac_29abff65.webp",
  "朝倉ことみ": "/images/jp_e69c9de58089_9af0e707.webp",
  "朝日ななみ": "/images/jp_e69c9de697a5_c61b2c57.webp",
  "朝比奈彩": "/images/jp_e69c9de6af94_bd8c814b.webp",
  "朝田ひまり": "/images/jp_e69c9de794b0_2ccf01bc.webp",
  "木下優樹菜": "/images/jp_e69ca8e4b88b_cdee704b.webp",
  "木下愛純": "/images/jp_e69ca8e4b88b_816ec64f.webp",
  "木下隆行(TKO)": "/images/tko_efd8d03a.webp",
  "木口亜矢": "/images/jp_e69ca8e58fa3_746cb476.webp",
  "木村あやね": "/images/jp_e69ca8e69d91_24f4e901.webp",
  "杉原杏璃": "/images/jp_e69d89e58e9f_e4525766.webp",
  "杉本愛莉鈴": "/images/jp_e69d89e69cac_3701031c.webp",
  "杉本有美": "/images/jp_e69d89e69cac_509e7355.webp",
  "杉野遥亮": "/images/jp_e69d89e9878e_dfd6bc63.webp",
  "杏さゆり": "/images/jp_e69d8fe38195_18d858f8.webp",
  "村上弘明": "/images/jp_e69d91e4b88a_0d4cf6c5.webp",
  "村島未悠": "/images/jp_e69d91e5b3b6_700f7b6f.webp",
  "来生かほ": "/images/jp_e69da5e7949f_fedab7c7.webp",
  "東口順昭": "/images/jp_e69db1e58fa3_ddc24636.webp",
  "東坂みゆ": "/images/jp_e69db1e59d82_42619779.webp",
  "東江ひかり": "/images/jp_e69db1e6b19f_3805b217.webp",
  "東雲うみ": "/images/jp_e69db1e99bb2_6bcea923.webp",
  "松中信彦": "/images/jp_e69dbee4b8ad_3bb07ac5.webp",
  "松井沙也香": "/images/jp_e69dbee4ba95_a31605ba.webp",
  "松坂大輔": "/images/jp_e69dbee59d82_7df31af1.webp",
  "松坂桃李": "/images/jp_e69dbee59d82_7a224ee2.webp",
  "松岡ちな": "/images/jp_e69dbee5b2a1_dc1c4087.webp",
  "松岡里英": "/images/jp_e69dbee5b2a1_498f67b2.webp",
  "松嶋えいみ": "/images/jp_e69dbee5b68b_0c94377c.webp",
  "松本さゆき": "/images/jp_e69dbee69cac_9c9f8d00.webp",
  "松本菜奈実": "/images/jp_e69dbee69cac_85481a6b.webp",
  "松田直樹": "/images/jp_e69dbee794b0_740b2220.webp",
  "松田龍平": "/images/jp_e69dbee794b0_13a5432f.webp",
  "松角洋平": "/images/jp_e69dbee8a792_02197026.webp",
  "松金ようこ": "/images/jp_e69dbee98791_76a1507d.webp",
  "板野優花": "/images/jp_e69dbfe9878e_78842719.webp",
  "林ゆめ": "/images/jp_e69e97e38286_33a126e1.webp",
  "林美佐": "/images/jp_e69e97e7be8e_3b8313d8.webp",
  "架乃ゆら": "/images/jp_e69eb6e4b983_866f5354.webp",
  "柚木みいな": "/images/jp_e69f9ae69ca8_76816728.webp",
  "柳いろは": "/images/jp_e69fb3e38184_1b99ee71.webp",
  "柳ゆり菜": "/images/jp_e69fb3e38286_29345894.webp",
  "柳俊太郎": "/images/jp_e69fb3e4bf8a_e29f0c5b.webp",
  "桂木澪": "/images/jp_e6a182e69ca8_949bb8ee.webp",
  "桐村萌絵": "/images/jp_e6a190e69d91_9ef3ddaa.webp",
  "桜あんり": "/images/jp_e6a19ce38182_93b74936.webp",
  "桜ここみ": "/images/jp_e6a19ce38193_9f02b767.webp",
  "桜井うい": "/images/jp_e6a19ce4ba95_d31e4c52.webp",
  "桜井彩": "/images/jp_e6a19ce4ba95_6b33340e.webp",
  "桜井花奈": "/images/jp_e6a19ce4ba95_8d879e3f.webp",
  "桜空もも": "/images/jp_e6a19ce7a9ba_cb7365e7.webp",
  "森のんの": "/images/jp_e6a3aee381ae_6310f023.webp",
  "森下悠里": "/images/jp_e6a3aee4b88b_d4b11867.webp",
  "森崎友紀": "/images/jp_e6a3aee5b48e_6a3c3e90.webp",
  "森未蘭": "/images/jp_e6a3aee69caa_e3c9618a.webp",
  "森本稀哲": "/images/jp_e6a3aee69cac_d647a94f.webp",
  "森重真人": "/images/jp_e6a3aee9878d_d3182f5d.webp",
  "植原ゆきな": "/images/jp_e6a48de58e9f_f6ffc04b.webp",
  "椎名あき": "/images/jp_e6a48ee5908d_caefefef.webp",
  "椿原愛": "/images/jp_e6a4bfe58e9f_87d20552.webp",
  "榎木孝明": "/images/jp_e6a68ee69ca8_34f53d77.webp",
  "樫本琳花": "/images/jp_e6a8abe69cac_26b455b7.webp",
  "樹智子": "/images/jp_e6a8b9e699ba_813ef21f.webp",
  "橋本さとし": "/images/jp_e6a98be69cac_4e115c5a.webp",
  "橋本マナミ": "/images/jp_e6a98be69cac_1c9e5f7f.webp",
  "橋本梨菜": "/images/jp_e6a98be69cac_9dbc9d9a.webp",
  "橋本萌花": "/images/jp_e6a98be69cac_ab801289.webp",
  "橘さり": "/images/jp_e6a998e38195_9a4172db.webp",
  "橘まりや": "/images/jp_e6a998e381be_16412878.webp",
  "橘和奈": "/images/jp_e6a998e5928c_c546ac6c.webp",
  "橘美羽": "/images/jp_e6a998e7be8e_04077672.webp",
  "橘舞": "/images/jp_e6a998e8889e_86deaa6f.webp",
  "武蔵": "/images/jp_e6ada6e894b5_415aeeb0.webp",
  "殿倉恵未": "/images/jp_e6aebfe58089_955b4797.webp",
  "比留川マイ": "/images/jp_e6af94e79599_2a06d895.webp",
  "水卜さくら": "/images/jp_e6b0b4e58d9c_874d8f1d.webp",
  "水咲優美": "/images/jp_e6b0b4e592b2_6b01112d.webp",
  "水城奈緒": "/images/jp_e6b0b4e59f8e_85b1357a.webp",
  "水月桃子": "/images/jp_e6b0b4e69c88_7234d41d.webp",
  "水沢のの": "/images/jp_e6b0b4e6b2a2_efb0081f.webp",
  "水沢エレナ": "/images/jp_e6b0b4e6b2a2_852eb3f1.webp",
  "水沢林太郎": "/images/jp_e6b0b4e6b2a2_b9444825.webp",
  "水谷さくら": "/images/jp_e6b0b4e8b0b7_033225b4.webp",
  "水谷ケイ": "/images/jp_e6b0b4e8b0b7_b97c5d78.webp",
  "水谷彩咲": "/images/jp_e6b0b4e8b0b7_1e6e261f.webp",
  "水野朝陽": "/images/jp_e6b0b4e9878e_8a9b305c.webp",
  "永井すみれ": "/images/jp_e6b0b8e4ba95_50ed00f9.webp",
  "永富仁菜": "/images/jp_e6b0b8e5af8c_2bc38510.webp",
  "永岡真実": "/images/jp_e6b0b8e5b2a1_060beee5.webp",
  "永瀬ひな": "/images/jp_e6b0b8e780ac_7ff378a2.webp",
  "永瀬永茉": "/images/jp_e6b0b8e780ac_c402ca80.webp",
  "江口洋介": "/images/jp_e6b19fe58fa3_b5526cf8.webp",
  "江藤菜摘": "/images/jp_e6b19fe897a4_a5b29f5a.webp",
  "池田ゆり": "/images/jp_e6b1a0e794b0_e80ae42a.webp",
  "池田夏希": "/images/jp_e6b1a0e794b0_06be736e.webp",
  "池田愛恵里": "/images/jp_e6b1a0e794b0_4e8e5692.webp",
  "沢村一樹": "/images/jp_e6b2a2e69d91_e89c36d3.webp",
  "河内裕里": "/images/jp_e6b2b3e58685_4edf3930.webp",
  "河合あすな": "/images/jp_e6b2b3e59088_32a826ac.webp",
  "波多野結衣": "/images/jp_e6b3a2e5a49a_fd7fdff2.webp",
  "浅川まりな": "/images/jp_e6b585e5b79d_f65e4edb.webp",
  "浦西ひかる": "/images/jp_e6b5a6e8a5bf_9f7ca98a.webp",
  "涼本めぐみ": "/images/jp_e6b6bce69cac_57b6b1a3.webp",
  "涼森れむ": "/images/jp_e6b6bce6a3ae_dbdf4b00.webp",
  "深井彩夏": "/images/jp_e6b7b1e4ba95_98859b37.webp",
  "深海理絵": "/images/jp_e6b7b1e6b5b7_6e4cd295.webp",
  "深田ナナ": "/images/jp_e6b7b1e794b0_232e880a.webp",
  "深田恭子": "/images/jp_e6b7b1e794b0_7ab5bdfb.webp",
  "清原翔": "/images/jp_e6b885e58e9f_7d5c5bde.webp",
  "清水あいり": "/images/jp_e6b885e6b0b4_bf03f9a7.webp",
  "清水みさと": "/images/jp_e6b885e6b0b4_96bcd6ff.webp",
  "清水舞美": "/images/jp_e6b885e6b0b4_2db714fe.webp",
  "清瀬汐希": "/images/jp_e6b885e780ac_ab69426e.webp",
  "渡辺哲": "/images/jp_e6b8a1e8beba_0e072524.webp",
  "渡辺謙": "/images/jp_e6b8a1e8beba_cf178135.webp",
  "湊莉久": "/images/jp_e6b98ae88e89_ac720b95.webp",
  "滝沢沙織": "/images/jp_e6bb9de6b2a2_cd1f5aca.webp",
  "潮崎まりん": "/images/jp_e6bdaee5b48e_76650e9b.webp",
  "澁谷果歩": "/images/jp_e6be81e8b0b7_11adc6a2.webp",
  "澤村拓一": "/images/jp_e6bea4e69d91_9108724a.webp",
  "濱尾ノリタカ": "/images/jp_e6bfb1e5b0be_54840158.webp",
  "熊江琉衣": "/images/jp_e7868ae6b19f_fb1e7be7.webp",
  "爽香": "/images/jp_e788bde9a699_aa511e67.webp",
  "片山萌美": "/images/jp_e78987e5b1b1_4b55a722.webp",
  "片瀬那奈": "/images/jp_e78987e780ac_0ea6ec98.webp",
  "田中マルクス闘莉王": "/images/jp_e794b0e4b8ad_61223bc5.webp",
  "田中瞳": "/images/jp_e794b0e4b8ad_907b0153.webp",
  "田丸麻紀": "/images/jp_e794b0e4b8b8_c6e7f9eb.webp",
  "町田啓太": "/images/jp_e794bae794b0_3e3584a6.webp",
  "町野修斗": "/images/jp_e794bae9878e_f122ec77.webp",
  "白山瑠衣": "/images/jp_e799bde5b1b1_b806eb8b.webp",
  "白田久子": "/images/jp_e799bde794b0_2a02b8a0.webp",
  "白石みずほ": "/images/jp_e799bde79fb3_0a0d34d3.webp",
  "白石希望": "/images/jp_e799bde79fb3_bb6cc35d.webp",
  "白石茉莉奈": "/images/jp_e799bde79fb3_71bde09e.webp",
  "益坂美亜": "/images/jp_e79b8ae59d82_74741fc6.webp",
  "目黒蓮": "/images/jp_e79baee9bb92_2feb3bc3.webp",
  "相原乃依": "/images/jp_e79bb8e58e9f_9e1dad70.webp",
  "相原美咲": "/images/jp_e79bb8e58e9f_f9c80aa9.webp",
  "相川亮二": "/images/jp_e79bb8e5b79d_2f1e9122.webp",
  "相沢まき": "/images/jp_e79bb8e6b2a2_a363d5ee.webp",
  "相沢菜々子": "/images/jp_e79bb8e6b2a2_6bd3c141.webp",
  "相沢菜月": "/images/jp_e79bb8e6b2a2_e2afa6eb.webp",
  "眞鍋かをり": "/images/jp_e79c9ee98d8b_86e393b2.webp",
  "真島なおみ": "/images/jp_e79c9fe5b3b6_53da2fc7.webp",
  "真木しおり": "/images/jp_e79c9fe69ca8_8d60690a.webp",
  "矢沢めい": "/images/jp_e79fa2e6b2a2_a1976fa1.webp",
  "矢澤サエ": "/images/jp_e79fa2e6bea4_48acfa49.webp",
  "知花くらら": "/images/jp_e79fa5e88ab1_95fe20fe.webp",
  "石井一久": "/images/jp_e79fb3e4ba95_f0bb85ca.webp",
  "石川恋": "/images/jp_e79fb3e5b79d_398c7ddd.webp",
  "石橋てるみ": "/images/jp_e79fb3e6a98b_a8ab37f5.webp",
  "石田ニコル": "/images/jp_e79fb3e794b0_beffcfd5.webp",
  "石田桃香": "/images/jp_e79fb3e794b0_a6a7ddfb.webp",
  "磯山さやか": "/images/jp_e7a3afe5b1b1_c97b84d1.webp",
  "磯貝花音": "/images/jp_e7a3afe8b29d_dd9c1b21.webp",
  "神咲詩織": "/images/jp_e7a59ee592b2_7c4a296b.webp",
  "神谷美伽": "/images/jp_e7a59ee8b0b7_63682ab8.webp",
  "福士蒼汰": "/images/jp_e7a68fe5a3ab_43bf5c85.webp",
  "福山雅治": "/images/jp_e7a68fe5b1b1_9cc0b024.webp",
  "福留孝介": "/images/jp_e7a68fe79599_6c447127.webp",
  "秋山祥子": "/images/jp_e7a78be5b1b1_8f129980.webp",
  "秦佐和子": "/images/jp_e7a7a6e4bd90_41db9483.webp",
  "秦綾": "/images/jp_e7a7a6e7b6be_f38ac1db.webp",
  "稲森美優": "/images/jp_e7a8b2e6a3ae_47fe6dd3.webp",
  "立花はるみ": "/images/jp_e7ab8be88ab1_f443710a.webp",
  "立花陽香": "/images/jp_e7ab8be88ab1_818b2f4e.webp",
  "竹内涼真": "/images/jp_e7abb9e58685_1547c2a9.webp",
  "竹内花": "/images/jp_e7abb9e58685_904ad110.webp",
  "筒香嘉智": "/images/jp_e7ad92e9a699_e355a994.webp",
  "篠崎愛": "/images/jp_e7afa0e5b48e_a4132cb3.webp",
  "篠田ゆう": "/images/jp_e7afa0e794b0_7592766d.webp",
  "篠田麻里子": "/images/jp_e7afa0e794b0_ac67e6e5.webp",
  "篠見星奈": "/images/jp_e7afa0e8a68b_744e0eac.webp",
  "簡秀吉": "/images/jp_e7b0a1e7a780_5ae0f655.webp",
  "紗倉まな": "/images/jp_e7b497e58089_c6f16d11.webp",
  "絃花みき": "/images/jp_e7b583e88ab1_1bae5ab3.webp",
  "綾野剛": "/images/jp_e7b6bee9878e_4778cd2c.webp",
  "緑川静香": "/images/jp_e7b791e5b79d_fe2f14ff.webp",
  "緒方咲": "/images/jp_e7b792e696b9_91b5596b.webp",
  "織莉叶": "/images/jp_e7b994e88e89_9b2cecc8.webp",
  "美月ちか": "/images/jp_e7be8ee69c88_f526e961.webp",
  "美波那緒": "/images/jp_e7be8ee6b3a2_cffeda55.webp",
  "美竹すず": "/images/jp_e7be8ee7abb9_22b54dfb.webp",
  "美輪咲月": "/images/jp_e7be8ee8bcaa_cb4006a0.webp",
  "羽賀研二": "/images/jp_e7bebde8b380_3873f591.webp",
  "脇田穂乃香": "/images/jp_e88487e794b0_016bab43.webp",
  "舞川あいく": "/images/jp_e8889ee5b79d_f324f96b.webp",
  "花咲来夢": "/images/jp_e88ab1e592b2_ac3e4933.webp",
  "花咲楓香": "/images/jp_e88ab1e592b2_55923c4b.webp",
  "花巻杏奈": "/images/jp_e88ab1e5b7bb_a90fadc8.webp",
  "芹沢潤": "/images/jp_e88ab9e6b2a2_e26923e8.webp",
  "若宮はずき": "/images/jp_e88ba5e5aeae_2fdbd15e.webp",
  "若林豪": "/images/jp_e88ba5e69e97_45b3dd84.webp",
  "若菜奈央": "/images/jp_e88ba5e88f9c_bdf14f5f.webp",
  "茜さや": "/images/jp_e88c9ce38195_29934756.webp",
  "草刈正雄": "/images/jp_e88d89e58888_fedc25dc.webp",
  "草野綾": "/images/jp_e88d89e9878e_0d9b0a55.webp",
  "荒井華奈": "/images/jp_e88d92e4ba95_7d8433db.webp",
  "荒川良々": "/images/jp_e88d92e5b79d_c120b71d.webp",
  "菅本裕子": "/images/jp_e88f85e69cac_d5c376d8.webp",
  "菊地優里": "/images/jp_e88f8ae59cb0_de6db737.webp",
  "菊池亜希子": "/images/jp_e88f8ae6b1a0_63362375.webp",
  "菊池雄星": "/images/jp_e88f8ae6b1a0_494040bd.webp",
  "菜々緒": "/images/jp_e88f9ce38085_ae07a31c.webp",
  "菜月理子": "/images/jp_e88f9ce69c88_3fd80ce0.webp",
  "葉加瀬マイ": "/images/jp_e89189e58aa0_a033105f.webp",
  "葉月ゆめ": "/images/jp_e89189e69c88_7f34e65e.webp",
  "葵つかさ": "/images/jp_e891b5e381a4_75445051.webp",
  "蒼井そら": "/images/jp_e892bce4ba95_6b884e72.webp",
  "蒼山みこと": "/images/jp_e892bce5b1b1_8af2a38b.webp",
  "薄井しお里": "/images/jp_e89684e4ba95_7bbdc74c.webp",
  "藤川らるむ": "/images/jp_e897a4e5b79d_cbdc2702.webp",
  "藤川球児": "/images/jp_e897a4e5b79d_83104b6b.webp",
  "藤木直人": "/images/jp_e897a4e69ca8_f2cc91da.webp",
  "藤本隆宏": "/images/jp_e897a4e69cac_56519d51.webp",
  "藤田あずさ": "/images/jp_e897a4e794b0_55011239.webp",
  "藤田恵名": "/images/jp_e897a4e794b0_25ed3949.webp",
  "藤田芽愛": "/images/jp_e897a4e794b0_235bda98.webp",
  "西原愛夏": "/images/jp_e8a5bfe58e9f_35a7dd73.webp",
  "西岡葉月": "/images/jp_e8a5bfe5b2a1_0d35f6a2.webp",
  "西川周作": "/images/jp_e8a5bfe5b79d_505de15b.webp",
  "西田美歩": "/images/jp_e8a5bfe794b0_1c4e7bc4.webp",
  "西葉瑞希": "/images/jp_e8a5bfe89189_2d643895.webp",
  "西谷麻糸呂": "/images/jp_e8a5bfe8b0b7_4c00d008.webp",
  "西野夢菜": "/images/jp_e8a5bfe9878e_af59632e.webp",
  "谷原章介": "/images/jp_e8b0b7e58e9f_76293d3e.webp",
  "谷口彰悟": "/images/jp_e8b0b7e58fa3_f704cef5.webp",
  "谷村奈南": "/images/jp_e8b0b7e69d91_7e2b5cc1.webp",
  "谷田歩": "/images/jp_e8b0b7e794b0_dde17c7d.webp",
  "谷碧": "/images/jp_e8b0b7e7a2a7_779cdb0a.webp",
  "赤井沙希": "/images/jp_e8b5a4e4ba95_e312dfdb.webp",
  "跡美しゅり": "/images/jp_e8b7a1e7be8e_8ae8ffd4.webp",
  "輪湖チロル": "/images/jp_e8bcaae6b996_09031a88.webp",
  "辻本杏": "/images/jp_e8bebbe69cac_49d11430.webp",
  "近藤みやび": "/images/jp_e8bf91e897a4_dbddbe2b.webp",
  "酒井宏樹": "/images/jp_e98592e4ba95_ceb3b2a2.webp",
  "酒向芳": "/images/jp_e98592e59091_676f93e2.webp",
  "野々のん": "/images/jp_e9878ee38085_79d6e1d4.webp",
  "野々村真": "/images/jp_e9878ee38085_00cc2ac5.webp",
  "野村康太": "/images/jp_e9878ee69d91_41a996e3.webp",
  "金子智美": "/images/jp_e98791e5ad90_8b027b8b.webp",
  "金田彩奈": "/images/jp_e98791e794b0_8f28b2f9.webp",
  "鈴木えみ": "/images/jp_e988b4e69ca8_a97133cb.webp",
  "鈴木ちなみ": "/images/jp_e988b4e69ca8_740d4224.webp",
  "鈴木伸之": "/images/jp_e988b4e69ca8_ff508d9d.webp",
  "鈴木優香": "/images/jp_e988b4e69ca8_125370da.webp",
  "鈴木聖": "/images/jp_e988b4e69ca8_7bdce876.webp",
  "鎌田大地": "/images/jp_e98e8ce794b0_68cfecae.webp",
  "長崎ちほみ": "/images/jp_e995b7e5b48e_8c26cc93.webp",
  "長澤ちはる": "/images/jp_e995b7e6bea4_2c5f34e0.webp",
  "長瀬麻美": "/images/jp_e995b7e780ac_e2b6b699.webp",
  "長谷川忍(シソンヌ)": "/images/jp_e995b7e8b0b7_ac1eefa2.webp",
  "長谷部瞳": "/images/jp_e995b7e8b0b7_fd5e5f72.webp",
  "阿南萌花": "/images/jp_e998bfe58d97_1306f2f2.webp",
  "雛田唯以": "/images/jp_e99b9be794b0_225c9d4c.webp",
  "雪平莉左": "/images/jp_e99baae5b9b3_abdc3311.webp",
  "雷田みゆ": "/images/jp_e99bb7e794b0_55b3ec25.webp",
  "霧島さくら": "/images/jp_e99ca7e5b3b6_4be588a2.webp",
  "青井鈴音": "/images/jp_e99d92e4ba95_4723580a.webp",
  "青宮鑑": "/images/jp_e99d92e5aeae_202f1404.webp",
  "青木佳音": "/images/jp_e99d92e69ca8_c5cbf9ed.webp",
  "青木崇高": "/images/jp_e99d92e69ca8_e7d3c293.webp",
  "青柳翔": "/images/jp_e99d92e69fb3_cf6d9748.webp",
  "須能咲良": "/images/jp_e9a088e883bd_a0486423.webp",
  "風間ゆみ": "/images/jp_e9a2a8e99693_66eb7ee8.webp",
  "飯島直子": "/images/jp_e9a3afe5b3b6_f405a849.webp",
  "高山智恵美": "/images/jp_e9ab98e5b1b1_4b93a821.webp",
  "高崎聖子": "/images/jp_e9ab98e5b48e_c69fe6b0.webp",
  "高嶋香帆": "/images/jp_e9ab98e5b68b_2abea860.webp",
  "高梨瑞樹": "/images/jp_e9ab98e6a2a8_4e5fbf43.webp",
  "高橋しょう子": "/images/jp_e9ab98e6a98b_b1614def.webp",
  "高橋茂雄": "/images/jp_e9ab98e6a98b_94879a7a.webp",
  "高砂ミドリ": "/images/jp_e9ab98e7a082_2ce37094.webp",
  "髙嶋政宏": "/images/jp_e9ab99e5b68b_16b55ecc.webp",
  "髙村梨々花": "/images/jp_e9ab99e69d91_9abe368d.webp",
  "髙橋七瀬": "/images/jp_e9ab99e6a98b_2400674e.webp",
  "鳥海かう": "/images/jp_e9b3a5e6b5b7_b5110d1e.webp",
  "鶴あいか": "/images/jp_e9b6b4e38182_c9e2657b.webp",
  "麻倉ひな子": "/images/jp_e9babbe58089_b85db35a.webp",
  "麻美ゆま": "/images/jp_e9babbe7be8e_012abcc3.webp",
  "黒木麗奈": "/images/jp_e9bb92e69ca8_67432723.webp",
  "黒田博樹": "/images/jp_e9bb92e794b0_2a069314.webp",
};

function decodeHtml(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t\r\f\v]+/g, " ")
    .replace(/\n+/g, "\n")
    .trim();
}

function escapeTsString(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function toAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&size=300&background=random&color=fff&bold=true`;
}

function getImagePath(name) {
  return IMAGE_PATHS[name] ?? toAvatar(name);
}

function preferredSort(preferredNames) {
  const preferredIndexes = new Map(
    preferredNames.map((name, index) => [name, index])
  );

  return (left, right) => {
    const leftPreferred =
      preferredIndexes.get(left.name) ?? Number.MAX_SAFE_INTEGER;
    const rightPreferred =
      preferredIndexes.get(right.name) ?? Number.MAX_SAFE_INTEGER;

    return (
      leftPreferred - rightPreferred ||
      Number(Boolean(IMAGE_PATHS[right.name])) -
        Number(Boolean(IMAGE_PATHS[left.name])) ||
      left.name.localeCompare(right.name, "ja")
    );
  };
}

function cleanMaleName(name) {
  return name
    .replace(/\s+/g, " ")
    .replace(
      /([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}々ー])\s+([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}々ー])/gu,
      "$1$2"
    )
    .replace(/\s+\(/g, "(")
    .replace(/《.*?》/g, "")
    .trim();
}

async function fetchFemaleCupEntries(cup) {
  const response = await fetch(
    `https://idolprof.com/wp-json/wp/v2/yada_wiki?slug=${FEMALE_CUP_PAGE_SLUGS[cup]}`
  );
  const pages = await response.json();
  const page = pages[0];

  if (!page) {
    throw new Error(`Missing cup page: ${cup}`);
  }

  return [...page.content.rendered.matchAll(/<tr>(.*?)<\/tr>/gs)]
    .map((match) => match[1])
    .map((row) =>
      [...row.matchAll(/<td[^>]*>(.*?)<\/td>/gs)].map((cell) =>
        decodeHtml(cell[1])
      )
    )
    .filter((cells) => cells.length === 8)
    .map((cells) => {
      const [name, _age, height, _weight, bust, _waist, _hip, actualCup] = cells;

      return {
        name,
        actualHeight: Number(height),
        bust: Number(bust),
        cup: actualCup,
      };
    })
    .filter(
      (entry) =>
        entry.name &&
        !FEMALE_EXCLUDED_NAMES.has(entry.name) &&
        Number.isFinite(entry.actualHeight) &&
        Number.isFinite(entry.bust) &&
        entry.bust > 0 &&
        /^[A-Z]$/.test(entry.cup)
    );
}

async function fetchMaleEntriesForHeight(height) {
  const response = await fetch(
    `https://shincho-navi.com/wp-json/wp/v2/posts?search=${encodeURIComponent(
      `身長${height}cm`
    )}&per_page=10`
  );
  const posts = await response.json();
  const post = posts.find(
    (entry) => entry.title.rendered === `身長${height}cmの有名人/芸能人まとめ`
  );

  if (!post) {
    return [];
  }

  const maleSectionMatch = post.content.rendered.match(
    /<h3[^>]*>身長.*?男性有名人.*?<\/h3>([\s\S]*?)<h3[^>]*>身長.*?女性有名人/s
  );

  if (!maleSectionMatch) {
    return [];
  }

  return [...maleSectionMatch[1].matchAll(/<tr>(.*?)<\/tr>/gs)]
    .map((match) => match[1])
    .map((row) =>
      [...row.matchAll(/<td[^>]*>(.*?)<\/td>/gs)].map((cell) => cell[1])
    )
    .filter((cells) => cells.length >= 2)
    .map((cells) => {
      const nameCell = cells[0];
      const lines = decodeHtml(nameCell)
        .replace(/\n+/g, "\n")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      return {
        name: cleanMaleName(lines[0] ?? ""),
        actualHeight: height,
      };
    })
    .filter(
      (entry) =>
        entry.name &&
        entry.name !== "名前" &&
        !entry.name.includes("ふりがな")
    );
}

async function buildFemaleProfiles() {
  const buckets = {};

  for (const cup of FEMALE_CUP_ORDER) {
    buckets[cup] = await fetchFemaleCupEntries(cup);
  }

  const sorter = preferredSort(FEMALE_PREFERRED_NAMES);
  const selected = [];
  const seenNames = new Set();

  for (const cup of FEMALE_CUP_ORDER) {
    const bucket = [...buckets[cup]].sort(sorter);

    for (const entry of bucket) {
      if (seenNames.has(entry.name)) {
        continue;
      }

      selected.push({
        name: entry.name,
        image: getImagePath(entry.name),
        actualHeight: entry.actualHeight,
        bust: entry.bust,
        cup: entry.cup,
      });
      seenNames.add(entry.name);
    }
  }

  for (const entry of FEMALE_AV_ADDITIONAL_PROFILES) {
    if (seenNames.has(entry.name)) {
      continue;
    }

    selected.push({
      name: entry.name,
      image: getImagePath(entry.name),
      actualHeight: entry.actualHeight,
      bust: entry.bust,
      cup: entry.cup,
    });
    seenNames.add(entry.name);
  }

  if (selected.length === 0) {
    throw new Error("Expected at least one female profile");
  }

  return selected;
}

async function buildMaleProfiles() {
  const pool = [];
  const seenNames = new Set();

  for (const height of MALE_HEIGHTS) {
    const entries = await fetchMaleEntriesForHeight(height);

    for (const entry of entries) {
      if (seenNames.has(entry.name)) {
        continue;
      }

      pool.push({
        name: entry.name,
        image: getImagePath(entry.name),
        actualHeight: entry.actualHeight,
      });
      seenNames.add(entry.name);
    }
  }

  const selected = pool.sort(preferredSort(MALE_PREFERRED_NAMES));

  if (selected.length === 0) {
    throw new Error("Expected at least one male profile");
  }

  return selected;
}

function renderProfilesFile(femaleProfiles, maleProfiles) {
  const renderFemale = femaleProfiles
    .map(
      (entry) => `  {
    name: "${escapeTsString(entry.name)}",
    image: "${escapeTsString(entry.image)}",
    actualHeight: ${entry.actualHeight},
    bust: ${entry.bust},
    cup: "${entry.cup}",
  }`
    )
    .join(",\n");

  const renderMale = maleProfiles
    .map(
      (entry) => `  {
    name: "${escapeTsString(entry.name)}",
    image: "${escapeTsString(entry.image)}",
    actualHeight: ${entry.actualHeight},
  }`
    )
    .join(",\n");

  return `export type FemaleProfileSource = {
  name: string;
  image: string;
  actualHeight: number;
  bust: number | null;
  cup: string | null;
};

export type MaleProfileSource = {
  name: string;
  image: string;
  actualHeight: number;
};

export const femaleProfilePool: FemaleProfileSource[] = [
${renderFemale},
];

export const maleProfilePool: MaleProfileSource[] = [
${renderMale},
];
`;
}

async function main() {
  const femaleProfiles = await buildFemaleProfiles();
  const maleProfiles = await buildMaleProfiles();

  if (process.argv.includes("--stats")) {
    const femaleDistribution = femaleProfiles.reduce((counts, profile) => {
      counts[profile.cup] = (counts[profile.cup] ?? 0) + 1;
      return counts;
    }, {});

    console.log(
      JSON.stringify(
        {
          femaleCount: femaleProfiles.length,
          maleCount: maleProfiles.length,
          femaleDistribution,
          femaleTop10: femaleProfiles.slice(0, 10).map((profile) => profile.name),
          maleTop10: maleProfiles.slice(0, 10).map((profile) => profile.name),
        },
        null,
        2
      )
    );
    return;
  }

  console.log(renderProfilesFile(femaleProfiles, maleProfiles));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
