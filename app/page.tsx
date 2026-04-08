"use client";

import { useEffect, useState } from "react";

type Gender = "female" | "male";

type RankingEntry = {
  name: string;
  score: number;
  image: string;
  cup?: string;
};

type RankingCategory = {
  category: string;
  title: string;
  ranking: RankingEntry[];
};

type RankingData = {
  female: RankingCategory[];
  male: RankingCategory[];
};

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
      .then((res) => res.json())
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
  const activeCategoryStyle =
    gender === "female"
      ? "bg-pink-500 text-white shadow-md"
      : "bg-blue-600 text-white shadow-md";

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-slate-50 to-white px-4 py-12">
      <main className="w-full max-w-2xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 sm:text-4xl">
            Celebrity Body Balance Ranking
          </h1>
          <p className="text-base text-slate-500 sm:text-lg">
            有名人の体型バランスを偏差値でランキング
          </p>
        </div>

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
          {categories.map((cat, index) => (
            <button
              key={`${gender}-${cat.category}`}
              type="button"
              onClick={() => setActiveTab(index)}
              aria-pressed={index === activeTab}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                index === activeTab
                  ? activeCategoryStyle
                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>

        {current ? (
          <div className="space-y-3">
            <h2 className="text-center text-xl font-bold text-slate-700">
              {current.title}
            </h2>
            {current.ranking.map((entry, index) => (
              <div
                key={`${gender}-${entry.name}`}
                className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-md transition-shadow hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-sm ${
                      medalColors[index] ?? "bg-slate-400 text-white"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <img
                    src={resolveImageSrc(entry.image)}
                    alt={entry.name}
                    className={`h-12 w-12 rounded-full object-cover ${
                      medalBorder[index] ?? ""
                    }`}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-700">
                      {entry.name}
                    </span>
                    {gender === "female" &&
                    entry.cup &&
                    entry.cup !== "非公表" ? (
                      <span className="rounded bg-pink-100 px-2 py-0.5 text-xs font-bold text-pink-700">
                        {entry.cup}カップ
                      </span>
                    ) : null}
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-bold ${
                    medalColors[index] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {entry.score}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
}
