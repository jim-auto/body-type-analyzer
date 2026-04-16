import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const API_ID = "cKLxQzpehtWUh0bpBvTZ";
const AFFILIATE_ID = "joyusexy-990";
const HITS_PER_PAGE = 100;
const SOURCE_PROFILES_PATH = path.join(process.cwd(), "lib", "source-profiles.ts");
const TRAINING_DATA_PATH = path.join(
  process.cwd(),
  "local-data",
  "training-profiles.json",
);
const TRAINING_IMAGES_DIR = path.join(
  process.cwd(),
  "local-data",
  "training-images",
);
const CUP_ORDER = Array.from({ length: 26 }, (_, index) =>
  String.fromCharCode("A".charCodeAt(0) + index),
);
const USER_AGENT = "body-type-analyzer/1.0";
const MINNANO_AV_PLACEHOLDER_PATTERN = /np\.gif|min-ogp\.png|header_logo\.png/i;

function parseArgs(argv) {
  const options = {
    minCup: "I",
    limit: null,
    includeFemalePool: false,
    onlyNamesFile: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--min-cup") {
      options.minCup = argv[index + 1] ?? options.minCup;
      index += 1;
      continue;
    }

    if (arg === "--limit") {
      const rawLimit = Number(argv[index + 1] ?? "");
      options.limit = Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : null;
      index += 1;
      continue;
    }

    if (arg === "--include-female-pool") {
      options.includeFemalePool = true;
      continue;
    }

    if (arg === "--only-names-file") {
      options.onlyNamesFile = argv[index + 1] ?? options.onlyNamesFile;
      index += 1;
    }
  }

  return options;
}

async function loadOnlyNames(filePath) {
  if (!filePath) {
    return new Set();
  }

  const raw = await fs.readFile(path.resolve(process.cwd(), filePath), "utf8");
  return new Set(
    raw
      .split(/\r?\n/gu)
      .map((name) => name.trim())
      .filter(Boolean),
  );
}

function normalizeCup(cup) {
  if (typeof cup !== "string") {
    return null;
  }

  const normalized = cup.trim().toUpperCase();
  return /^[A-Z]$/u.test(normalized) ? normalized : null;
}

function getCupIndex(cup) {
  const normalized = normalizeCup(cup);
  return normalized ? normalized.charCodeAt(0) - "A".charCodeAt(0) : null;
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sanitizeImageUrl(url) {
  if (typeof url !== "string" || !url) {
    return "";
  }

  return url.replace(/^http:\/\//u, "https://");
}

function makeImageFilename(name, imageUrl) {
  const asciiStem = name
    .trim()
    .normalize("NFKC")
    .replace(/[^\x00-\x7F]+/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const digest = createHash("sha1").update(name, "utf8").digest("hex").slice(0, 8);
  const ext = path.extname(new URL(imageUrl).pathname) || ".jpg";
  const stem = asciiStem || `jp_${Buffer.from(name, "utf8").toString("hex").slice(0, 12)}`;

  return `dmm_training_${stem}_${digest}${ext}`;
}

function toTrainingProfile(actress, imagePath, imageResolution, options) {
  const actualHeight = parseNumber(actress.height);
  const bust = parseNumber(actress.bust);
  const cup = normalizeCup(actress.cup);
  const remoteImageUrl = sanitizeImageUrl(imageResolution.remoteImageUrl);
  const sourceUrl = imageResolution.sourceUrl || actress.listURL?.digital || "";
  const includeFemalePool = Boolean(options?.includeFemalePool);
  let source = imageResolution.source;

  if (includeFemalePool && imageResolution.source === "dmm") {
    source = "dmm-public-thumb";
  } else if (actualHeight === null && imageResolution.source === "dmm") {
    source = "dmm-cup-only";
  }

  if (
    !actress.name ||
    bust === null ||
    cup === null ||
    !remoteImageUrl ||
    !imagePath
  ) {
    return null;
  }

  return {
    name: actress.name,
    imagePath,
    actualHeight,
    bust,
    cup,
    displayCup: cup,
    source,
    sourceUrl,
    remoteImageUrl,
    scrapedHeight: null,
    scrapedBust: null,
    scrapedWaist: null,
    scrapedHip: null,
    useForHeight: actualHeight !== null && source === "dmm-public-thumb",
    useForCup: true,
    useForSimilarity: false,
    waist: null,
    hip: null,
  };
}

function getDirectDmmImageUrl(actress) {
  const imageUrl = actress.imageURL;

  if (!imageUrl || typeof imageUrl !== "object") {
    return "";
  }

  for (const key of ["large", "small", "list", "thumbnail"]) {
    const value = sanitizeImageUrl(imageUrl[key]);

    if (value) {
      return value;
    }
  }

  return "";
}

async function resolveFanzaSearchImage(actress) {
  const actressId = String(actress.id ?? "").trim();

  if (!actressId) {
    return null;
  }

  const remoteImageUrl = `https://fanza-search.com/img/actress/${actressId}.jpg`;
  const response = await fetch(remoteImageUrl, {
    method: "HEAD",
    headers: {
      "user-agent": USER_AGENT,
    },
  });

  if (!response.ok || !String(response.headers.get("content-type") ?? "").startsWith("image/")) {
    return null;
  }

  return {
    remoteImageUrl,
    source: "dmm-fanza-search",
    sourceUrl: `https://fanza-search.com/actress/${actressId}`,
  };
}

async function resolveMinnanoAvImage(actress) {
  if (!actress.name) {
    return null;
  }

  const searchUrl = new URL("https://www.minnano-av.com/search_result.php");
  searchUrl.searchParams.set("search_scope", "actress");
  searchUrl.searchParams.set("search_word", actress.name);

  const response = await fetch(searchUrl, {
    headers: {
      "user-agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    return null;
  }

  const html = await response.text();
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] ?? "";
  const remoteImageUrl =
    html.match(/property="og:image" content="([^"]+)"/i)?.[1]?.trim() ?? "";

  if (
    !/\/actress\d+\.html/i.test(canonical) ||
    !remoteImageUrl ||
    MINNANO_AV_PLACEHOLDER_PATTERN.test(remoteImageUrl)
  ) {
    return null;
  }

  return {
    remoteImageUrl,
    source: "dmm-minnano-av",
    sourceUrl: canonical,
  };
}

async function resolveImageSource(actress) {
  const directDmmImageUrl = getDirectDmmImageUrl(actress);

  if (directDmmImageUrl) {
    return {
      remoteImageUrl: directDmmImageUrl,
      source: "dmm",
      sourceUrl: actress.listURL?.digital ?? "",
    };
  }

  return (
    (await resolveFanzaSearchImage(actress)) ??
    (await resolveMinnanoAvImage(actress))
  );
}

async function loadJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function loadFemalePoolNames() {
  const moduleUrl = `${pathToFileURL(SOURCE_PROFILES_PATH).href}?t=${Date.now()}`;
  const { femaleProfilePool } = await import(moduleUrl);
  return new Set(femaleProfilePool.map((profile) => profile.name));
}

async function fetchActressPage(offset) {
  const url = new URL("https://api.dmm.com/affiliate/v3/ActressSearch");
  url.searchParams.set("api_id", API_ID);
  url.searchParams.set("affiliate_id", AFFILIATE_ID);
  url.searchParams.set("output", "json");
  url.searchParams.set("hits", String(HITS_PER_PAGE));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("sort", "-bust");

  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`DMM ActressSearch failed: HTTP ${response.status}`);
  }

  const payload = await response.json();
  return payload.result?.actress ?? [];
}

async function downloadImage(imageUrl, absolutePath) {
  try {
    await fs.access(absolutePath);
    return false;
  } catch {
    // Continue to download.
  }

  const response = await fetch(imageUrl, {
    headers: {
      "user-agent": USER_AGENT,
      referer: "https://www.dmm.co.jp/",
    },
  });

  if (!response.ok) {
    throw new Error(`Image download failed: HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(absolutePath, buffer);
  return true;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const minCupIndex = getCupIndex(options.minCup);

  if (minCupIndex === null) {
    throw new Error(`Invalid --min-cup: ${options.minCup}`);
  }

  const trainingRecords = await loadJson(TRAINING_DATA_PATH, []);
  const onlyNames = await loadOnlyNames(options.onlyNamesFile);
  const femalePoolNames = await loadFemalePoolNames();
  const existingTrainingNames = new Set(
    trainingRecords
      .filter((record) => typeof record?.name === "string" && record.name)
      .map((record) => record.name),
  );
  const skippedNames = new Set([
    ...(options.includeFemalePool ? [] : [...femalePoolNames]),
    ...existingTrainingNames,
  ]);
  const candidates = [];
  const candidateNames = new Set();

  for (let offset = 1; ; offset += HITS_PER_PAGE) {
    const actresses = await fetchActressPage(offset);

    if (actresses.length === 0) {
      break;
    }

    for (const actress of actresses) {
      const cup = normalizeCup(actress.cup);

      if (!cup || getCupIndex(cup) < minCupIndex) {
        continue;
      }

      if (onlyNames.size > 0 && !onlyNames.has(actress.name)) {
        continue;
      }

      if (
        !actress.name ||
        skippedNames.has(actress.name) ||
        candidateNames.has(actress.name)
      ) {
        continue;
      }

      candidates.push(actress);
      candidateNames.add(actress.name);

      if (options.limit && candidates.length >= options.limit) {
        break;
      }
    }

    if (options.limit && candidates.length >= options.limit) {
      break;
    }
  }

  await fs.mkdir(TRAINING_IMAGES_DIR, { recursive: true });

  const nextRecords = [...trainingRecords];
  const addedCounts = Object.fromEntries(CUP_ORDER.map((cup) => [cup, 0]));
  let downloadedCount = 0;
  let addedWithoutHeight = 0;
  const failures = [];

  for (const actress of candidates) {
    try {
      const imageResolution = await resolveImageSource(actress);

      if (!imageResolution?.remoteImageUrl) {
        failures.push({
          name: actress.name,
          error: "No fallback image source",
        });
        continue;
      }

      const remoteImageUrl = sanitizeImageUrl(imageResolution.remoteImageUrl);
      const filename = makeImageFilename(actress.name, remoteImageUrl);
      const absoluteImagePath = path.join(TRAINING_IMAGES_DIR, filename);
      const relativeImagePath = path
        .join("local-data", "training-images", filename)
        .replace(/\\/gu, "/");
      const didDownload = await downloadImage(remoteImageUrl, absoluteImagePath);
      const record = toTrainingProfile(
        actress,
        relativeImagePath,
        imageResolution,
        options,
      );

      if (!record) {
        continue;
      }

      nextRecords.push(record);
      addedCounts[record.cup] += 1;
      if (record.actualHeight === null) {
        addedWithoutHeight += 1;
      }

      if (didDownload) {
        downloadedCount += 1;
      }
    } catch (error) {
      failures.push({
        name: actress.name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await fs.writeFile(
    TRAINING_DATA_PATH,
    `${JSON.stringify(nextRecords, null, 2)}\n`,
    "utf8",
  );

  const addedSummary = Object.fromEntries(
    Object.entries(addedCounts).filter(([, count]) => count > 0),
  );
  const unresolvedOnlyNames =
    onlyNames.size === 0
      ? []
      : [...onlyNames].filter(
          (name) =>
            !candidateNames.has(name) &&
            !existingTrainingNames.has(name) &&
            !(
              !options.includeFemalePool &&
              femalePoolNames.has(name)
            ),
        );

  console.log(
    JSON.stringify(
      {
        minCup: normalizeCup(options.minCup),
        requestedLimit: options.limit,
        addedProfiles: nextRecords.length - trainingRecords.length,
        downloadedImages: downloadedCount,
        addedWithoutHeight,
        addedByCup: addedSummary,
        requestedOnlyNames: onlyNames.size,
        unresolvedOnlyNames,
        failed: failures.length,
        failures,
      },
      null,
      2,
    ),
  );
}

await main();
