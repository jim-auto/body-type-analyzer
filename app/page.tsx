"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

export default function Home() {
  const [data, setData] = useState<RankingData | null>(null);
  const [gender, setGender] = useState<Gender>("female");
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const basePath =
    process.env.NODE_ENV === "production" ? "/body-type-analyzer" : "";

  const resolveImageSrc = (src: string) =>
    src.startsWith("/") ? `${basePath}${src}` : src;

  useEffect(() => {
    let isMounted = true;

    fetch(`${basePath}/data/ranking.json`)
      .then((response) => response.json())
      .then((nextData: RankingData) => {
        if (!isMounted) {
          return;
        }

        setData(nextData);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setError(true);
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [basePath]);

  const handleGenderChange = (nextGender: Gender) => {
    setGender(nextGender);
    setActiveTab(0);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="animate-pulse text-lg font-medium text-blue-600">
          読み込み中...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg font-medium text-red-600">
          データの読み込みに失敗しました
        </p>
      </div>
    );
  }

  const categories = data ? data[gender] : [];
  const current = categories[activeTab];
  const isEstimatedHeightCategory = current?.category === "estimatedHeight";
  const isEstimatedCupCategory = current?.category === "estimatedCup";
  const activeCategoryStyle =
    gender === "female"
      ? "bg-pink-500 text-white shadow-md"
      : "bg-blue-600 text-white shadow-md";

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-slate-50 to-white px-4 py-8 sm:py-12">
      <main className="w-full max-w-3xl space-y-8">
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
            画像をアップロードすると、seed 乱数ベースで身長とカップサイズをそれっぽく推定します。
          </p>
          <Link
            href="/analyze"
            className="mt-5 inline-flex rounded-full bg-pink-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-pink-600"
          >
            AI診断をはじめる
          </Link>
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

        <div className="flex flex-wrap justify-center gap-2">
          {categories.map((category, index) => (
            <button
              key={`${gender}-${category.category}`}
              type="button"
              onClick={() => setActiveTab(index)}
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
            {current.ranking.map((entry, index) => {
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
                        medalColors[index] ?? defaultRankBadge
                      }`}
                    >
                      {index + 1}
                    </span>
                    <img
                      src={resolveImageSrc(entry.image)}
                      alt={entry.name}
                      className={`h-12 w-12 shrink-0 rounded-full object-cover ${
                        medalBorder[index] ?? defaultAvatarRing
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
                      medalColors[index] ?? defaultScoreBadge
                    }`}
                  >
                    {scoreLabel}
                  </span>
                </div>
              );
            })}
          </div>
        ) : null}
      </main>
    </div>
  );
}
