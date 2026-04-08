"use client";

import type { ChangeEvent, DragEvent } from "react";
import { useEffect, useRef, useState } from "react";

import {
  AI_LOADING_MESSAGES,
  DIAGNOSIS_DISCLAIMERS,
  type DiagnosisResult,
  type SilhouetteType,
  buildShareText,
  buildXShareUrl,
  diagnose,
  hashFromImage,
} from "@/lib/image-analyzer";

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

export default function AnalyzePage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const previewUrlRef = useRef<string | null>(null);
  const timeoutIdsRef = useRef<number[]>([]);
  const analysisRunRef = useRef(0);
  const basePath =
    process.env.NODE_ENV === "production" ? "/body-type-analyzer" : "";

  const shareText = result ? buildShareText(result) : "";

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
    setCopyMessage("");
    setResult(null);
    setIsAnalyzing(true);
    setLoadingMessageIndex(0);
    setProgress(8);

    try {
      const hash = await hashFromImage(file);

      if (runId !== analysisRunRef.current) {
        return;
      }

      runLoadingSequence(diagnose(hash), runId);
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

  const handleCopy = async () => {
    if (!result) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
      } else {
        const textArea = document.createElement("textarea");

        textArea.value = shareText;
        textArea.setAttribute("readonly", "true");
        textArea.style.position = "absolute";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopyMessage("結果テキストをコピーしました。");
    } catch {
      setCopyMessage("コピーに失敗しました。");
    }
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
                  画像を1枚アップロードすると、AIっぽい顔で身長とカップサイズを推定します。
                  もちろん真面目そうに見せているだけです。
                </p>
              </div>
            </div>

            <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                ⚠ 本人の画像のみ使用してください
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                結果はエンタメ目的です
              </div>
            </div>
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
                    AIがかなり真剣に診断中
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
                    解析精度より演出を優先しています。
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    それっぽい計算をしているように見せかけています。
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
                    ハッシュと seed 乱数から、もっともらしい値を決定論的に返しています。
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
                          X / I / A のどれかを雰囲気で選んでいます。
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
                      低めなのは仕様です。AIもそこまで自信はありません。
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
                    画像を選ぶと、ハッシュから seed を作って毎回同じ結果を返します。
                    同じ画像なら同じ診断になります。
                  </p>
                </div>

                <div className="grid gap-3 text-sm text-slate-500">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    ネタローディング演出つきで診断します。
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    結果はあとからコピーして X にシェアできます。
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    免責表示は結果欄にも明示します。
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
                  ランキングデータから、身長とカップサイズが近い候補を抽出しました。
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
                    シェアする
                  </h2>
                  <p className="text-sm leading-6 text-slate-500">
                    診断結果はテキストでコピーするか、X にそのまま投稿できます。
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    結果テキストをコピー
                  </button>
                  <a
                    href={buildXShareUrl(result)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
                  >
                    Xでシェア
                  </a>
                </div>

                {copyMessage ? (
                  <p role="status" className="mt-4 text-sm text-emerald-600">
                    {copyMessage}
                  </p>
                ) : null}

                <textarea
                  readOnly
                  aria-label="シェア文"
                  value={shareText}
                  rows={8}
                  className="mt-5 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600 outline-none"
                />
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
