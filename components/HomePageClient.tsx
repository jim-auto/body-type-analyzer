"use client";

import { useState } from "react";
import Link from "next/link";

import type { FemaleCupTrainingCoverageSummary } from "@/lib/cup-training-coverage";
import type {
  FemaleCupDistributionSummary,
  MaleHeightDistributionSummary,
} from "@/lib/distributions";
import { getCupIndex, normalizeCupLabel } from "@/lib/cup-order";
import {
  getFemaleProfileOccupations,
  PROFILE_OCCUPATION_LABELS,
  type ProfileOccupation,
  type FemaleProfileCoverageSummary,
  type FemaleProfileGoalSummary,
} from "@/lib/profile-occupations";
import {
  formatSignedDifference,
  getMismatchEmoji,
} from "@/lib/profile-estimates";
import {
  isFemaleEntry,
  type FemaleRankingEntry,
  type MaleRankingEntry,
  type RankingData,
  type RankingEntry,
} from "@/lib/ranking";

type Gender = "female" | "male";

type HomePageClientProps = {
  data: RankingData;
  femaleCupDistribution: FemaleCupDistributionSummary;
  femaleCupTrainingCoverage: FemaleCupTrainingCoverageSummary;
  femaleOccupationCoverage: FemaleProfileCoverageSummary;
  femaleOccupationGoals: FemaleProfileGoalSummary;
  maleHeightDistribution: MaleHeightDistributionSummary;
};

type DistributionBucket = {
  label: string;
  count: number;
  percentage: number;
};

type OccupationFilter = "all" | ProfileOccupation;
type WeightFilter =
  | "all"
  | "under45"
  | "45-49"
  | "50-54"
  | "55-59"
  | "60plus"
  | "unknown";

const WEIGHT_FILTERS: Array<{
  id: WeightFilter;
  label: string;
  matches: (weight: number | null) => boolean;
}> = [
  {
    id: "all",
    label: "All",
    matches: () => true,
  },
  {
    id: "under45",
    label: "Under 45kg",
    matches: (weight) => weight !== null && weight < 45,
  },
  {
    id: "45-49",
    label: "45-49kg",
    matches: (weight) => weight !== null && weight >= 45 && weight < 50,
  },
  {
    id: "50-54",
    label: "50-54kg",
    matches: (weight) => weight !== null && weight >= 50 && weight < 55,
  },
  {
    id: "55-59",
    label: "55-59kg",
    matches: (weight) => weight !== null && weight >= 55 && weight < 60,
  },
  {
    id: "60plus",
    label: "60kg+",
    matches: (weight) => weight !== null && weight >= 60,
  },
  {
    id: "unknown",
    label: "Weight unknown",
    matches: (weight) => weight === null,
  },
];

const PAGE_SIZE = 20;
const EARLY_PAGE_COUNT = 5;
const RANKING_CARD_OCCUPATION_LIMIT = 3;

const medalColors: Record<number, string> = {
  0: "bg-yellow-400 text-yellow-900",
  1: "bg-gray-300 text-gray-800",
  2: "bg-amber-600 text-white",
};

const medalBorder: Record<number, string> = {
  0: "ring-2 ring-yellow-400",
  1: "ring-2 ring-gray-300",
  2: "ring-2 ring-amber-600",
};

const defaultRankBadge = "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
const defaultAvatarRing = "ring-1 ring-slate-200";
const defaultScoreBadge = "bg-slate-100 text-slate-700";

const genderButtonStyles: Record<Gender, { active: string; inactive: string }> =
  {
    female: {
      active:
        "bg-pink-500 text-white shadow-lg shadow-pink-200 ring-1 ring-pink-300",
      inactive: "text-slate-500 hover:bg-white/80",
    },
    male: {
      active:
        "bg-blue-600 text-white shadow-lg shadow-blue-200 ring-1 ring-blue-300",
      inactive: "text-slate-500 hover:bg-white/80",
    },
  };

function normalizeSearchQuery(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/\s+/g, "").trim();
}

function getPaginationItems(
  currentPage: number,
  totalPages: number
): Array<number | string> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index);
  }

  const visiblePages = new Set<number>([0, totalPages - 1]);

  if (currentPage <= EARLY_PAGE_COUNT - 2) {
    for (let index = 0; index < EARLY_PAGE_COUNT; index += 1) {
      visiblePages.add(index);
    }
  } else if (currentPage >= totalPages - (EARLY_PAGE_COUNT - 1)) {
    for (let index = totalPages - EARLY_PAGE_COUNT; index < totalPages; index += 1) {
      visiblePages.add(index);
    }
  } else {
    for (let index = currentPage - 1; index <= currentPage + 1; index += 1) {
      visiblePages.add(index);
    }
  }

  const sortedPages = [...visiblePages]
    .filter((index) => index >= 0)
    .sort((left, right) => left - right);
  const items: Array<number | string> = [];

  for (let index = 0; index < sortedPages.length; index += 1) {
    const page = sortedPages[index];
    const previousPage = sortedPages[index - 1];

    if (previousPage !== undefined && page - previousPage > 1) {
      items.push(`ellipsis-${previousPage}-${page}`);
    }

    items.push(page);
  }

  return items;
}

function getDefaultCategoryIndex(
  categories: RankingData[Gender],
  gender: Gender
): number {
  const defaultCategory = gender === "female" ? "publicCup" : "style";
  const index = categories.findIndex(
    (category) => category.category === defaultCategory
  );

  return index >= 0 ? index : 0;
}

function getDisplayedCup(entry: FemaleRankingEntry): string | null {
  return entry.displayCup ?? entry.cup;
}

function getCupSampleCount(
  summary: FemaleCupTrainingCoverageSummary,
  cup: string | null | undefined
): number | null {
  const normalizedCup = normalizeCupLabel(cup);

  if (!normalizedCup) {
    return null;
  }

  return summary.sampleCounts[normalizedCup] ?? 0;
}

function hasInsufficientCupData(
  entry: FemaleRankingEntry,
  summary: FemaleCupTrainingCoverageSummary
): boolean {
  const displayedCup = getDisplayedCup(entry);
  const displayedCupIndex = getCupIndex(displayedCup);
  const largeCupIndex = getCupIndex(summary.largeCupWarningMin);
  const sampleCount = getCupSampleCount(summary, displayedCup);

  return (
    displayedCupIndex !== null &&
    largeCupIndex !== null &&
    displayedCupIndex >= largeCupIndex &&
    sampleCount !== null &&
    sampleCount < summary.scarceSampleThreshold
  );
}

function getFemaleStyleDetail(entry: FemaleRankingEntry): string {
  const displayedCup = getDisplayedCup(entry);
  const publicSummary = displayedCup
    ? `${entry.actualHeight}cm / ${displayedCup}カップ`
    : `${entry.actualHeight}cm / カップ非公表`;
  const estimatedCupSummary = entry.estimatedCup
    ? `${entry.estimatedCup}カップ`
    : "カップ推定不可";

  return `公表: ${publicSummary} ・ AI推定: ${entry.estimatedHeight}cm / ${estimatedCupSummary}`;
}

function getMaleStyleDetail(entry: MaleRankingEntry): string {
  return `公表: ${entry.actualHeight}cm ・ AI推定: ${entry.estimatedHeight}cm`;
}

function getPublicHeightDetail(entry: RankingEntry): string {
  return `AI推定身長: ${entry.estimatedHeight}cm（差: ${formatSignedDifference(
    entry.heightDiff,
    "cm"
  )} ${getMismatchEmoji(entry.heightDiff)}）`;
}

function getPublicCupDetail(entry: FemaleRankingEntry): string {
  if (!entry.estimatedCup || entry.displayCupDiff === null) {
    return entry.estimatedCup
      ? `AI推定カップ: ${entry.estimatedCup}カップ`
      : "AI推定カップ: 不明";
  }

  return `AI推定カップ: ${entry.estimatedCup}カップ（差: ${formatSignedDifference(
    entry.displayCupDiff,
    "サイズ"
  )} ${getMismatchEmoji(entry.displayCupDiff)}）`;
}

function getFemaleOccupationLabels(name: string): string[] {
  return getFemaleProfileOccupations(name)
    .slice(0, RANKING_CARD_OCCUPATION_LIMIT)
    .map((occupation) => PROFILE_OCCUPATION_LABELS[occupation]);
}

function DistributionSeriesCard({
  title,
  total,
  buckets,
  tone,
  referencePrefix,
}: {
  title: string;
  total: number;
  buckets: DistributionBucket[];
  tone: "rose" | "sky";
  referencePrefix?: (label: string) => string | null;
}) {
  const containerClass =
    tone === "rose" ? "bg-rose-50/70" : "bg-sky-50/80";
  const trackClass = tone === "rose" ? "bg-rose-100" : "bg-sky-100";
  const barClass =
    tone === "rose"
      ? "bg-gradient-to-r from-pink-500 to-rose-300"
      : "bg-gradient-to-r from-sky-500 to-cyan-300";

  return (
    <section className="space-y-3 rounded-[1.4rem] border border-slate-100 bg-slate-50/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-700">
          {title}
        </h4>
        <span className="text-xs text-slate-400">{total}人ベース</span>
      </div>

      <div className="space-y-3">
        {buckets.map((bucket) => (
          <div key={`${title}-${bucket.label}`} className={`rounded-2xl px-4 py-3 ${containerClass}`}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-slate-700">{bucket.label}</span>
              <span className="text-slate-500">
                {bucket.count}人 / {bucket.percentage.toFixed(1)}%
              </span>
            </div>
            <div className={`mt-2 h-2.5 overflow-hidden rounded-full ${trackClass}`}>
              <div
                className={`h-full rounded-full ${barClass}`}
                style={{ width: `${bucket.percentage}%` }}
              />
            </div>
            {referencePrefix ? (
              <p className="mt-2 text-xs text-slate-400">
                {referencePrefix(bucket.label)}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomePageClient({
  data,
  femaleCupDistribution,
  femaleCupTrainingCoverage,
  femaleOccupationCoverage,
  femaleOccupationGoals,
  maleHeightDistribution,
}: HomePageClientProps) {
  const [gender, setGender] = useState<Gender>("female");
  const [activeTab, setActiveTab] = useState(() =>
    getDefaultCategoryIndex(data.female, "female")
  );
  const [activePage, setActivePage] = useState(0);
  const [activeOccupationFilter, setActiveOccupationFilter] =
    useState<OccupationFilter>("all");
  const [activeWeightFilter, setActiveWeightFilter] =
    useState<WeightFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const basePath =
    process.env.NODE_ENV === "production" ? "/body-type-analyzer" : "";

  const resolveImageSrc = (src: string) =>
    src.startsWith("/") ? `${basePath}${src}` : src;

  const handleGenderChange = (nextGender: Gender) => {
    setGender(nextGender);
    setActiveTab(getDefaultCategoryIndex(data[nextGender], nextGender));
    setActivePage(0);
    setActiveOccupationFilter("all");
    setActiveWeightFilter("all");
  };

  const handleCategoryChange = (nextTab: number) => {
    setActiveTab(nextTab);
    setActivePage(0);
    setActiveWeightFilter("all");
  };

  const categories = data[gender];
  const current = categories[activeTab];
  const currentRanking = current?.ranking ?? [];
  const currentRankingEntries: readonly RankingEntry[] = currentRanking;
  const femaleRankingOccupationCounts =
    gender === "female"
      ? currentRanking.reduce<Record<ProfileOccupation, number>>(
          (counts, entry) => {
            for (const occupation of getFemaleProfileOccupations(entry.name)) {
              counts[occupation] += 1;
            }

            return counts;
          },
          {
            gravure: 0,
            av: 0,
            actress: 0,
            model: 0,
            talent: 0,
            idol: 0,
            racequeen: 0,
            cosplayer: 0,
            announcer: 0,
            singer: 0,
            wrestler: 0,
          }
        )
      : null;
  const femaleOccupationFilterOptions =
    gender === "female" && femaleRankingOccupationCounts
      ? femaleOccupationCoverage.occupations.filter(
          (entry) =>
            (femaleRankingOccupationCounts[entry.occupation] ?? 0) > 0 ||
            activeOccupationFilter === entry.occupation
        )
      : [];
  const occupationFilteredRanking =
    gender === "female" && activeOccupationFilter !== "all"
      ? currentRanking.filter((entry) =>
          getFemaleProfileOccupations(entry.name).includes(activeOccupationFilter)
        )
      : currentRanking;
  const femaleWeightFilterCounts =
    gender === "female"
      ? WEIGHT_FILTERS.reduce<Record<WeightFilter, number>>(
          (counts, filter) => {
            counts[filter.id] =
              filter.id === "all"
                ? occupationFilteredRanking.length
                : occupationFilteredRanking.filter(
                    (entry) =>
                      isFemaleEntry(entry) && filter.matches(entry.actualWeight)
                  ).length;

            return counts;
          },
          {
            all: 0,
            under45: 0,
            "45-49": 0,
            "50-54": 0,
            "55-59": 0,
            "60plus": 0,
            unknown: 0,
          }
        )
      : null;
  const activeWeightFilterConfig = WEIGHT_FILTERS.find(
    (filter) => filter.id === activeWeightFilter
  );
  const femaleWeightFilterOptions =
    gender === "female" && femaleWeightFilterCounts
      ? WEIGHT_FILTERS.filter(
          (filter) =>
            filter.id === "all" ||
            (femaleWeightFilterCounts[filter.id] ?? 0) > 0 ||
            activeWeightFilter === filter.id
        )
      : [];
  const weightFilteredRanking =
    gender === "female" && activeWeightFilter !== "all"
      ? occupationFilteredRanking.filter(
          (entry) =>
            isFemaleEntry(entry) &&
            (activeWeightFilterConfig?.matches(entry.actualWeight) ?? true)
        )
      : occupationFilteredRanking;
  const normalizedSearchQuery = normalizeSearchQuery(searchQuery);
  const filteredRanking =
    normalizedSearchQuery.length === 0
      ? weightFilteredRanking
      : weightFilteredRanking.filter((entry) =>
          normalizeSearchQuery(entry.name).includes(normalizedSearchQuery)
        );
  const totalPages = Math.max(1, Math.ceil(filteredRanking.length / PAGE_SIZE));
  const currentPage = Math.min(activePage, totalPages - 1);
  const pageStart = currentPage * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, filteredRanking.length);
  const pagedRanking = filteredRanking.slice(pageStart, pageEnd);
  const paginationItems = getPaginationItems(currentPage, totalPages);
  const isPublicHeightCategory = current?.category === "publicHeight";
  const isPublicCupCategory = current?.category === "publicCup";
  const activeCategoryStyle =
    gender === "female"
      ? "bg-pink-500 text-white shadow-md"
      : "bg-blue-600 text-white shadow-md";
  const gravureCount =
    femaleOccupationCoverage.occupations.find(
      (entry) => entry.occupation === "gravure"
    )?.count ?? 0;
  const avCount =
    femaleOccupationCoverage.occupations.find((entry) => entry.occupation === "av")
      ?.count ?? 0;
  const gravurefitCoverage =
    femaleOccupationCoverage.referenceCoverage.gravurefitLargeCup;
  const topGoalProgress = femaleOccupationGoals.occupations.reduce(
    (total, entry) => total + Math.min(entry.count, entry.target),
    0
  );
  const topGoalTarget = femaleOccupationGoals.occupations.reduce(
    (total, entry) => total + entry.target,
    0
  );
  const activeOccupationFilterLabel =
    activeOccupationFilter === "all"
      ? "All"
      : PROFILE_OCCUPATION_LABELS[activeOccupationFilter];
  const activeWeightFilterLabel =
    activeWeightFilterConfig?.label ?? "All";

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-slate-50 to-white px-4 py-8 sm:py-12">
      <main className="w-full max-w-5xl space-y-10">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
            芸能人スタイルランキング
          </h1>
          <p className="text-base text-slate-500 sm:text-lg">
            芸能人のスタイルをAIが偏差値で格付け！
          </p>
        </div>

        <section className="rounded-3xl border border-rose-100 bg-[linear-gradient(135deg,_rgba(251,113,133,0.12),_rgba(255,255,255,0.95))] p-6 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-500">
            New
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-800">
            あなたのスタイルも診断してみる？
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
            画像から特徴量を抽出し、学習プロフィール画像の近傍比較で身長とカップを推定します。
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/analyze"
              className="inline-flex rounded-full bg-pink-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-pink-600"
            >
              AIスタイル診断をはじめる
            </Link>
            <Link
              href="/analyze#model-performance"
              className="inline-flex rounded-full border border-pink-200 bg-white px-5 py-3 text-sm font-semibold text-pink-600 transition hover:border-pink-300 hover:bg-pink-50"
            >
              モデル性能を見る
            </Link>
          </div>
        </section>

        <div className="mx-auto flex w-full max-w-sm rounded-full bg-slate-100 p-1 shadow-inner">
          <button
            type="button"
            onClick={() => handleGenderChange("female")}
            aria-pressed={gender === "female"}
            className={`flex-1 rounded-full px-5 py-3 text-base font-bold transition ${
              gender === "female"
                ? genderButtonStyles.female.active
                : genderButtonStyles.female.inactive
            }`}
          >
            女性
          </button>
          <button
            type="button"
            onClick={() => handleGenderChange("male")}
            aria-pressed={gender === "male"}
            className={`flex-1 rounded-full px-5 py-3 text-base font-bold transition ${
              gender === "male"
                ? genderButtonStyles.male.active
                : genderButtonStyles.male.inactive
            }`}
          >
            男性
          </button>
        </div>

        {gender === "female" ? (
          <section className="rounded-[1.75rem] border border-amber-100 bg-[linear-gradient(135deg,_rgba(251,191,36,0.14),_rgba(255,255,255,0.96))] p-5 shadow-sm sm:p-6">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600">
                Coverage
              </p>
              <h2 className="text-2xl font-bold text-slate-900">
                職種タグのカバレッジ
              </h2>
              <p className="text-sm leading-6 text-slate-500 sm:text-base">
                公開女性プロフィール {femaleOccupationCoverage.total} 人に対して、
                `グラビア / AV女優 / 女優 / モデル` などの職種タグを別データで管理しています。
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "タグ付与済み",
                  value: `${femaleOccupationCoverage.tagged}人`,
                  tone: "bg-white/90 text-slate-900",
                },
                {
                  label: "グラビア",
                  value: `${gravureCount}人`,
                  tone: "bg-pink-50 text-pink-700",
                },
                {
                  label: "AV女優",
                  value: `${avCount}人`,
                  tone: "bg-rose-50 text-rose-700",
                },
                {
                  label: "未判定",
                  value: `${femaleOccupationCoverage.untagged}人`,
                  tone: "bg-slate-100 text-slate-700",
                },
              ].map((item) => (
                <article
                  key={item.label}
                  className={`rounded-2xl px-4 py-3 shadow-sm ring-1 ring-black/5 ${item.tone}`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-70">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold">{item.value}</p>
                </article>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {femaleOccupationCoverage.occupations
                .filter((entry) => entry.count > 0)
                .slice(0, 6)
                .map((entry) => (
                  <span
                    key={entry.occupation}
                    className="rounded-full bg-white/85 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200"
                  >
                    {entry.label} {entry.count}人
                  </span>
                ))}
            </div>

            <div className="mt-6 rounded-3xl border border-white/70 bg-white/80 p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">Targets</h3>
                  <p className="text-sm text-slate-500">
                    Pool {femaleOccupationGoals.totalCurrent} /{" "}
                    {femaleOccupationGoals.totalTarget} people, left{" "}
                    {femaleOccupationGoals.totalRemaining}
                  </p>
                </div>
                <div className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-amber-700 ring-1 ring-amber-200">
                  {topGoalProgress} / {topGoalTarget}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {femaleOccupationGoals.occupations.map((entry) => (
                  <article
                    key={entry.occupation}
                    className="rounded-2xl border border-slate-100 bg-slate-50/85 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-800">
                          {entry.label}
                        </p>
                        <p className="text-xs uppercase tracking-[0.12em] text-slate-400">
                          Current / Goal / Left
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                          entry.remaining === 0
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : "bg-amber-50 text-amber-700 ring-amber-200"
                        }`}
                      >
                        {entry.remaining}
                      </span>
                    </div>

                    <p className="mt-3 text-base font-bold text-slate-900">
                      {entry.count} / {entry.target}人
                    </p>

                    <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full ${
                          entry.remaining === 0
                            ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                            : "bg-gradient-to-r from-amber-500 to-orange-400"
                        }`}
                        style={{ width: `${Math.min(entry.progressRate, 100)}%` }}
                      />
                    </div>

                    <p className="mt-2 text-xs text-slate-400">
                      {entry.progressRate.toFixed(1)}% of target
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <p className="mt-4 text-sm text-slate-600">
              参考集合: {gravurefitCoverage.label} {gravurefitCoverage.matchedProfiles} /{" "}
              {gravurefitCoverage.referenceTotal} ({gravurefitCoverage.coverageRate}%)
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {femaleOccupationCoverage.notes[0]}
            </p>
          </section>
        ) : null}

        <section className="space-y-8">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category, index) => (
              <button
                key={`${gender}-${category.category}`}
                type="button"
                onClick={() => handleCategoryChange(index)}
                aria-pressed={index === activeTab}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  index === activeTab
                    ? activeCategoryStyle
                    : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                }`}
              >
                {category.title}
              </button>
            ))}
          </div>

          {current ? (
            <div className="space-y-2.5">
              <h2 className="text-center text-xl font-bold text-slate-700">
                {current.title}
              </h2>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-100/80 px-4 py-3 text-sm text-slate-600">
                <div className="space-y-1">
                  <p>
                    {filteredRanking.length === 0
                      ? "0人"
                      : `${pageStart + 1}-${pageEnd}位 / ${filteredRanking.length}人`}
                  </p>
                  <p className="text-xs text-slate-400">
                    ページ {filteredRanking.length === 0 ? 0 : currentPage + 1} /{" "}
                    {filteredRanking.length === 0 ? 0 : totalPages}
                    {activeOccupationFilter !== "all"
                      ? ` ・ ${activeOccupationFilterLabel} filter`
                      : ""}
                    {activeWeightFilter !== "all"
                      ? ` ・ ${activeWeightFilterLabel} filter`
                      : ""}
                    {normalizedSearchQuery.length > 0
                      ? ` ・ 「${searchQuery.trim()}」の検索結果`
                      : ""}
                  </p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[17rem]">
                  {gender === "female" ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Occupation Filter
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveOccupationFilter("all");
                            setActivePage(0);
                          }}
                          aria-pressed={activeOccupationFilter === "all"}
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                            activeOccupationFilter === "all"
                              ? activeCategoryStyle
                              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          All {currentRanking.length}
                        </button>
                        {femaleOccupationFilterOptions.map((entry) => (
                          <button
                            key={entry.occupation}
                            type="button"
                            onClick={() => {
                              setActiveOccupationFilter(entry.occupation);
                              setActivePage(0);
                            }}
                            aria-pressed={activeOccupationFilter === entry.occupation}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                              activeOccupationFilter === entry.occupation
                                ? activeCategoryStyle
                                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {entry.label}{" "}
                            {femaleRankingOccupationCounts?.[entry.occupation] ?? 0}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {gender === "female" ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Weight Filter
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {femaleWeightFilterOptions.map((filter) => (
                          <button
                            key={filter.id}
                            type="button"
                            onClick={() => {
                              setActiveWeightFilter(filter.id);
                              setActivePage(0);
                            }}
                            aria-pressed={activeWeightFilter === filter.id}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                              activeWeightFilter === filter.id
                                ? activeCategoryStyle
                                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {filter.label}{" "}
                            {femaleWeightFilterCounts?.[filter.id] ?? 0}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <label
                    htmlFor="ranking-search"
                    className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400"
                  >
                    名前で検索
                  </label>
                  <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    <input
                      id="ranking-search"
                      type="search"
                      value={searchQuery}
                      onChange={(event) => {
                        setSearchQuery(event.target.value);
                        setActivePage(0);
                      }}
                      placeholder="名前を入力"
                      className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    />
                    {searchQuery.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setActivePage(0);
                        }}
                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-200"
                      >
                        クリア
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
              {filteredRanking.length > 0 ? (
                <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-white/80 px-4 py-3 shadow-sm ring-1 ring-slate-100">
                  <button
                    type="button"
                    onClick={() => setActivePage((page) => Math.max(page - 1, 0))}
                    disabled={currentPage === 0}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    前へ
                  </button>
                  {paginationItems.map((item) =>
                    typeof item === "number" ? (
                      <button
                        key={`page-${item + 1}`}
                        type="button"
                        onClick={() => setActivePage(item)}
                        aria-current={item === currentPage ? "page" : undefined}
                        className={`min-w-10 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                          item === currentPage
                            ? activeCategoryStyle
                            : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {item + 1}
                      </button>
                    ) : (
                      <span
                        key={item}
                        className="px-1 text-sm font-semibold text-slate-400"
                      >
                        ...
                      </span>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setActivePage((page) => Math.min(page + 1, totalPages - 1))
                    }
                    disabled={currentPage >= totalPages - 1}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    次へ
                  </button>
                </div>
              ) : null}

              {pagedRanking.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white/90 px-6 py-12 text-center shadow-sm">
                  <p className="text-base font-semibold text-slate-700">
                    該当する人物が見つかりません。
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    名前を変えてもう一度検索してください。
                  </p>
                </div>
              ) : (
                pagedRanking.map((entry) => {
                  const absoluteIndex = currentRankingEntries.indexOf(entry);
                  const rankIndex =
                    absoluteIndex >= 0 ? absoluteIndex : pageStart + pagedRanking.indexOf(entry);
                  const rankNumber = rankIndex + 1;
                  const femaleEntry =
                    gender === "female" && isFemaleEntry(entry) ? entry : null;
                  const femaleOccupationLabels = femaleEntry
                    ? getFemaleOccupationLabels(entry.name)
                    : [];
                  const hasCupDataWarning = femaleEntry
                    ? hasInsufficientCupData(femaleEntry, femaleCupTrainingCoverage)
                    : false;
                  const predictionText = isPublicHeightCategory
                    ? getPublicHeightDetail(entry)
                    : isPublicCupCategory && femaleEntry
                      ? getPublicCupDetail(femaleEntry)
                      : femaleEntry
                        ? getFemaleStyleDetail(femaleEntry)
                        : getMaleStyleDetail(entry as MaleRankingEntry);
                  const scoreLabel = isPublicHeightCategory
                    ? `${entry.score}cm`
                    : isPublicCupCategory && femaleEntry
                      ? `${getDisplayedCup(femaleEntry) ?? femaleEntry.cup}カップ`
                      : `偏差値${entry.score}`;

                  return (
                    <div
                      key={`${gender}-${entry.name}`}
                      className="flex items-start justify-between rounded-2xl bg-white/95 p-3.5 shadow-sm ring-1 ring-slate-100 transition-shadow hover:shadow-md sm:p-4"
                    >
                      <div className="flex min-w-0 items-start gap-4">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            medalColors[rankIndex] ?? defaultRankBadge
                          }`}
                        >
                          {rankNumber}
                        </span>
                        <img
                          src={resolveImageSrc(entry.image)}
                          alt={entry.name}
                          className={`h-12 w-12 shrink-0 rounded-full object-cover ${
                            medalBorder[rankIndex] ?? defaultAvatarRing
                          }`}
                        />
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-slate-700">
                              {entry.name}
                            </span>
                            {femaleEntry && getDisplayedCup(femaleEntry) ? (
                              <span className="rounded bg-pink-100 px-2 py-0.5 text-xs font-bold text-pink-700">
                                {getDisplayedCup(femaleEntry)}カップ
                              </span>
                            ) : null}
                            {hasCupDataWarning ? (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                                そのカップ数はデータ不足
                              </span>
                            ) : null}
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                              {entry.actualHeight}cm
                            </span>
                            {femaleEntry && femaleEntry.actualWeight !== null ? (
                              <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                                {femaleEntry.actualWeight}kg
                              </span>
                            ) : null}
                          </div>
                          {femaleOccupationLabels.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {femaleOccupationLabels.map((label) => (
                                <span
                                  key={`${entry.name}-${label}`}
                                  className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200"
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                          ) : null}
                          <p className="text-xs text-slate-400">{predictionText}</p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${
                          medalColors[rankIndex] ?? defaultScoreBadge
                        }`}
                      >
                        {scoreLabel}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          ) : null}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,_rgba(236,253,245,0.9),_rgba(255,255,255,0.96))] p-6 shadow-sm sm:p-8">
          <div className="space-y-2 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
              Distribution
            </p>
            <h2 className="text-2xl font-bold text-slate-900">分布セクション</h2>
            <p className="text-sm leading-6 text-slate-500 sm:text-base">
              ランキングとは別に、公開データと推定データの分布を並べています。
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <article className="rounded-[1.75rem] border border-rose-100 bg-white/95 p-5 shadow-sm">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">女性カップ分布</h3>
                <p className="text-sm leading-6 text-slate-500">
                  対象は {femaleCupDistribution.total}人。
                  参考値は {femaleCupDistribution.referencePublisher}{" "}
                  {femaleCupDistribution.referenceYear}年の公開分布です。
                </p>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <DistributionSeriesCard
                  title={femaleCupDistribution.publicSeries.title}
                  total={femaleCupDistribution.total}
                  buckets={femaleCupDistribution.publicSeries.buckets}
                  tone="rose"
                  referencePrefix={(label) => {
                    const bucket = femaleCupDistribution.publicSeries.buckets.find(
                      (entry) => entry.label === label
                    );

                    if (!bucket) {
                      return null;
                    }

                    return bucket.referencePercentage === null
                      ? "参考分布: 公開比率の対象外"
                      : `参考分布: ${bucket.referencePercentage.toFixed(1)}%`;
                  }}
                />
                <DistributionSeriesCard
                  title={femaleCupDistribution.estimatedSeries.title}
                  total={femaleCupDistribution.total}
                  buckets={femaleCupDistribution.estimatedSeries.buckets}
                  tone="rose"
                />
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-sky-100 bg-white/95 p-5 shadow-sm">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">男性身長分布</h3>
                <p className="text-sm leading-6 text-slate-500">
                  対象は {maleHeightDistribution.total}人。参考統計は平均{" "}
                  {maleHeightDistribution.mean.toFixed(1)}cm / 標準偏差{" "}
                  {maleHeightDistribution.stddev.toFixed(1)} です。
                </p>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <DistributionSeriesCard
                  title={maleHeightDistribution.publicSeries.title}
                  total={maleHeightDistribution.total}
                  buckets={maleHeightDistribution.publicSeries.buckets}
                  tone="sky"
                />
                <DistributionSeriesCard
                  title={maleHeightDistribution.estimatedSeries.title}
                  total={maleHeightDistribution.total}
                  buckets={maleHeightDistribution.estimatedSeries.buckets}
                  tone="sky"
                />
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
