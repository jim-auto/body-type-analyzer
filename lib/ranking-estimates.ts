import {
  DIAGNOSIS_MODEL_ENTRIES,
  diagnoseFromFeatures,
} from "./diagnosis-model.ts";
import maleRankingModelJson from "../public/data/male-ranking-model.json" with { type: "json" };
import {
  getAdjustedEstimatedCup,
  getEstimatedHeight,
} from "./profile-estimates.ts";
import { getCupIndex, getCupLabel, getPreferredCupLabel } from "./cup-order.ts";
import type {
  FemaleProfileSource,
  MaleProfileSource,
} from "./source-profiles.ts";

type FemaleModelEstimate = {
  estimatedHeight: number;
  estimatedCup: string;
};

const FEMALE_IMAGE_MODEL_WEIGHT = 0.7;
const MALE_IMAGE_MODEL_WEIGHT = 0.3;
const diagnosisEntryByName = new Map(
  DIAGNOSIS_MODEL_ENTRIES.map((entry) => [entry.name, entry])
);
const femaleEstimateCache = new Map<string, FemaleModelEstimate>();
const maleRankingModel = maleRankingModelJson as {
  estimates: Record<string, number>;
};

const FEMALE_IMAGE_MODEL_EXCLUDED_NAMES = new Set([
  "ケリー",
  "愛川ゆず季",
  "夏来唯",
  "喜多愛",
  "菊池亜希子",
  "佐藤江梨子",
  "山咲まりな",
  "春輝",
  "小泉深雪",
  "松本さゆき",
  "水咲優美",
  "青宮鑑",
  "爽香",
  "相沢菜々子",
  "中村明花",
  "潮崎まりん",
  "天羽結愛",
  "天野ちよ",
  "奈月セナ",
  "日向葵衣",
  "木村あやね",
  "片山萌美",
  "あいだあい",
  "緑川静香",
  "いとうあこ",
  "おしの沙羅",
  "たしろさやか",
  "ももゆい",
  "茜さや",
  "安座間美優",
  "伊藤しほ乃",
  "一色亜莉沙",
  "羽田奈央",
  "永岡真実",
  "加藤紗里",
  "河内裕里",
  "花咲来夢",
  "樫本琳花",
  "岩﨑名美",
  "吉川綾乃",
  "橘和奈",
  "後藤真桜",
  "荒井華奈",
  "佐々木麻衣",
  "佐藤栞里",
  "糸山千恵",
  "篠見星奈",
  "小阪由佳",
  "小倉あずさ",
  "小柳歩",
  "上杉智世",
  "森未蘭",
  "深井彩夏",
  "深海理絵",
  "神谷美伽",
  "秦綾",
  "仁藤みさき",
  "須能咲良",
  "星野真希",
  "西岡葉月",
  "西田美歩",
  "石田ニコル",
  "川上さり",
  "川奈ゆう",
  "倉貫まりこ",
  "相沢まき",
  "草場恵",
  "多田あさみ",
  "大空愛",
  "中村葵",
  "長谷部瞳",
  "鳥海かう",
  "東坂みゆ",
  "藤田あずさ",
  "日向泉",
  "尾崎礼香",
  "美波那緒",
  "姫神ゆり",
  "舞川あいく",
  "副島美咲",
  "保﨑麗",
  "堀まゆみ",
  "櫻井りか",
]);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function isFemaleImageModelExcluded(name: string): boolean {
  return FEMALE_IMAGE_MODEL_EXCLUDED_NAMES.has(name);
}

function getFemaleModelEstimate(
  profile: FemaleProfileSource
): FemaleModelEstimate | null {
  if (
    !profile.image.startsWith("/images/") ||
    isFemaleImageModelExcluded(profile.name)
  ) {
    return null;
  }

  const cached = femaleEstimateCache.get(profile.name);

  if (cached) {
    return cached;
  }

  const diagnosisEntry = diagnosisEntryByName.get(profile.name);

  if (!diagnosisEntry) {
    return null;
  }

  const result = diagnoseFromFeatures(diagnosisEntry.featureSets, {
    excludeName: diagnosisEntry.name,
  });
  const estimate = {
    estimatedHeight: result.estimatedHeight,
    estimatedCup: result.estimatedCup,
  };

  femaleEstimateCache.set(profile.name, estimate);

  return estimate;
}

export function getFemaleRankingEstimatedHeight(
  profile: FemaleProfileSource
): number {
  const baselineEstimate = getEstimatedHeight(profile.actualHeight, profile.name);
  const modelEstimate = getFemaleModelEstimate(profile)?.estimatedHeight;

  if (modelEstimate === undefined) {
    return baselineEstimate;
  }

  return Math.round(
    modelEstimate * FEMALE_IMAGE_MODEL_WEIGHT +
      baselineEstimate * (1 - FEMALE_IMAGE_MODEL_WEIGHT)
  );
}

export function getFemaleRankingEstimatedCup(
  profile: FemaleProfileSource
): string | null {
  const baselineEstimate = getAdjustedEstimatedCup(
    profile.bust,
    getPreferredCupLabel(profile)
  );
  const modelEstimate = getFemaleModelEstimate(profile)?.estimatedCup;

  if (!modelEstimate) {
    return baselineEstimate;
  }

  if (!baselineEstimate) {
    return modelEstimate;
  }

  const baselineIndex = getCupIndex(baselineEstimate);
  const modelIndex = getCupIndex(modelEstimate);

  if (baselineIndex === null || modelIndex === null) {
    return baselineEstimate;
  }

  const blendedIndex = Math.round(
    modelIndex * FEMALE_IMAGE_MODEL_WEIGHT +
      baselineIndex * (1 - FEMALE_IMAGE_MODEL_WEIGHT)
  );

  return getCupLabel(blendedIndex);
}

export function getMaleRankingEstimatedHeight(
  profile: MaleProfileSource
): number {
  const baselineEstimate = getEstimatedHeight(profile.actualHeight, profile.name);
  const modelEstimate = maleRankingModel.estimates[profile.name];

  if (modelEstimate === undefined) {
    return baselineEstimate;
  }

  return Math.round(
    modelEstimate * MALE_IMAGE_MODEL_WEIGHT +
      baselineEstimate * (1 - MALE_IMAGE_MODEL_WEIGHT)
  );
}
