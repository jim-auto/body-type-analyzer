"use client";

import { useEffect, useState } from "react";

type RankingEntry = {
  name: string;
  score: number;
  image: string;
};

type RankingCategory = {
  category: string;
  title: string;
  ranking: RankingEntry[];
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

export default function Home() {
  const [categories, setCategories] = useState<RankingCategory[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const basePath =
    process.env.NODE_ENV === "production" ? "/body-type-analyzer" : "";

  const resolveImageSrc = (src: string) =>
    src.startsWith("/") ? `${basePath}${src}` : src;

  useEffect(() => {
    fetch(`${basePath}/data/ranking.json`)
      .then((res) => res.json())
      .then((data: RankingCategory[]) => {
        setCategories(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg font-medium text-blue-600 animate-pulse">
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

  const current = categories[activeTab];

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-12 bg-gradient-to-b from-slate-50 to-white">
      <main className="w-full max-w-2xl space-y-8">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-800">
            Celebrity Body Balance Ranking
          </h1>
          <p className="text-base sm:text-lg text-slate-500">
            有名人の体型バランスを偏差値でランキング
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((cat, i) => (
            <button
              key={cat.category}
              onClick={() => setActiveTab(i)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                i === activeTab
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>

        {/* Ranking List */}
        {current && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-center text-slate-700">
              {current.title}
            </h2>
            {current.ranking.map((entry, i) => (
              <div
                key={entry.name}
                className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  {/* Rank badge */}
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-sm ${
                      medalColors[i] ?? "bg-slate-400 text-white"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {/* Avatar */}
                  <img
                    src={resolveImageSrc(entry.image)}
                    alt={entry.name}
                    className={`w-12 h-12 rounded-full object-cover ${
                      medalBorder[i] ?? ""
                    }`}
                  />
                  {/* Name */}
                  <span className="font-semibold text-slate-700">
                    {entry.name}
                  </span>
                </div>
                {/* Score badge */}
                <span
                  className={`rounded-full px-3 py-1 text-sm font-bold ${
                    medalColors[i] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {entry.score}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
