export type AnalysisResult = {
  silhouetteType: "X" | "I" | "A";
  upperBodyBalance: string;
  deviationScore: number;
  aiConfidence: number;
  atmosphere: "balanced" | "sharp" | "soft";
  cupSize: string;
  percentile: number;
};

/**
 * FileReaderでArrayBufferとして読み込み、簡易ハッシュを計算する
 */
export function hashFromImage(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(buffer);
      let hash = 0;
      for (let i = 0; i < bytes.length; i++) {
        hash = (hash * 31 + bytes[i]) & 0xFFFFFFFF;
      }
      resolve(hash);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * xorshift32ベースの疑似乱数生成器を返すクロージャ
 */
export function seededRandom(seed: number): () => number {
  let s = seed === 0 ? 1 : seed; // xorshiftはseed=0だと0しか返さないので回避
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

/**
 * ハッシュ値から体型分析結果を生成する
 */
export function analyzeBody(hash: number): AnalysisResult {
  const rand = seededRandom(hash);

  const r1 = rand();
  const silhouetteType: "X" | "I" | "A" =
    r1 < 0.33 ? "X" : r1 < 0.66 ? "I" : "A";

  const balanceOptions = ["やや上寄り", "標準", "やや下寄り", "上半身優位", "バランス型"];
  const upperBodyBalance = balanceOptions[Math.floor(rand() * balanceOptions.length)];

  const deviationScore = Math.floor(rand() * 45) + 30;
  const aiConfidence = Math.floor(rand() * 30) + 15;

  const r5 = rand();
  const atmosphere: "balanced" | "sharp" | "soft" =
    r5 < 0.33 ? "balanced" : r5 < 0.66 ? "sharp" : "soft";

  const cupSizes = ["A", "B", "C", "D", "E", "F", "G"];
  const cupSize = cupSizes[Math.floor(rand() * 7)];

  const percentile = 100 - deviationScore;

  return {
    silhouetteType,
    upperBodyBalance,
    deviationScore,
    aiConfidence,
    atmosphere,
    cupSize,
    percentile,
  };
}
