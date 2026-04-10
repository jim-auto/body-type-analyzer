"use client";

import type { ChangeEvent, DragEvent } from "react";
import { useEffect, useRef, useState } from "react";

import {
  AI_LOADING_MESSAGES,
  DIAGNOSIS_DISCLAIMERS,
  DIAGNOSIS_MODEL_SUMMARY,
  DIAGNOSIS_VALIDATION_LABEL,
  type DiagnosisResult,
  type SilhouetteType,
  diagnose,
  extractDiagnosisFeatures,
} from "@/lib/image-analyzer";
import { DIAGNOSIS_MODEL_METRICS } from "@/lib/diagnosis-model";

const MESSAGE_INTERVAL_MS = 1500;

const silhouetteLabels: Record<SilhouetteType, string> = {
  X: "メリハリ型",
  I: "スラっと直線型",
  A: "下重心バランス型",
};

function getConfidenceBarClass(confidence: number): string {
  if (confidence < 25) {
    return "bg-gradient-to-r from-rose-500 to-orange-400";
  }

  if (confidence < 35) {
    return "bg-gradient-to-r from-orange-400 to-amber-400";
  }

  return "bg-gradient-to-r from-amber-400 to-yellow-300";
}

function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function formatErrorBound(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function formatCoverageText(
  rate: number,
  maxError: number,
  unit: string
): string {
  return `${Math.round(rate * 10)}割が±${formatErrorBound(maxError)}${unit}以内`;
}

const PERFORMANCE_SUMMARIES = [
  {
    title: "身長",
    value: `±${formatErrorBound(
      DIAGNOSIS_MODEL_METRICS.height.generalization.coverage[0]?.maxError ?? 0
    )}cm`,
    summary: `${Math.round(
      (DIAGNOSIS_MODEL_METRICS.height.generalization.coverage[0]?.rate ?? 0.7) * 10
    )}割がこの範囲`,
    exact: `完全一致 ${formatRate(
      DIAGNOSIS_MODEL_METRICS.height.generalization.exactRate
    )}`,
    mae: `平均誤差 ${formatErrorBound(DIAGNOSIS_MODEL_METRICS.height.generalization.mae)}cm`,
    validation: `固定テスト ${DIAGNOSIS_MODEL_METRICS.height.generalization.holdoutCount}件`,
  },
  {
    title: "カップ",
    value: `±${formatErrorBound(
      DIAGNOSIS_MODEL_METRICS.cup.generalization.coverage[0]?.maxError ?? 0
    )}カップ`,
    summary: `${Math.round(
      (DIAGNOSIS_MODEL_METRICS.cup.generalization.coverage[0]?.rate ?? 0.7) * 10
    )}割がこの範囲`,
    exact: `完全一致 ${formatRate(
      DIAGNOSIS_MODEL_METRICS.cup.generalization.exactRate
    )}`,
    mae: `平均誤差 ${formatErrorBound(DIAGNOSIS_MODEL_METRICS.cup.generalization.mae)}カップ`,
    validation: `固定テスト ${DIAGNOSIS_MODEL_METRICS.cup.generalization.holdoutCount}件`,
  },
] as const;

export default function AnalyzePage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const timeoutIdsRef = useRef<number[]>([]);
  const analysisRunRef = useRef(0);
  const basePath =
    process.env.NODE_ENV === "production" ? "/body-type-analyzer" : "";

  const resolveImageSrc = (src: string) =>
    src.startsWith("/") ? `${basePath}${src}` : src;

  const clearTimers = () => {
    timeoutIdsRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId);
    });
    timeoutIdsRef.current = [];
  };

  const revokePreviewUrl = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  };

  const updatePreviewUrl = (nextPreviewUrl: string | null) => {
    revokePreviewUrl();
    previewUrlRef.current = nextPreviewUrl;
    setPreviewUrl(nextPreviewUrl);
  };

  const runLoadingSequence = (nextResult: DiagnosisResult, runId: number) => {
    AI_LOADING_MESSAGES.forEach((_, index) => {
      const timeoutId = window.setTimeout(() => {
        if (runId !== analysisRunRef.current) {
          return;
        }

        setLoadingMessageIndex(index);
        setProgress(Math.min(95, 15 + index * 20));
      }, index * MESSAGE_INTERVAL_MS);

      timeoutIdsRef.current.push(timeoutId);
    });

    const finishTimeoutId = window.setTimeout(() => {
      if (runId !== analysisRunRef.current) {
        return;
      }

      setProgress(100);
      setResult(nextResult);
      setIsAnalyzing(false);
    }, AI_LOADING_MESSAGES.length * MESSAGE_INTERVAL_MS);

    timeoutIdsRef.current.push(finishTimeoutId);
  };

  const startAnalysis = async (file: File) => {
    const nextPreviewUrl = URL.createObjectURL(file);
    const runId = analysisRunRef.current + 1;

    analysisRunRef.current = runId;
    clearTimers();
    updatePreviewUrl(nextPreviewUrl);
    setSelectedFileName(file.name);
    setErrorMessage(null);
    setResult(null);
    setIsAnalyzing(true);
    setLoadingMessageIndex(0);
    setProgress(8);

    try {
      const features = await extractDiagnosisFeatures(file);

      if (runId !== analysisRunRef.current) {
        return;
      }

      runLoadingSequence(diagnose(features), runId);
    } catch {
      if (runId !== analysisRunRef.current) {
        return;
      }

      setIsAnalyzing(false);
      setProgress(0);
      setErrorMessage("画像の読み込みに失敗しました。別の画像でお試しください。");
    }
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage("画像ファイルを選択してください。");
      return;
    }

    void startAnalysis(file);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    handleFiles(event.dataTransfer.files);
  };

  useEffect(() => {
    return () => {
      analysisRunRef.current += 1;
      clearTimers();
      revokePreviewUrl();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.15),_transparent_35%),linear-gradient(180deg,_#fff7fb_0%,_#fffdf8_45%,_#f8fafc_100%)] px-4 py-8 sm:py-12">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <section className="overflow-hidden rounded-[2rem] border border-rose-100 bg-white/90 p-6 shadow-[0_24px_80px_-32px_rgba(244,114,182,0.45)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-bold tracking-[0.2em] text-rose-600">
                ENTERTAINMENT ONLY
              </span>
              <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                  AI診断
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                  画像を1枚アップロードすると、学習プロフィール画像から近い特徴を探して
                  身長とカップサイズを推定します。
                </p>
              </div>
            </div>

            <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                {DIAGNOSIS_MODEL_SUMMARY}
              </div>
              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 sm:col-span-2">
                {DIAGNOSIS_VALIDATION_LABEL}
              </div>
            </div>
          </div>
        </section>

        <section
          id="model-performance"
          aria-label="モデル性能"
          className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8"
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">モデル性能</h2>
              <p className="text-sm leading-6 text-slate-600 sm:text-base">
                学習プロフィール画像 {DIAGNOSIS_MODEL_METRICS.trainingCount} 枚から作った
                近傍比較モデルを、学習に使っていない固定テストで確認した結果です。
                完全一致より、数cm単位・1カップ単位でどこまで収まるかを中心に公開しています。
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
              <p>学習画像 {DIAGNOSIS_MODEL_METRICS.trainingCount} 枚</p>
              <p>身長 固定テスト {DIAGNOSIS_MODEL_METRICS.height.generalization.holdoutCount} 件</p>
              <p>カップ 固定テスト {DIAGNOSIS_MODEL_METRICS.cup.generalization.holdoutCount} 件</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {PERFORMANCE_SUMMARIES.map((item) => (
              <article
                key={item.title}
                className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] px-6 py-6"
              >
                <p className="text-sm font-semibold tracking-[0.2em] text-slate-400">
                  {item.title}
                </p>
                <p className="mt-3 text-4xl font-black text-slate-900">{item.value}</p>
                <p className="mt-2 text-base font-semibold text-slate-700">
                  {item.summary}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-500">
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {item.exact}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {item.mae}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {item.validation}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  画像アップロード
                </h2>
                <p className="text-sm text-slate-500">
                  ドラッグ&ドロップまたはクリックで画像を選択
                </p>
              </div>
              {selectedFileName ? (
                <span className="max-w-40 truncate rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {selectedFileName}
                </span>
              ) : null}
            </div>

            <label
              htmlFor="diagnosis-image"
              data-testid="upload-area"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex min-h-80 cursor-pointer flex-col items-center justify-center gap-4 rounded-[1.75rem] border border-dashed px-6 py-8 text-center transition ${
                isDragActive
                  ? "border-rose-400 bg-rose-50"
                  : "border-slate-300 bg-[linear-gradient(180deg,_rgba(248,250,252,0.9)_0%,_rgba(255,255,255,1)_100%)] hover:border-rose-300 hover:bg-rose-50/50"
              }`}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="アップロード画像のプレビュー"
                  className="h-52 w-full max-w-sm rounded-[1.5rem] object-cover shadow-md"
                />
              ) : (
                <div className="flex h-40 w-full max-w-sm items-center justify-center rounded-[1.5rem] bg-slate-100 text-5xl text-slate-400">
                  +
                </div>
              )}

              <div className="space-y-2">
                <p className="text-lg font-semibold text-slate-800">
                  画像をアップロード
                </p>
                <p className="text-sm leading-6 text-slate-500">
                  JPG / PNG / WebP などの画像に対応しています。
                  画像はブラウザ内でのみ処理され、サーバーには送信されません。
                </p>
              </div>

              <span className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                画像を選ぶ
              </span>
            </label>

            <input
              id="diagnosis-image"
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="診断する画像を選択"
              onChange={handleInputChange}
            />

            {errorMessage ? (
              <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {errorMessage}
              </p>
            ) : null}
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8">
            {isAnalyzing ? (
              <div className="space-y-5" aria-live="polite">
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-500">
                    Analyzing
                  </p>
                  <h2 className="text-2xl font-bold text-slate-900">
                    近いサンプルを検索中
                  </h2>
                  <p className="text-sm leading-6 text-slate-500">
                    {AI_LOADING_MESSAGES[loadingMessageIndex]}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 via-orange-400 to-amber-300 transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div
                    role="progressbar"
                    aria-label="AI診断の進捗"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                    className="text-sm font-medium text-slate-500"
                  >
                    進捗 {progress}%
                  </div>
                </div>

                <div className="grid gap-3 text-sm text-slate-500">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    画像から特徴量を抽出して近傍候補を比較しています。
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    途中表示は演出ですが、推定自体は固定モデルで計算しています。
                  </div>
                </div>
              </div>
            ) : result ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">
                    Complete
                  </p>
                  <h2 className="text-2xl font-bold text-slate-900">
                    診断結果
                  </h2>
                  <p className="text-sm leading-6 text-slate-500">
                    {DIAGNOSIS_MODEL_SUMMARY}から近いサンプルを探して推定しています。
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <article className="rounded-[1.5rem] bg-slate-950 px-5 py-5 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      推定身長
                    </p>
                    <p className="mt-3 text-4xl font-black">
                      {result.estimatedHeight}
                      <span className="ml-1 text-xl font-bold text-slate-300">
                        cm
                      </span>
                    </p>
                    <span className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-slate-200">
                      偏差値 {result.heightDeviation}
                    </span>
                  </article>

                  <article className="rounded-[1.5rem] bg-rose-50 px-5 py-5 text-slate-900 ring-1 ring-rose-100">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">
                      推定カップ
                    </p>
                    <p className="mt-3 text-4xl font-black">
                      {result.estimatedCup}
                      <span className="ml-1 text-xl font-bold text-slate-500">
                        カップ
                      </span>
                    </p>
                    <span className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold text-rose-500 ring-1 ring-rose-100">
                      偏差値 {result.cupDeviation}
                    </span>
                  </article>

                  <article className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      シルエットタイプ
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl font-black text-amber-700">
                        {result.silhouetteType}
                      </span>
                      <div>
                        <p className="text-lg font-bold text-slate-900">
                          {silhouetteLabels[result.silhouetteType]}
                        </p>
                        <p className="text-sm text-slate-500">
                          推定身長と推定カップの組み合わせから分類しています。
                        </p>
                      </div>
                    </div>
                  </article>

                  <article className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      AI信頼度
                    </p>
                    <p className="mt-3 text-4xl font-black text-slate-900">
                      {result.confidence}
                      <span className="ml-1 text-xl font-bold text-slate-400">
                        %
                      </span>
                    </p>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${getConfidenceBarClass(
                          result.confidence
                        )}`}
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      近傍の距離と投票のまとまり具合から算出しています。
                    </p>
                  </article>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col justify-between gap-6">
                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Ready
                  </p>
                  <h2 className="text-2xl font-bold text-slate-900">
                    診断待機中
                  </h2>
                  <p className="text-sm leading-6 text-slate-500">
                    画像から特徴量を抽出し、学習プロフィール画像の近傍を検索します。
                    同じ画像なら同じ特徴量になり、近い結果になります。
                  </p>
                </div>

                <div className="grid gap-3 text-sm text-slate-500">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    カップ推定は上半身寄り、身長推定は全体寄りの特徴を使います。
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    固定テストの検証値も公開しています。
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    結果は類似有名人や注意書きとあわせて画面内で確認できます。
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {result ? (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8">
              <div className="mb-5 space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">
                  あなたに近い有名人
                </h2>
                <p className="text-sm leading-6 text-slate-500">
                  学習に使ったプロフィール画像の近傍から候補を出しています。
                </p>
              </div>

              <div className="space-y-4">
                {result.similarCelebrities.map((celebrity) => (
                  <article
                    key={celebrity.name}
                    className="flex items-center gap-4 rounded-[1.5rem] border border-slate-100 bg-slate-50 px-4 py-4"
                  >
                    <img
                      src={resolveImageSrc(celebrity.image)}
                      alt={celebrity.name}
                      className="h-16 w-16 rounded-2xl object-cover ring-1 ring-slate-200"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-slate-900">
                          {celebrity.name}
                        </p>
                        <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                          {celebrity.actualHeight}cm / {celebrity.cup}カップ
                        </span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-300"
                          style={{ width: `${celebrity.similarity}%` }}
                        />
                      </div>
                    </div>
                    <span className="shrink-0 text-lg font-black text-slate-900">
                      {celebrity.similarity}%
                    </span>
                  </article>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur sm:p-8">
                <div className="mb-5 space-y-2">
                  <h2 className="text-2xl font-bold text-slate-900">
                    診断の見方
                  </h2>
                  <p className="text-sm leading-6 text-slate-500">
                    診断結果はこの画面で確認する前提にしています。共有やコピーの機能は出していません。
                  </p>
                </div>

                <p className="text-sm leading-6 text-slate-500">
                  診断結果は画面上で確認できます。共有やコピーの機能は表示していません。
                </p>
              </section>

              <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-amber-900">免責表示</h2>
                <div className="mt-4 space-y-3 text-sm leading-6 text-amber-900/80">
                  {DIAGNOSIS_DISCLAIMERS.map((disclaimer) => (
                    <p key={disclaimer}>{disclaimer}</p>
                  ))}
                </div>
              </section>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
