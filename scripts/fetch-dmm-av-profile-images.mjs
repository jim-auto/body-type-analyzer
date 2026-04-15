import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const DATA_PATH = path.join(process.cwd(), "data", "dmm-av-profiles.json");
const IMAGES_DIR = path.join(process.cwd(), "public", "images");
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
const CONCURRENCY = 8;

function makeFilename(name) {
  const asciiStem = name
    .trim()
    .normalize("NFKC")
    .replace(/[^\x00-\x7F]+/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const digest = createHash("sha1").update(name, "utf8").digest("hex").slice(0, 8);

  if (asciiStem) {
    return `${asciiStem}_${digest}`;
  }

  const hexStem = Buffer.from(name, "utf8").toString("hex").slice(0, 12);
  return `jp_${hexStem}_${digest}`;
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
  const startToken = "const IMAGE_PATHS = {";
  const startIndex = source.indexOf(startToken);

  if (startIndex < 0) {
    throw new Error("Could not locate IMAGE_PATHS in fetch-source-profiles.mjs");
  }

  const endIndex = source.indexOf("\n};", startIndex);

  if (endIndex < 0) {
    throw new Error("Could not locate IMAGE_PATHS terminator in fetch-source-profiles.mjs");
  }

  const block = source.slice(startIndex, endIndex + "\n};".length);
  const entries = parseImagePathEntries(block);

  for (const [name, imagePath] of replacements.entries()) {
    entries.set(name, imagePath);
  }

  const updated =
    source.slice(0, startIndex) +
    renderImagePaths(entries) +
    source.slice(endIndex + "\n};".length);
  await fs.writeFile(FETCH_SOURCE_PROFILES_PATH, updated, "utf8");
}

async function updateImageCredits(profiles, replacements) {
  const currentCredits = JSON.parse(await fs.readFile(IMAGE_CREDITS_PATH, "utf8"));
  const creditsByName = new Map(currentCredits.map((entry) => [entry.name, entry]));

  for (const profile of profiles) {
    const image = replacements.get(profile.name);

    if (!image) {
      continue;
    }

    creditsByName.set(profile.name, {
      name: profile.name,
      image,
      title: profile.name,
      creator: null,
      creatorUrl: null,
      source: profile.remoteImageUrl,
      provider: "dmm",
      license: "",
      licenseVersion: "",
      licenseUrl: "",
      foreignLandingUrl: profile.sourceUrl || profile.remoteImageUrl,
      attribution: "",
    });
  }

  const nextCredits = [...creditsByName.values()].sort((left, right) =>
    left.name.localeCompare(right.name, "ja")
  );
  await fs.writeFile(IMAGE_CREDITS_PATH, `${JSON.stringify(nextCredits, null, 2)}\n`);
}

async function downloadProfileImage(profile) {
  const filename = `${makeFilename(profile.name)}.jpg`;
  const absolutePath = path.join(IMAGES_DIR, filename);
  const imagePath = `/images/${filename}`;

  try {
    await fs.access(absolutePath);
    return { name: profile.name, imagePath, downloaded: false };
  } catch {
    // Continue to download.
  }

  const response = await fetch(profile.remoteImageUrl, {
    headers: {
      "user-agent": "body-type-analyzer/1.0",
      referer: "https://joyu.sexy/",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(absolutePath, buffer);

  return { name: profile.name, imagePath, downloaded: true };
}

async function mapWithConcurrency(items, limit, iteratee) {
  const results = [];
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await iteratee(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);
  return results;
}

async function main() {
  const payload = JSON.parse(await fs.readFile(DATA_PATH, "utf8"));
  const profiles = Array.isArray(payload?.profiles) ? payload.profiles : [];

  await fs.mkdir(IMAGES_DIR, { recursive: true });

  const results = await mapWithConcurrency(profiles, CONCURRENCY, async (profile) => {
    try {
      return await downloadProfileImage(profile);
    } catch (error) {
      return {
        name: profile.name,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  const replacements = new Map(
    results
      .filter((result) => result?.imagePath)
      .map((result) => [result.name, result.imagePath])
  );
  const downloaded = results.filter((result) => result?.downloaded).length;
  const failed = results.filter((result) => result?.error);

  await updateFetchSourceProfiles(replacements);
  await updateImageCredits(profiles, replacements);

  console.log(
    JSON.stringify(
      {
        requested: profiles.length,
        updated: replacements.size,
        downloaded,
        failed: failed.length,
        failures: failed,
      },
      null,
      2
    )
  );
}

await main();
