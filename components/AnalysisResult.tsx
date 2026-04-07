"use client";

import type { AnalysisResult as AnalysisResultType } from "@/lib/analyzer";

type Props = {
  result: AnalysisResultType;
};

const atmosphereLabel: Record<string, string> = {
  balanced: "バランス型",
  sharp: "シャープ",
  soft: "ソフト",
};

export default function AnalysisResult({ result }: Props) {
  const confidenceColor =
    result.aiConfidence < 25 ? "bg-red-400" : "bg-yellow-400";

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* シルエットタイプ */}
      <div className="text-center">
        <span className="inline-block rounded-full bg-blue-600 px-6 py-2 text-3xl font-bold text-white">
          {result.silhouetteType}タイプ
        </span>
      </div>

      {/* 偏差値 */}
      <div className="rounded-2xl bg-white shadow-lg p-6 text-center">
        <p className="text-sm text-slate-500 mb-1">体型バランス偏差値</p>
        <p className="text-6xl font-bold text-slate-800" data-testid="deviation-score">
          {result.deviationScore}
        </p>
        <p className="mt-2 text-lg font-medium text-blue-600" data-testid="percentile">
          上位 {result.percentile}%
        </p>
      </div>

      {/* 詳細グリッド */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-white shadow p-4">
          <p className="text-xs text-slate-400">上半身バランス</p>
          <p className="mt-1 text-lg font-semibold text-slate-700" data-testid="upper-body-balance">
            {result.upperBodyBalance}
          </p>
        </div>
        <div className="rounded-xl bg-white shadow p-4">
          <p className="text-xs text-slate-400">雰囲気</p>
          <p className="mt-1 text-lg font-semibold text-slate-700" data-testid="atmosphere">
            {atmosphereLabel[result.atmosphere] ?? result.atmosphere}
          </p>
        </div>
        <div className="rounded-xl bg-white shadow p-4">
          <p className="text-xs text-slate-400">カップサイズ</p>
          <p className="mt-1 text-lg font-semibold text-slate-700" data-testid="cup-size">
            {result.cupSize}
          </p>
        </div>
        <div className="rounded-xl bg-white shadow p-4">
          <p className="text-xs text-slate-400">AI信頼度</p>
          <p className="mt-1 text-lg font-semibold text-slate-700" data-testid="ai-confidence">
            {result.aiConfidence}%
          </p>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-200" data-testid="confidence-bar">
            <div
              className={`h-full rounded-full ${confidenceColor}`}
              style={{ width: `${result.aiConfidence}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
