import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

const THROTTLE_MS = Number(process.env.THROTTLE_MS ?? 1200);
const TARGET_LIMIT = Number(process.env.LIMIT ?? 0);
const FLUSH_EVERY = Number(process.env.FLUSH_EVERY ?? 25);
const USER_AGENT = "body-type-analyzer/1.0 (local task automation)";
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

const SEARCH_OVERRIDES = {
  "Nissy / 西島隆弘": {
    jaTitles: ["Nissy", "西島隆弘"],
    jaSearch: ["Nissy", "西島隆弘"],
    enSearch: ["Nissy", "Takahiro Nishijima"],
  },
  SHIHO: {
    jaTitles: ["SHIHO (ファッションモデル)", "SHIHO"],
    enTitles: ["Shiho Yano"],
  },
  "ryuchell / りゅうちぇる": {
    jaTitles: ["りゅうちぇる", "ryuchell"],
    jaSearch: ["りゅうちぇる", "ryuchell"],
    enSearch: ["Ryuchell"],
  },
  "インリン・オブ・ジョイトイ": {
    jaTitles: ["インリン", "インリン・オブ・ジョイトイ"],
    enTitles: ["Yinling of Joytoy"],
  },
  "KAƵMA / 池田一真": {
    jaTitles: ["KAƵMA", "池田一真"],
    jaSearch: ["KAƵMA", "池田一真"],
  },
  "BOSS THE MC": {
    jaSearch: ["BOSS THE MC", "THA BLUE HERB BOSS"],
  },
  "DJ JIN": {
    jaSearch: ["DJ JIN", "RHYMESTER DJ JIN"],
  },
  "DJ 松永": {
    jaSearch: ["DJ松永", "DJ 松永"],
    enSearch: ["DJ Matsunaga"],
  },
  GACKT: {
    jaTitles: ["GACKT"],
    jaSearch: ["GACKT"],
  },
  HEATH: {
    jaSearch: ["HEATH X JAPAN", "HEATH"],
  },
  HIRO: {
    jaSearch: ["HIRO EXILE", "HIRO"],
  },
  IKKO: {
    jaTitles: ["IKKO"],
    jaSearch: ["IKKO"],
  },
  JIRO: {
    jaSearch: ["JIRO GLAY", "JIRO"],
  },
  "佐藤健": {
    jaTitles: ["佐藤健 (俳優)", "佐藤健"],
  },
  KURO: {
    jaSearch: ["KURO HOME MADE 家族", "KURO"],
  },
  "Mummy-D": {
    jaSearch: ["Mummy-D", "マミーD"],
  },
  TERU: {
    jaSearch: ["TERU GLAY", "TERU"],
  },
  "吉沢亮": {
    jaTitles: ["吉沢亮"],
  },
  "松坂桃李": {
    jaTitles: ["松坂桃李"],
  },
  "筧美和子": {
    jaTitles: ["筧美和子"],
  },
  tofubeats: {
    jaSearch: ["tofubeats"],
  },
  "西島秀俊": {
    jaTitles: ["西島秀俊"],
  },
  YAMATO: {
    jaSearch: ["ORANGE RANGE YAMATO", "YAMATO ORANGE RANGE"],
  },
  YOSHIKI: {
    jaSearch: ["YOSHIKI"],
  },
  ZAZY: {
    jaSearch: ["ZAZY"],
  },
};

let nextRequestAt = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function hasLatin(value) {
  return /[A-Za-z]/.test(value);
}

function normalizeText(value) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]+/gu, "");
}

function matchesWholeLatinWord(text, value) {
  return new RegExp(
    `(^|[^A-Za-z0-9])${escapeRegex(value)}([^A-Za-z0-9]|$)`,
    "i"
  ).test(text);
}

function titleMatchesVariantExactly(title, variant) {
  if (!variant) {
    return false;
  }

  if (hasLatin(variant)) {
    return title.trim().localeCompare(variant, undefined, {
      sensitivity: "accent",
    }) === 0;
  }

  return normalizeText(title) === normalizeText(variant);
}

function titleStartsWithVariant(title, variant) {
  if (!variant) {
    return false;
  }

  if (hasLatin(variant)) {
    return new RegExp(`^${escapeRegex(variant)}([^A-Za-z0-9]|$)`, "i").test(
      title.trim()
    );
  }

  return normalizeText(title).startsWith(normalizeText(variant));
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapePowerShellString(value) {
  return value.replace(/'/g, "''");
}

function buildSummaryUrl(language, title) {
  return `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
    title
  )}`;
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

function getSummarySource(payload) {
  const candidates = [payload?.thumbnail?.source, payload?.originalimage?.source];
  return candidates.find((source) => isUsableImageSource(source)) ?? null;
}

function shouldConvertPng(sourceUrl) {
  const lower = sourceUrl.toLowerCase();
  return !lower.includes("logo") && !lower.includes(".svg.png");
}

function isUsableImageSource(sourceUrl) {
  if (!sourceUrl || typeof sourceUrl !== "string") {
    return false;
  }

  const lower = sourceUrl.toLowerCase();

  return !(
    lower.includes(".svg.png") ||
    lower.includes("logo") ||
    lower.includes("flag_of_") ||
    lower.includes("replace_this_image") ||
    lower.includes("gthumb")
  );
}

async function throttledFetch(url, attempt = 0) {
  const waitMs = nextRequestAt - Date.now();

  if (waitMs > 0) {
    await sleep(waitMs);
  }

  let response;

  try {
    response = await fetch(url, {
      headers: {
        "user-agent": USER_AGENT,
        "api-user-agent": USER_AGENT,
      },
    });
  } catch (error) {
    if (attempt < 2) {
      await sleep((attempt + 1) * 2000);
      return throttledFetch(url, attempt + 1);
    }

    throw error;
  }

  nextRequestAt = Date.now() + THROTTLE_MS;

  if (response.status === 404) {
    return response;
  }

  if (response.status === 429 && attempt < 2) {
    const retryAfterSeconds = Number(response.headers.get("retry-after") ?? "3");
    await sleep(retryAfterSeconds * 1000);
    return throttledFetch(url, attempt + 1);
  }

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${url}`);
  }

  return response;
}

async function lookupByTitles(language, titles) {
  for (const title of titles) {
    const response = await throttledFetch(buildSummaryUrl(language, title));

    if (response.status === 404) {
      continue;
    }

    const payload = await response.json();
    const source = getSummarySource(payload);

    if (source) {
      return { source, locator: `${language}:title:${title}` };
    }
  }

  return null;
}

function getSearchSource(payload, variants) {
  const pages = payload?.query?.pages ?? [];

  const scored = pages
    .map((page) => {
      const source = page?.thumbnail?.source ?? null;
      const title = String(page?.title ?? "");

      if (!isUsableImageSource(source)) {
        return null;
      }

      let score = 0;

      for (const variant of variants) {
        if (titleMatchesVariantExactly(title, variant)) {
          score = Math.max(score, 3);
        } else if (titleStartsWithVariant(title, variant)) {
          score = Math.max(score, 2);
        } else if (
          !hasLatin(variant) &&
          normalizeText(title).includes(normalizeText(variant))
        ) {
          score = Math.max(score, 1);
        } else if (hasLatin(variant) && matchesWholeLatinWord(title, variant)) {
          score = Math.max(score, 1);
        }
      }

      if (score === 0) {
        return null;
      }

      return { score, source, title };
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score);

  return scored[0] ?? null;
}

async function lookupBySearch(language, queries, variants) {
  for (const query of queries) {
    const response = await throttledFetch(buildSearchUrl(language, query));
    const payload = await response.json();
    const result = getSearchSource(payload, variants);

    if (result) {
      return { source: result.source, locator: `${language}:search:${query}` };
    }
  }

  return null;
}

function stripParenthetical(value) {
  return value
    .replace(/\([^)]*\)/g, " ")
    .replace(/（[^）]*）/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .trim();
}

function buildNameVariants(name) {
  const slashParts = name
    .split(/\s*[\/／]\s*/u)
    .map((value) => value.trim())
    .filter(Boolean);
  const parenthetical = stripParenthetical(name);
  const parentheticalSlashParts = parenthetical
    .split(/\s*[\/／]\s*/u)
    .map((value) => value.trim())
    .filter(Boolean);

  return unique([
    name.trim(),
    parenthetical,
    ...slashParts,
    ...parentheticalSlashParts,
  ]).map((value) => value.replace(/\s+/g, " ").trim());
}

function buildSearchQueries(name, gender) {
  const variants = buildNameVariants(name);
  const hints =
    gender === "female"
      ? ["女優", "モデル", "タレント", "グラビア"]
      : ["俳優", "歌手", "タレント", "ラッパー"];

  const queries = [...variants];

  for (const variant of variants) {
    for (const hint of hints) {
      queries.push(`${variant} ${hint}`);
    }
  }

  return unique(queries);
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

function shouldRefreshExistingImage(imagePath) {
  return (
    process.env.REFRESH_EXISTING === "1" && imagePath.startsWith("/images/jp_")
  );
}

function buildTarget(name, gender) {
  const overrides = SEARCH_OVERRIDES[name] ?? {};
  const variants = buildNameVariants(name);
  const englishVariants = variants.filter(hasLatin);

  return {
    name,
    filename: makeFilename(name),
    jaTitles: unique([...(overrides.jaTitles ?? []), ...variants]),
    jaSearch: unique([...(overrides.jaSearch ?? []), ...buildSearchQueries(name, gender)]),
    enTitles: unique([...(overrides.enTitles ?? []), ...englishVariants]),
    enSearch: unique([
      ...(overrides.enSearch ?? []),
      ...englishVariants,
      ...englishVariants.map((variant) =>
        gender === "female" ? `${variant} model` : `${variant} actor`
      ),
    ]),
  };
}

async function loadProfiles() {
  const moduleUrl = `${pathToFileURL(SOURCE_PROFILES_PATH).href}?t=${Date.now()}`;
  return import(moduleUrl);
}

async function resolveImageSource(target) {
  const jaTitles = target.jaTitles ?? [target.name];
  const jaSearch = target.jaSearch ?? [target.name];
  const enTitles = target.enTitles ?? [];
  const enSearch = target.enSearch ?? enTitles;
  const jaVariants = unique([...jaTitles, ...jaSearch]);
  const enVariants = unique([...enTitles, ...enSearch]);

  return (
    (await lookupByTitles("ja", jaTitles)) ??
    (await lookupBySearch("ja", jaSearch, jaVariants)) ??
    (enTitles.length > 0 ? await lookupByTitles("en", enTitles) : null) ??
    (enSearch.length > 0 ? await lookupBySearch("en", enSearch, enVariants) : null)
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

async function flushReplacements(replacements) {
  if (replacements.size === 0) {
    return;
  }

  await updateSourceProfiles(replacements);
  await updateFetchSourceProfiles(replacements);
}

async function main() {
  const { femaleProfilePool, maleProfilePool } = await loadProfiles();

  await fs.mkdir(IMAGES_DIR, { recursive: true });

  const femaleTargets = femaleProfilePool
    .filter(
      (entry) =>
        entry.image.startsWith("https://ui-avatars.com/") ||
        shouldRefreshExistingImage(entry.image)
    )
    .map((entry) => buildTarget(entry.name, "female"));
  const maleTargets = maleProfilePool
    .filter(
      (entry) =>
        entry.image.startsWith("https://ui-avatars.com/") ||
        shouldRefreshExistingImage(entry.image)
    )
    .map((entry) => buildTarget(entry.name, "male"));
  const onlyNames = new Set(
    (process.env.ONLY_NAMES ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
  const targets = [...femaleTargets, ...maleTargets].filter(
    (target) => onlyNames.size === 0 || onlyNames.has(target.name)
  );
  const limitedTargets =
    TARGET_LIMIT > 0 ? targets.slice(0, TARGET_LIMIT) : targets;
  const replacements = new Map();
  const failures = [];
  let downloadedCount = 0;
  let reusedCount = 0;

  for (const target of limitedTargets) {
    const outputPath = path.join(IMAGES_DIR, `${target.filename}.jpg`);
    const imagePath = `/images/${target.filename}.jpg`;

    try {
      try {
        await fs.access(outputPath);
        replacements.set(target.name, imagePath);
        reusedCount += 1;

        if (replacements.size % FLUSH_EVERY === 0) {
          await flushReplacements(replacements);
        }

        console.log(`${target.name} -> cached`);
        continue;
      } catch {
        // Download the image when the cached file does not exist yet.
      }

      const resolved = await resolveImageSource(target);

      if (!resolved) {
        failures.push({ name: target.name, reason: "no-image-found" });
        console.warn(`No Wikipedia image found for ${target.name}`);
        continue;
      }

      await downloadImage(resolved.source, outputPath);
      replacements.set(target.name, imagePath);
      downloadedCount += 1;

      if (replacements.size % FLUSH_EVERY === 0) {
        await flushReplacements(replacements);
      }

      console.log(`${target.name} -> ${resolved.locator}`);
    } catch (error) {
      failures.push({
        name: target.name,
        reason: error instanceof Error ? error.message : String(error),
      });
      console.warn(`Failed for ${target.name}: ${failures.at(-1)?.reason}`);
    }
  }

  await flushReplacements(replacements);

  console.log(
    JSON.stringify(
      {
        requested: limitedTargets.length,
        totalTargets: targets.length,
        updated: replacements.size,
        downloaded: downloadedCount,
        reused: reusedCount,
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
