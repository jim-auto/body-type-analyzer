import type { AnalysisResult } from "./analyzer";

const APP_URL = "https://jim-auto.github.io/body-type-analyzer/";

export function generateShareText(result: AnalysisResult): string {
  return `体型バランス偏差値 ${result.deviationScore}（上位${result.percentile}%）でした！\nシルエットタイプ: ${result.silhouetteType}\n#体型バランスAI診断`;
}

export function generateCopyText(result: AnalysisResult): string {
  return `【体型バランスAI診断】
シルエットタイプ: ${result.silhouetteType}
体型バランス偏差値: ${result.deviationScore}
上位 ${result.percentile}%
雰囲気: ${result.atmosphere}
AI信頼度: ${result.aiConfidence}%

#体型バランスAI診断
${APP_URL}`;
}

export function generateXShareUrl(result: AnalysisResult): string {
  const shareText = generateShareText(result);
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(APP_URL)}`;
}
