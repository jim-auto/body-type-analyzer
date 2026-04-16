import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promisify } from "node:util";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const execFileAsync = promisify(execFile);

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
const IDOLPROF_SEARCH_URL =
  "https://idolprof.com/wp-json/wp/v2/yada_wiki?search=%s&per_page=5";

const FEMALE_IDOLPROF_NAMES = [
  "松本さゆき",
  "水咲優美",
  "爽香",
  "相沢菜々子",
  "潮崎まりん",
  "天羽結愛",
  "天野ちよ",
  "奈月セナ",
];

const TARGETS = [
  ...FEMALE_IDOLPROF_NAMES.map((name) => ({
    name,
    kind: "idolprof",
    landingUrl: `https://idolprof.com/wiki/${encodeURIComponent(name)}/`,
  })),
  {
    name: "愛川ゆず季",
    kind: "direct",
    landingUrl: "https://www.flickr.com/photos/sabrebiade/8333933546",
    imageUrl: "https://live.staticflickr.com/8219/8333933546_1f90f1092f.jpg",
  },
  {
    name: "夏来唯",
    kind: "direct",
    landingUrl: "https://mache.tv/talent/natsuki-yui/",
    imageUrl:
      "https://inn2sst03.blob.core.windows.net/inn/viewer_img/image_id/d87b8d29-6bd1-4d2f-9c00-9b1ac257a0ec.jpg",
  },
  {
    name: "喜多愛",
    kind: "direct",
    landingUrl: "https://www.manakamanaka.com/profile/",
    imageUrl:
      "https://www.manakamanaka.com/wp-content/uploads/2017/12/manaka-branding_l.jpg",
  },
  {
    name: "山咲まりな",
    kind: "direct",
    landingUrl: "https://yamasaki-marina.net/profile/",
    imageUrl:
      "https://yamasaki-marina.net/mari_2022/wp-content/uploads/2022/09/thumbnail_1080_1.jpg",
  },
  {
    name: "ケリー",
    kind: "direct",
    landingUrl: "https://baila.hpplus.jp/beauty/bodyfragrance/39859",
    imageUrl:
      "https://img-baila.hpplus.jp/common/large/image/a6/a611d7d7-7d23-4b5a-b068-6f7f09f786c2.jpg",
  },
  {
    name: "春輝",
    kind: "direct",
    landingUrl: "https://www.bs11.jp/lineup/2019/04/haruki.html",
    imageUrl: "https://www.bs11.jp/education/img/national-border_cast03.jpg",
  },
  {
    name: "小泉深雪",
    kind: "direct",
    landingUrl: "https://tateokaoffice.com/models/miyukikoizumi/",
    imageUrl:
      "https://tateokaoffice.com/toweb/wp-content/uploads/2024/03/miyuki001.jpg",
  },
  {
    name: "中村明花",
    kind: "direct",
    landingUrl: "https://news.ntv.co.jp/category/culture/339144",
    imageUrl:
      "https://news.ntv.co.jp/gimage/n24/articles/00349641b9f04be78e20f94c5104edf0/ent_45029.jpg?w=1200",
  },
  {
    name: "日向葵衣",
    kind: "direct",
    landingUrl: "https://yanmaga.jp/gravures/idols/1f3f2d932a14ead92edc73895b88f711",
    imageUrl:
      "https://eh96lnrmau.user-space.cdn.idcfcloud.net/uploads/author/avatar/613/196839c9-3f54-462e-8af9-4e69fdb6431e.jpg",
  },
  {
    name: "木村あやね",
    kind: "direct",
    landingUrl: "https://girlsnews.tv/news/252298",
    imageUrl: "https://girlsnews.tv/reimage/h400/img20151030kimuraayane1.jpg",
  },
  {
    name: "菊池亜希子",
    kind: "page-regex",
    landingUrl: "https://tencarat.co.jp/kikuchiakiko/",
    patterns: [
      /https:\/\/ten-carat-official-image\.s3\.ap-northeast-1\.amazonaws\.com\/wp-content\/uploads\/[^"'<> ]+\/kikuchiakiko_2025\.jpg/iu,
    ],
  },
  {
    name: "佐藤江梨子",
    kind: "page-regex",
    landingUrl: "https://www.oricon.co.jp/prof/209854/photo/p/2/",
    patterns: [
      /https:\/\/contents\.oricon\.co\.jp\/upimg\/talent\/W\/W00-0278\.jpg/iu,
    ],
  },
  {
    name: "上杉柊平",
    kind: "direct",
    landingUrl: "https://wiki.d-addicts.com/Uesugi_Shuhei",
    imageUrl:
      "https://wiki.d-addicts.com/images/thumb/9/90/Uesugi_Shuhei.jpg/200px-Uesugi_Shuhei.jpg",
  },
  {
    name: "濱尾ノリタカ",
    kind: "page-regex",
    landingUrl: "https://spn.ken-on.com/profile/?id=hamao_noritaka",
    patterns: [
      /https:\/\/www2\.ken-on\.com\/img\/profile\/photo_sp\/hamao_noritaka\.jpg/iu,
    ],
  },
  {
    name: "青宮鑑",
    kind: "direct",
    landingUrl: "https://p-bandai.jp/item/item-1000141915/",
    imageUrl: "https://bandai-a.akamaihd.net/bc/img/model/b/1000141915_1.jpg",
  },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapePowerShellString(value) {
  return value.replace(/'/g, "''");
}

async function loadOnlyNames() {
  const names = (process.env.ONLY_NAMES ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const onlyNamesFile = process.env.ONLY_NAMES_FILE?.trim();

  if (onlyNamesFile) {
    const fileNames = (await fs.readFile(onlyNamesFile, "utf8"))
      .split(/\r?\n/u)
      .map((value) => value.trim())
      .filter(Boolean);
    names.push(...fileNames);
  }

  return new Set(names);
}

function makeFilename(name) {
  const normalized = name.normalize("NFKC");
  const asciiStem = normalized
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const hash = createHash("sha1").update(normalized).digest("hex").slice(0, 8);

  if (asciiStem) {
    return `${asciiStem}_${hash}`;
  }

  const hexStem = Buffer.from(normalized).toString("hex").slice(0, 12);
  return `jp_${hexStem}_${hash}`;
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&#0*38;/giu, "&")
    .replace(/&amp;/giu, "&")
    .replace(/&quot;/giu, '"')
    .replace(/&#x27;/giu, "'");
}

function isUnusableIdolprofImageUrl(sourceUrl) {
  const lower = sourceUrl.toLowerCase();

  return (
    lower.includes("8y9bdlnv_400x400.png") ||
    lower.includes("no-image-160.png") ||
    lower.includes("404.png") ||
    lower.includes("site-icon") ||
    lower.includes("ws-fe.amazon-adsystem.com")
  );
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      "accept-language": "ja,en-US;q=0.9,en;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }

  return Buffer.from(await response.arrayBuffer()).toString("utf8");
}

function extractOgImage(html, landingUrl) {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/iu,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/iu,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match?.[1]) {
      return decodeHtmlEntities(match[1]);
    }
  }

  throw new Error(`Could not find og:image on ${landingUrl}`);
}

function normalizeIdolprofImageUrl(sourceUrl) {
  if (!sourceUrl) {
    throw new Error("Missing idolprof image URL");
  }

  if (sourceUrl.startsWith("//")) {
    sourceUrl = `https:${sourceUrl}`;
  }

  if (isUnusableIdolprofImageUrl(sourceUrl)) {
    throw new Error(`Unusable idolprof image: ${sourceUrl}`);
  }

  const parsed = new URL(sourceUrl);
  const rakutenImage = parsed.searchParams.get("pc");

  if (rakutenImage) {
    return rakutenImage;
  }

  return sourceUrl;
}

async function resolveIdolprofLandingUrl(name) {
  const searchUrl = IDOLPROF_SEARCH_URL.replace("%s", encodeURIComponent(name));
  const response = await fetch(searchUrl, {
    headers: {
      "user-agent": USER_AGENT,
      "accept-language": "ja,en-US;q=0.9,en;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Idolprof search failed (${response.status}) for ${name}`);
  }

  const results = await response.json();
  const exact = results.find((entry) => entry?.title?.rendered === name);

  if (!exact) {
    return null;
  }

  return `https://idolprof.com/wiki/${exact.slug}/`;
}

function extractFirstMatch(html, landingUrl, patterns) {
  for (const pattern of patterns) {
    const match = html.match(pattern);

    if (match?.[0]) {
      return decodeHtmlEntities(match[0]);
    }
  }

  throw new Error(`Could not find image URL on ${landingUrl}`);
}

async function resolveTarget(target) {
  if (target.kind === "direct") {
    return {
      imageUrl: target.imageUrl,
      landingUrl: target.landingUrl,
    };
  }

  const html = await fetchText(target.landingUrl);

  if (target.kind === "idolprof") {
    return {
      imageUrl: normalizeIdolprofImageUrl(
        extractOgImage(html, target.landingUrl)
      ),
      landingUrl: target.landingUrl,
    };
  }

  return {
    imageUrl: extractFirstMatch(html, target.landingUrl, target.patterns),
    landingUrl: target.landingUrl,
  };
}

function shouldConvertPng(sourceUrl, contentType) {
  return (
    contentType.includes("image/png") ||
    /\.png(?:$|\?)/iu.test(sourceUrl)
  );
}

async function downloadImage(sourceUrl, outputPath) {
  const response = await fetch(sourceUrl, {
    headers: {
      "user-agent": USER_AGENT,
      "accept-language": "ja,en-US;q=0.9,en;q=0.8",
      referer: sourceUrl,
    },
  });

  if (!response.ok) {
    throw new Error(`Image request failed (${response.status}) for ${sourceUrl}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const arrayBuffer = await response.arrayBuffer();

  if (
    contentType.includes("image/jpeg") ||
    /\.jpe?g(?:$|\?)/iu.test(sourceUrl)
  ) {
    await fs.writeFile(outputPath, Buffer.from(arrayBuffer));
    return;
  }

  if (shouldConvertPng(sourceUrl, contentType)) {
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
  const pattern = /^\s{2}((?:"(?:\\.|[^"\\])*")|[^:]+):\s+"([^"]+)",$/gmu;

  for (const match of block.matchAll(pattern)) {
    const key = match[1].trim();
    const parsedKey = key.startsWith('"') ? JSON.parse(key) : key;
    entries.set(normalizeImagePathKey(parsedKey), match[2]);
  }

  return entries;
}

function normalizeImagePathKey(key) {
  let normalized = key.trim();

  for (let index = 0; index < 4; index += 1) {
    if (!normalized.startsWith('"') || !normalized.endsWith('"')) {
      break;
    }

    try {
      const parsed = JSON.parse(normalized);

      if (typeof parsed !== "string" || parsed === normalized) {
        break;
      }

      normalized = parsed;
    } catch {
      break;
    }
  }

  return normalized;
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

async function flushReplacements(replacements) {
  if (replacements.size === 0) {
    return;
  }

  await updateSourceProfiles(replacements);
  await updateFetchSourceProfiles(replacements);
}

async function main() {
  await fs.mkdir(IMAGES_DIR, { recursive: true });

  const onlyNames = await loadOnlyNames();
  const configuredTargets = TARGETS.filter(
    (target) => onlyNames.size === 0 || onlyNames.has(target.name)
  );
  const configuredTargetNames = new Set(
    configuredTargets.map((target) => target.name)
  );
  const autoIdolprofTargets = [];

  if (process.env.AUTO_IDOLPROF_EXACT === "1" && onlyNames.size > 0) {
    for (const name of onlyNames) {
      if (configuredTargetNames.has(name)) {
        continue;
      }

      let landingUrl = null;

      try {
        landingUrl = await resolveIdolprofLandingUrl(name);
      } catch (error) {
        console.warn(`${name} -> idolprof search failed`);
        console.warn(error);
        continue;
      }

      if (!landingUrl) {
        continue;
      }

      autoIdolprofTargets.push({
        name,
        kind: "idolprof",
        landingUrl,
      });
    }
  }

  const targets = [...configuredTargets, ...autoIdolprofTargets];
  const refreshExisting = process.env.REFRESH_EXISTING === "1";
  const replacements = new Map();
  const failures = [];

  for (const target of targets) {
    const imagePath = `/images/${makeFilename(target.name)}.jpg`;
    const outputPath = path.join(IMAGES_DIR, path.basename(imagePath));

    try {
      try {
        await fs.access(outputPath);
        if (!refreshExisting) {
          replacements.set(target.name, imagePath);
          console.log(`${target.name} -> cached`);
          continue;
        }
      } catch {
        // Download when the local file is not present yet.
      }

      const resolved = await resolveTarget(target);
      await downloadImage(resolved.imageUrl, outputPath);
      replacements.set(target.name, imagePath);
      console.log(`${target.name} -> ${resolved.imageUrl}`);
      await sleep(300);
    } catch (error) {
      failures.push({
        name: target.name,
        reason: error instanceof Error ? error.message : String(error),
      });
      console.warn(`${target.name} -> failed`);
      console.warn(error);
    }
  }

  await flushReplacements(replacements);

  if (failures.length > 0) {
    console.error("Failures:");
    console.error(JSON.stringify(failures, null, 2));
    process.exitCode = 1;
    return;
  }

  console.log(`Updated ${replacements.size} ranking display images.`);
}

await main();
