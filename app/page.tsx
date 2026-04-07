"use client";

import { useState, useRef } from "react";
import ImageUploader from "@/components/ImageUploader";
import AnalysisResultComponent from "@/components/AnalysisResult";
import LoadingAnimation from "@/components/LoadingAnimation";
import DisclaimerNotes from "@/components/DisclaimerNotes";
import ShareButtons from "@/components/ShareButtons";
import SafetyNotice from "@/components/SafetyNotice";
import SimilarCelebrities from "@/components/SimilarCelebrities";
import { hashFromImage, analyzeBody } from "@/lib/analyzer";
import { findSimilarCelebrities } from "@/lib/similarity";
import type { AnalysisResult } from "@/lib/analyzer";
import type { Celebrity } from "@/lib/similarity";

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [similarCelebs, setSimilarCelebs] = useState<
    { name: string; similarity: number }[]
  >([]);
  const pendingResultRef = useRef<{
    result: AnalysisResult;
    hash: number;
    celebs: { name: string; similarity: number }[];
  } | null>(null);

  const handleImageSelected = async (file: File) => {
    setIsAnalyzing(true);
    setResult(null);
    setSimilarCelebs([]);
    try {
      const h = await hashFromImage(file);
      const analysisResult = analyzeBody(h);

      // Fetch celebrities and find similar ones
      let similar: { name: string; similarity: number }[] = [];
      const basePath =
        process.env.NODE_ENV === "production" ? "/body-type-analyzer" : "";
      try {
        const res = await fetch(`${basePath}/data/celebrities.json`);
        const celebrities: Celebrity[] = await res.json();
        similar = findSimilarCelebrities(analysisResult, celebrities, h);
      } catch {
        // celebrities fetch failed — not critical
      }

      pendingResultRef.current = { result: analysisResult, hash: h, celebs: similar };
    } catch {
      setIsAnalyzing(false);
    }
  };

  const handleLoadingComplete = () => {
    if (pendingResultRef.current) {
      const { result: analysisResult, celebs } = pendingResultRef.current;
      setResult(analysisResult);
      setSimilarCelebs(celebs);
      pendingResultRef.current = null;
    }
    setIsAnalyzing(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-12">
      <main className="flex w-full max-w-lg flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            体型バランスAI診断
          </h1>
          <p className="mt-4 max-w-md text-lg text-slate-600">
            画像をアップロードするだけで、AIがあなたの体型バランスを偏差値で診断します
          </p>
        </div>

        <SafetyNotice />
        <ImageUploader onImageSelected={handleImageSelected} />

        {isAnalyzing && <LoadingAnimation onComplete={handleLoadingComplete} />}

        {result && (
          <>
            <AnalysisResultComponent result={result} />
            <DisclaimerNotes />
            <ShareButtons result={result} />
            {similarCelebs.length > 0 && (
              <SimilarCelebrities celebrities={similarCelebs} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
