import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import iconv from "iconv-lite";

const USER_AGENT = "body-type-analyzer/1.0 (local training fetcher)";
const THROTTLE_MS = Number(process.env.THROTTLE_MS ?? 400);
const ORICON_BASE_URL = "https://www.oricon.co.jp";
const ORICON_NO_IMAGE_PATH = "/pc/img/_parts/common/ph-noimage03.png";

const LOCAL_DATA_DIR = path.join(process.cwd(), "local-data");
const LOCAL_IMAGES_DIR = path.join(LOCAL_DATA_DIR, "training-images");
const LOCAL_PROFILES_PATH = path.join(LOCAL_DATA_DIR, "training-profiles.json");
const SOURCE_PROFILES_PATH = path.join(process.cwd(), "lib", "source-profiles.ts");

let nextRequestAt = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
    .trim();
}

function normalizeName(value) {
  return value.normalize("NFKC").replace(/[\s\u3000・･.．\-‐―ｰ]/g, "").toLowerCase();
}

function slugify(value) {
  const normalized = value.normalize("NFKC");
  const asciiStem = normalized
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const hash = createHash("sha1").update(normalized).digest("hex").slice(0, 8);

  return asciiStem ? `local_${asciiStem}_${hash}` : `local_${hash}`;
}

async function loadProfilePools() {
  const moduleUrl = `${pathToFileURL(SOURCE_PROFILES_PATH).href}?t=${Date.now()}`;
  const { femaleProfilePool, maleProfilePool } = await import(moduleUrl);
  const onlyNames = new Set(
    (process.env.ONLY_NAMES ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
  );

  return {
    femaleTargets: femaleProfilePool.filter(
      (entry) =>
        (onlyNames.size === 0 || onlyNames.has(entry.name)) &&
        entry.image.startsWith("https://ui-avatars.com/") &&
        entry.cup
    ),
    sourceNames: new Set(
      [...femaleProfilePool, ...maleProfilePool].map((entry) => entry.name)
    ),
  };
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

async function fetchText(url, encoding = "utf-8") {
  const response = await throttledFetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());

  return new TextDecoder(encoding).decode(buffer);
}

async function fetchBuffer(url) {
  const response = await throttledFetch(url);

  return {
    contentType: response.headers.get("content-type") ?? "image/jpeg",
    buffer: Buffer.from(await response.arrayBuffer()),
  };
}

function buildTalentDatabankSearchUrl(name) {
  const url = new URL("https://www.talent-databank.co.jp/search/result");
  url.searchParams.set("talent_name", name);
  url.searchParams.append("gender[]", "1");
  return url.toString();
}

function encodeShiftJisQuery(value) {
  return [...iconv.encode(value, "shift_jis")]
    .map((byte) => `%${byte.toString(16).toUpperCase().padStart(2, "0")}`)
    .join("");
}

function buildOriconArtistSearchUrl(name) {
  return `${ORICON_BASE_URL}/search/result.php?types=artist&search_string=${encodeShiftJisQuery(
    name
  )}`;
}

function parseTalentDatabankResults(html) {
  const results = [];
  const pattern =
    /<li class="item[\s\S]*?<a href="([^"]*\/search\/profile\/\d+)"[\s\S]*?<img src="([^"]+)"[\s\S]*?<p class="name">([\s\S]*?)<\/p>/g;
  let match = pattern.exec(html);

  while (match) {
    results.push({
      profileUrl: decodeHtml(match[1]),
      imageUrl: decodeHtml(match[2]),
      name: decodeHtml(match[3]),
    });
    match = pattern.exec(html);
  }

  return results;
}

function parseOriconArtistResults(html) {
  const results = [];
  const pattern =
    /<li class="card">[\s\S]*?<a href="([^"]+)" class="inner">[\s\S]*?<img src="([^"]+)"[^>]*>[\s\S]*?<p class="jsc-three-line-text card-name">([\s\S]*?)<\/p>/g;
  let match = pattern.exec(html);

  while (match) {
    results.push({
      profileUrl: new URL(match[1], ORICON_BASE_URL).toString(),
      imageUrl: new URL(match[2], ORICON_BASE_URL).toString(),
      name: decodeHtml(match[3]),
    });
    match = pattern.exec(html);
  }

  return results;
}

function isOriconPlaceholderImage(imageUrl) {
  return imageUrl.includes(ORICON_NO_IMAGE_PATH);
}

function parseTalentDatabankStats(html) {
  const sizeBlock = html.match(
    /<dt class="head">(?:サイズ|身長・サイズ)<\/dt>[\s\S]*?<dd class="cont">([\s\S]*?)<\/dd>/
  )?.[1];

  if (!sizeBlock) {
    return null;
  }

  const text = decodeHtml(sizeBlock);

  return {
    bust: Number(text.match(/B:\s*(\d+(?:\.\d+)?)/)?.[1] ?? NaN),
    waist: Number(text.match(/W:\s*(\d+(?:\.\d+)?)/)?.[1] ?? NaN),
    hip: Number(text.match(/H:\s*(\d+(?:\.\d+)?)/)?.[1] ?? NaN),
    height: Number(text.match(/(?:身長|Height):\s*(\d+(?:\.\d+)?)/)?.[1] ?? NaN),
  };
}

async function readExistingProfiles() {
  try {
    const content = await fs.readFile(LOCAL_PROFILES_PATH, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function resolveTalentDatabankProfile(target) {
  const searchHtml = await fetchText(buildTalentDatabankSearchUrl(target.name));
  const result = parseTalentDatabankResults(searchHtml).find(
    (entry) => normalizeName(entry.name) === normalizeName(target.name)
  );

  if (!result) {
    return null;
  }

  const profileHtml = await fetchText(result.profileUrl);

  return {
    source: "talent-databank",
    profileUrl: result.profileUrl,
    imageUrl: result.imageUrl,
    stats: parseTalentDatabankStats(profileHtml),
  };
}

async function resolveOriconProfile(target) {
  const searchHtml = await fetchText(buildOriconArtistSearchUrl(target.name), "shift_jis");
  const result = parseOriconArtistResults(searchHtml).find(
    (entry) =>
      normalizeName(entry.name) === normalizeName(target.name) &&
      !isOriconPlaceholderImage(entry.imageUrl)
  );

  if (!result) {
    return null;
  }

  return {
    source: "oricon",
    profileUrl: result.profileUrl,
    imageUrl: result.imageUrl,
    stats: null,
  };
}

function toStoredRecord(target, resolved, localImagePath) {
  return {
    name: target.name,
    imagePath: localImagePath.replace(/\\/g, "/"),
    actualHeight: target.actualHeight,
    bust: target.bust,
    cup: target.cup,
    source: resolved.source,
    sourceUrl: resolved.profileUrl,
    remoteImageUrl: resolved.imageUrl,
    scrapedHeight: Number.isFinite(resolved.stats?.height) ? resolved.stats.height : null,
    scrapedBust: Number.isFinite(resolved.stats?.bust) ? resolved.stats.bust : null,
    scrapedWaist: Number.isFinite(resolved.stats?.waist) ? resolved.stats.waist : null,
    scrapedHip: Number.isFinite(resolved.stats?.hip) ? resolved.stats.hip : null,
  };
}

async function main() {
  const { femaleTargets: targets, sourceNames } = await loadProfilePools();
  const existingProfiles = (await readExistingProfiles()).filter((entry) =>
    sourceNames.has(entry.name)
  );
  const existingByName = new Map(existingProfiles.map((entry) => [entry.name, entry]));

  await fs.mkdir(LOCAL_IMAGES_DIR, { recursive: true });

  const failures = [];
  const additions = [];

  for (const target of targets) {
    try {
      const resolved =
        (await resolveTalentDatabankProfile(target)) ?? (await resolveOriconProfile(target));

      if (!resolved) {
        failures.push({ name: target.name, reason: "no-exact-match" });
        continue;
      }

      const { buffer, contentType } = await fetchBuffer(resolved.imageUrl);
      const extension = contentType.includes("png") ? "png" : "jpg";
      const localImagePath = path.join(
        "local-data",
        "training-images",
        `${slugify(`${resolved.source}_${target.name}`)}.${extension}`
      );

      await fs.writeFile(path.join(process.cwd(), localImagePath), buffer);

      const record = toStoredRecord(target, resolved, localImagePath);
      existingByName.set(target.name, record);
      additions.push({
        name: target.name,
        profileUrl: resolved.profileUrl,
        imagePath: record.imagePath,
        source: resolved.source,
      });
      console.log(`${target.name} -> ${record.imagePath} (${resolved.source})`);
    } catch (error) {
      failures.push({
        name: target.name,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const mergedProfiles = [...existingByName.values()].sort((left, right) =>
    left.name.localeCompare(right.name, "ja")
  );

  await fs.mkdir(LOCAL_DATA_DIR, { recursive: true });
  await fs.writeFile(
    LOCAL_PROFILES_PATH,
    `${JSON.stringify(mergedProfiles, null, 2)}\n`,
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        requested: targets.length,
        stored: additions.length,
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
