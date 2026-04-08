import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const THROTTLE_MS = 2000;
const USER_AGENT = "body-type-analyzer/1.0 (local task automation)";
const execFileAsync = promisify(execFile);

const TARGETS = [
  { name: "橋本マナミ", filename: "hashimoto_manami" },
  { name: "小池栄子", filename: "koike_eiko" },
  {
    name: "井上和香",
    filename: "inoue_waka",
    enTitles: ["Waka Inoue"],
  },
  { name: "泉里香", filename: "izumi_rika" },
  { name: "おのののか", filename: "onononoka" },
  {
    name: "SHIHO",
    filename: "shiho",
    jaSearch: ["SHIHO モデル"],
    enTitles: ["Shiho Yano"],
  },
  { name: "筧美和子", filename: "kakei_miwako" },
  { name: "馬場ふみか", filename: "baba_fumika" },
  {
    name: "ケリー",
    filename: "kelly",
    jaSearch: ["ケリー モデル", "Kelly モデル"],
    enTitles: ["Kelly (fashion model)"],
  },
  { name: "篠崎愛", filename: "shinozaki_ai" },
  { name: "佐野ひなこ", filename: "sano_hinako" },
  { name: "あべみほ", filename: "abe_miho" },
  { name: "久松郁実", filename: "hisamatsu_ikumi" },
  { name: "稲森美優", filename: "inamori_miyu", jaSearch: ["稲森美優"] },
  {
    name: "しほの涼",
    filename: "shihono_ryo",
    enTitles: ["Ryo Shihono"],
  },
  {
    name: "インリン・オブ・ジョイトイ",
    filename: "inrin_of_joytoy",
    enTitles: ["Yinling of Joytoy"],
  },
  {
    name: "MALIA.",
    filename: "malia",
    jaSearch: ["MALIA. モデル"],
  },
  {
    name: "マギー",
    filename: "maggy",
    jaSearch: ["マギー モデル"],
    enTitles: ["Maggy", "Maggy (Japanese model)"],
  },
  { name: "葵井えりか", filename: "aoi_erika" },
  { name: "朝比奈彩", filename: "asahina_aya" },
  { name: "安井まゆ", filename: "yasui_mayu" },
  { name: "伊藤かな", filename: "ito_kana" },
  { name: "広瀬アリス", filename: "hirose_alice" },
  { name: "菊地優里", filename: "kikuchi_yuri" },
  { name: "伊藤裕子", filename: "ito_yuko" },
  {
    name: "衛藤美彩",
    filename: "eto_misa",
    enTitles: ["Misa Eto"],
  },
  {
    name: "伊原六花",
    filename: "ihara_rikka",
    enTitles: ["Rikka Ihara"],
  },
  {
    name: "リア・ディゾン",
    filename: "lea_dizon",
    enTitles: ["Leah Dizon"],
  },
  {
    name: "フォンチー",
    filename: "phongchi",
    enTitles: ["Phongchi"],
  },
  { name: "井上真央", filename: "inoue_mao" },
  { name: "yunocy", filename: "yunocy" },
  { name: "くぼたみか", filename: "kubota_mika" },
  { name: "安枝瞳", filename: "yasueda_hitomi" },
  { name: "磯貝花音", filename: "isogai_kanon" },
  { name: "こもりやさくら", filename: "komoriya_sakura" },
  { name: "安田美沙子", filename: "yasuda_misako" },
  { name: "中村アン", filename: "nakamura_anne" },
  {
    name: "若槻千夏",
    filename: "wakatsuki_chinatsu",
    enTitles: ["Chinatsu Wakatsuki"],
  },
  { name: "鎌倉美咲", filename: "kamakura_misaki" },
  { name: "杉野遥亮", filename: "sugino_yosuke" },
  { name: "竹内涼真", filename: "takeuchi_ryoma" },
  { name: "目黒蓮", filename: "meguro_ren" },
  { name: "鈴木伸之", filename: "suzuki_nobuyuki" },
  {
    name: "Shen(Def Tech)",
    filename: "shen_def_tech",
    jaSearch: ["Shen Def Tech", "Def Tech Shen"],
  },
  { name: "坂口健太郎", filename: "sakaguchi_kentaro" },
  { name: "渡辺謙", filename: "watanabe_ken" },
  {
    name: "JP",
    filename: "jp",
    jaTitles: ["JP (ものまね芸人)", "JP"],
    jaSearch: ["JP ものまね芸人"],
  },
  {
    name: "伊藤英明",
    filename: "ito_hideaki",
    enTitles: ["Hideaki Ito"],
  },
  { name: "谷原章介", filename: "tanihara_shosuke" },
  { name: "町田啓太", filename: "machida_keita" },
  { name: "福士蒼汰", filename: "fukushi_sota" },
  {
    name: "ROLAND",
    filename: "roland",
    jaTitles: ["ROLAND", "ROLAND (ホスト)"],
    jaSearch: ["ROLAND ホスト"],
  },
  {
    name: "TAKURO(GLAY)",
    filename: "takuro_glay",
    jaTitles: ["TAKURO"],
    jaSearch: ["TAKURO GLAY"],
  },
  { name: "長谷川博己", filename: "hasegawa_hiroki" },
  { name: "反町隆史", filename: "sorimachi_takashi" },
  { name: "綾野剛", filename: "ayano_go" },
  { name: "間宮祥太朗", filename: "mamiya_shotaro" },
  { name: "浅野忠信", filename: "asano_tadanobu" },
  { name: "アニマル浜口", filename: "animal_hamaguchi" },
  {
    name: "堤真一",
    filename: "tsutsumi_shinichi",
    enTitles: ["Shinichi Tsutsumi"],
  },
  { name: "DAIGO", filename: "daigo" },
  {
    name: "SALU",
    filename: "salu",
    jaSearch: ["SALU ラッパー"],
    enSearch: ["SALU rapper"],
  },
];

const SOURCE_PROFILES_PATH = path.join(
  process.cwd(),
  "lib",
  "source-profiles.ts"
);
const FETCH_SOURCE_PROFILES_PATH = path.join(
  process.cwd(),
  "scripts",
  "fetch-source-profiles.mjs"
);
const IMAGES_DIR = path.join(process.cwd(), "public", "images");

let nextRequestAt = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildTitleUrl(language, title) {
  const url = new URL(`https://${language}.wikipedia.org/w/api.php`);
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  url.searchParams.set("redirects", "1");
  url.searchParams.set("prop", "pageimages");
  url.searchParams.set("pithumbsize", "400");
  url.searchParams.set("titles", title);
  return url.toString();
}

function buildSearchUrl(language, query) {
  const url = new URL(`https://${language}.wikipedia.org/w/api.php`);
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrlimit", "5");
  url.searchParams.set("prop", "pageimages");
  url.searchParams.set("pithumbsize", "400");
  url.searchParams.set("gsrsearch", query);
  return url.toString();
}

function escapePowerShellString(value) {
  return value.replace(/'/g, "''");
}

function shouldConvertPng(sourceUrl) {
  const lower = sourceUrl.toLowerCase();
  return !lower.includes("logo") && !lower.includes(".svg.png");
}

async function throttledFetch(url) {
  const waitMs = nextRequestAt - Date.now();

  if (waitMs > 0) {
    await sleep(waitMs);
  }

  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
    },
  });

  nextRequestAt = Date.now() + THROTTLE_MS;

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${url}`);
  }

  return response;
}

function getThumbnailSource(payload) {
  const pages = payload?.query?.pages ?? [];
  return pages.find((page) => page?.thumbnail?.source)?.thumbnail?.source ?? null;
}

async function lookupByTitles(language, titles) {
  for (const title of titles) {
    const response = await throttledFetch(buildTitleUrl(language, title));
    const payload = await response.json();
    const source = getThumbnailSource(payload);

    if (source) {
      return { source, locator: `${language}:title:${title}` };
    }
  }

  return null;
}

async function lookupBySearch(language, queries) {
  for (const query of queries) {
    const response = await throttledFetch(buildSearchUrl(language, query));
    const payload = await response.json();
    const source = getThumbnailSource(payload);

    if (source) {
      return { source, locator: `${language}:search:${query}` };
    }
  }

  return null;
}

async function resolveImageSource(target) {
  const jaTitles = target.jaTitles ?? [target.name];
  const jaSearch = target.jaSearch ?? [target.name];
  const enTitles = target.enTitles ?? [];
  const enSearch = target.enSearch ?? enTitles;

  return (
    (await lookupByTitles("ja", jaTitles)) ??
    (await lookupBySearch("ja", jaSearch)) ??
    (enTitles.length > 0 ? await lookupByTitles("en", enTitles) : null) ??
    (enSearch.length > 0 ? await lookupBySearch("en", enSearch) : null)
  );
}

async function downloadImage(sourceUrl, outputPath) {
  const response = await throttledFetch(sourceUrl);
  const contentType = response.headers.get("content-type") ?? "";
  const arrayBuffer = await response.arrayBuffer();

  if (contentType.includes("image/jpeg")) {
    await fs.writeFile(outputPath, Buffer.from(arrayBuffer));
    return;
  }

  if (contentType.includes("image/png") && shouldConvertPng(sourceUrl)) {
    const tempPath = path.join(
      os.tmpdir(),
      `${path.basename(outputPath, ".jpg")}-${process.pid}.png`
    );

    await fs.writeFile(tempPath, Buffer.from(arrayBuffer));

    const command = [
      "Add-Type -AssemblyName System.Drawing",
      `$img = [System.Drawing.Image]::FromFile('${escapePowerShellString(
        tempPath
      )}')`,
      "$jpeg = [System.Drawing.Imaging.ImageFormat]::Jpeg",
      `$img.Save('${escapePowerShellString(outputPath)}', $jpeg)`,
      "$img.Dispose()",
      `Remove-Item -LiteralPath '${escapePowerShellString(tempPath)}'`,
    ].join("; ");

    await execFileAsync("powershell", ["-NoProfile", "-Command", command]);
    return;
  }

  throw new Error(`Unsupported image (${contentType}) from ${sourceUrl}`);
}

async function updateSourceProfiles(replacements) {
  let source = await fs.readFile(SOURCE_PROFILES_PATH, "utf8");

  for (const [name, imagePath] of replacements.entries()) {
    const pattern = new RegExp(
      `(name: "${escapeRegex(name)}",\\r?\\n\\s*image: ")[^"]+(")`,
      "u"
    );

    if (!pattern.test(source)) {
      throw new Error(`Could not find source profile entry for ${name}`);
    }

    source = source.replace(pattern, `$1${imagePath}$2`);
  }

  await fs.writeFile(SOURCE_PROFILES_PATH, source);
}

function parseImagePathEntries(block) {
  const entries = new Map();
  const pattern = /^\s{2}(?:"([^"]+)"|([^:]+)):\s+"([^"]+)",$/gmu;

  for (const match of block.matchAll(pattern)) {
    const key = match[1] ?? match[2];
    entries.set(key.trim(), match[3]);
  }

  return entries;
}

function renderImagePaths(entries) {
  const sorted = [...entries.entries()].sort(([left], [right]) =>
    left.localeCompare(right, "ja")
  );
  const lines = sorted.map(
    ([name, imagePath]) => `  ${JSON.stringify(name)}: "${imagePath}",`
  );
  return `const IMAGE_PATHS = {\n${lines.join("\n")}\n};`;
}

async function updateFetchSourceProfiles(replacements) {
  const source = await fs.readFile(FETCH_SOURCE_PROFILES_PATH, "utf8");
  const match = source.match(/const IMAGE_PATHS = \{[\s\S]*?\n\};/u);

  if (!match) {
    throw new Error("Could not locate IMAGE_PATHS in fetch-source-profiles.mjs");
  }

  const entries = parseImagePathEntries(match[0]);

  for (const [name, imagePath] of replacements.entries()) {
    entries.set(name, imagePath);
  }

  const updated = source.replace(match[0], renderImagePaths(entries));
  await fs.writeFile(FETCH_SOURCE_PROFILES_PATH, updated);
}

async function main() {
  await fs.mkdir(IMAGES_DIR, { recursive: true });

  const onlyNames = new Set(
    (process.env.ONLY_NAMES ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
  const targets =
    onlyNames.size > 0
      ? TARGETS.filter((target) => onlyNames.has(target.name))
      : TARGETS;
  const replacements = new Map();
  const failures = [];

  for (const target of targets) {
    const outputPath = path.join(IMAGES_DIR, `${target.filename}.jpg`);

    try {
      const resolved = await resolveImageSource(target);

      if (!resolved) {
        failures.push({ name: target.name, reason: "no-image-found" });
        console.warn(`No Wikipedia image found for ${target.name}`);
        continue;
      }

      await downloadImage(resolved.source, outputPath);
      replacements.set(target.name, `/images/${target.filename}.jpg`);
      console.log(`${target.name} -> ${resolved.locator}`);
    } catch (error) {
      failures.push({
        name: target.name,
        reason: error instanceof Error ? error.message : String(error),
      });
      console.warn(`Failed for ${target.name}: ${failures.at(-1).reason}`);
    }
  }

  if (replacements.size > 0) {
    await updateSourceProfiles(replacements);
    await updateFetchSourceProfiles(replacements);
  }

  console.log(
    JSON.stringify(
      {
        requested: targets.length,
        updated: replacements.size,
        failed: failures.length,
        failures,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
