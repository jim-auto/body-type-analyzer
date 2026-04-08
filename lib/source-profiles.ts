const avatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${name}&size=300&background=random&color=fff&bold=true`;

export type FemaleProfileSource = {
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
  {
    name: "新垣結衣",
    image: "/images/aragaki_yui.jpg",
    actualHeight: 169,
    bust: null,
    cup: null,
  },
  {
    name: "佐々木希",
    image: "/images/sasaki_nozomi.jpg",
    actualHeight: 168,
    bust: 80,
    cup: "C",
  },
  {
    name: "綾瀬はるか",
    image: "/images/ayase_haruka.jpg",
    actualHeight: 165,
    bust: 88,
    cup: "F",
  },
  {
    name: "深田恭子",
    image: "/images/fukada_kyoko.jpg",
    actualHeight: 163,
    bust: 86,
    cup: "E",
  },
  {
    name: "石原さとみ",
    image: "/images/ishihara_satomi.jpg",
    actualHeight: 157,
    bust: 82,
    cup: "D",
  },
  {
    name: "長澤まさみ",
    image: "/images/nagasawa_masami.jpg",
    actualHeight: 169,
    bust: 84,
    cup: "F",
  },
  {
    name: "浜辺美波",
    image: "/images/hamabe_minami.jpg",
    actualHeight: 157,
    bust: null,
    cup: null,
  },
  {
    name: "橋本環奈",
    image: "/images/hashimoto_kanna.jpg",
    actualHeight: 152,
    bust: 80,
    cup: null,
  },
  {
    name: "広瀬すず",
    image: "/images/hirose_suzu.jpg",
    actualHeight: 159,
    bust: 77,
    cup: null,
  },
  {
    name: "北川景子",
    image: "/images/kitagawa_keiko.jpg",
    actualHeight: 160,
    bust: 75,
    cup: null,
  },
  {
    name: "菜々緒",
    image: "/images/nanao.jpg",
    actualHeight: 172,
    bust: 80,
    cup: "B",
  },
  {
    name: "中条あやみ",
    image: "/images/nakajo_ayami.jpg",
    actualHeight: 169,
    bust: 79,
    cup: null,
  },
  {
    name: "今田美桜",
    image: "/images/imada_mio.jpg",
    actualHeight: 157,
    bust: 86,
    cup: "F",
  },
  {
    name: "藤田ニコル",
    image: "/images/fujita_nicole.jpg",
    actualHeight: 167,
    bust: 78,
    cup: null,
  },
  {
    name: "吉岡里帆",
    image: avatar("吉岡里帆"),
    actualHeight: 158,
    bust: 82,
    cup: null,
  },
  {
    name: "川口春奈",
    image: avatar("川口春奈"),
    actualHeight: 166,
    bust: 75,
    cup: null,
  },
  {
    name: "有村架純",
    image: avatar("有村架純"),
    actualHeight: 160,
    bust: 80,
    cup: null,
  },
  {
    name: "白石麻衣",
    image: avatar("白石麻衣"),
    actualHeight: 162,
    bust: 81,
    cup: null,
  },
  {
    name: "泉里香",
    image: avatar("泉里香"),
    actualHeight: 166,
    bust: 81,
    cup: "F",
  },
  {
    name: "杉原杏璃",
    image: avatar("杉原杏璃"),
    actualHeight: 157,
    bust: 89,
    cup: "G",
  },
  {
    name: "磯山さやか",
    image: avatar("磯山さやか"),
    actualHeight: 155,
    bust: 88,
    cup: "F",
  },
  {
    name: "小嶋陽菜",
    image: avatar("小嶋陽菜"),
    actualHeight: 164,
    bust: 80,
    cup: null,
  },
  {
    name: "指原莉乃",
    image: avatar("指原莉乃"),
    actualHeight: 159,
    bust: 73,
    cup: "B",
  },
  {
    name: "柏木由紀",
    image: avatar("柏木由紀"),
    actualHeight: 164,
    bust: 75,
    cup: "C",
  },
  {
    name: "土屋太鳳",
    image: avatar("土屋太鳳"),
    actualHeight: 155,
    bust: 79,
    cup: null,
  },
  {
    name: "永野芽郁",
    image: avatar("永野芽郁"),
    actualHeight: 163,
    bust: 76,
    cup: null,
  },
  {
    name: "池田エライザ",
    image: avatar("池田エライザ"),
    actualHeight: 169,
    bust: 85,
    cup: null,
  },
  {
    name: "木村有希",
    image: avatar("木村有希"),
    actualHeight: 157,
    bust: 80,
    cup: null,
  },
  {
    name: "本田翼",
    image: avatar("本田翼"),
    actualHeight: 166,
    bust: 84,
    cup: null,
  },
  {
    name: "桐谷美玲",
    image: avatar("桐谷美玲"),
    actualHeight: 163,
    bust: 78,
    cup: null,
  },
  {
    name: "中村アン",
    image: avatar("中村アン"),
    actualHeight: 161,
    bust: 82,
    cup: "E",
  },
  {
    name: "ダレノガレ明美",
    image: avatar("ダレノガレ明美"),
    actualHeight: 161,
    bust: 83,
    cup: "E",
  },
  {
    name: "安めぐみ",
    image: avatar("安めぐみ"),
    actualHeight: 160,
    bust: 85,
    cup: "D",
  },
  {
    name: "原幹恵",
    image: avatar("原幹恵"),
    actualHeight: 163,
    bust: 94,
    cup: "G",
  },
  {
    name: "MEGUMI",
    image: avatar("MEGUMI"),
    actualHeight: 158,
    bust: 94,
    cup: "H",
  },
  {
    name: "壇蜜",
    image: avatar("壇蜜"),
    actualHeight: 158,
    bust: 85,
    cup: "E",
  },
];

export const maleProfilePool: MaleProfileSource[] = [
  {
    name: "斎藤工",
    image: "/images/saito_takumi.jpg",
    actualHeight: 184,
  },
  {
    name: "向井理",
    image: "/images/mukai_osamu.jpg",
    actualHeight: 182,
  },
  {
    name: "福山雅治",
    image: "/images/fukuyama_masaharu.jpg",
    actualHeight: 181,
  },
  {
    name: "玉木宏",
    image: "/images/tamaki_hiroshi.jpg",
    actualHeight: 180,
  },
  {
    name: "竹野内豊",
    image: "/images/takenouchi_yutaka.jpg",
    actualHeight: 179,
  },
  {
    name: "鈴木亮平",
    image: "/images/suzuki_redactedi.jpg",
    actualHeight: 186,
  },
  {
    name: "松坂桃李",
    image: "/images/matsuzaka_tori.jpg",
    actualHeight: 183,
  },
  {
    name: "西島秀俊",
    image: "/images/nishijima_hidetoshi.jpg",
    actualHeight: 178,
  },
  {
    name: "佐藤健",
    image: "/images/sato_takeru.jpg",
    actualHeight: 170,
  },
  {
    name: "山田孝之",
    image: "/images/yamada_takayuki.jpg",
    actualHeight: 169,
  },
  {
    name: "田中圭",
    image: "/images/tanaka_kei.jpg",
    actualHeight: 178,
  },
  {
    name: "岩田剛典",
    image: "/images/iwata_takanori.jpg",
    actualHeight: 174,
  },
  {
    name: "横浜流星",
    image: "/images/yokohama_ryusei.jpg",
    actualHeight: 174,
  },
  {
    name: "吉沢亮",
    image: "/images/yoshizawa_ryo.jpg",
    actualHeight: 171,
  },
  {
    name: "中村倫也",
    image: "/images/nakamura_tomoya.jpg",
    actualHeight: 170,
  },
  {
    name: "菅田将暉",
    image: avatar("菅田将暉"),
    actualHeight: 176,
  },
  {
    name: "賀来賢人",
    image: avatar("賀来賢人"),
    actualHeight: 179,
  },
  {
    name: "成田凌",
    image: avatar("成田凌"),
    actualHeight: 183,
  },
  {
    name: "新田真剣佑",
    image: avatar("新田真剣佑"),
    actualHeight: 177,
  },
  {
    name: "北村匠海",
    image: avatar("北村匠海"),
    actualHeight: 177,
  },
  {
    name: "三浦春馬",
    image: avatar("三浦春馬"),
    actualHeight: 179,
  },
  {
    name: "窪田正孝",
    image: avatar("窪田正孝"),
    actualHeight: 175,
  },
  {
    name: "千葉雄大",
    image: avatar("千葉雄大"),
    actualHeight: 173,
  },
  {
    name: "志尊淳",
    image: avatar("志尊淳"),
    actualHeight: 178,
  },
  {
    name: "長瀬智也",
    image: avatar("長瀬智也"),
    actualHeight: 182,
  },
  {
    name: "木村拓哉",
    image: avatar("木村拓哉"),
    actualHeight: 176,
  },
  {
    name: "二宮和也",
    image: avatar("二宮和也"),
    actualHeight: 168,
  },
  {
    name: "相葉雅紀",
    image: avatar("相葉雅紀"),
    actualHeight: 175,
  },
  {
    name: "妻夫木聡",
    image: avatar("妻夫木聡"),
    actualHeight: 172,
  },
  {
    name: "小栗旬",
    image: avatar("小栗旬"),
    actualHeight: 184,
  },
  {
    name: "山崎賢人",
    image: avatar("山崎賢人"),
    actualHeight: 178,
  },
  {
    name: "神木隆之介",
    image: avatar("神木隆之介"),
    actualHeight: 168,
  },
  {
    name: "高橋一生",
    image: avatar("高橋一生"),
    actualHeight: 175,
  },
  {
    name: "星野源",
    image: avatar("星野源"),
    actualHeight: 168,
  },
  {
    name: "ムロツヨシ",
    image: avatar("ムロツヨシ"),
    actualHeight: 168,
  },
];
