import rankingData from "../public/data/ranking.json";

import type { FemaleRankingEntry, RankingData } from "./ranking.ts";
import {
  FEMALE_STATS,
  calculateCupDeviation,
  calculateDeviation,
  getCupSortValue,
} from "./statistics.ts";

export const AI_LOADING_MESSAGES = [
  "骨格をなんとなく解析中…",
  "AIが雰囲気で判断しています…",
  "体型バランスを数値化中…",
  "偏差値をフィーリングで算出中…",
  "もっともらしい結果を生成中…",
] as const;

export const DIAGNOSIS_DISCLAIMERS = [
  "※ このAIは雰囲気で動いています",
  "※ 結果はAIの気分で算出されています",
  "※ 画像はサーバーに送信されません。全てブラウザ内で処理されます",
] as const;

export const DIAGNOSIS_SHARE_URL =
  "https://jim-auto.github.io/body-type-analyzer/";

const HEIGHT_MIN = 140;
const HEIGHT_MAX = 190;
const DEVIATION_MIN = 20;
const DEVIATION_MAX = 80;
const MAX_SIMILAR_CELEBRITIES = 3;
const FALLBACK_CUP = "C";
const FALLBACK_CELEBRITY = "石原さとみ";
const CUP_DISTRIBUTION = [
  { cup: "A", probability: 0.021 },
  { cup: "B", probability: 0.179 },
  { cup: "C", probability: 0.269 },
  { cup: "D", probability: 0.263 },
  { cup: "E", probability: 0.188 },
  { cup: "F", probability: 0.06 },
  { cup: "G", probability: 0.016 },
  { cup: "H", probability: 0.004 },
] as const;

type Cup = (typeof CUP_DISTRIBUTION)[number]["cup"];

export type SilhouetteType = "X" | "I" | "A";

export type SimilarCelebrity = {
  name: string;
  image: string;
  similarity: number;
  actualHeight: number;
  cup: Cup;
};

export type DiagnosisResult = {
  estimatedHeight: number;
  estimatedCup: Cup;
  heightDeviation: number;
  cupDeviation: number;
  silhouetteType: SilhouetteType;
  confidence: number;
  similarCelebrity: string;
  similarCelebrities: SimilarCelebrity[];
};

type CelebrityCandidate = Pick<
  FemaleRankingEntry,
  "name" | "image" | "actualHeight" | "cup" | "estimatedCup"
>;

const celebrityCandidates = collectCelebrityCandidates();

function collectCelebrityCandidates(): CelebrityCandidate[] {
  const femaleCategories = (rankingData as RankingData).female;
  const candidates = new Map<string, CelebrityCandidate>();

  femaleCategories.flatMap((category) => category.ranking).forEach((entry) => {
    const current = candidates.get(entry.name);
    const image =
      current?.image.startsWith("/images/") || !entry.image.startsWith("/images/")
        ? current?.image ?? entry.image
        : entry.image;

    candidates.set(entry.name, {
      name: entry.name,
      image,
      actualHeight: entry.actualHeight,
      cup: current?.cup ?? entry.cup,
      estimatedCup: current?.estimatedCup ?? entry.estimatedCup,
    });
  });

  return [...candidates.values()];
}

async function readFileBuffer(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === "function") {
    return file.arrayBuffer();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error("画像の読み込みに失敗しました"));
    };

    reader.readAsArrayBuffer(file);
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function generateHeight(rand: () => number): number {
  const u1 = Math.max(rand(), Number.EPSILON);
  const u2 = rand();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

  return clamp(
    Math.round(FEMALE_STATS.height.mean + FEMALE_STATS.height.stddev * z),
    HEIGHT_MIN,
    HEIGHT_MAX
  );
}

function pickCup(randomValue: number): Cup {
  let cumulative = 0;

  for (const distribution of CUP_DISTRIBUTION) {
    cumulative += distribution.probability;

    if (randomValue <= cumulative) {
      return distribution.cup;
    }
  }

  return "H";
}

function pickSilhouette(randomValue: number): SilhouetteType {
  if (randomValue < 0.34) {
    return "X";
  }

  if (randomValue < 0.67) {
    return "I";
  }

  return "A";
}

function getCandidateCup(candidate: CelebrityCandidate): Cup {
  const cup = candidate.cup ?? candidate.estimatedCup ?? FALLBACK_CUP;

  return (getCupSortValue(cup) === -1 ? FALLBACK_CUP : cup) as Cup;
}

function inferCandidateSilhouette(
  actualHeight: number,
  cup: Cup
): SilhouetteType {
  const cupValue = getCupSortValue(cup);

  if (actualHeight <= 158 && cupValue >= getCupSortValue("E")) {
    return "A";
  }

  if (actualHeight >= 164 && cupValue <= getCupSortValue("C")) {
    return "I";
  }

  return "X";
}

function getSimilarCelebrities(
  estimatedHeight: number,
  estimatedCup: Cup,
  silhouetteType: SilhouetteType
): SimilarCelebrity[] {
  const estimatedCupValue = getCupSortValue(estimatedCup);

  return celebrityCandidates
    .map((candidate) => {
      const candidateCup = getCandidateCup(candidate);
      const candidateSilhouette = inferCandidateSilhouette(
        candidate.actualHeight,
        candidateCup
      );
      const heightDistance = Math.abs(candidate.actualHeight - estimatedHeight);
      const cupDistance = Math.abs(
        getCupSortValue(candidateCup) - estimatedCupValue
      );
      const heightScore = 1 - Math.min(heightDistance, 18) / 18;
      const cupScore = 1 - Math.min(cupDistance, 7) / 7;
      const silhouetteScore =
        candidateSilhouette === silhouetteType ? 1 : 0.35;
      const similarity = clamp(
        Math.round(
          (heightScore * 0.58 + cupScore * 0.27 + silhouetteScore * 0.15) * 100
        ),
        52,
        97
      );

      return {
        name: candidate.name,
        image: candidate.image,
        similarity,
        actualHeight: candidate.actualHeight,
        cup: candidateCup,
        heightDistance,
        cupDistance,
      };
    })
    .sort(
      (left, right) =>
        right.similarity - left.similarity ||
        left.heightDistance - right.heightDistance ||
        left.cupDistance - right.cupDistance ||
        Number(right.image.startsWith("/images/")) -
          Number(left.image.startsWith("/images/")) ||
        left.name.localeCompare(right.name, "ja")
    )
    .slice(0, MAX_SIMILAR_CELEBRITIES)
    .map(
      ({ heightDistance: _heightDistance, cupDistance: _cupDistance, ...entry }) =>
        entry
    );
}

export async function hashFromImage(file: File): Promise<number> {
  const buffer = await readFileBuffer(file);
  const bytes = new Uint8Array(buffer);
  let hash = 0;

  for (const byte of bytes) {
    hash = (Math.imul(hash, 31) + byte) >>> 0;
  }

  return hash || 1;
}

export function seededRandom(seed: number): () => number {
  let state = (seed >>> 0) || 1;

  return () => {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state >>>= 0;
    state ^= state << 5;
    state >>>= 0;

    return state / 0x100000000;
  };
}

export function diagnose(hash: number): DiagnosisResult {
  const rand = seededRandom(hash);
  const estimatedHeight = generateHeight(rand);
  const estimatedCup = pickCup(rand());
  const heightDeviation = clamp(
    calculateDeviation(
      estimatedHeight,
      FEMALE_STATS.height.mean,
      FEMALE_STATS.height.stddev
    ),
    DEVIATION_MIN,
    DEVIATION_MAX
  );
  const cupDeviation = clamp(
    calculateCupDeviation(estimatedCup),
    DEVIATION_MIN,
    DEVIATION_MAX
  );
  const silhouetteType = pickSilhouette(rand());
  const confidence = Math.floor(rand() * 30) + 15;
  const similarCelebrities = getSimilarCelebrities(
    estimatedHeight,
    estimatedCup,
    silhouetteType
  );
  const similarCelebrity =
    similarCelebrities[0]?.name ?? FALLBACK_CELEBRITY;

  return {
    estimatedHeight,
    estimatedCup,
    heightDeviation,
    cupDeviation,
    silhouetteType,
    confidence,
    similarCelebrity,
    similarCelebrities,
  };
}

export function buildShareText(result: DiagnosisResult): string {
  return [
    "【芸能人スタイルランキング AI診断】",
    `推定身長: ${result.estimatedHeight}cm（偏差値${result.heightDeviation}）`,
    `推定カップ: ${result.estimatedCup}カップ（偏差値${result.cupDeviation}）`,
    `似ている有名人: ${result.similarCelebrity}`,
    `AI信頼度: ${result.confidence}%（雰囲気で判定）`,
    "",
    "#芸能人スタイルランキング",
    DIAGNOSIS_SHARE_URL,
  ].join("\n");
}

export function buildXShareUrl(result: DiagnosisResult): string {
  return `https://x.com/intent/tweet?text=${encodeURIComponent(
    buildShareText(result)
  )}`;
}
