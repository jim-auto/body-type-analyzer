"use client";

import { useState } from "react";
import Link from "next/link";

import type {
  FemaleCupDistributionSummary,
  MaleHeightDistributionSummary,
} from "@/lib/distributions";
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
  maleHeightDistribution: MaleHeightDistributionSummary;
};

type DistributionBucket = {
  label: string;
  count: number;
  percentage: number;
};

const PAGE_SIZE = 20;

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

function getFemalePredictionText(entry: FemaleRankingEntry): string {
  if (!entry.estimatedCup) {
    return "AI推定: 実バスト非公表";
  }

  if (!entry.cup) {
    return `AI推定: ${entry.estimatedCup}カップ（実カップ非公表 🤔）`;
  }

  if (entry.cupDiff === null) {
    return `AI推定: ${entry.estimatedCup}カップ`;
  }

  const emoji = getMismatchEmoji(entry.cupDiff);
  return `AI推定: ${entry.estimatedCup}カップ（${formatSignedDifference(
    entry.cupDiff,
    "サイズ"
  )} ${emoji}）`;
}

function getMalePredictionText(entry: MaleRankingEntry): string {
  const emoji = getMismatchEmoji(entry.heightDiff);

  return `AI推定: ${entry.estimatedHeight}cm（${formatSignedDifference(
    entry.heightDiff,
    "cm"
  )} ${emoji}）`;
}

function getEstimatedHeightDetail(entry: RankingEntry): string {
  const emoji = getMismatchEmoji(entry.heightDiff);

  return `実際: ${entry.actualHeight}cm（差: ${formatSignedDifference(
    entry.heightDiff,
    "cm"
  )} ${emoji}）`;
}

function getEstimatedCupDetail(entry: FemaleRankingEntry): string {
  const actualCupText = entry.cup ? `${entry.cup}カップ` : "非公表";

  if (entry.cupDiff === null) {
    return `実際: ${actualCupText}（差: 不明 🤔）`;
  }

  const emoji = getMismatchEmoji(entry.cupDiff);

  return `実際: ${actualCupText}（差: ${formatSignedDifference(
    entry.cupDiff,
    "サイズ"
  )} ${emoji}）`;
}

function DistributionSeriesCard({
  title,
  buckets,
  tone,
  referencePrefix,
}: {
  title: string;
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
        <span className="text-xs text-slate-400">100人ベース</span>
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
  maleHeightDistribution,
}: HomePageClientProps) {
  const [gender, setGender] = useState<Gender>("female");
  const [activeTab, setActiveTab] = useState(0);
  const [activePage, setActivePage] = useState(0);
  const basePath =
    process.env.NODE_ENV === "production" ? "/body-type-analyzer" : "";

  const resolveImageSrc = (src: string) =>
    src.startsWith("/") ? `${basePath}${src}` : src;

  const handleGenderChange = (nextGender: Gender) => {
    setGender(nextGender);
    setActiveTab(0);
    setActivePage(0);
  };

  const handleCategoryChange = (nextTab: number) => {
    setActiveTab(nextTab);
    setActivePage(0);
  };

  const categories = data[gender];
  const current = categories[activeTab];
  const currentRanking = current?.ranking ?? [];
  const totalPages = Math.max(1, Math.ceil(currentRanking.length / PAGE_SIZE));
  const currentPage = Math.min(activePage, totalPages - 1);
  const pageStart = currentPage * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, currentRanking.length);
  const pagedRanking = currentRanking.slice(pageStart, pageEnd);
  const isEstimatedHeightCategory = current?.category === "estimatedHeight";
  const isEstimatedCupCategory = current?.category === "estimatedCup";
  const activeCategoryStyle =
    gender === "female"
      ? "bg-pink-500 text-white shadow-md"
      : "bg-blue-600 text-white shadow-md";

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
            推定値は公開データをもとに補正しつつ、画像診断は seed
            乱数ベースでそれっぽく返します。
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/analyze"
              className="inline-flex rounded-full bg-pink-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-pink-600"
            >
              AI診断をはじめる
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
                <p>
                  {currentRanking.length === 0
                    ? "0件"
                    : `${pageStart + 1}-${pageEnd}位 / ${currentRanking.length}人`}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActivePage((page) => Math.max(page - 1, 0))}
                    disabled={currentPage === 0}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 transition enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    前の20人
                  </button>
                  <span className="min-w-14 text-center font-semibold text-slate-500">
                    {currentPage + 1} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setActivePage((page) => Math.min(page + 1, totalPages - 1))
                    }
                    disabled={currentPage >= totalPages - 1}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 transition enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    次の20人
                  </button>
                </div>
              </div>
              {pagedRanking.map((entry, index) => {
                const absoluteIndex = pageStart + index;
                const femaleEntry =
                  gender === "female" && isFemaleEntry(entry) ? entry : null;
                const predictionText = isEstimatedHeightCategory
                  ? getEstimatedHeightDetail(entry)
                  : isEstimatedCupCategory && femaleEntry
                    ? getEstimatedCupDetail(femaleEntry)
                    : femaleEntry
                      ? getFemalePredictionText(femaleEntry)
                      : getMalePredictionText(entry as MaleRankingEntry);
                const scoreLabel = isEstimatedHeightCategory
                  ? `${entry.score}cm`
                  : isEstimatedCupCategory && femaleEntry?.estimatedCup
                    ? `${femaleEntry.estimatedCup}カップ`
                    : `偏差値${entry.score}`;

                return (
                  <div
                    key={`${gender}-${entry.name}`}
                    className="flex items-start justify-between rounded-2xl bg-white/95 p-3.5 shadow-sm ring-1 ring-slate-100 transition-shadow hover:shadow-md sm:p-4"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          medalColors[absoluteIndex] ?? defaultRankBadge
                        }`}
                      >
                        {absoluteIndex + 1}
                      </span>
                      <img
                        src={resolveImageSrc(entry.image)}
                        alt={entry.name}
                        className={`h-12 w-12 shrink-0 rounded-full object-cover ${
                          medalBorder[absoluteIndex] ?? defaultAvatarRing
                        }`}
                      />
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-700">
                            {entry.name}
                          </span>
                          {femaleEntry?.cup ? (
                            <span className="rounded bg-pink-100 px-2 py-0.5 text-xs font-bold text-pink-700">
                              {femaleEntry.cup}カップ
                            </span>
                          ) : null}
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                            {entry.actualHeight}cm
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{predictionText}</p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${
                        medalColors[absoluteIndex] ?? defaultScoreBadge
                      }`}
                    >
                      {scoreLabel}
                    </span>
                  </div>
                );
              })}
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
                  buckets={maleHeightDistribution.publicSeries.buckets}
                  tone="sky"
                />
                <DistributionSeriesCard
                  title={maleHeightDistribution.estimatedSeries.title}
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
