import {
  buildShareText,
  buildXShareUrl,
  diagnose,
  hashFromImage,
  seededRandom,
} from "@/lib/image-analyzer";

const VALID_CUPS = new Set(["A", "B", "C", "D", "E", "F", "G", "H"]);
const VALID_SILHOUETTES = new Set(["X", "I", "A"]);

const createImageFile = (content: string, name = "sample.png") =>
  new File([content], name, { type: "image/png" });

describe("image-analyzer", () => {
  test("hashFromImage は同じファイルで同じハッシュを返す", async () => {
    const file = createImageFile("same-image");

    await expect(hashFromImage(file)).resolves.toBe(await hashFromImage(file));
  });

  test("hashFromImage は異なるファイルで異なるハッシュを返す", async () => {
    const first = createImageFile("first-image");
    const second = createImageFile("second-image");

    expect(await hashFromImage(first)).not.toBe(await hashFromImage(second));
  });

  test("seededRandom は同じ seed で同じ乱数列を返す", () => {
    const first = seededRandom(12345);
    const second = seededRandom(12345);

    expect([first(), first(), first(), first(), first()]).toEqual([
      second(),
      second(),
      second(),
      second(),
      second(),
    ]);
  });

  test("seededRandom は異なる seed で異なる乱数列を返す", () => {
    const first = seededRandom(12345);
    const second = seededRandom(54321);

    expect([first(), first(), first()]).not.toEqual([
      second(),
      second(),
      second(),
    ]);
  });

  test("seededRandom の返り値は 0 以上 1 未満に収まる", () => {
    const random = seededRandom(98765);
    const values = Array.from({ length: 100 }, () => random());

    values.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });
  });

  test("diagnose は同じ hash で同じ結果を返す", () => {
    expect(diagnose(123456789)).toEqual(diagnose(123456789));
  });

  test("diagnose は異なる hash で異なる結果を返す", () => {
    expect(diagnose(111111111)).not.toEqual(diagnose(222222222));
  });

  test("diagnose の estimatedHeight は 140〜190 の範囲に収まる", () => {
    const result = diagnose(13579);

    expect(result.estimatedHeight).toBeGreaterThanOrEqual(140);
    expect(result.estimatedHeight).toBeLessThanOrEqual(190);
  });

  test("diagnose の estimatedCup は A〜H のいずれかになる", () => {
    const result = diagnose(24680);

    expect(VALID_CUPS.has(result.estimatedCup)).toBe(true);
  });

  test("diagnose の heightDeviation は 20〜80 の範囲に収まる", () => {
    const result = diagnose(1234);

    expect(result.heightDeviation).toBeGreaterThanOrEqual(20);
    expect(result.heightDeviation).toBeLessThanOrEqual(80);
  });

  test("diagnose の cupDeviation は 20〜80 の範囲に収まる", () => {
    const result = diagnose(5678);

    expect(result.cupDeviation).toBeGreaterThanOrEqual(20);
    expect(result.cupDeviation).toBeLessThanOrEqual(80);
  });

  test("diagnose の confidence は 15〜44 の範囲に収まる", () => {
    const result = diagnose(9999);

    expect(result.confidence).toBeGreaterThanOrEqual(15);
    expect(result.confidence).toBeLessThanOrEqual(44);
  });

  test('diagnose の silhouetteType は "X" | "I" | "A" のいずれかになる', () => {
    const result = diagnose(424242);

    expect(VALID_SILHOUETTES.has(result.silhouetteType)).toBe(true);
  });

  test("diagnose の similarCelebrity は空文字ではない", () => {
    const result = diagnose(20260408);

    expect(result.similarCelebrity).not.toBe("");
  });

  test("diagnose の similarCelebrities は 1〜3 件返り、先頭が similarCelebrity と一致する", () => {
    const result = diagnose(31415926);

    expect(result.similarCelebrities.length).toBeGreaterThanOrEqual(1);
    expect(result.similarCelebrities.length).toBeLessThanOrEqual(3);
    expect(result.similarCelebrities[0]?.name).toBe(result.similarCelebrity);

    result.similarCelebrities.forEach((celebrity) => {
      expect(celebrity.similarity).toBeGreaterThanOrEqual(52);
      expect(celebrity.similarity).toBeLessThanOrEqual(97);
    });
  });

  test("buildShareText はシェア文に主要な結果を含める", () => {
    const result = diagnose(808080);
    const shareText = buildShareText(result);

    expect(shareText).toContain("【芸能人スタイルランキング AI診断】");
    expect(shareText).toContain(`推定身長: ${result.estimatedHeight}cm`);
    expect(shareText).toContain(`推定カップ: ${result.estimatedCup}カップ`);
    expect(shareText).toContain(`似ている有名人: ${result.similarCelebrity}`);
    expect(shareText).toContain("#芸能人スタイルランキング");
  });

  test("buildXShareUrl は X シェア URL を返す", () => {
    const result = diagnose(909090);
    const url = buildXShareUrl(result);

    expect(url).toContain("https://x.com/intent/tweet?text=");
    expect(url).toContain(encodeURIComponent(result.similarCelebrity));
  });

  test("100 個の hash を診断しても各値が範囲内に収まる", () => {
    Array.from({ length: 100 }, (_, index) => diagnose(index + 1)).forEach(
      (result) => {
        expect(result.estimatedHeight).toBeGreaterThanOrEqual(140);
        expect(result.estimatedHeight).toBeLessThanOrEqual(190);
        expect(VALID_CUPS.has(result.estimatedCup)).toBe(true);
        expect(result.heightDeviation).toBeGreaterThanOrEqual(20);
        expect(result.heightDeviation).toBeLessThanOrEqual(80);
        expect(result.cupDeviation).toBeGreaterThanOrEqual(20);
        expect(result.cupDeviation).toBeLessThanOrEqual(80);
        expect(result.confidence).toBeGreaterThanOrEqual(15);
        expect(result.confidence).toBeLessThanOrEqual(44);
        expect(VALID_SILHOUETTES.has(result.silhouetteType)).toBe(true);
        expect(result.similarCelebrity).not.toBe("");
      }
    );
  });
});
