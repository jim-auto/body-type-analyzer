"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/analyzer";
import { generateCopyText, generateXShareUrl } from "@/lib/share";

type Props = {
  result: AnalysisResult;
};

export default function ShareButtons({ result }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = generateCopyText(result);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const xShareUrl = generateXShareUrl(result);

  return (
    <div className="w-full max-w-md mx-auto flex gap-4 mt-6">
      <button
        onClick={handleCopy}
        className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        data-testid="copy-button"
      >
        {copied ? "コピーしました！" : "結果をコピー"}
      </button>
      <a
        href={xShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white text-center hover:bg-slate-800 transition-colors"
        data-testid="x-share-link"
      >
        Xでシェア
      </a>
    </div>
  );
}
