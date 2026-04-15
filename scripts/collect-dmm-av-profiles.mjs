import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const API_ID = "cKLxQzpehtWUh0bpBvTZ";
const AFFILIATE_ID = "joyusexy-990";
const HITS_PER_PAGE = 100;
const SOURCE_PROFILES_PATH = path.join(
  process.cwd(),
  "lib",
  "source-profiles.ts"
);
const PROFILE_COVERAGE_PATH = path.join(
  process.cwd(),
  "public",
  "data",
  "profile-coverage.json"
);
const OUTPUT_PATH = path.join(process.cwd(), "data", "dmm-av-profiles.json");

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeCup(cup) {
  if (typeof cup !== "string") {
    return null;
  }

  const normalized = cup.trim().toUpperCase();

  if (!normalized) {
    return null;
  }

  if (/^[A-G]$/.test(normalized)) {
    return normalized;
  }

  return "H";
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

function toProfile(actress) {
  const actualHeight = parseNumber(actress.height);
  const bust = parseNumber(actress.bust);
  const cup = normalizeCup(actress.cup);
  const remoteImageUrl = sanitizeImageUrl(actress.imageURL?.large);
  const sourceUrl = actress.listURL?.digital ?? "";

  if (
    !actress.name ||
    actualHeight === null ||
    bust === null ||
    cup === null ||
    !remoteImageUrl
  ) {
    return null;
  }

  return {
    name: actress.name,
    actualHeight,
    bust,
    cup,
    remoteImageUrl,
    sourceUrl,
  };
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
      "user-agent": "body-type-analyzer/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`DMM ActressSearch failed: HTTP ${response.status}`);
  }

  const payload = await response.json();
  return payload.result?.actress ?? [];
}

async function loadFemaleProfileNames() {
  const moduleUrl = `${pathToFileURL(SOURCE_PROFILES_PATH).href}?t=${Date.now()}`;
  const { femaleProfilePool } = await import(moduleUrl);
  return new Set(femaleProfilePool.map((profile) => profile.name));
}

async function main() {
  const targetAvTotal = Number(process.argv[2] ?? 500);
  const existingPayload = readJsonIfExists(OUTPUT_PATH);
  const existingProfiles = Array.isArray(existingPayload?.profiles)
    ? existingPayload.profiles
    : [];
  const currentCoverage = readJsonIfExists(PROFILE_COVERAGE_PATH)?.female;
  const currentAvCount =
    currentCoverage?.occupations?.find((entry) => entry.occupation === "av")?.count ?? 0;
  const baseAvCount =
    currentAvCount > existingProfiles.length
      ? currentAvCount - existingProfiles.length
      : currentAvCount;
  const targetGeneratedCount = Math.max(targetAvTotal - baseAvCount, 0);
  const currentPoolNames = await loadFemaleProfileNames();
  const retainedProfiles = existingProfiles
    .filter(
      (profile) =>
        profile?.name &&
        Number.isFinite(profile.actualHeight) &&
        profile.actualHeight > 0 &&
        Number.isFinite(profile.bust) &&
        profile.bust > 0 &&
        profile?.cup &&
        profile?.remoteImageUrl
    )
    .slice(0, targetGeneratedCount);
  const retainedNames = new Set(retainedProfiles.map((profile) => profile.name));

  for (const name of retainedNames) {
    currentPoolNames.delete(name);
  }

  const results = [...retainedProfiles];
  let offset = 1;

  while (results.length < targetGeneratedCount) {
    const actresses = await fetchActressPage(offset);

    if (actresses.length === 0) {
      break;
    }

    for (const actress of actresses) {
      const profile = toProfile(actress);

      if (!profile) {
        continue;
      }

      if (currentPoolNames.has(profile.name) || retainedNames.has(profile.name)) {
        continue;
      }

      results.push(profile);
      retainedNames.add(profile.name);

      if (results.length >= targetGeneratedCount) {
        break;
      }
    }

    offset += HITS_PER_PAGE;
  }

  if (results.length < targetGeneratedCount) {
    throw new Error(
      `Collected ${results.length} DMM AV profiles, but ${targetGeneratedCount} were required`
    );
  }

  const output = {
    generatedAt: new Date().toISOString(),
    source: "DMM ActressSearch",
    targetAvTotal,
    baseAvCount,
    profiles: results,
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        targetAvTotal,
        baseAvCount,
        generatedProfiles: results.length,
        outputPath: OUTPUT_PATH,
      },
      null,
      2
    )
  );
}

await main();
