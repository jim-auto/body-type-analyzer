"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type RankingEntry = {
  name: string;
  score: number;
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

export default function RankingPage() {
  const [categories, setCategories] = useState<RankingCategory[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const basePath =
      process.env.NODE_ENV === "production" ? "/body-type-analyzer" : "";
    fetch(`${basePath}/data/ranking.json`)
      .then((res) => res.json())
      .then((data: RankingCategory[]) => {
        setCategories(data);
        setLoading(false);
      })
      .catch(() => {
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

  const current = categories[activeTab];

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-12">
      <main className="w-full max-w-lg space-y-8">
        <h1 className="text-3xl font-bold text-center text-slate-800">
          有名人体型バランスランキング
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 justify-center">
          {categories.map((cat, i) => (
            <button
              key={cat.category}
              onClick={() => setActiveTab(i)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                i === activeTab
                  ? "bg-blue-600 text-white"
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
                className="flex items-center justify-between rounded-xl bg-white p-4 shadow"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                      medalColors[i] ?? "bg-slate-400 text-white"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="font-semibold text-slate-700">
                    {entry.name}
                  </span>
                </div>
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

        <div className="text-center">
          <Link
            href="/"
            className="text-blue-600 underline hover:text-blue-800"
          >
            トップページへ戻る
          </Link>
        </div>
      </main>
    </div>
  );
}
