import fs from "node:fs";
import path from "node:path";

const { femaleProfilePool } = await import("../lib/source-profiles.ts");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const IDEALPROF_CUP_PAGE_SLUGS = [
  "a%E3%82%AB%E3%83%83%E3%83%97",
  "b%E3%82%AB%E3%83%83%E3%83%97",
  "c%E3%82%AB%E3%83%83%E3%83%97",
  "d%E3%82%AB%E3%83%83%E3%83%97",
  "e%E3%82%AB%E3%83%83%E3%83%97",
  "f%E3%82%AB%E3%83%83%E3%83%97",
  "g%E3%82%AB%E3%83%83%E3%83%97",
  "h%E3%82%AB%E3%83%83%E3%83%97",
];
const PROFILE_OCCUPATION_ORDER = [
  "gravure",
  "av",
  "actress",
  "model",
  "talent",
  "idol",
  "racequeen",
  "cosplayer",
  "announcer",
  "singer",
  "wrestler",
];
const PROFILE_OCCUPATION_LABELS = {
  gravure: "グラビア",
  av: "AV女優",
  actress: "女優",
  model: "モデル",
  talent: "タレント",
  idol: "アイドル",
  racequeen: "レースクイーン",
  cosplayer: "コスプレイヤー",
  announcer: "アナウンサー",
  singer: "歌手",
  wrestler: "プロレスラー",
};
const FEMALE_OCCUPATION_OVERRIDES = {
  Hitomi: ["av"],
  JULIA: ["av"],
  みひろ: ["av", "actress", "talent", "singer"],
  若菜奈央: ["av"],
  水谷ケイ: ["av", "actress", "talent"],
  成海うるみ: ["av"],
};
const GRAVURE_NOTE_PATTERN =
  /グラビア|ミスマガジン|ミスFLASH|ミスヤング|日テレジェニック|イメージガール|週刊プレイボーイ|ヤングジャンプ|ヤングマガジン|ミスアクション|ミス東スポ|週刊実話WJガールズ/;

const REPO_ROOT = process.cwd();
const OCCUPATIONS_OUTPUT_PATH = path.join(
  REPO_ROOT,
  "public",
  "data",
  "profile-occupations.json"
);
const COVERAGE_OUTPUT_PATH = path.join(
  REPO_ROOT,
  "public",
  "data",
  "profile-coverage.json"
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchText(url, { retries = 5 } = {}) {
  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }

      return await response.text();
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        await sleep(500 * attempt);
      }
    }
  }

  throw lastError;
}

async function fetchJson(url, options) {
  return JSON.parse(await fetchText(url, options));
}

function decodeHtml(value) {
  return value
    .replace(/&#(\d+);/g, (_, codePoint) =>
      String.fromCodePoint(Number(codePoint))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, codePoint) =>
      String.fromCodePoint(Number.parseInt(codePoint, 16))
    )
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripHtml(value) {
  return decodeHtml(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/[ \t\r\f\v]+/g, " ")
      .replace(/\n+/g, "\n")
  ).trim();
}

function normalizeName(name) {
  return name.normalize("NFKC").replace(/[\s\u3000\u200b]+/g, "").trim();
}

function getNameVariants(name) {
  const normalized = normalizeName(name);
  const variants = new Set(normalized ? [normalized] : []);
  const bracketPatterns = [
    ["（", "）"],
    ["(", ")"],
  ];

  for (const [open, close] of bracketPatterns) {
    const openIndex = name.indexOf(open);
    const closeIndex = name.indexOf(close, openIndex + open.length);

    if (openIndex < 0 || closeIndex < 0) {
      continue;
    }

    const base = name.slice(0, openIndex);
    const alias = name.slice(openIndex + open.length, closeIndex);

    for (const value of [base, alias, `${base}${alias}`]) {
      const candidate = normalizeName(value);

      if (candidate) {
        variants.add(candidate);
      }
    }
  }

  return variants;
}

function addToVariantMap(map, name, value) {
  for (const variant of getNameVariants(name)) {
    if (!map.has(variant)) {
      map.set(variant, value);
    }
  }
}

function extractWikipediaUrl(pageText) {
  const wikipediaIndex = pageText.indexOf("Wikipedia");

  if (wikipediaIndex < 0) {
    return null;
  }

  const urlMatch = pageText
    .slice(wikipediaIndex)
    .match(/https?:\/\/[^\s]+/i);

  if (!urlMatch) {
    return null;
  }

  const url = urlMatch[0].replace(/[)\]、。]+$/u, "");

  return url.includes("wikipedia.org") ? url : null;
}

function extractNoteText(pageText) {
  const match = pageText.match(/備考[:：]\s*(.*?)\s+Wikipedia[:：]/s);

  if (!match) {
    return "";
  }

  return match[1].trim();
}

function extractWikipediaTitle(wikipediaUrl) {
  if (!wikipediaUrl) {
    return null;
  }

  const parsed = new URL(wikipediaUrl);
  const titleParam = parsed.searchParams.get("title");

  if (titleParam) {
    return decodeURIComponent(titleParam).replace(/_/g, " ");
  }

  const wikiPathMatch = parsed.pathname.match(/\/wiki\/(.+)$/);

  if (!wikiPathMatch) {
    return null;
  }

  return decodeURIComponent(wikiPathMatch[1]).replace(/_/g, " ");
}

async function mapWithConcurrency(items, limit, iteratee) {
  const results = new Array(items.length);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      if (currentIndex >= items.length) {
        return;
      }

      results[currentIndex] = await iteratee(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(workers);

  return results;
}

async function buildFemaleProfilePageMap() {
  const pageUrlByName = new Map();
  const pageUrlByVariant = new Map();

  for (const slug of IDEALPROF_CUP_PAGE_SLUGS) {
    const pageData = await fetchJson(
      `https://idolprof.com/wp-json/wp/v2/yada_wiki?slug=${slug}`
    );
    const html = String(pageData[0]?.content?.rendered ?? "");

    for (const rowMatch of html.matchAll(/<tr>(.*?)<\/tr>/gs)) {
      const rowHtml = rowMatch[1];
      const nameMatch = rowHtml.match(
        /<td>\s*<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>\s*<\/td>/is
      );

      if (!nameMatch) {
        continue;
      }

      const profileUrl = decodeHtml(nameMatch[1]).trim();
      const name = stripHtml(nameMatch[2]);

      if (!name || !profileUrl) {
        continue;
      }

      if (!pageUrlByName.has(name)) {
        pageUrlByName.set(name, profileUrl);
      }

      addToVariantMap(pageUrlByVariant, name, profileUrl);
    }
  }

  return { pageUrlByName, pageUrlByVariant };
}

function resolveFemaleProfileUrl(name, pageMaps) {
  return (
    pageMaps.pageUrlByName.get(name) ??
    pageMaps.pageUrlByVariant.get(normalizeName(name)) ??
    null
  );
}

async function fetchIdolprofProfileDetail(profileUrl, cache) {
  if (cache.has(profileUrl)) {
    return cache.get(profileUrl);
  }

  const parsed = new URL(profileUrl);
  const slug = decodeURIComponent(
    parsed.pathname
      .split("/")
      .filter(Boolean)
      .at(-1) ?? ""
  );

  if (!slug) {
    const emptyDetail = { pageText: "", noteText: "", wikipediaUrl: null };
    cache.set(profileUrl, emptyDetail);
    return emptyDetail;
  }

  const pageData = await fetchJson(
    `https://idolprof.com/wp-json/wp/v2/yada_wiki?slug=${encodeURIComponent(slug)}`
  );
  const page = pageData[0];

  if (!page) {
    const emptyDetail = { pageText: "", noteText: "", wikipediaUrl: null };
    cache.set(profileUrl, emptyDetail);
    return emptyDetail;
  }

  const pageText = stripHtml(String(page.content?.rendered ?? ""));
  const detail = {
    pageText,
    noteText: extractNoteText(pageText),
    wikipediaUrl: extractWikipediaUrl(pageText),
  };

  cache.set(profileUrl, detail);

  return detail;
}

function chunk(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function buildWikipediaIntroMap(wikipediaUrls) {
  return buildWikipediaIntroMapFromEntries(
    wikipediaUrls.map((wikipediaUrl) => ({
      key: wikipediaUrl,
      host: new URL(wikipediaUrl).host,
      title: extractWikipediaTitle(wikipediaUrl),
    }))
  );
}

async function buildWikipediaIntroMapForNames(names, host = "ja.wikipedia.org") {
  return buildWikipediaIntroMapFromEntries(
    unique(names).map((name) => ({
      key: name,
      host,
      title: name,
    }))
  );
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

async function buildWikipediaIntroMapFromEntries(entries) {
  const introByUrl = new Map();
  const groupedByHost = new Map();

  for (const entry of entries) {
    if (!entry.title) {
      introByUrl.set(entry.key, "");
      continue;
    }

    const bucket = groupedByHost.get(entry.host) ?? [];
    bucket.push(entry);
    groupedByHost.set(entry.host, bucket);
  }

  for (const [host, entries] of groupedByHost) {
    const uniqueTitles = unique(entries.map((entry) => entry.title));
    const introByTitle = new Map();

    for (const titleChunk of chunk(uniqueTitles, 20)) {
      const apiUrl = new URL(`https://${host}/w/api.php`);
      apiUrl.searchParams.set("action", "query");
      apiUrl.searchParams.set("prop", "extracts");
      apiUrl.searchParams.set("exintro", "1");
      apiUrl.searchParams.set("explaintext", "1");
      apiUrl.searchParams.set("redirects", "1");
      apiUrl.searchParams.set("titles", titleChunk.join("|"));
      apiUrl.searchParams.set("format", "json");

      try {
        const data = await fetchJson(apiUrl.toString());

        for (const page of Object.values(data.query?.pages ?? {})) {
          if (typeof page?.title !== "string") {
            continue;
          }

          introByTitle.set(
            page.title,
            typeof page.extract === "string" ? page.extract.trim() : ""
          );
        }
      } catch {
        for (const title of titleChunk) {
          introByTitle.set(title, "");
        }
      }
    }

    for (const entry of entries) {
      introByUrl.set(entry.key, introByTitle.get(entry.title) ?? "");
    }
  }

  return introByUrl;
}

function detectOccupations({ pageText, noteText, wikipediaIntro }) {
  const strongText = [wikipediaIntro, noteText].filter(Boolean).join("\n");
  const tags = new Set();

  if (/(AV女優|セクシー女優|AVモデル|元AV女優|元セクシー女優)/.test(strongText)) {
    tags.add("av");
  }

  if (/(グラビアアイドル|元グラビアアイドル|グラビアモデル|着エロ|グラドル)/.test(strongText)) {
    tags.add("gravure");
  } else if (GRAVURE_NOTE_PATTERN.test(noteText)) {
    tags.add("gravure");
  }

  if (/(ファッションモデル|モデル)/.test(strongText)) {
    tags.add("model");
  }

  if (/(タレント)/.test(strongText)) {
    tags.add("talent");
  }

  if (/(アイドル(?!プロフィール)|アイドルグループ)/.test(strongText)) {
    tags.add("idol");
  }

  if (/(レースクイーン)/.test(strongText)) {
    tags.add("racequeen");
  }

  if (/(コスプレイヤー)/.test(strongText)) {
    tags.add("cosplayer");
  }

  if (/(アナウンサー|キャスター)/.test(strongText)) {
    tags.add("announcer");
  }

  if (/(歌手|シンガーソングライター|アーティスト|ミュージシャン)/.test(strongText)) {
    tags.add("singer");
  }

  if (/(プロレスラー)/.test(strongText)) {
    tags.add("wrestler");
  }

  const actingText = strongText.replace(
    /AV女優|セクシー女優|AVモデル|元AV女優|元セクシー女優/g,
    ""
  );

  if (/(女優|俳優)/.test(actingText) || /出演ドラマ|出演映画|出演舞台/.test(pageText)) {
    tags.add("actress");
  }

  return PROFILE_OCCUPATION_ORDER.filter((occupation) => tags.has(occupation));
}

function mergeOccupations(...occupationLists) {
  const tags = new Set(occupationLists.flat().filter(Boolean));
  return PROFILE_OCCUPATION_ORDER.filter((occupation) => tags.has(occupation));
}

async function fetchGravurefitLargeCupReferenceSet() {
  const names = new Set();

  for (const cup of ["f", "g", "h", "i", "j", "k"]) {
    const html = await fetchText(`https://www.gravurefit.info/style/cup-${cup}/`);

    for (const tableMatch of html.matchAll(/<table[^>]*>(.*?)<\/table>/gs)) {
      const tableHtml = tableMatch[1];
      const values = [];

      for (const rowMatch of tableHtml.matchAll(/<tr>(.*?)<\/tr>/gs)) {
        const rowHtml = rowMatch[1];
        const cells = [...rowHtml.matchAll(/<(?:th|td)[^>]*>(.*?)<\/(?:th|td)>/gs)].map(
          (cellMatch) => stripHtml(cellMatch[1])
        );

        if (cells.length >= 2) {
          values.push(cells[1]);
        }
      }

      if (values.length < 5) {
        continue;
      }

      const name = values[0];

      if (name) {
        for (const variant of getNameVariants(name)) {
          names.add(variant);
        }
      }
    }
  }

  return names;
}

async function main() {
  const generatedAt = new Date().toISOString();
  const femalePageMaps = await buildFemaleProfilePageMap();
  const idolprofCache = new Map();
  const femaleProfiles = [...femaleProfilePool];

  const femaleResults = await mapWithConcurrency(
    femaleProfiles,
    4,
    async (profile, index) => {
      const profileUrl = resolveFemaleProfileUrl(profile.name, femalePageMaps);
      const detail = profileUrl
        ? await fetchIdolprofProfileDetail(profileUrl, idolprofCache)
        : { pageText: "", noteText: "", wikipediaUrl: null };

      if ((index + 1) % 100 === 0 || index === femaleProfiles.length - 1) {
        console.log(`Fetched ${index + 1}/${femaleProfiles.length} female profiles`);
      }

      return {
        name: profile.name,
        pageText: detail.pageText,
        noteText: detail.noteText,
        wikipediaUrl: detail.wikipediaUrl,
      };
    }
  );

  const wikipediaIntroByUrl = await buildWikipediaIntroMap(
    femaleResults
      .map((entry) => entry.wikipediaUrl)
      .filter((url) => typeof url === "string" && url.length > 0)
  );
  const wikipediaIntroByName = await buildWikipediaIntroMapForNames(
    femaleResults.map((entry) => entry.name)
  );

  for (let index = 0; index < femaleResults.length; index += 1) {
    const entry = femaleResults[index];
    const wikipediaIntro =
      (entry.wikipediaUrl ? wikipediaIntroByUrl.get(entry.wikipediaUrl) ?? "" : "") ||
      wikipediaIntroByName.get(entry.name) ||
      "";
    const overrideOccupations = FEMALE_OCCUPATION_OVERRIDES[entry.name] ?? [];

    entry.occupations = mergeOccupations(
      detectOccupations({
        pageText: entry.pageText,
        noteText: entry.noteText,
        wikipediaIntro,
      }),
      overrideOccupations
    );

    if ((index + 1) % 100 === 0 || index === femaleResults.length - 1) {
      console.log(`Tagged ${index + 1}/${femaleResults.length} female profiles`);
    }
  }

  const femaleOccupationMap = Object.fromEntries(
    femaleResults.map((entry) => [entry.name, entry.occupations])
  );
  const maleOccupationMap = {};
  const counts = Object.fromEntries(
    PROFILE_OCCUPATION_ORDER.map((occupation) => [occupation, 0])
  );
  let tagged = 0;

  for (const { occupations } of femaleResults) {
    if (occupations.length > 0) {
      tagged += 1;
    }

    for (const occupation of occupations) {
      counts[occupation] += 1;
    }
  }

  const gravurefitLargeCupReference = await fetchGravurefitLargeCupReferenceSet();
  const sourceNameVariants = new Set();

  for (const profile of femaleProfiles) {
    for (const variant of getNameVariants(profile.name)) {
      sourceNameVariants.add(variant);
    }
  }

  let gravurefitOverlap = 0;

  for (const name of gravurefitLargeCupReference) {
    if (sourceNameVariants.has(name)) {
      gravurefitOverlap += 1;
    }
  }

  const coverageData = {
    generatedAt,
    female: {
      total: femaleProfiles.length,
      tagged,
      untagged: femaleProfiles.length - tagged,
      occupations: PROFILE_OCCUPATION_ORDER.map((occupation) => ({
        occupation,
        label: PROFILE_OCCUPATION_LABELS[occupation],
        count: counts[occupation],
        percentage:
          femaleProfiles.length === 0
            ? 0
            : Number(((counts[occupation] / femaleProfiles.length) * 100).toFixed(1)),
      })),
      referenceCoverage: {
        gravurefitLargeCup: {
          label: "gravurefit F-Kカップ",
          referenceTotal: gravurefitLargeCupReference.size,
          matchedProfiles: gravurefitOverlap,
          coverageRate:
            gravurefitLargeCupReference.size === 0
              ? 0
              : Number(
                  (
                    (gravurefitOverlap / gravurefitLargeCupReference.size) *
                    100
                  ).toFixed(1)
                ),
        },
      },
      notes: [
        "occupation は idolprof の個別プロフィール本文と、リンクされている Wikipedia の導入文から自動推定した参考値です。",
        "真の業界総数ではなく、公開プロフィール母集団に対して何人を職種タグ付きで追えているかを見るための集計です。",
      ],
    },
  };
  const occupationsData = {
    generatedAt,
    female: femaleOccupationMap,
    male: maleOccupationMap,
  };

  fs.writeFileSync(
    OCCUPATIONS_OUTPUT_PATH,
    `${JSON.stringify(occupationsData, null, 2)}\n`
  );
  fs.writeFileSync(
    COVERAGE_OUTPUT_PATH,
    `${JSON.stringify(coverageData, null, 2)}\n`
  );

  console.log(`Generated ${OCCUPATIONS_OUTPUT_PATH}`);
  console.log(`Generated ${COVERAGE_OUTPUT_PATH}`);
  console.log(
    JSON.stringify(
      {
        tagged,
        total: femaleProfiles.length,
        gravure: counts.gravure,
        av: counts.av,
        gravurefitLargeCupCoverage:
          coverageData.female.referenceCoverage.gravurefitLargeCup.coverageRate,
      },
      null,
      2
    )
  );
}

await main();
