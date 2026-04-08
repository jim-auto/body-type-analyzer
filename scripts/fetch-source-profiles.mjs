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

const FEMALE_QUOTAS = {
  A: 7,
  B: 22,
  C: 26,
  D: 22,
  E: 13,
  F: 6,
  G: 3,
  H: 1,
};

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
  新垣結衣: "/images/aragaki_yui.jpg",
  綾瀬はるか: "/images/ayase_haruka.jpg",
  藤田ニコル: "/images/fujita_nicole.jpg",
  深田恭子: "/images/fukada_kyoko.jpg",
  福山雅治: "/images/fukuyama_masaharu.jpg",
  浜辺美波: "/images/hamabe_minami.jpg",
  橋本環奈: "/images/hashimoto_kanna.jpg",
  広瀬すず: "/images/hirose_suzu.jpg",
  本田翼: "/images/honda_tsubasa.jpg",
  今田美桜: "/images/imada_mio.jpg",
  石原さとみ: "/images/ishihara_satomi.jpg",
  岩田剛典: "/images/iwata_takanori.jpg",
  川口春奈: "/images/kawaguchi_haruna.jpg",
  北川景子: "/images/kitagawa_keiko.jpg",
  小嶋陽菜: "/images/kojima_haruna.jpg",
  松坂桃李: "/images/matsuzaka_tori.jpg",
  森香澄: "/images/mori_hikari.jpg",
  向井理: "/images/mukai_osamu.jpg",
  長澤まさみ: "/images/nagasawa_masami.jpg",
  中条あやみ: "/images/nakajo_ayami.jpg",
  中村倫也: "/images/nakamura_tomoya.jpg",
  菜々緒: "/images/nanao.jpg",
  西島秀俊: "/images/nishijima_hidetoshi.jpg",
  斎藤工: "/images/saito_takumi.jpg",
  佐々木希: "/images/sasaki_nozomi.jpg",
  佐藤健: "/images/sato_takeru.jpg",
  鈴木亮平: "/images/suzuki_ryohei.jpg",
  竹野内豊: "/images/takenouchi_yutaka.jpg",
  玉木宏: "/images/tamaki_hiroshi.jpg",
  田中圭: "/images/tanaka_kei.jpg",
  山田孝之: "/images/yamada_takayuki.jpg",
  横浜流星: "/images/yokohama_ryusei.jpg",
  吉沢亮: "/images/yoshizawa_ryo.jpg",
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

  for (const cup of Object.keys(FEMALE_QUOTAS)) {
    buckets[cup] = await fetchFemaleCupEntries(cup);
  }

  const sorter = preferredSort(FEMALE_PREFERRED_NAMES);
  const selected = [];
  const seenNames = new Set();

  for (const [cup, quota] of Object.entries(FEMALE_QUOTAS)) {
    const bucket = [...buckets[cup]].sort(sorter);
    let selectedForCup = 0;

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
      selectedForCup += 1;

      if (selectedForCup >= quota) {
        break;
      }
    }
  }

  if (selected.length !== 100) {
    throw new Error(`Expected 100 female profiles, received ${selected.length}`);
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

  const selected = pool.sort(preferredSort(MALE_PREFERRED_NAMES)).slice(0, 100);

  if (selected.length !== 100) {
    throw new Error(`Expected 100 male profiles, received ${selected.length}`);
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
