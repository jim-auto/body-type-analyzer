import { seededRandom, analyzeBody, hashFromImage, AnalysisResult } from '../analyzer';

describe('seededRandom', () => {
  it('同じseedで同じ乱数列が返ること', () => {
    const rand1 = seededRandom(12345);
    const rand2 = seededRandom(12345);
    for (let i = 0; i < 10; i++) {
      expect(rand1()).toBe(rand2());
    }
  });

  it('異なるseedで異なる乱数列が返ること', () => {
    const rand1 = seededRandom(12345);
    const rand2 = seededRandom(67890);
    const values1 = Array.from({ length: 5 }, () => rand1());
    const values2 = Array.from({ length: 5 }, () => rand2());
    expect(values1).not.toEqual(values2);
  });

  it('返り値が 0〜1 の範囲内であること（100回ループで確認）', () => {
    const rand = seededRandom(42);
    for (let i = 0; i < 100; i++) {
      const val = rand();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  it('連続呼び出しで異なる値が返ること', () => {
    const rand = seededRandom(99999);
    const first = rand();
    const second = rand();
    const third = rand();
    // 3つ全て同じになる確率は実質ゼロ
    expect(new Set([first, second, third]).size).toBeGreaterThan(1);
  });
});

describe('analyzeBody', () => {
  it('同じhashで同じ結果が返ること（冪等性）', () => {
    const result1 = analyzeBody(12345);
    const result2 = analyzeBody(12345);
    expect(result1).toEqual(result2);
  });

  it('異なるhashで異なる結果が返ること', () => {
    const result1 = analyzeBody(11111);
    const result2 = analyzeBody(99999);
    // 全フィールドが一致する確率は極めて低い
    expect(result1).not.toEqual(result2);
  });

  it('silhouetteType が "X" | "I" | "A" のいずれかであること', () => {
    const result = analyzeBody(12345);
    expect(["X", "I", "A"]).toContain(result.silhouetteType);
  });

  it('deviationScore が 30〜74 の範囲であること', () => {
    const result = analyzeBody(12345);
    expect(result.deviationScore).toBeGreaterThanOrEqual(30);
    expect(result.deviationScore).toBeLessThanOrEqual(74);
  });

  it('aiConfidence が 15〜44 の範囲であること', () => {
    const result = analyzeBody(12345);
    expect(result.aiConfidence).toBeGreaterThanOrEqual(15);
    expect(result.aiConfidence).toBeLessThanOrEqual(44);
  });

  it('atmosphere が "balanced" | "sharp" | "soft" のいずれかであること', () => {
    const result = analyzeBody(12345);
    expect(["balanced", "sharp", "soft"]).toContain(result.atmosphere);
  });

  it('cupSize が A〜G のいずれかであること', () => {
    const result = analyzeBody(12345);
    expect(["A", "B", "C", "D", "E", "F", "G"]).toContain(result.cupSize);
  });

  it('percentile が正しく計算されること（100 - deviationScore）', () => {
    const result = analyzeBody(12345);
    expect(result.percentile).toBe(100 - result.deviationScore);
  });

  it('upperBodyBalance が定義済みの選択肢のいずれかであること', () => {
    const result = analyzeBody(12345);
    const options = ["やや上寄り", "標準", "やや下寄り", "上半身優位", "バランス型"];
    expect(options).toContain(result.upperBodyBalance);
  });

  it('多数のseedで範囲テスト（100個のseedでループして全て範囲内か確認）', () => {
    const validSilhouettes = ["X", "I", "A"];
    const validAtmospheres = ["balanced", "sharp", "soft"];
    const validCupSizes = ["A", "B", "C", "D", "E", "F", "G"];
    const validBalances = ["やや上寄り", "標準", "やや下寄り", "上半身優位", "バランス型"];

    for (let seed = 1; seed <= 100; seed++) {
      const result = analyzeBody(seed * 7919); // 素数で散らす
      expect(validSilhouettes).toContain(result.silhouetteType);
      expect(result.deviationScore).toBeGreaterThanOrEqual(30);
      expect(result.deviationScore).toBeLessThanOrEqual(74);
      expect(result.aiConfidence).toBeGreaterThanOrEqual(15);
      expect(result.aiConfidence).toBeLessThanOrEqual(44);
      expect(validAtmospheres).toContain(result.atmosphere);
      expect(validCupSizes).toContain(result.cupSize);
      expect(result.percentile).toBe(100 - result.deviationScore);
      expect(validBalances).toContain(result.upperBodyBalance);
    }
  });
});

describe('hashFromImage', () => {
  it('同じファイルで同じハッシュが返ること', async () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const file = new File([data], 'test.jpg', { type: 'image/jpeg' });
    const hash1 = await hashFromImage(file);
    // 同じ内容で新しいFileを作る
    const file2 = new File([new Uint8Array([1, 2, 3, 4, 5])], 'test.jpg', { type: 'image/jpeg' });
    const hash2 = await hashFromImage(file2);
    expect(hash1).toBe(hash2);
  });

  it('異なるファイルで異なるハッシュが返ること', async () => {
    const file1 = new File([new Uint8Array([1, 2, 3])], 'a.jpg', { type: 'image/jpeg' });
    const file2 = new File([new Uint8Array([4, 5, 6])], 'b.jpg', { type: 'image/jpeg' });
    const hash1 = await hashFromImage(file1);
    const hash2 = await hashFromImage(file2);
    expect(hash1).not.toBe(hash2);
  });

  it('返り値が number であること', async () => {
    const file = new File([new ArrayBuffer(100)], 'test.jpg', { type: 'image/jpeg' });
    const hash = await hashFromImage(file);
    expect(typeof hash).toBe('number');
  });
});
