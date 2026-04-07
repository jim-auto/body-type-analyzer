import { generateShareText, generateCopyText, generateXShareUrl } from "../share";
import type { AnalysisResult } from "../analyzer";

const mockResult: AnalysisResult = {
  silhouetteType: "X",
  upperBodyBalance: "標準",
  deviationScore: 55,
  aiConfidence: 30,
  atmosphere: "balanced",
  cupSize: "C",
  percentile: 45,
};

describe("generateShareText", () => {
  it("シルエットタイプを含むこと", () => {
    const text = generateShareText(mockResult);
    expect(text).toContain("X");
    expect(text).toContain("シルエットタイプ");
  });

  it("偏差値を含むこと", () => {
    const text = generateShareText(mockResult);
    expect(text).toContain("55");
  });

  it("ハッシュタグを含むこと", () => {
    const text = generateShareText(mockResult);
    expect(text).toContain("#体型バランスAI診断");
  });

  it("パーセンタイルを含むこと", () => {
    const text = generateShareText(mockResult);
    expect(text).toContain("45%");
  });
});

describe("generateCopyText", () => {
  it("全フィールドを含むこと", () => {
    const text = generateCopyText(mockResult);
    expect(text).toContain("X");
    expect(text).toContain("55");
    expect(text).toContain("45%");
    expect(text).toContain("balanced");
    expect(text).toContain("30%");
  });

  it("URLを含むこと", () => {
    const text = generateCopyText(mockResult);
    expect(text).toContain("https://jim-auto.github.io/body-type-analyzer/");
  });

  it("タイトルを含むこと", () => {
    const text = generateCopyText(mockResult);
    expect(text).toContain("【体型バランスAI診断】");
  });

  it("ハッシュタグを含むこと", () => {
    const text = generateCopyText(mockResult);
    expect(text).toContain("#体型バランスAI診断");
  });
});

describe("generateXShareUrl", () => {
  it("twitter.com/intent/tweetで始まること", () => {
    const url = generateXShareUrl(mockResult);
    expect(url).toMatch(/^https:\/\/twitter\.com\/intent\/tweet/);
  });

  it("エンコードされたテキストを含むこと", () => {
    const url = generateXShareUrl(mockResult);
    const shareText = generateShareText(mockResult);
    expect(url).toContain(encodeURIComponent(shareText));
  });

  it("エンコードされたURLを含むこと", () => {
    const url = generateXShareUrl(mockResult);
    expect(url).toContain(
      encodeURIComponent("https://jim-auto.github.io/body-type-analyzer/")
    );
  });

  it("textパラメータを含むこと", () => {
    const url = generateXShareUrl(mockResult);
    expect(url).toContain("text=");
  });

  it("urlパラメータを含むこと", () => {
    const url = generateXShareUrl(mockResult);
    expect(url).toContain("url=");
  });
});
