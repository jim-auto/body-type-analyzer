import {
  FEMALE_STATS,
  MALE_STATS,
  bustToEstimatedCup,
  calculateDeviation,
} from "@/lib/statistics";

describe("statistics", () => {
  test("calculateDeviationは平均値で偏差値50になる", () => {
    expect(calculateDeviation(158, 158, 5.4)).toBe(50);
  });

  test("calculateDeviationは平均+1σで偏差値60になる", () => {
    expect(calculateDeviation(163.4, 158, 5.4)).toBe(60);
  });

  test("calculateDeviationは平均-1σで偏差値40になる", () => {
    expect(calculateDeviation(152.6, 158, 5.4)).toBe(40);
  });

  test("calculateDeviationは平均+2σで偏差値70になる", () => {
    expect(calculateDeviation(168.8, 158, 5.4)).toBe(70);
  });

  test("FEMALE_STATS.height.meanは158.0である", () => {
    expect(FEMALE_STATS.height.mean).toBe(158.0);
  });

  test("FEMALE_STATS.height.stddevは5.4である", () => {
    expect(FEMALE_STATS.height.stddev).toBe(5.4);
  });

  test("FEMALE_STATS.bust.meanは84.1である", () => {
    expect(FEMALE_STATS.bust.mean).toBe(84.1);
  });

  test("FEMALE_STATS.bust.stddevは4.5である", () => {
    expect(FEMALE_STATS.bust.stddev).toBe(4.5);
  });

  test("MALE_STATS.height.meanは171.0である", () => {
    expect(MALE_STATS.height.mean).toBe(171.0);
  });

  test("MALE_STATS.height.stddevは5.8である", () => {
    expect(MALE_STATS.height.stddev).toBe(5.8);
  });

  test("深田恭子の身長163cmは偏差値59になる", () => {
    expect(calculateDeviation(163, 158, 5.4)).toBe(59);
  });

  test("福山雅治の身長181cmは偏差値67になる", () => {
    expect(calculateDeviation(181, 171, 5.8)).toBe(67);
  });

  test("bustToEstimatedCupは94cmで大きいカップを返す", () => {
    expect(["E", "F", "G"]).toContain(bustToEstimatedCup(94));
  });

  test("bustToEstimatedCupは80cmで標準的なカップを返す", () => {
    expect(["B", "C"]).toContain(bustToEstimatedCup(80));
  });

  test("bustToEstimatedCupは88cmで中〜大きめのカップを返す", () => {
    expect(["C", "D", "E"]).toContain(bustToEstimatedCup(88));
  });

  test("bustToEstimatedCupは異なるバストサイズで異なるカップを返す", () => {
    expect(bustToEstimatedCup(80)).not.toBe(bustToEstimatedCup(94));
  });

  test("bustToEstimatedCupは複数入力で同じ値に固定されない", () => {
    const cups = [65, 80, 88, 94].map((bust) => bustToEstimatedCup(bust));
    expect(new Set(cups).size).toBeGreaterThan(2);
  });
});
