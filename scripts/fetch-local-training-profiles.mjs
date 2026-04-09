import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import iconv from "iconv-lite";

const USER_AGENT = "body-type-analyzer/1.0 (local training fetcher)";
const THROTTLE_MS = Number(process.env.THROTTLE_MS ?? 400);
const FETCH_TIMEOUT_MS = Number(process.env.FETCH_TIMEOUT_MS ?? 15000);
const ORICON_BASE_URL = "https://www.oricon.co.jp";
const ORICON_NO_IMAGE_PATH = "/pc/img/_parts/common/ph-noimage03.png";
const IDOLPROF_API_URL = "https://idolprof.com/wp-json/wp/v2/yada_wiki";
const WIKIPEDIA_API_URL = "https://ja.wikipedia.org/w/api.php";
const WIKIPEDIA_SUMMARY_API = "https://ja.wikipedia.org/api/rest_v1/page/summary";
const WIKIPEDIA_PERSON_HINTS = [
  "日本の",
  "女性",
  "女優",
  "モデル",
  "タレント",
  "アイドル",
  "グラビア",
  "歌手",
  "レースクイーン",
  "インフルエンサー",
  "YouTuber",
];
const EXTERNAL_LINK_BLOCKLIST = [
  "amazon.",
  "amazon-adsystem",
  "rakuten.",
  "hb.afl.",
  "dmm.com",
  "hatena.ne.jp/keyword",
  "miss-flash.jp/vote",
];
const IMG_SRC_BLOCKLIST = [
  "logo",
  "icon",
  "banner",
  "line.gif",
  "pdf.gif",
  "no-image",
  "name_",
  "spacer",
];
const IDOLPROF_PAGE_IMAGE_BLOCKLIST = [
  "amazon-adsystem",
  "rakuten.",
  "hb.afl.",
  "line.gif",
  "logo",
  "banner",
  "no-image",
  "site-icon",
  "favicon",
];

const LOCAL_DATA_DIR = path.join(process.cwd(), "local-data");
const LOCAL_IMAGES_DIR = path.join(LOCAL_DATA_DIR, "training-images");
const LOCAL_PROFILES_PATH = path.join(LOCAL_DATA_DIR, "training-profiles.json");
const SOURCE_PROFILES_PATH = path.join(process.cwd(), "lib", "source-profiles.ts");
const BROAD_POOL = process.env.BROAD_POOL === "1";
const MAX_BROAD_NEW = Number(process.env.MAX_BROAD_NEW ?? 120);
const IDOLPROF_CUPS = ["A", "B", "C", "D", "E", "F", "G", "H"];

let nextRequestAt = 0;
const idolprofCupCandidateCache = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeHtml(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16))
    )
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

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), FETCH_TIMEOUT_MS);

  let response;

  try {
    response = await fetch(url, {
      headers: {
        "user-agent": USER_AGENT,
      },
      signal: abortController.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

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

async function fetchJson(url) {
  const response = await throttledFetch(url);
  return response.json();
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

function stripParenthetical(value) {
  return value.replace(/\([^)]*\)/g, " ").replace(/（[^）]*）/g, " ").trim();
}

function buildOriconArtistSearchUrl(name) {
  return `${ORICON_BASE_URL}/search/result.php?types=artist&search_string=${encodeShiftJisQuery(
    name
  )}`;
}

function buildWikipediaSearchUrl(query) {
  const url = new URL(WIKIPEDIA_API_URL);
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  url.searchParams.set("generator", "search");
  url.searchParams.set("redirects", "1");
  url.searchParams.set("gsrlimit", "5");
  url.searchParams.set("prop", "pageimages|extracts|info");
  url.searchParams.set("piprop", "thumbnail|original");
  url.searchParams.set("pithumbsize", "800");
  url.searchParams.set("inprop", "url");
  url.searchParams.set("exintro", "1");
  url.searchParams.set("explaintext", "1");
  url.searchParams.set("exchars", "280");
  url.searchParams.set("gsrsearch", query);
  return url.toString();
}

function buildWikipediaSummaryUrl(title) {
  return `${WIKIPEDIA_SUMMARY_API}/${encodeURIComponent(title)}`;
}

function buildIdolprofLookupUrl(name) {
  const url = new URL(IDOLPROF_API_URL);
  url.searchParams.set("search", name);
  url.searchParams.set("per_page", "10");
  return url.toString();
}

function buildWikipediaQueries(name) {
  const variants = [
    name,
    stripParenthetical(name),
  ].filter(Boolean);
  const queries = [];

  for (const variant of variants) {
    queries.push(variant);
    queries.push(`"${variant}"`);
    queries.push(`"${variant}" モデル`);
    queries.push(`"${variant}" タレント`);
    queries.push(`"${variant}" グラビア`);
    queries.push(`"${variant}" 女優`);
  }

  return [...new Set(queries)];
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

function getWikipediaImageUrl(page) {
  return page?.original?.source ?? page?.thumbnail?.source ?? null;
}

function getWikipediaSummaryImageUrl(payload) {
  return payload?.originalimage?.source ?? payload?.thumbnail?.source ?? null;
}

function countWikipediaHints(text) {
  return WIKIPEDIA_PERSON_HINTS.filter((hint) => text.includes(hint)).length;
}

function scoreWikipediaCandidate(target, page) {
  const targetName = normalizeName(stripParenthetical(target.name));
  const titleName = normalizeName(stripParenthetical(page.title ?? ""));
  const extract = String(page.extract ?? "");
  const imageUrl = getWikipediaImageUrl(page);
  const hasParentheticalTitle = /[()（）]/u.test(page.title ?? "");
  const hintCount = countWikipediaHints(extract);

  if (!targetName || !titleName || !imageUrl) {
    return -1;
  }

  let titleScore = -1;

  if (titleName === targetName) {
    titleScore = 6;
  } else if (titleName.startsWith(targetName) || targetName.startsWith(titleName)) {
    titleScore = 4;
  }

  if (titleScore < 0) {
    return -1;
  }

  if (!hasParentheticalTitle && hintCount === 0) {
    return -1;
  }

  return titleScore + hintCount;
}

function decodeHtmlDocument(buffer, contentType) {
  const normalizedType = (contentType ?? "").toLowerCase();
  const fallbackText = buffer.toString("utf8");
  const declaredEncoding =
    /charset=([^;]+)/i.exec(normalizedType)?.[1]?.trim().toLowerCase() ??
    (fallbackText.match(/charset=["']?([^"'>\s]+)/i)?.[1]?.trim().toLowerCase() ??
      "utf-8");

  if (declaredEncoding.includes("shift_jis") || declaredEncoding.includes("shift-jis")) {
    return iconv.decode(buffer, "shift_jis");
  }

  return new TextDecoder("utf-8").decode(buffer);
}

async function fetchHtml(url) {
  const response = await throttledFetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") ?? "";
  return decodeHtmlDocument(buffer, contentType);
}

function normalizeLink(url) {
  const decoded = decodeHtml(url).replace(/^\/\//, "https://");
  const matches = decoded.match(/https?:\/\/[^\s"'<>]+/gu);
  return matches ?? [];
}

function normalizeIdolprofUrl(url) {
  return decodeHtml(url)
    .replace(/^\/\//, "https://")
    .replace(/^http:\/\/idolprof\.com\//u, "https://idolprof.com/")
    .replace(/^https?:\/\/idolprof\.xsrv\.jp\//u, "https://idolprof.com/");
}

function extractAnchorLinks(html) {
  return [...html.matchAll(/<a[^>]+href="([^"]+)"/giu)]
    .flatMap((match) => normalizeLink(match[1]));
}

function extractTextLinks(text) {
  return [...String(text).matchAll(/https?:\/\/[^\s<>"']+/giu)]
    .flatMap((match) => normalizeLink(match[0]));
}

function isBlockedExternalLink(url) {
  return EXTERNAL_LINK_BLOCKLIST.some((pattern) => url.includes(pattern));
}

function buildRelevantText(html) {
  const title =
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/iu)?.[1] ??
    html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/iu)?.[1] ??
    html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/iu)?.[1] ??
    "";
  const description =
    html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/iu)?.[1] ??
    html.match(/<meta[^>]+content="([^"]+)"[^>]+name="description"/iu)?.[1] ??
    "";

  return normalizeName(`${decodeHtml(title)} ${decodeHtml(description)}`);
}

function extractMetaImageUrl(html) {
  const imageUrl =
    html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/iu)?.[1] ??
    html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/iu)?.[1] ??
    html.match(/<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"/iu)?.[1] ??
    html.match(/<meta[^>]+content="([^"]+)"[^>]+name="twitter:image"/iu)?.[1] ??
    null;

  return imageUrl ? decodeHtml(imageUrl).replace(/^\/\//, "https://") : null;
}

function normalizeImageCandidate(url, baseUrl) {
  const normalized = decodeHtml(url).replace(/^\/\//, "https://");

  try {
    return new URL(normalized, baseUrl).toString();
  } catch {
    return null;
  }
}

function extractInlineImageUrl(html, pageUrl) {
  const candidates = [...html.matchAll(/<img[^>]+src="([^"]+)"/giu)]
    .map((match) => normalizeImageCandidate(match[1], pageUrl))
    .filter(Boolean)
    .filter((url) => !IMG_SRC_BLOCKLIST.some((pattern) => url.includes(pattern)))
    .filter((url) => /\.(?:jpe?g|png|webp)(?:[?#].*)?$/iu.test(url));

  return candidates[0] ?? null;
}

function extractIdolprofPageImageUrl(html, pageUrl) {
  const candidates = [
    extractMetaImageUrl(html),
    ...[...html.matchAll(/<img[^>]+src="([^"]+)"/giu)].map((match) => match[1]),
  ]
    .map((candidate) => normalizeImageCandidate(candidate, pageUrl))
    .filter(Boolean)
    .map((candidate) => normalizeIdolprofUrl(candidate))
    .filter(
      (candidate) =>
        !IDOLPROF_PAGE_IMAGE_BLOCKLIST.some((pattern) => candidate.includes(pattern))
    )
    .filter((candidate) => /\.(?:jpe?g|png|webp)(?:[?#].*)?$/iu.test(candidate))
    .filter((candidate) => candidate.includes("/wp-content/uploads/"));

  return candidates[0] ?? null;
}

async function resolveWikipediaProfileFromUrl(url) {
  const pageTitle = decodeURIComponent(new URL(url).pathname.replace(/^\/wiki\//u, ""));

  if (!pageTitle) {
    return null;
  }

  const payload = await fetchJson(buildWikipediaSummaryUrl(pageTitle));
  const imageUrl = getWikipediaSummaryImageUrl(payload);

  if (!imageUrl) {
    return null;
  }

  return {
    source: "wikipedia",
    profileUrl: url,
    imageUrl,
    stats: null,
  };
}

async function resolveIdolprofProfilePage(target, pageUrl, stats = null) {
  const html = await fetchHtml(pageUrl);
  const idolprofImageUrl = extractIdolprofPageImageUrl(html, pageUrl);

  if (idolprofImageUrl) {
    return {
      source: "idolprof",
      profileUrl: pageUrl,
      imageUrl: idolprofImageUrl,
      stats,
    };
  }

  const links = [
    ...new Set([...extractAnchorLinks(html), ...extractTextLinks(html)]),
  ]
    .filter((url) => !url.startsWith("https://idolprof.com/wiki/"))
    .filter((url) => !isBlockedExternalLink(url));

  for (const link of links) {
    try {
      if (link.startsWith("https://ja.wikipedia.org/wiki/")) {
        const wikipediaProfile = await resolveWikipediaProfileFromUrl(link);

        if (wikipediaProfile) {
          return wikipediaProfile;
        }

        continue;
      }

      const externalProfile = await resolveExternalLinkedProfile(target, link);

      if (externalProfile) {
        return externalProfile;
      }
    } catch {
      // Ignore broken fallbacks and continue to the next candidate link.
    }
  }

  return null;
}

async function resolveExternalLinkedProfile(target, url) {
  const html = await fetchHtml(url);
  const relevantText = buildRelevantText(html);
  const targetName = normalizeName(stripParenthetical(target.name));
  const hostname = new URL(url).hostname.replace(/^www\./u, "");
  const imageUrl = extractMetaImageUrl(html) ?? extractInlineImageUrl(html, url);

  if (!imageUrl || imageUrl.includes("no-image")) {
    return null;
  }

  if (hostname === "instagram.com") {
    return {
      source: hostname,
      profileUrl: url,
      imageUrl,
      stats: null,
    };
  }

  if (!relevantText.includes(targetName)) {
    return null;
  }

  return {
    source: hostname,
    profileUrl: url,
    imageUrl,
    stats: null,
  };
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

async function resolveWikipediaProfile(target) {
  for (const query of buildWikipediaQueries(target.name)) {
    const payload = await fetchJson(buildWikipediaSearchUrl(query));
    const pages = payload?.query?.pages ?? [];
    const bestMatch = pages
      .map((page) => ({
        page,
        score: scoreWikipediaCandidate(target, page),
      }))
      .filter((candidate) => candidate.score >= 6)
      .sort(
        (left, right) =>
          right.score - left.score ||
          (left.page.index ?? Number.MAX_SAFE_INTEGER) -
            (right.page.index ?? Number.MAX_SAFE_INTEGER)
      )[0];

    if (!bestMatch) {
      continue;
    }

    return {
      source: "wikipedia",
      profileUrl:
        bestMatch.page.fullurl ??
        `https://ja.wikipedia.org/?curid=${bestMatch.page.pageid}`,
      imageUrl: getWikipediaImageUrl(bestMatch.page),
      stats: null,
    };
  }

  return null;
}

async function resolveIdolprofProfile(target) {
  if (target.cup) {
    const cupCandidates = await getIdolprofCupCandidatesExact(target.cup);
    const cupCandidate = cupCandidates.find(
      (entry) => normalizeName(entry.name) === normalizeName(target.name)
    );

    if (cupCandidate?.profileUrl) {
      const exactProfile = await resolveIdolprofProfilePage(
        target,
        cupCandidate.profileUrl
      );

      if (exactProfile) {
        return exactProfile;
      }
    }
  }

  const pages = await fetchJson(buildIdolprofLookupUrl(target.name));
  const page = pages.find(
    (entry) => normalizeName(entry?.title?.rendered ?? "") === normalizeName(target.name)
  );

  if (page?.link) {
    const exactProfile = await resolveIdolprofProfilePage(
      target,
      normalizeIdolprofUrl(page.link)
    );

    if (exactProfile) {
      return exactProfile;
    }
  }

  if (!page?.content?.rendered) {
    return null;
  }

  return resolveIdolprofProfilePage(
    target,
    page.link
      ? normalizeIdolprofUrl(page.link)
      : `https://idolprof.com/wiki/${encodeURIComponent(target.name)}/`
  );
}

async function fetchIdolprofPage(title) {
  const pages = await fetchJson(buildIdolprofLookupUrl(title));

  return (
    pages.find(
      (entry) => normalizeName(entry?.title?.rendered ?? "") === normalizeName(title)
    ) ?? null
  );
}

function parseIdolprofCategoryCandidates(renderedContent) {
  const candidates = [];

  for (const [, rowHtml] of renderedContent.matchAll(/<tr>([\s\S]*?)<\/tr>/giu)) {
    const linkMatch = rowHtml.match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/iu);
    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/giu)].map((match) =>
      decodeHtml(match[1])
    );

    if (!linkMatch || cells.length < 8) {
      continue;
    }

    const name = decodeHtml(linkMatch[2]);
    const actualHeight = Number(cells[2]);
    const bust = Number(cells[4]);
    const waist = Number(cells[5]);
    const hip = Number(cells[6]);
    const cup = cells[7]?.trim().toUpperCase();

    if (!name || !Number.isFinite(actualHeight) || !Number.isFinite(bust) || !cup) {
      continue;
    }

    if (!/^[A-H]$/u.test(cup)) {
      continue;
    }

    candidates.push({
      name,
      profileUrl: normalizeIdolprofUrl(linkMatch[1]),
      actualHeight,
      bust,
      waist: Number.isFinite(waist) ? waist : null,
      hip: Number.isFinite(hip) ? hip : null,
      cup,
    });
  }

  return candidates;
}

async function getIdolprofCupCandidates(cup) {
  if (idolprofCupCandidateCache.has(cup)) {
    return idolprofCupCandidateCache.get(cup);
  }

  const categoryPage = await fetchIdolprofPage(`${cup}カップ`);
  const candidates = categoryPage?.content?.rendered
    ? parseIdolprofCategoryCandidates(categoryPage.content.rendered)
    : [];

  idolprofCupCandidateCache.set(cup, candidates);
  return candidates;
}

async function getIdolprofCupCandidatesExact(cup) {
  if (idolprofCupCandidateCache.has(cup)) {
    return idolprofCupCandidateCache.get(cup);
  }

  const categoryPage = await fetchIdolprofPage(`${cup}\u30ab\u30c3\u30d7`);
  const candidates = categoryPage?.content?.rendered
    ? parseIdolprofCategoryCandidates(categoryPage.content.rendered)
    : [];

  idolprofCupCandidateCache.set(cup, candidates);
  return candidates;
}

function shouldUseResolvedRecordForHeight(source) {
  return source !== "instagram.com";
}

function shouldUseResolvedRecordForCup(source) {
  return source !== "oricon" && source !== "ja.wikipedia.org";
}

function shouldUseBroadRecordForTraining(source) {
  return shouldUseResolvedRecordForHeight(source);
}

function toStoredRecord(target, resolved, localImagePath, overrides = {}) {
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
    useForHeight: shouldUseResolvedRecordForHeight(resolved.source),
    useForCup: shouldUseResolvedRecordForCup(resolved.source),
    useForSimilarity: false,
    ...overrides,
  };
}

async function writeStoredProfiles(existingByName) {
  const mergedProfiles = [...existingByName.values()].sort((left, right) =>
    left.name.localeCompare(right.name, "ja")
  );

  await fs.mkdir(LOCAL_DATA_DIR, { recursive: true });
  await fs.writeFile(
    LOCAL_PROFILES_PATH,
    `${JSON.stringify(mergedProfiles, null, 2)}\n`,
    "utf8"
  );
}

async function collectBroadIdolprofPool(existingByName, additions, failures) {
  let addedCount = 0;

  for (const cup of IDOLPROF_CUPS) {
    if (addedCount >= MAX_BROAD_NEW) {
      break;
    }

    const categoryPage = await fetchIdolprofPage(`${cup}カップ`);

    if (!categoryPage?.content?.rendered) {
      continue;
    }

    const candidates = parseIdolprofCategoryCandidates(categoryPage.content.rendered);

    for (const candidate of candidates) {
      if (addedCount >= MAX_BROAD_NEW) {
        break;
      }

      if (existingByName.has(candidate.name)) {
        continue;
      }

      try {
        const resolved = await resolveIdolprofProfile(candidate);

        if (!resolved) {
          failures.push({ name: candidate.name, reason: "idolprof-broad-no-image" });
          continue;
        }

        const { buffer, contentType } = await fetchBuffer(resolved.imageUrl);
        const extension = contentType.includes("png") ? "png" : "jpg";
        const localImagePath = path.join(
          "local-data",
          "training-images",
          `${slugify(`broad_${resolved.source}_${candidate.name}`)}.${extension}`
        );

        await fs.writeFile(path.join(process.cwd(), localImagePath), buffer);

        const useForTraining = shouldUseBroadRecordForTraining(resolved.source);
        const record = toStoredRecord(candidate, resolved, localImagePath, {
          waist: candidate.waist,
          hip: candidate.hip,
          useForHeight: useForTraining,
          useForCup: useForTraining,
          useForSimilarity: false,
          source: `idolprof-${resolved.source}`,
        });

        existingByName.set(candidate.name, record);
        additions.push({
          name: candidate.name,
          profileUrl: resolved.profileUrl,
          imagePath: record.imagePath,
          source: record.source,
        });
        addedCount += 1;
        console.log(`${candidate.name} -> ${record.imagePath} (${record.source})`);
      } catch (error) {
        failures.push({
          name: candidate.name,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return addedCount;
}

async function collectBroadIdolprofPoolV2(existingByName, additions, failures) {
  let addedCount = 0;

  for (const cup of IDOLPROF_CUPS) {
    if (addedCount >= MAX_BROAD_NEW) {
      break;
    }

    let candidates = [];

    try {
      candidates = await getIdolprofCupCandidatesExact(cup);
    } catch (error) {
      failures.push({
        name: `${cup}カップ`,
        reason: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    for (const candidate of candidates) {
      if (addedCount >= MAX_BROAD_NEW) {
        break;
      }

      if (existingByName.has(candidate.name)) {
        continue;
      }

      try {
        const resolved = await resolveIdolprofProfilePage(
          candidate,
          candidate.profileUrl,
          candidate
        );

        if (!resolved) {
          failures.push({ name: candidate.name, reason: "idolprof-broad-no-image" });
          continue;
        }

        const { buffer, contentType } = await fetchBuffer(resolved.imageUrl);
        const extension = contentType.includes("png") ? "png" : "jpg";
        const localImagePath = path.join(
          "local-data",
          "training-images",
          `${slugify(`broad_${resolved.source}_${candidate.name}`)}.${extension}`
        );

        await fs.writeFile(path.join(process.cwd(), localImagePath), buffer);

        const useForTraining = shouldUseBroadRecordForTraining(resolved.source);
        const record = toStoredRecord(candidate, resolved, localImagePath, {
          waist: candidate.waist,
          hip: candidate.hip,
          useForHeight: useForTraining,
          useForCup: useForTraining,
          useForSimilarity: false,
          source: `idolprof-${resolved.source}`,
        });

        existingByName.set(candidate.name, record);
        additions.push({
          name: candidate.name,
          profileUrl: resolved.profileUrl,
          imagePath: record.imagePath,
          source: record.source,
        });
        await writeStoredProfiles(existingByName);
        addedCount += 1;
        console.log(`${candidate.name} -> ${record.imagePath} (${record.source})`);
      } catch (error) {
        failures.push({
          name: candidate.name,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return addedCount;
}

async function main() {
  const { femaleTargets: targets } = await loadProfilePools();
  const existingProfiles = (await readExistingProfiles()).map((entry) => ({
    ...entry,
    useForSimilarity: false,
  }));
  const existingByName = new Map(existingProfiles.map((entry) => [entry.name, entry]));

  await fs.mkdir(LOCAL_IMAGES_DIR, { recursive: true });

  const failures = [];
  const additions = [];

  for (const target of targets) {
    try {
      const resolved =
        (await resolveTalentDatabankProfile(target)) ??
        (await resolveOriconProfile(target)) ??
        (await resolveIdolprofProfile(target)) ??
        (await resolveWikipediaProfile(target));

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

  let broadAdded = 0;

  if (BROAD_POOL) {
    broadAdded = await collectBroadIdolprofPoolV2(
      existingByName,
      additions,
      failures
    );
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
        broadAdded,
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
