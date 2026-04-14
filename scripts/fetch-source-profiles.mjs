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
  "BOSS THE MC": "/images/boss_the_mc_69aab9e8.jpg",
  "DAIGO": "/images/daigo.jpg",
  "GACKT": "/images/gackt_0da89e2f.jpg",
  "HEATH": "/images/heath_8fa8aa02.jpg",
  "ILMARI": "/images/ilmari_589ea945.jpg",
  "JIRO": "/images/jiro_153da67d.jpg",
  "JP": "/images/jp.jpg",
  "MEGUMI": "/images/megumi_14481fc7.jpg",
  "missha": "/images/missha_28756abc.jpg",
  "Nissy / 西島隆弘": "/images/nissy_3355c7b6.jpg",
  "ryuchell / りゅうちぇる": "/images/ryuchell_0a7a9db9.jpg",
  "SALU": "/images/salu.jpg",
  "Shen(Def Tech)": "/images/shen_def_tech.jpg",
  "SHIHO": "/images/shiho_a1fbfb6f.jpg",
  "TAKURO(GLAY)": "/images/takuro_glay.jpg",
  "YOSHIKI": "/images/yoshiki_7dee13bf.jpg",
  "yunocy": "/images/yunocy.jpg",
  "Zeebra": "/images/zeebra_db95427d.jpg",
  "あおい夢叶": "/images/jp_e38182e3818a_05c3d020.jpg",
  "アニマル浜口": "/images/animal_hamaguchi.jpg",
  "あばれる君": "/images/jp_e38182e381b0_d61db535.jpg",
  "あべみほ": "/images/abe_miho.jpg",
  "アレックス・ラミレス": "/images/jp_e382a2e383ac_dc3c802a.jpg",
  "いかりや長介": "/images/jp_e38184e3818b_12bfdad8.jpg",
  "イチロー": "/images/jp_e382a4e38381_44f272c2.jpg",
  "イッセー尾形": "/images/jp_e382a4e38383_d14bcb92.jpg",
  "いとうせいこう": "/images/jp_e38184e381a8_257c5d7f.jpg",
  "イリィ": "/images/jp_e382a4e383aa_563a6dc0.jpg",
  "インリン・オブ・ジョイトイ": "/images/jp_e382a4e383b3_308a9da1.jpg",
  "オダギリジョー": "/images/jp_e382aae38380_53d66cdb.jpg",
  "おのののか": "/images/ono_nonoka.jpg",
  "かでなれおん": "/images/jp_e3818be381a7_fcc0e4d3.jpg",
  "きゃりーぱみゅぱみゅ": "/images/jp_e3818de38283_2a186bc9.jpg",
  "くぼたみか": "/images/kubota_mika.jpg",
  "くりえみ": "/images/jp_e3818fe3828a_d67fab45.jpg",
  "クリスチャン・ベール": "/images/jp_e382afe383aa_943d3d25.jpg",
  "ケビン・コスナー": "/images/jp_e382b1e38393_006d8276.jpg",
  "ケリー": "/images/jp_e382b1e383aa_1218fbde.jpg",
  "こもりやさくら": "/images/komoriya_sakura.jpg",
  "ジェシー(SixTONES)": "/images/sixtones_b3310cf5.jpg",
  "しほの涼": "/images/shihono_ryo.jpg",
  "スザンヌ": "/images/ov_e382b9e382b6_36ca17f1.jpg",
  "セイン・カミュ": "/images/jp_e382bbe382a4_cf45129c.jpg",
  "そちお": "/images/jp_e3819de381a1_9219cd7f.jpg",
  "タイガー・ウッズ": "/images/jp_e382bfe382a4_5ed6c9b8.jpg",
  "ダレノガレ明美": "/images/jp_e38380e383ac_b44f2260.jpg",
  "ちとせよしの": "/images/jp_e381a1e381a8_55c8aa51.jpg",
  "つぶら": "/images/jp_e381a4e381b6_403fbc18.jpg",
  "ドクター・ドレー": "/images/jp_e38389e382af_2753edf3.jpg",
  "なるせるな": "/images/jp_e381aae3828b_10cd16b7.jpg",
  "ニック・カーター": "/images/jp_e3838be38383_7059e98b.jpg",
  "にわみきほ": "/images/jp_e381abe3828f_db249532.jpg",
  "パトリック・ハーラン/パックン": "/images/jp_e38391e38388_3b745e89.jpg",
  "ハリー杉山": "/images/jp_e3838fe383aa_ce597b12.jpg",
  "ビビアン・スー": "/images/jp_e38393e38393_ce0d325a.jpg",
  "フォンチー": "/images/phongchi.jpg",
  "ブラッドリー・クーパー": "/images/jp_e38396e383a9_6f0a86e0.jpg",
  "ポール・スタンレー(キッス)": "/images/jp_e3839de383bc_063a4c49.jpg",
  "ホラン千秋": "/images/jp_e3839be383a9_3a8053c9.jpg",
  "まなせゆうな": "/images/jp_e381bee381aa_8c5ad9ed.jpg",
  "マリウス葉(元 Sexy Zone)": "/images/sexy_zone_ce3b8d5e.jpg",
  "マリリン・マンソン": "/images/jp_e3839ee383aa_b51a7df5.jpg",
  "ユージ": "/images/jp_e383a6e383bc_b40aea26.jpg",
  "リア・ディゾン": "/images/lea_dizon.jpg",
  "レイザーラモンHG": "/images/hg_50912a72.jpg",
  "ローラ・チャン": "/images/jp_e383ade383bc_f9c49f29.jpg",
  "わちみなみ": "/images/jp_e3828fe381a1_91263773.jpg",
  "ヲヲタリンリン": "/images/jp_e383b2e383b2_f8ff9ca4.jpg",
  "阿南萌花": "/images/jp_e998bfe58d97_1306f2f2.jpg",
  "阿比留あんな": "/images/jp_e998bfe6af94_8db66f2b.jpg",
  "愛坂めい": "/images/jp_e6849be59d82_07936377.jpg",
  "愛川ゆず季": "/images/jp_e6849be5b79d_3e2dd344.jpg",
  "逢坂南": "/images/jp_e980a2e59d82_d5ccf8c4.jpg",
  "逢沢りな": "/images/jp_e980a2e6b2a2_66015cf9.jpg",
  "葵井えりか": "/images/aoi_erika.jpg",
  "茜紬うた": "/images/jp_e88c9ce7b4ac_be3e200d.jpg",
  "綾瀬はるか": "/images/ayase_haruka.jpg",
  "綾野剛": "/images/ayano_go.jpg",
  "安めぐみ": "/images/jp_e5ae89e38281_8669e6be.jpg",
  "安位薫": "/images/jp_e5ae89e4bd8d_f7c2e645.jpg",
  "安井まゆ": "/images/yasui_mayu.jpg",
  "安久澤ユノ": "/images/jp_e5ae89e4b985_99cec25d.jpg",
  "安枝瞳": "/images/yasueda_hitomi.jpg",
  "安田七奈": "/images/jp_e5ae89e794b0_b90439d3.jpg",
  "安田美沙子": "/images/yasuda_misako.jpg",
  "安藤沙耶香": "/images/jp_e5ae89e897a4_36b04ca3.jpg",
  "伊原六花": "/images/ihara_rikka.jpg",
  "伊織もえ": "/images/jp_e4bc8ae7b994_93844235.jpg",
  "伊勢みはと": "/images/jp_e4bc8ae58ba2_e74c25e1.jpg",
  "伊藤えみ": "/images/jp_e4bc8ae897a4_39b59ebd.jpg",
  "伊藤かな": "/images/ito_kana.jpg",
  "伊藤英明": "/images/ito_hideaki.jpg",
  "伊藤裕子": "/images/ito_yuko.jpg",
  "為近あんな": "/images/jp_e782bae8bf91_40528102.jpg",
  "井浦新": "/images/jp_e4ba95e6b5a6_7f91791a.jpg",
  "井原亜美": "/images/jp_e4ba95e58e9f_ad10ac2d.jpg",
  "井上うらら": "/images/jp_e4ba95e4b88a_51f3a164.jpg",
  "井上真央": "/images/inoue_mao.jpg",
  "井上晴菜": "/images/jp_e4ba95e4b88a_15803144.jpg",
  "井上和香": "/images/inoue_waka.jpg",
  "磯貝花音": "/images/isogai_kanon.jpg",
  "一戸愛子": "/images/jp_e4b880e688b8_7fca29c8.jpg",
  "稲森美優": "/images/inamori_miyu.jpg",
  "宇佐木にの": "/images/jp_e5ae87e4bd90_da84cbae.jpg",
  "羽賀研二": "/images/jp_e7bebde8b380_3873f591.jpg",
  "臼田あさ美": "/images/jp_e887bce794b0_91c3d79a.jpg",
  "浦西ひかる": "/images/jp_e6b5a6e8a5bf_9f7ca98a.jpg",
  "永山瑛太": "/images/jp_e6b0b8e5b1b1_5e7147c7.jpg",
  "永瀬永茉": "/images/jp_e6b0b8e780ac_c402ca80.jpg",
  "永瀬麻帆": "/images/jp_e6b0b8e780ac_7c74f5a4.jpg",
  "永富仁菜": "/images/jp_e6b0b8e5af8c_2bc38510.jpg",
  "益若つばさ": "/images/jp_e79b8ae88ba5_cd1f465b.jpg",
  "遠藤まめ": "/images/jp_e981a0e897a4_fc8d156c.jpg",
  "塩地美澄": "/images/jp_e5a1a9e59cb0_9cf6a787.jpg",
  "横浜流星": "/images/yokohama_ryusei.jpg",
  "岡安麗奈": "/images/jp_e5b2a1e5ae89_306292e4.jpg",
  "岡田ちほ": "/images/jp_e5b2a1e794b0_8e90099d.jpg",
  "岡田紗佳": "/images/jp_e5b2a1e794b0_c31647b3.jpg",
  "岡田佑里乃": "/images/jp_e5b2a1e794b0_deb7d1ef.jpg",
  "岡本杷奈": "/images/jp_e5b2a1e69cac_73b7b5de.jpg",
  "加瀬亮": "/images/jp_e58aa0e780ac_a909276a.jpg",
  "加藤ローサ": "/images/jp_e58aa0e897a4_9cdcc1f7.jpg",
  "加藤沙耶香": "/images/jp_e58aa0e897a4_c86fa3b1.jpg",
  "夏佳しお": "/images/jp_e5a48fe4bdb3_eeac0844.jpg",
  "夏乃美菜": "/images/jp_e5a48fe4b983_9b8a31a1.jpg",
  "夏本あさみ": "/images/jp_e5a48fe69cac_9a99974f.jpg",
  "夏来唯": "/images/jp_e5a48fe69da5_2d1aafe4.jpg",
  "河合風花": "/images/jp_e6b2b3e59088_abeef133.jpg",
  "河西智美": "/images/jp_e6b2b3e8a5bf_920c2790.jpg",
  "河北麻友子": "/images/jp_e6b2b3e58c97_4f4e8db2.jpg",
  "河路由希子": "/images/jp_e6b2b3e8b7af_19e424df.jpg",
  "花巻杏奈": "/images/jp_e88ab1e5b7bb_a90fadc8.jpg",
  "花咲楓香": "/images/jp_e88ab1e592b2_55923c4b.jpg",
  "我謝よしか": "/images/jp_e68891e8ac9d_7452ad1d.jpg",
  "海月咲希": "/images/jp_e6b5b7e69c88_85796911.jpg",
  "皆川彩月": "/images/jp_e79a86e5b79d_9cd09933.jpg",
  "皆川玲奈": "/images/jp_e79a86e5b79d_8a6b1560.jpg",
  "階戸瑠李": "/images/jp_e99a8ee688b8_156eec0f.jpg",
  "外岡えりか": "/images/jp_e5a496e5b2a1_6c405c54.jpg",
  "外崎梨香": "/images/jp_e5a496e5b48e_6a1437cb.jpg",
  "笠原美香": "/images/jp_e7aca0e58e9f_1739bd18.jpg",
  "鎌田大地": "/images/jp_e98e8ce794b0_68cfecae.jpg",
  "巻誠一郎": "/images/jp_e5b7bbe8aaa0_0f1d6a74.jpg",
  "簡秀吉": "/images/jp_e7b0a1e7a780_5ae0f655.jpg",
  "間宮祥太朗": "/images/mamiya_shotaro.jpg",
  "岸みゆ": "/images/jp_e5b2b8e381bf_8cfe9399.jpg",
  "岩上愛美": "/images/jp_e5b2a9e4b88a_900f16da.jpg",
  "岩田ゆい": "/images/jp_e5b2a9e794b0_652cad1c.jpg",
  "岩田剛典": "/images/iwata_takanori.jpg",
  "喜多愛": "/images/jp_e5969ce5a49a_95e73477.jpg",
  "希島あいり": "/images/jp_e5b88ce5b3b6_abec3599.jpg",
  "菊地亜沙美": "/images/jp_e88f8ae59cb0_eaa7901a.jpg",
  "菊地優里": "/images/kikuchi_yuri.jpg",
  "菊池亜希子": "/images/jp_e88f8ae6b1a0_63362375.jpg",
  "菊池麻衣子": "/images/jp_e88f8ae6b1a0_97b29855.jpg",
  "菊池雄星": "/images/jp_e88f8ae6b1a0_494040bd.jpg",
  "菊池梨沙": "/images/jp_e88f8ae6b1a0_cc33a4b6.jpg",
  "吉岡なつき": "/images/jp_e59089e5b2a1_6d69d75f.jpg",
  "吉川さおり": "/images/jp_e59089e5b79d_070585e2.jpg",
  "吉沢亮": "/images/jp_e59089e6b2a2_c0e00879.jpg",
  "吉田ユウ": "/images/jp_e59089e794b0_860c00dd.jpg",
  "吉田早希": "/images/jp_e59089e794b0_d1d91ff9.jpg",
  "吉澤玲菜": "/images/jp_e59089e6bea4_b283891a.jpg",
  "橘さり": "/images/jp_e6a998e38195_9a4172db.jpg",
  "橘美羽": "/images/jp_e6a998e7be8e_04077672.jpg",
  "久松郁実": "/images/hisamatsu_ikumi.jpg",
  "宮越虹海": "/images/jp_e5aeaee8b68a_9a2f861b.jpg",
  "宮花もも": "/images/jp_e5aeaee88ab1_7a4b4ca9.jpg",
  "宮瀬なこ": "/images/jp_e5aeaee780ac_9dfe561f.jpg",
  "宮川みやび": "/images/jp_e5aeaee5b79d_85a62a53.jpg",
  "宮沢氷魚": "/images/jp_e5aeaee6b2a2_5b2efdb2.jpg",
  "宮地れな": "/images/jp_e5aeaee59cb0_fd3eb5b0.jpg",
  "宮地真緒": "/images/jp_e5aeaee59cb0_3d005315.jpg",
  "宮尾俊太郎": "/images/jp_e5aeaee5b0be_29a0ec0e.jpg",
  "宮部桃香": "/images/jp_e5aeaee983a8_c454e125.jpg",
  "宮本りお": "/images/jp_e5aeaee69cac_bcfbc41a.jpg",
  "宮﨑まこ": "/images/jp_e5aeaeefa891_91c0f704.jpg",
  "弓川いち華": "/images/jp_e5bc93e5b79d_ae366316.jpg",
  "京谷あかり": "/images/jp_e4baace8b0b7_ffd7adb1.jpg",
  "橋本マナミ": "/images/hashimoto_manami.jpg",
  "橋本環奈": "/images/hashimoto_kanna.jpg",
  "橋本楓": "/images/jp_e6a98be69cac_d31ac458.jpg",
  "橋本萌花": "/images/jp_e6a98be69cac_ab801289.jpg",
  "玉木宏": "/images/tamaki_hiroshi.jpg",
  "桐谷あむ": "/images/jp_e6a190e8b0b7_2a28f556.jpg",
  "近藤みやび": "/images/jp_e8bf91e897a4_dbddbe2b.jpg",
  "近藤真琴": "/images/jp_e8bf91e897a4_3beeab7e.jpg",
  "金山睦": "/images/jp_e98791e5b1b1_f8d50189.jpg",
  "駒井まち": "/images/jp_e9a792e4ba95_7ac9e464.jpg",
  "窪田美沙": "/images/jp_e7aaaae794b0_ead3d464.jpg",
  "熊江琉衣": "/images/jp_e7868ae6b19f_fb1e7be7.jpg",
  "栗崎結衣": "/images/jp_e6a097e5b48e_d6af9628.jpg",
  "桑田彩": "/images/jp_e6a191e794b0_1876b75b.jpg",
  "月花めもり": "/images/jp_e69c88e88ab1_8b10a99d.jpg",
  "犬塚志乃": "/images/jp_e78aace5a19a_0402b779.jpg",
  "原つむぎ": "/images/jp_e58e9fe381a4_7d0bb2a2.jpg",
  "原史奈": "/images/jp_e58e9fe58fb2_d8e2af01.jpg",
  "原田真緒": "/images/jp_e58e9fe794b0_d44e5748.jpg",
  "絃花みき": "/images/jp_e7b583e88ab1_1bae5ab3.jpg",
  "古屋呂敏": "/images/jp_e58fa4e5b18b_1928b4e7.jpg",
  "古川優奈": "/images/jp_e58fa4e5b79d_4c80083a.jpg",
  "古田凜奈": "/images/jp_e58fa4e794b0_2be9e40d.jpg",
  "戸塚こはる": "/images/jp_e688b8e5a19a_4e3346e1.jpg",
  "戸田れい": "/images/jp_e688b8e794b0_9e79f336.jpg",
  "戸田恵梨香": "/images/jp_e688b8e794b0_ef825ecd.jpg",
  "御子柴かな": "/images/jp_e5bea1e5ad90_70262ff6.jpg",
  "工藤夢": "/images/jp_e5b7a5e897a4_ae67eb38.jpg",
  "幸野ゆりあ": "/images/jp_e5b9b8e9878e_d1b3127f.jpg",
  "広瀬アリス": "/images/hirose_alice.jpg",
  "広瀬すず": "/images/hirose_suzu.jpg",
  "江口洋介": "/images/jp_e6b19fe58fa3_b5526cf8.jpg",
  "江崎葉奈": "/images/jp_e6b19fe5b48e_bdb818a3.jpg",
  "江藤菜摘": "/images/jp_e6b19fe897a4_a5b29f5a.jpg",
  "溝口真央": "/images/jp_e6ba9de58fa3_b8c28fce.jpg",
  "香川照之": "/images/jp_e9a699e5b79d_dd52792a.jpg",
  "高岡未來": "/images/jp_e9ab98e5b2a1_dd18d66a.jpg",
  "高橋ナツミ": "/images/jp_e9ab98e6a98b_3cf06528.jpg",
  "高橋杏優": "/images/jp_e9ab98e6a98b_bb84d2d7.jpg",
  "高砂ミドリ": "/images/jp_e9ab98e7a082_2ce37094.jpg",
  "高崎かなみ": "/images/jp_e9ab98e5b48e_8a2b7eee.jpg",
  "高城樹衣": "/images/jp_e9ab98e59f8e_76505f9d.jpg",
  "高杉果那": "/images/jp_e9ab98e69d89_59c99763.jpg",
  "高槻実穂": "/images/jp_e9ab98e6a7bb_062a9455.jpg",
  "高島千明": "/images/jp_e9ab98e5b3b6_a61ca734.jpg",
  "高部あい": "/images/jp_e9ab98e983a8_7bc44fff.jpg",
  "高柳明音": "/images/jp_e9ab98e69fb3_6cd2dd2f.jpg",
  "合田雅吏": "/images/jp_e59088e794b0_6eb679f1.jpg",
  "黒川芽以": "/images/jp_e9bb92e5b79d_f79ee4ad.jpg",
  "黒川結衣": "/images/jp_e9bb92e5b79d_cf0c2671.jpg",
  "黒川智花": "/images/jp_e9bb92e5b79d_9a830fc4.jpg",
  "黒田としえ": "/images/jp_e9bb92e794b0_fcd19faf.jpg",
  "黒田みこ": "/images/jp_e9bb92e794b0_a4a2f8e6.jpg",
  "黒田博樹": "/images/jp_e9bb92e794b0_2a069314.jpg",
  "黒田有彩": "/images/jp_e9bb92e794b0_dd950744.jpg",
  "黒木麗奈": "/images/jp_e9bb92e69ca8_67432723.jpg",
  "今井亜未": "/images/jp_e4bb8ae4ba95_db1b18dd.jpg",
  "今田美桜": "/images/imada_mio.jpg",
  "根岸愛": "/images/jp_e6a0b9e5b2b8_3414502f.jpg",
  "佐々木希": "/images/sasaki_nozomi.jpg",
  "佐々木心音": "/images/jp_e4bd90e38085_e4efb010.jpg",
  "佐々木萌香": "/images/jp_e4bd90e38085_dc21b1b1.jpg",
  "佐々木明音": "/images/jp_e4bd90e38085_c3b9c264.jpg",
  "佐倉仁菜": "/images/jp_e4bd90e58089_7430ae42.jpg",
  "佐藤さくら": "/images/jp_e4bd90e897a4_ff73f24e.jpg",
  "佐藤亜美菜": "/images/jp_e4bd90e897a4_b6883381.jpg",
  "佐藤健": "/images/jp_e4bd90e897a4_b65d2e85.jpg",
  "佐藤江梨子": "/images/jp_e4bd90e897a4_c6b9411f.jpg",
  "佐藤七彩": "/images/jp_e4bd90e897a4_7dc5e793.jpg",
  "佐藤美希": "/images/jp_e4bd90e897a4_5ca29906.jpg",
  "佐藤望美": "/images/jp_e4bd90e897a4_5c36f6a1.jpg",
  "佐藤夢": "/images/jp_e4bd90e897a4_67b87e44.jpg",
  "佐藤唯": "/images/jp_e4bd90e897a4_44eb3d0e.jpg",
  "佐藤遥": "/images/jp_e4bd90e897a4_e2518d6b.jpg",
  "佐武宇綺": "/images/jp_e4bd90e6ada6_ffecf11e.jpg",
  "佐野なぎさ": "/images/jp_e4bd90e9878e_e160ad94.jpg",
  "佐野ひなこ": "/images/sano_hinako.jpg",
  "佐野マリア": "/images/jp_e4bd90e9878e_19bf0618.jpg",
  "最上もが": "/images/jp_e69c80e4b88a_a5782eb5.jpg",
  "妻夫木聡": "/images/jp_e5a6bbe5a4ab_e8910f6e.jpg",
  "斎藤恭代": "/images/jp_e6968ee897a4_1079f216.jpg",
  "斎藤工": "/images/saito_takumi.jpg",
  "菜々緒": "/images/nanao.jpg",
  "坂元誉梨": "/images/jp_e59d82e58583_40a534ef.jpg",
  "坂口健太郎": "/images/sakaguchi_kentaro.jpg",
  "坂地久美": "/images/jp_e59d82e59cb0_01a63d57.jpg",
  "坂東彌十郎": "/images/jp_e59d82e69db1_3736dd1e.jpg",
  "堺雅人": "/images/jp_e5a0bae99b85_9d6beb74.jpg",
  "咲菜月": "/images/jp_e592b2e88f9c_2b2f18cf.jpg",
  "桜あんり": "/images/jp_e6a19ce38182_93b74936.jpg",
  "桜のどか": "/images/jp_e6a19ce381ae_6386a127.jpg",
  "桜井うい": "/images/jp_e6a19ce4ba95_d31e4c52.jpg",
  "桜雪": "/images/jp_e6a19ce99baa_2ed53577.jpg",
  "笹岡郁未": "/images/jp_e7acb9e5b2a1_e1b8d538.jpg",
  "三浦萌": "/images/jp_e4b889e6b5a6_5f77a0ad.jpg",
  "三花愛良": "/images/jp_e4b889e88ab1_30994253.jpg",
  "三橋くん": "/images/jp_e4b889e6a98b_8348d5ad.jpg",
  "三宅智子": "/images/jp_e4b889e5ae85_8c38a83f.jpg",
  "山下リオ": "/images/jp_e5b1b1e4b88b_05938f4e.jpg",
  "山下真司": "/images/jp_e5b1b1e4b88b_3c1ae3ce.jpg",
  "山下智久": "/images/jp_e5b1b1e4b88b_62a25d74.jpg",
  "山岸奈津美": "/images/jp_e5b1b1e5b2b8_560ad98c.jpg",
  "山口紗弥加": "/images/jp_e5b1b1e58fa3_1202586e.jpg",
  "山咲まりな": "/images/jp_e5b1b1e592b2_73d2e85b.jpg",
  "山川紗弥": "/images/jp_e5b1b1e5b79d_58ce01b1.jpg",
  "山谷萌愛": "/images/jp_e5b1b1e8b0b7_4b05ff0a.jpg",
  "山中絢子": "/images/jp_e5b1b1e4b8ad_7cbdff22.jpg",
  "山田孝之": "/images/yamada_takayuki.jpg",
  "山田裕貴": "/images/jp_e5b1b1e794b0_bd8ef894.jpg",
  "山之内すず": "/images/jp_e5b1b1e4b98b_a5936d33.jpg",
  "山本梓": "/images/jp_e5b1b1e69cac_58a0f038.jpg",
  "山本瑚々南": "/images/jp_e5b1b1e69cac_e417475f.jpg",
  "市川紗椰": "/images/jp_e5b882e5b79d_13222003.jpg",
  "市川知宏": "/images/jp_e5b882e5b79d_e84013c1.jpg",
  "市川由衣": "/images/jp_e5b882e5b79d_4de56e2b.jpg",
  "市川莉乃": "/images/jp_e5b882e5b79d_c0f697db.jpg",
  "志崎ひなた": "/images/jp_e5bf97e5b48e_3c66b60c.jpg",
  "志田音々": "/images/jp_e5bf97e794b0_ec30a944.jpg",
  "志田友美": "/images/jp_e5bf97e794b0_17d85ffd.jpg",
  "指原莉乃": "/images/jp_e68c87e58e9f_cb2e8974.jpg",
  "寺口智香": "/images/jp_e5afbae58fa3_f423e979.jpg",
  "寺田安裕香": "/images/jp_e5afbae794b0_7477f3f8.jpg",
  "鹿谷弥生": "/images/jp_e9b9bfe8b0b7_fd15b4a3.jpg",
  "七海": "/images/jp_e4b883e6b5b7_1f1886e6.jpg",
  "七海かのん": "/images/jp_e4b883e6b5b7_09c653c8.jpg",
  "七海なな": "/images/jp_e4b883e6b5b7_0dc4cd64.jpg",
  "七瀬なな": "/images/jp_e4b883e780ac_c55b03a9.jpg",
  "篠崎こころ": "/images/jp_e7afa0e5b48e_be08c68b.jpg",
  "篠崎愛": "/images/shinozaki_ai.jpg",
  "篠田麻里子": "/images/jp_e7afa0e794b0_ac67e6e5.jpg",
  "釈由美子": "/images/jp_e98788e794b1_85ccd5de.jpg",
  "若木萌": "/images/jp_e88ba5e69ca8_155eaa64.jpg",
  "朱華": "/images/jp_e69cb1e88faf_1d9a142e.jpg",
  "酒井宏樹": "/images/jp_e98592e4ba95_ceb3b2a2.jpg",
  "酒井蘭": "/images/jp_e98592e4ba95_9c8183ca.jpg",
  "舟山久美子": "/images/jp_e8889fe5b1b1_58bd9a85.jpg",
  "住谷杏奈": "/images/jp_e4bd8fe8b0b7_20fb5b4a.jpg",
  "重盛さと美": "/images/jp_e9878de79b9b_0a12655a.jpg",
  "春輝": "/images/jp_e698a5e8bc9d_13946a89.jpg",
  "春菜めぐみ": "/images/jp_e698a5e88f9c_77b185b3.jpg",
  "春名美波": "/images/jp_e698a5e5908d_d7f4ffbb.jpg",
  "初崎ありか": "/images/jp_e5889de5b48e_55936f22.jpg",
  "緒方咲": "/images/jp_e7b792e696b9_91b5596b.jpg",
  "勝矢": "/images/jp_e58b9de79fa2_43e10f52.jpg",
  "小熊絵理": "/images/jp_e5b08fe7868a_f83d0623.jpg",
  "小栗あり": "/images/jp_e5b08fe6a097_929c71ce.jpg",
  "小栗旬": "/images/jp_e5b08fe6a097_ef033428.jpg",
  "小原徳子": "/images/jp_e5b08fe58e9f_708d30ad.jpg",
  "小向美奈子": "/images/jp_e5b08fe59091_bc1af46c.jpg",
  "小桜ももな": "/images/jp_e5b08fe6a19c_bed86d60.jpg",
  "小森ゆきの": "/images/jp_e5b08fe6a3ae_1f747fda.jpg",
  "小森純": "/images/jp_e5b08fe6a3ae_2b4763c8.jpg",
  "小泉深雪": "/images/jp_e5b08fe6b389_aa01f885.jpg",
  "小倉ゆうか": "/images/jp_e5b08fe58089_7cbe016d.jpg",
  "小倉優子": "/images/jp_e5b08fe58089_b1b12132.jpg",
  "小倉遥": "/images/jp_e5b08fe58089_7ac5f519.jpg",
  "小谷野花純": "/images/jp_e5b08fe8b0b7_6b8920bd.jpg",
  "小池栄子": "/images/koike_eiko.jpg",
  "小池里奈": "/images/jp_e5b08fe6b1a0_806916b3.jpg",
  "小田あさ美": "/images/jp_e5b08fe794b0_4b6f152c.jpg",
  "小田島渚": "/images/jp_e5b08fe794b0_feb274f0.jpg",
  "小島瑠璃子": "/images/jp_e5b08fe5b3b6_01db3ed0.jpg",
  "小嶋陽菜": "/images/kojima_haruna.jpg",
  "小日向ななせ": "/images/jp_e5b08fe697a5_43df30ee.jpg",
  "小日向はる": "/images/jp_e5b08fe697a5_fbb64cbd.jpg",
  "小日向ゆり": "/images/jp_e5b08fe697a5_cc0fc3ca.jpg",
  "小野真弓": "/images/jp_e5b08fe9878e_a4697af9.jpg",
  "小林ユリ": "/images/jp_e5b08fe69e97_7b160370.jpg",
  "小林宏之": "/images/jp_e5b08fe69e97_8a98758c.jpg",
  "小林香菜": "/images/jp_e5b08fe69e97_46435ff9.jpg",
  "小林麗菜": "/images/jp_e5b08fe69e97_e8565eb0.jpg",
  "松井さやか": "/images/jp_e69dbee4ba95_ae8883e1.jpg",
  "松井絵里奈": "/images/jp_e69dbee4ba95_31f5d7cc.jpg",
  "松井沙也香": "/images/jp_e69dbee4ba95_a31605ba.jpg",
  "松井咲子": "/images/jp_e69dbee4ba95_33a3d459.jpg",
  "松浦早希": "/images/jp_e69dbee6b5a6_a3828da3.jpg",
  "松岡里英": "/images/jp_e69dbee5b2a1_498f67b2.jpg",
  "松金ようこ": "/images/jp_e69dbee98791_76a1507d.jpg",
  "松原怜香": "/images/jp_e69dbee58e9f_443c8873.jpg",
  "松坂大輔": "/images/jp_e69dbee59d82_7df31af1.jpg",
  "松坂桃李": "/images/jp_e69dbee59d82_7a224ee2.jpg",
  "松山ケンイチ": "/images/jp_e69dbee5b1b1_e5418639.jpg",
  "松山メアリ": "/images/jp_e69dbee5b1b1_f50ea0f4.jpg",
  "松中信彦": "/images/jp_e69dbee4b8ad_3bb07ac5.jpg",
  "松田つかさ": "/images/jp_e69dbee794b0_4f7e535a.jpg",
  "松田龍平": "/images/jp_e69dbee794b0_13a5432f.jpg",
  "松嶋えいみ": "/images/jp_e69dbee5b68b_0c94377c.jpg",
  "松本さゆき": "/images/jp_e69dbee69cac_9c9f8d00.jpg",
  "松本潤": "/images/ov_e69dbee69cac_e5cd1066.jpg",
  "上原さくら": "/images/jp_e4b88ae58e9f_cfcca9c3.jpg",
  "上杉柊平": "/images/jp_e4b88ae69d89_cd091724.jpg",
  "植原ゆきな": "/images/jp_e6a48de58e9f_f6ffc04b.jpg",
  "心愛": "/images/jp_e5bf83e6849b_bf3159e5.jpg",
  "新井萌花": "/images/jp_e696b0e4ba95_0079f733.jpg",
  "新井遥": "/images/jp_e696b0e4ba95_ac83fdf7.jpg",
  "新海まき": "/images/jp_e696b0e6b5b7_d5ce0a45.jpg",
  "新垣結衣": "/images/aragaki_yui.jpg",
  "新見ななえ": "/images/jp_e696b0e8a68b_c1019084.jpg",
  "新川優愛": "/images/jp_e696b0e5b79d_614c9259.jpg",
  "新谷真由": "/images/jp_e696b0e8b0b7_4f82ee65.jpg",
  "新田まみ": "/images/jp_e696b0e794b0_ec5ddb1e.jpg",
  "新田ゆう": "/images/jp_e696b0e794b0_21981381.jpg",
  "新田妃奈": "/images/jp_e696b0e794b0_918a42e6.jpg",
  "森のんの": "/images/jp_e6a3aee381ae_6310f023.jpg",
  "森香澄": "/images/mori_hikari.jpg",
  "森重真人": "/images/jp_e6a3aee9878d_d3182f5d.jpg",
  "森川彩香": "/images/jp_e6a3aee5b79d_033a5a09.jpg",
  "森田みいこ": "/images/jp_e6a3aee794b0_220cdbae.jpg",
  "森本稀哲": "/images/jp_e6a3aee69cac_d647a94f.jpg",
  "深田恭子": "/images/fukada_kyoko.jpg",
  "真島なおみ": "/images/jp_e79c9fe5b3b6_53da2fc7.jpg",
  "真奈": "/images/jp_e79c9fe5a588_0e6e583b.jpg",
  "真木しおり": "/images/jp_e79c9fe69ca8_8d60690a.jpg",
  "真野恵里菜": "/images/jp_e79c9fe9878e_c138e8f5.jpg",
  "神崎紗衣": "/images/jp_e7a59ee5b48e_5e73878b.jpg",
  "秦佐和子": "/images/jp_e7a7a6e4bd90_41db9483.jpg",
  "秦瑞穂": "/images/jp_e7a7a6e7919e_8e11758a.jpg",
  "仁科鋭美": "/images/jp_e4bb81e7a791_b287a600.jpg",
  "吹石一恵": "/images/jp_e590b9e79fb3_fe27e8c8.jpg",
  "水月桃子": "/images/jp_e6b0b4e69c88_7234d41d.jpg",
  "水咲優美": "/images/jp_e6b0b4e592b2_6b01112d.jpg",
  "水沢エレナ": "/images/jp_e6b0b4e6b2a2_852eb3f1.jpg",
  "水沢友香": "/images/jp_e6b0b4e6b2a2_bdceab48.jpg",
  "水谷さくら": "/images/jp_e6b0b4e8b0b7_033225b4.jpg",
  "水谷彩咲": "/images/jp_e6b0b4e8b0b7_1e6e261f.jpg",
  "枢木むつ": "/images/jp_e69ea2e69ca8_d41f9b59.jpg",
  "雛森つぐみ": "/images/jp_e99b9be6a3ae_a66d3aa8.jpg",
  "雛田唯以": "/images/jp_e99b9be794b0_225c9d4c.jpg",
  "杉本愛莉鈴": "/images/jp_e69d89e69cac_3701031c.jpg",
  "杉本有美": "/images/jp_e69d89e69cac_509e7355.jpg",
  "杉野遥亮": "/images/sugino_yosuke.jpg",
  "澄川れみ": "/images/jp_e6be84e5b79d_1e2020fa.jpg",
  "瀬戸ローズ": "/images/jp_e780ace688b8_34954a70.jpg",
  "瀬名葵": "/images/jp_e780ace5908d_fbb0918f.jpg",
  "成海舞": "/images/jp_e68890e6b5b7_4a59453c.jpg",
  "成瀬かのん": "/images/jp_e68890e780ac_6baf83cc.jpg",
  "星島沙也加": "/images/jp_e6989fe5b3b6_e330323e.jpg",
  "星名美津紀": "/images/jp_e6989fe5908d_80260034.jpg",
  "星野あかり": "/images/jp_e6989fe9878e_ec1bbd8e.jpg",
  "星野琴": "/images/jp_e6989fe9878e_1d831a17.jpg",
  "星野真里": "/images/jp_e6989fe9878e_99c4859c.jpg",
  "星野白花": "/images/jp_e6989fe9878e_727f8503.jpg",
  "星野明日香": "/images/jp_e6989fe9878e_d93b4ce4.jpg",
  "清原翔": "/images/jp_e6b885e58e9f_7d5c5bde.jpg",
  "清水ゆう子": "/images/jp_e6b885e6b0b4_8d8fada6.jpg",
  "清水富美加": "/images/jp_e6b885e6b0b4_48a6d4b9.jpg",
  "清水舞美": "/images/jp_e6b885e6b0b4_2db714fe.jpg",
  "清水楓": "/images/jp_e6b885e6b0b4_6564b731.jpg",
  "清瀬汐希": "/images/jp_e6b885e780ac_ab69426e.jpg",
  "清野菜名": "/images/jp_e6b885e9878e_21585db5.jpg",
  "西永彩奈": "/images/jp_e8a5bfe6b0b8_f2d8032d.jpg",
  "西川周作": "/images/jp_e8a5bfe5b79d_505de15b.jpg",
  "西島秀俊": "/images/jp_e8a5bfe5b3b6_10d37b7d.jpg",
  "西方凌": "/images/jp_e8a5bfe696b9_8c985ea7.jpg",
  "西本ヒカル": "/images/jp_e8a5bfe69cac_1a250a08.jpg",
  "西脇彩華": "/images/jp_e8a5bfe88487_3810ba6c.jpg",
  "青井鈴音": "/images/jp_e99d92e4ba95_4723580a.jpg",
  "青宮鑑": "/images/jp_e99d92e5aeae_202f1404.jpg",
  "青山りか": "/images/jp_e99d92e5b1b1_705bf203.jpg",
  "青木佳音": "/images/jp_e99d92e69ca8_c5cbf9ed.jpg",
  "青木崇高": "/images/jp_e99d92e69ca8_e7d3c293.jpg",
  "青柳翔": "/images/jp_e99d92e69fb3_cf6d9748.jpg",
  "青葉さくら": "/images/jp_e99d92e89189_985a75aa.jpg",
  "石井一久": "/images/jp_e79fb3e4ba95_f0bb85ca.jpg",
  "石橋てるみ": "/images/jp_e79fb3e6a98b_a8ab37f5.jpg",
  "石原あつ美": "/images/jp_e79fb3e58e9f_b90ad5c7.jpg",
  "石原さとみ": "/images/ishihara_satomi.jpg",
  "石原由希": "/images/jp_e79fb3e58e9f_39f8d9d7.jpg",
  "石川沙織": "/images/jp_e79fb3e5b79d_21f4cb74.jpg",
  "石川麻衣": "/images/jp_e79fb3e5b79d_d5fe3e2c.jpg",
  "石川優実": "/images/jp_e79fb3e5b79d_ba638aca.jpg",
  "石川恋": "/images/jp_e79fb3e5b79d_398c7ddd.jpg",
  "石田安奈": "/images/jp_e79fb3e794b0_59f74f89.jpg",
  "石田裕子": "/images/jp_e79fb3e794b0_1716ebd2.jpg",
  "赤井沙希": "/images/jp_e8b5a4e4ba95_e312dfdb.jpg",
  "千倉里菜": "/images/jp_e58d83e58089_fd74c5f5.jpg",
  "川井優沙": "/images/jp_e5b79de4ba95_b720b2bf.jpg",
  "川口春奈": "/images/kawaguchi_haruna.jpg",
  "川崎あや": "/images/jp_e5b79de5b48e_1ed08347.jpg",
  "川上瑞葉": "/images/jp_e5b79de4b88a_44e07f44.jpg",
  "川瀬もえ": "/images/jp_e5b79de780ac_20ae3b8e.jpg",
  "川村那月": "/images/jp_e5b79de69d91_8c676d07.jpg",
  "川島永嗣": "/images/jp_e5b79de5b3b6_dfda1299.jpg",
  "泉里香": "/images/izumi_rika.jpg",
  "浅川まりな": "/images/jp_e6b585e5b79d_f65e4edb.jpg",
  "浅野忠信": "/images/asano_tadanobu.jpg",
  "前田希美": "/images/jp_e5898de794b0_1deb3536.jpg",
  "前田敦子": "/images/jp_e5898de794b0_0448449e.jpg",
  "前田美里": "/images/jp_e5898de794b0_6cf90dd7.jpg",
  "曽田茉莉江": "/images/jp_e69bbde794b0_8de76b66.jpg",
  "倉岡生夏": "/images/jp_e58089e5b2a1_5107d0fc.jpg",
  "倉持明日香": "/images/jp_e58089e68c81_c103566c.jpg",
  "倉持由香": "/images/jp_e58089e68c81_ffac3c1a.jpg",
  "倉田夏希": "/images/jp_e58089e794b0_95fbd8d0.jpg",
  "倉本清子": "/images/jp_e58089e69cac_90a5754f.jpg",
  "爽香": "/images/jp_e788bde9a699_aa511e67.jpg",
  "早瀬あや": "/images/jp_e697a9e780ac_acfb80d8.jpg",
  "早川渚紗": "/images/jp_e697a9e5b79d_d916c0e0.jpg",
  "相原乃依": "/images/jp_e79bb8e58e9f_9e1dad70.jpg",
  "相川聖奈": "/images/jp_e79bb8e5b79d_b4b3bd6f.jpg",
  "相川亮二": "/images/jp_e79bb8e5b79d_2f1e9122.jpg",
  "相沢菜々子": "/images/jp_e79bb8e6b2a2_6bd3c141.jpg",
  "相澤ゆうき": "/images/jp_e79bb8e6bea4_e416a561.jpg",
  "草川紫音": "/images/jp_e88d89e5b79d_d1b70bb1.jpg",
  "蒼井さや": "/images/jp_e892bce4ba95_9ce439e8.jpg",
  "増田有華": "/images/jp_e5a297e794b0_ccd5d1a1.jpg",
  "村上りいな": "/images/jp_e69d91e4b88a_04617bf1.jpg",
  "村上麻莉奈": "/images/jp_e69d91e4b88a_f77390e9.jpg",
  "村上友梨": "/images/jp_e69d91e4b88a_657be8f9.jpg",
  "太田千晶": "/images/jp_e5a4aae794b0_4f5cac84.jpg",
  "太田莉菜": "/images/jp_e5a4aae794b0_6596b1f1.jpg",
  "大園みゆう": "/images/jp_e5a4a7e59c92_e8e9de81.jpg",
  "大貫彩香": "/images/jp_e5a4a7e8b2ab_e54e4589.jpg",
  "大月あくあ": "/images/jp_e5a4a7e69c88_124a5416.jpg",
  "大泉洋": "/images/jp_e5a4a7e6b389_a5bb1467.jpg",
  "大沢あかね": "/images/jp_e5a4a7e6b2a2_a0db3ac0.jpg",
  "大竹愛子": "/images/jp_e5a4a7e7abb9_20bb1363.jpg",
  "大塚びる": "/images/jp_e5a4a7e5a19a_7531cc76.jpg",
  "大塚杏奈": "/images/jp_e5a4a7e5a19a_c2036654.jpg",
  "大島優子": "/images/jp_e5a4a7e5b3b6_ed16c738.jpg",
  "大嶋みく": "/images/jp_e5a4a7e5b68b_4c05e913.jpg",
  "大迫勇也": "/images/jp_e5a4a7e8bfab_8ae74cab.jpg",
  "大友さゆり": "/images/jp_e5a4a7e58f8b_ca2e4d4b.jpg",
  "大條美唯": "/images/jp_e5a4a7e6a29d_8d0bf867.jpg",
  "滝口成美": "/images/jp_e6bb9de58fa3_d9ed68ca.jpg",
  "滝川綾": "/images/jp_e6bb9de5b79d_391e9112.jpg",
  "滝沢沙織": "/images/jp_e6bb9de6b2a2_cd1f5aca.jpg",
  "沢村一樹": "/images/jp_e6b2a2e69d91_e89c36d3.jpg",
  "谷原章介": "/images/tanihara_shosuke.jpg",
  "谷口彰悟": "/images/jp_e8b0b7e58fa3_f704cef5.jpg",
  "谷田歩": "/images/jp_e8b0b7e794b0_dde17c7d.jpg",
  "谷碧": "/images/jp_e8b0b7e7a2a7_779cdb0a.jpg",
  "壇蜜": "/images/jp_e5a387e89c9c_28be20f2.jpg",
  "知花くらら": "/images/jp_e79fa5e88ab1_95fe20fe.jpg",
  "知香里": "/images/jp_e79fa5e9a699_6890ff73.jpg",
  "池松壮亮": "/images/jp_e6b1a0e69dbe_04914419.jpg",
  "池上紗理依": "/images/jp_e6b1a0e4b88a_c98ec9c8.jpg",
  "池田ゆり": "/images/jp_e6b1a0e794b0_e80ae42a.jpg",
  "池田愛恵里": "/images/jp_e6b1a0e794b0_4e8e5692.jpg",
  "池田夏希": "/images/jp_e6b1a0e794b0_06be736e.jpg",
  "竹川由華": "/images/jp_e7abb9e5b79d_9c28b492.jpg",
  "竹内涼真": "/images/takeuchi_ryoma.jpg",
  "竹本茉莉": "/images/jp_e7abb9e69cac_4661a02a.jpg",
  "竹野内豊": "/images/takenouchi_yutaka.jpg",
  "中井ゆかり": "/images/jp_e4b8ade4ba95_3c28b9e1.jpg",
  "中原未來": "/images/jp_e4b8ade58e9f_5fa1a26f.jpg",
  "中条あやみ": "/images/nakajo_ayami.jpg",
  "中川心": "/images/jp_e4b8ade5b79d_6db82fed.jpg",
  "中川大輔": "/images/jp_e4b8ade5b79d_b8b5ad02.jpg",
  "中川知香": "/images/jp_e4b8ade5b79d_23c294cf.jpg",
  "中川美樹": "/images/jp_e4b8ade5b79d_0d7db5d5.jpg",
  "中川翔子": "/images/jp_e4b8ade5b79d_d3612254.jpg",
  "中村アン": "/images/nakamura_anne.jpg",
  "中村愛": "/images/jp_e4b8ade69d91_430a2136.jpg",
  "中村航輔": "/images/jp_e4b8ade69d91_1c545508.jpg",
  "中村明花": "/images/jp_e4b8ade69d91_0616b591.jpg",
  "中村優": "/images/jp_e4b8ade69d91_bc95f5b4.jpg",
  "中村里帆": "/images/jp_e4b8ade69d91_0949998f.jpg",
  "中田ちさと": "/images/jp_e4b8ade794b0_226f690f.jpg",
  "中田彩": "/images/jp_e4b8ade794b0_4e4dcd9b.jpg",
  "中畑清": "/images/jp_e4b8ade79591_07d07b46.jpg",
  "中野由貴": "/images/jp_e4b8ade9878e_bf944db9.jpg",
  "仲原ちえ": "/images/jp_e4bbb2e58e9f_14456c77.jpg",
  "仲根かすみ": "/images/jp_e4bbb2e6a0b9_c814ef57.jpg",
  "仲川遥香": "/images/jp_e4bbb2e5b79d_4beae839.jpg",
  "仲村トオル": "/images/jp_e4bbb2e69d91_90b7d912.jpg",
  "仲村まひろ": "/images/jp_e4bbb2e69d91_7f34d867.jpg",
  "仲村みう": "/images/jp_e4bbb2e69d91_e4c050e6.jpg",
  "仲村美海": "/images/jp_e4bbb2e69d91_6fa49802.jpg",
  "仲村瑠璃亜": "/images/jp_e4bbb2e69d91_1a293e1a.jpg",
  "朝比奈りる": "/images/jp_e69c9de6af94_31725835.jpg",
  "朝比奈彩": "/images/asahina_aya.jpg",
  "潮崎まりん": "/images/jp_e6bdaee5b48e_76650e9b.jpg",
  "潮田ひかる": "/images/jp_e6bdaee794b0_b317ab6f.jpg",
  "町田啓太": "/images/machida_keita.jpg",
  "町野修斗": "/images/jp_e794bae9878e_f122ec77.jpg",
  "長崎ちほみ": "/images/jp_e995b7e5b48e_8c26cc93.jpg",
  "長瀬麻美": "/images/jp_e995b7e780ac_e2b6b699.jpg",
  "長谷川かすみ": "/images/jp_e995b7e8b0b7_1956c31b.jpg",
  "長谷川忍(シソンヌ)": "/images/jp_e995b7e8b0b7_ac1eefa2.jpg",
  "長谷川博己": "/images/hasegawa_hiroki.jpg",
  "長澤こうね": "/images/jp_e995b7e6bea4_f58c5808.jpg",
  "長澤ちはる": "/images/jp_e995b7e6bea4_2c5f34e0.jpg",
  "長澤まさみ": "/images/nagasawa_masami.jpg",
  "鳥井玲": "/images/jp_e9b3a5e4ba95_b5ca7446.jpg",
  "椎名ひかり": "/images/jp_e6a48ee5908d_6dbdd67c.jpg",
  "塚原あずさ": "/images/jp_e5a19ae58e9f_8dcfe8ae.jpg",
  "堤真一": "/images/tsutsumi_shinichi.jpg",
  "天羽結愛": "/images/jp_e5a4a9e7bebd_5977448d.jpg",
  "天野ちよ": "/images/jp_e5a4a9e9878e_1d358383.jpg",
  "殿倉恵未": "/images/jp_e6aebfe58089_955b4797.jpg",
  "田丸りさ": "/images/jp_e794b0e4b8b8_f12111b9.jpg",
  "田丸麻紀": "/images/jp_e794b0e4b8b8_c6e7f9eb.jpg",
  "田口新奈": "/images/jp_e794b0e58fa3_16098305.jpg",
  "田中マルクス闘莉王": "/images/jp_e794b0e4b8ad_61223bc5.jpg",
  "田中圭": "/images/tanaka_kei.jpg",
  "田中菜々": "/images/jp_e794b0e4b8ad_66f88966.jpg",
  "渡辺謙": "/images/watanabe_ken.jpg",
  "渡辺朱莉": "/images/jp_e6b8a1e8beba_575fdd6f.jpg",
  "渡辺麻友": "/images/jp_e6b8a1e8beba_fa03a65f.jpg",
  "都丸亜華梨": "/images/jp_e983bde4b8b8_012a2ecf.jpg",
  "土肥洋一": "/images/jp_e59c9fe882a5_d812301f.jpg",
  "島崎遥香": "/images/jp_e5b3b6e5b48e_d878ac61.jpg",
  "島﨑由莉香": "/images/jp_e5b3b6efa891_d04d0fc6.jpg",
  "嶋村瞳": "/images/jp_e5b68be69d91_4440c1a3.jpg",
  "東原亜希": "/images/jp_e69db1e58e9f_97ccc522.jpg",
  "東口順昭": "/images/jp_e69db1e58fa3_ddc24636.jpg",
  "東堂とも": "/images/jp_e69db1e5a082_86e5ec3b.jpg",
  "桃月なしこ": "/images/jp_e6a183e69c88_49bc196e.jpg",
  "桃原里香": "/images/jp_e6a183e58e9f_b2374cda.jpg",
  "桃香": "/images/jp_e6a183e9a699_7394d7b8.jpg",
  "筒香嘉智": "/images/jp_e7ad92e9a699_e355a994.jpg",
  "藤井リナ": "/images/jp_e897a4e4ba95_62f86004.jpg",
  "藤原竜也": "/images/jp_e897a4e58e9f_8be65a00.jpg",
  "藤川らるむ": "/images/jp_e897a4e5b79d_cbdc2702.jpg",
  "藤川球児": "/images/jp_e897a4e5b79d_83104b6b.jpg",
  "藤田ニコル": "/images/fujita_nicole.jpg",
  "藤本隆宏": "/images/jp_e897a4e69cac_56519d51.jpg",
  "藤木直人": "/images/jp_e897a4e69ca8_f2cc91da.jpg",
  "道枝駿佑": "/images/jp_e98193e69e9d_6d9481ba.jpg",
  "奈月セナ": "/images/jp_e5a588e69c88_5151f217.jpg",
  "内田安咲美": "/images/jp_e58685e794b0_51d70f19.jpg",
  "内田眞由美": "/images/jp_e58685e794b0_e44d043e.jpg",
  "南明奈": "/images/jp_e58d97e6988e_747828d3.jpg",
  "南茉莉花": "/images/jp_e58d97e88c89_50095910.jpg",
  "日向葵衣": "/images/jp_e697a5e59091_bcbf282a.jpg",
  "日南響子": "/images/jp_e697a5e58d97_8f044976.jpg",
  "日野アリス": "/images/jp_e697a5e9878e_33c64b86.jpg",
  "入山法子": "/images/jp_e585a5e5b1b1_f0b3f4d9.jpg",
  "如月はるな": "/images/jp_e5a682e69c88_f29ad977.jpg",
  "乃木坂ゆりな": "/images/jp_e4b983e69ca8_d35c12e8.jpg",
  "波崎天結": "/images/jp_e6b3a2e5b48e_174a4e85.jpg",
  "馬場ふみか": "/images/baba_fumika.jpg",
  "梅本まどか": "/images/jp_e6a285e69cac_bcddd111.jpg",
  "柏木由紀": "/images/jp_e69f8fe69ca8_3753418d.jpg",
  "白河優菜": "/images/jp_e799bde6b2b3_870f718c.jpg",
  "白山瑠衣": "/images/jp_e799bde5b1b1_b806eb8b.jpg",
  "白石希望": "/images/jp_e799bde79fb3_bb6cc35d.jpg",
  "白石時": "/images/jp_e799bde79fb3_4d238273.jpg",
  "白石唯菜": "/images/jp_e799bde79fb3_37fc4e57.jpg",
  "白沢マリナ": "/images/jp_e799bde6b2a2_1d6f99e5.jpg",
  "白田久子": "/images/jp_e799bde794b0_2a02b8a0.jpg",
  "白藤有華": "/images/jp_e799bde897a4_d72cd79e.jpg",
  "白浜さち": "/images/jp_e799bde6b59c_11e87995.jpg",
  "八田亜矢子": "/images/jp_e585abe794b0_8c48a99f.jpg",
  "反町隆史": "/images/sorimachi_takashi.jpg",
  "板野優花": "/images/jp_e69dbfe9878e_78842719.jpg",
  "板野友美": "/images/jp_e69dbfe9878e_45e8741a.jpg",
  "飯豊まりえ": "/images/jp_e9a3afe8b18a_99d5eb20.jpg",
  "番ことみ": "/images/jp_e795aae38193_59d530ac.jpg",
  "比留川游": "/images/jp_e6af94e79599_33c9a2b9.jpg",
  "飛鳥りん": "/images/jp_e9a39be9b3a5_c3161d8c.jpg",
  "美沙玲奈": "/images/jp_e7be8ee6b299_64b6348c.jpg",
  "美輪咲月": "/images/jp_e7be8ee8bcaa_cb4006a0.jpg",
  "百川晴香": "/images/jp_e799bee5b79d_ce4f06a9.jpg",
  "百武あい": "/images/jp_e799bee6ada6_7e24789a.jpg",
  "百野綾華": "/images/jp_e799bee9878e_0fee9a03.jpg",
  "浜田翔子": "/images/jp_e6b59ce794b0_ffb66128.jpg",
  "浜辺美波": "/images/hamabe_minami.jpg",
  "冨永愛": "/images/jp_e586a8e6b0b8_cd155a63.jpg",
  "冨手麻妙": "/images/jp_e586a8e6898b_976fb8bb.jpg",
  "武蔵": "/images/jp_e6ada6e894b5_415aeeb0.jpg",
  "福山雅治": "/images/fukuyama_masaharu.jpg",
  "福士蒼汰": "/images/fukushi_sota.jpg",
  "福田沙紀": "/images/jp_e7a68fe794b0_1897183c.jpg",
  "兵頭功海": "/images/jp_e585b5e9a0ad_5e133a36.jpg",
  "幣原あやの": "/images/jp_e5b9a3e58e9f_62977c4f.jpg",
  "平山あや": "/images/jp_e5b9b3e5b1b1_bdc4f4d5.jpg",
  "平山祐介": "/images/jp_e5b9b3e5b1b1_c0aa918b.jpg",
  "平塚千瑛": "/images/jp_e5b9b3e5a19a_49e60acf.jpg",
  "平野紫耀": "/images/jp_e5b9b3e9878e_8c93a39b.jpg",
  "平林あずみ": "/images/jp_e5b9b3e69e97_21c3f62e.jpg",
  "碧羽ひなた": "/images/jp_e7a2a7e7bebd_d724906a.jpg",
  "片瀬那奈": "/images/jp_e78987e780ac_0ea6ec98.jpg",
  "峰尾こずえ": "/images/jp_e5b3b0e5b0be_cdc11e61.jpg",
  "峯岸みなみ": "/images/jp_e5b3afe5b2b8_e6398167.jpg",
  "豊田ルナ": "/images/jp_e8b18ae794b0_db8698d3.jpg",
  "望月美寿々": "/images/jp_e69c9be69c88_dd5e6d96.jpg",
  "北向珠夕": "/images/jp_e58c97e59091_3d487ff1.jpg",
  "北川景子": "/images/kitagawa_keiko.jpg",
  "北村真姫": "/images/jp_e58c97e69d91_75602ebb.jpg",
  "堀このみ": "/images/jp_e5a080e38193_189cb591.jpg",
  "堀みなみ": "/images/jp_e5a080e381bf_6176d884.jpg",
  "堀越のり": "/images/jp_e5a080e8b68a_003ef7e7.jpg",
  "堀川美加子": "/images/jp_e5a080e5b79d_6591b449.jpg",
  "本仮屋ユイカ": "/images/jp_e69cace4bbae_f289dad6.jpg",
  "本郷杏奈": "/images/jp_e69cace983b7_7dfde792.jpg",
  "本田翼": "/images/honda_tsubasa.jpg",
  "麻倉みな": "/images/jp_e9babbe58089_f3da1859.jpg",
  "麻友美": "/images/jp_e9babbe58f8b_45116580.jpg",
  "末永みゆ": "/images/jp_e69cabe6b0b8_41509eed.jpg",
  "末永もも": "/images/jp_e69cabe6b0b8_ebb786e8.jpg",
  "夢月ゆのん": "/images/jp_e5a4a2e69c88_5443297c.jpg",
  "霧島聖子": "/images/jp_e99ca7e5b3b6_b7ebae30.jpg",
  "木下愛純": "/images/jp_e69ca8e4b88b_816ec64f.jpg",
  "木下優樹菜": "/images/jp_e69ca8e4b88b_cdee704b.jpg",
  "木更かのん": "/images/jp_e69ca8e69bb4_41df6789.jpg",
  "木村あやね": "/images/jp_e69ca8e69d91_24f4e901.jpg",
  "木村好珠": "/images/jp_e69ca8e69d91_d15665a6.jpg",
  "目黒蓮": "/images/meguro_ren.jpg",
  "野々のん": "/images/jp_e9878ee38085_79d6e1d4.jpg",
  "野村康太": "/images/jp_e9878ee69d91_41a996e3.jpg",
  "矢沢めい": "/images/jp_e79fa2e6b2a2_a1976fa1.jpg",
  "矢部美希": "/images/jp_e79fa2e983a8_9e560947.jpg",
  "矢野未希子": "/images/jp_e79fa2e9878e_18bdc9b9.jpg",
  "矢野目美有": "/images/jp_e79fa2e9878e_505e4872.jpg",
  "役所広司": "/images/jp_e5bdb9e68980_e4a5222b.jpg",
  "柳いろは": "/images/jp_e69fb3e38184_1b99ee71.jpg",
  "柳ゆり菜": "/images/jp_e69fb3e38286_29345894.jpg",
  "優木まおみ": "/images/jp_e584aae69ca8_c4595208.jpg",
  "友咲まどか": "/images/jp_e58f8be592b2_7761e798.jpg",
  "有村果夏": "/images/jp_e69c89e69d91_d6bf676f.jpg",
  "有村藍里": "/images/jp_e69c89e69d91_e78a41bb.jpg",
  "有馬あかり": "/images/jp_e69c89e9a6ac_29abff65.jpg",
  "柚木あゆみ": "/images/jp_e69f9ae69ca8_74280351.jpg",
  "柚木みいな": "/images/jp_e69f9ae69ca8_76816728.jpg",
  "柚木彩見": "/images/jp_e69f9ae69ca8_518d1071.jpg",
  "由井香織": "/images/jp_e794b1e4ba95_4ff35fa6.jpg",
  "由良朱合": "/images/jp_e794b1e889af_681e51a9.jpg",
  "誉田みに": "/images/jp_e8aa89e794b0_46a45c65.jpg",
  "葉加瀬マイ": "/images/jp_e89189e58aa0_a033105f.jpg",
  "葉月めぐ": "/images/jp_e89189e69c88_72ebe2b7.jpg",
  "葉月ゆめ": "/images/jp_e89189e69c88_7f34e65e.jpg",
  "来栖あつこ": "/images/jp_e69da5e6a096_ca1b75ea.jpg",
  "来栖うさこ": "/images/jp_e69da5e6a096_3557d6b6.jpg",
  "来生かほ": "/images/jp_e69da5e7949f_fedab7c7.jpg",
  "嵐優子": "/images/jp_e5b590e584aa_ae22fb3f.jpg",
  "梨花": "/images/ov_e6a2a8e88ab1_2f1e9745.jpg",
  "里田まい": "/images/jp_e9878ce794b0_99d599e3.jpg",
  "立花あんな": "/images/jp_e7ab8be88ab1_55b0d80d.jpg",
  "立花のぞみ": "/images/jp_e7ab8be88ab1_44a09050.jpg",
  "立花紫音": "/images/jp_e7ab8be88ab1_e2230f2e.jpg",
  "涼本めぐみ": "/images/jp_e6b6bce69cac_57b6b1a3.jpg",
  "林ゆめ": "/images/jp_e69e97e38286_33a126e1.jpg",
  "林田百加": "/images/jp_e69e97e794b0_0467aa15.jpg",
  "輪湖チロル": "/images/jp_e8bcaae6b996_09031a88.jpg",
  "鈴木えみ": "/images/jp_e988b4e69ca8_a97133cb.jpg",
  "鈴木まりや": "/images/jp_e988b4e69ca8_01e6b5f9.jpg",
  "鈴木ゆうか": "/images/jp_e988b4e69ca8_6c0aab20.jpg",
  "鈴木咲": "/images/jp_e988b4e69ca8_658f25e1.jpg",
  "鈴木伸之": "/images/suzuki_nobuyuki.jpg",
  "鈴木聖": "/images/jp_e988b4e69ca8_7bdce876.jpg",
  "鈴木亮平": "/images/suzuki_redactedi.jpg",
  "和久井雅子": "/images/jp_e5928ce4b985_4c0d6a1c.jpg",
  "和泉テルミ": "/images/jp_e5928ce6b389_0dfabfb9.jpg",
  "和智日菜子": "/images/jp_e5928ce699ba_aeda0b9c.jpg",
  "榑林里奈": "/images/jp_e6a691e69e97_5962b38f.jpg",
  "澤村拓一": "/images/jp_e6bea4e69d91_9108724a.jpg",
  "澤田リサ": "/images/jp_e6bea4e794b0_4d6a4ad1.jpg",
  "濱尾ノリタカ": "/images/jp_e6bfb1e5b0be_54840158.jpg",
  "筧美和子": "/images/jp_e7ada7e7be8e_e114a8b4.jpg",
  "蔡晴星": "/images/jp_e894a1e699b4_2e854f01.jpg",
  "髙村梨々花": "/images/jp_e9ab99e69d91_9abe368d.jpg",
  "髙嶋政宏": "/images/jp_e9ab99e5b68b_16b55ecc.jpg",
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
