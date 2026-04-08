import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

const THROTTLE_MS = Number(process.env.THROTTLE_MS ?? 700);
const USER_AGENT = "body-type-analyzer/1.0 (licensed image fetcher)";
const OPENVERSE_PAGE_SIZE = 10;
const OPENVERSE_LICENSES = "by,by-sa,cc0,pdm";
const execFileAsync = promisify(execFile);
const AMBIGUOUS_LATIN_NAMES = new Set([
  "AKLO",
  "DABO",
  "HIRO",
  "IKKO",
  "KURO",
  "TERU",
  "YAMATO",
]);
const BLOCKED_TITLE_PATTERNS = [
  /(^|\\s)#/u,
  /\b(costume|club|concert|campaign|billboard|advertisement|hotel|station|castle|train|book|work of)\b/i,
  /(?:ポスター|看板|広告|扇子|うちわ|衣装|コスチューム|キャンペーン|焼肉店|燒肉店|店|温泉|海|駅|城)/u,
];
const BLOCKED_TAG_PATTERNS = [
  /\b(instagram|ifttt|advertisement|billboard|costume|poster|cosplay)\b/i,
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
const IMAGE_CREDITS_PATH = path.join(
  process.cwd(),
  "public",
  "data",
  "image-credits.json"
);
const IMAGES_DIR = path.join(process.cwd(), "public", "images");

const SEARCH_OVERRIDES = {
  "KAƵMA / 池田一真": ["KAƵMA", "池田一真"],
  "Nissy / 西島隆弘": ["Nissy", "西島隆弘"],
  "ryuchell / りゅうちぇる": ["ryuchell", "りゅうちぇる"],
  "DJ 松永": ["DJ 松永", "DJ松永"],
  "BOSS THE MC": ["BOSS THE MC"],
  "Mummy-D": ["Mummy-D", "マミーD"],
  "DJ JIN": ["DJ JIN"],
  YOSHIKI: ["YOSHIKI"],
  GACKT: ["GACKT"],
  HEATH: ["HEATH"],
  JIRO: ["JIRO"],
  ILMARI: ["ILMARI"],
  IKKO: ["IKKO"],
  HIRO: ["HIRO"],
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
    return title.trim().localeCompare(variant, undefined, { sensitivity: "accent" }) === 0;
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

function tagMatchesVariantExactly(tag, variant) {
  if (!variant) {
    return false;
  }

  if (hasLatin(variant)) {
    return matchesWholeLatinWord(tag, variant);
  }

  return normalizeText(tag) === normalizeText(variant);
}

function hasBlockedMetadata(title, tagNames) {
  if (BLOCKED_TITLE_PATTERNS.some((pattern) => pattern.test(title))) {
    return true;
  }

  return tagNames.some((tag) =>
    BLOCKED_TAG_PATTERNS.some((pattern) => pattern.test(tag))
  );
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
  const overrides = SEARCH_OVERRIDES[name] ?? [];

  return unique([
    name.trim(),
    parenthetical,
    ...slashParts,
    ...parentheticalSlashParts,
    ...overrides,
  ]);
}

function buildQueries(name) {
  const variants = buildNameVariants(name);
  const latinVariants = variants.filter(hasLatin);

  return unique([...variants, ...latinVariants.map((value) => value.trim())]);
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
    return `ov_${asciiStem}_${hash}`;
  }

  const hexStem = Buffer.from(normalized).toString("hex").slice(0, 12);
  return `ov_${hexStem}_${hash}`;
}

function buildOpenverseUrl(query) {
  const url = new URL("https://api.openverse.org/v1/images/");
  url.searchParams.set("q", query);
  url.searchParams.set("license", OPENVERSE_LICENSES);
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("page_size", String(OPENVERSE_PAGE_SIZE));
  return url.toString();
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
      },
    });
  } catch (error) {
    if (attempt < 2) {
      await sleep((attempt + 1) * 1500);
      return throttledFetch(url, attempt + 1);
    }

    throw error;
  }

  nextRequestAt = Date.now() + THROTTLE_MS;

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

function getResultScore(name, result, nameVariants) {
  const title = String(result.title ?? "");
  const tagNames = (result.tags ?? []).map((tag) => String(tag.name ?? ""));

  if (result.source === "wikimedia" || result.provider === "wikimedia") {
    return Number.NEGATIVE_INFINITY;
  }

  if (!result.url || !result.license || !result.license_url) {
    return Number.NEGATIVE_INFINITY;
  }

  if (hasBlockedMetadata(title, tagNames)) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 0;
  let hasExactTitle = false;
  let hasStartsTitle = false;
  let hasExactTag = false;

  for (const variant of nameVariants) {
    if (!variant) {
      continue;
    }

    if (titleMatchesVariantExactly(title, variant)) {
      score += 180;
      hasExactTitle = true;
    } else if (titleStartsWithVariant(title, variant)) {
      score += 110;
      hasStartsTitle = true;
    }

    if (tagNames.some((tag) => tagMatchesVariantExactly(tag, variant))) {
      score += 90;
      hasExactTag = true;
    }
  }

  if (!hasExactTitle && !(hasStartsTitle && hasExactTag)) {
    return Number.NEGATIVE_INFINITY;
  }

  if (AMBIGUOUS_LATIN_NAMES.has(name) && !hasExactTag) {
    return Number.NEGATIVE_INFINITY;
  }

  if (result.source === "flickr") {
    score += 20;
  }

  if ((result.height ?? 0) >= 400 && (result.width ?? 0) >= 300) {
    score += 10;
  }

  if ((result.height ?? 0) > (result.width ?? 0)) {
    score += 10;
  }
  return score;
}

async function resolveOpenverseImage(name) {
  const queries = buildQueries(name);
  const variants = buildNameVariants(name);
  const collected = new Map();

  for (const query of queries) {
    const response = await throttledFetch(buildOpenverseUrl(query));
    const payload = await response.json();

    for (const result of payload.results ?? []) {
      if (!result.id || collected.has(result.id)) {
        continue;
      }

      collected.set(result.id, result);
    }
  }

  const scored = [...collected.values()]
    .map((result) => ({
      result,
      score: getResultScore(name, result, variants),
    }))
    .filter((entry) => entry.score >= 180)
    .sort((left, right) => right.score - left.score);

  return scored[0]?.result ?? null;
}

function shouldConvertPng(sourceUrl) {
  const lower = sourceUrl.toLowerCase();
  return !lower.includes("logo") && !lower.includes(".svg.png");
}

function escapePowerShellString(value) {
  return value.replace(/'/g, "''");
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

async function loadProfiles() {
  const moduleUrl = `${pathToFileURL(SOURCE_PROFILES_PATH).href}?t=${Date.now()}`;
  return import(moduleUrl);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

async function readExistingCredits() {
  try {
    const raw = await fs.readFile(IMAGE_CREDITS_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function updateImageCredits(creditsByName) {
  const currentCredits = await readExistingCredits();
  const merged = new Map(currentCredits.map((entry) => [entry.name, entry]));

  for (const [name, credit] of creditsByName.entries()) {
    merged.set(name, credit);
  }

  const nextCredits = [...merged.values()].sort((left, right) =>
    left.name.localeCompare(right.name, "ja")
  );

  await fs.writeFile(IMAGE_CREDITS_PATH, `${JSON.stringify(nextCredits, null, 2)}\n`);
}

async function main() {
  const { femaleProfilePool, maleProfilePool } = await loadProfiles();

  await fs.mkdir(IMAGES_DIR, { recursive: true });

  const onlyNames = new Set(
    (process.env.ONLY_NAMES ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );
  const targets = [...femaleProfilePool, ...maleProfilePool]
    .filter((entry) => entry.image.startsWith("https://ui-avatars.com/"))
    .filter((entry) => onlyNames.size === 0 || onlyNames.has(entry.name));
  const replacements = new Map();
  const credits = new Map();
  const failures = [];

  for (const target of targets) {
    const outputPath = path.join(IMAGES_DIR, `${makeFilename(target.name)}.jpg`);

    try {
      const resolved = await resolveOpenverseImage(target.name);

      if (!resolved) {
        failures.push({ name: target.name, reason: "no-image-found" });
        console.warn(`No Openverse image found for ${target.name}`);
        continue;
      }

      await downloadImage(resolved.url, outputPath);

      const imagePath = `/images/${path.basename(outputPath)}`;
      replacements.set(target.name, imagePath);
      credits.set(target.name, {
        name: target.name,
        image: imagePath,
        title: resolved.title ?? target.name,
        creator: resolved.creator ?? null,
        creatorUrl: resolved.creator_url ?? null,
        source: resolved.source ?? "openverse",
        provider: resolved.provider ?? "openverse",
        license: resolved.license ?? "",
        licenseVersion: resolved.license_version ?? "",
        licenseUrl: resolved.license_url ?? "",
        foreignLandingUrl: resolved.foreign_landing_url ?? "",
        attribution: resolved.attribution ?? "",
      });

      console.log(`${target.name} -> ${resolved.source}:${resolved.title}`);
    } catch (error) {
      failures.push({
        name: target.name,
        reason: error instanceof Error ? error.message : String(error),
      });
      console.warn(`Failed for ${target.name}: ${failures.at(-1)?.reason}`);
    }
  }

  if (replacements.size > 0) {
    await updateSourceProfiles(replacements);
    await updateFetchSourceProfiles(replacements);
    await updateImageCredits(credits);
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
