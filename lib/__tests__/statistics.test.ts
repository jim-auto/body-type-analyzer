import {
  CUP_DISTRIBUTION,
  FEMALE_STATS,
  MALE_STATS,
  bustToEstimatedCup,
  calculateCupDeviation,
  calculateDeviation,
} from "@/lib/statistics";
import { EXTENDED_CUP_ORDER } from "@/lib/cup-order";

describe("statistics", () => {
  test("calculateDeviation returns 50 at the mean", () => {
    expect(calculateDeviation(158, 158, 5.4)).toBe(50);
  });

  test("calculateDeviation returns 60 at plus one standard deviation", () => {
    expect(calculateDeviation(163.4, 158, 5.4)).toBe(60);
  });

  test("calculateDeviation returns 40 at minus one standard deviation", () => {
    expect(calculateDeviation(152.6, 158, 5.4)).toBe(40);
  });

  test("calculateDeviation returns 70 at plus two standard deviations", () => {
    expect(calculateDeviation(168.8, 158, 5.4)).toBe(70);
  });

  test("female height statistics stay fixed", () => {
    expect(FEMALE_STATS.height.mean).toBe(158.0);
    expect(FEMALE_STATS.height.stddev).toBe(5.4);
  });

  test("female bust statistics stay fixed", () => {
    expect(FEMALE_STATS.bust.mean).toBe(84.1);
    expect(FEMALE_STATS.bust.stddev).toBe(4.5);
  });

  test("male height statistics stay fixed", () => {
    expect(MALE_STATS.height.mean).toBe(171.0);
    expect(MALE_STATS.height.stddev).toBe(5.8);
  });

  test("163 cm female height is above average", () => {
    expect(calculateDeviation(163, 158, 5.4)).toBe(59);
  });

  test("181 cm male height is above average", () => {
    expect(calculateDeviation(181, 171, 5.8)).toBe(67);
  });

  test("bustToEstimatedCup returns a larger cup for 94 cm", () => {
    expect(["E", "F", "G"]).toContain(bustToEstimatedCup(94));
  });

  test("bustToEstimatedCup returns a relatively small cup for 80 cm", () => {
    expect(["B", "C"]).toContain(bustToEstimatedCup(80));
  });

  test("bustToEstimatedCup returns a middle range cup for 88 cm", () => {
    expect(["C", "D", "E"]).toContain(bustToEstimatedCup(88));
  });

  test("bustToEstimatedCup changes across different bust values", () => {
    expect(bustToEstimatedCup(80)).not.toBe(bustToEstimatedCup(94));
  });

  test("bustToEstimatedCup spreads across several labels", () => {
    const cups = [65, 80, 88, 94].map((bust) => bustToEstimatedCup(bust));
    expect(new Set(cups).size).toBeGreaterThan(2);
  });

  test("cup distribution stays normalized", () => {
    const total = Object.values(CUP_DISTRIBUTION).reduce(
      (sum, value) => sum + value,
      0
    );

    expect(total).toBeGreaterThanOrEqual(0.95);
    expect(total).toBeLessThanOrEqual(1.05);
  });

  test("C cup stays near the population center", () => {
    expect(calculateCupDeviation("C")).toBeGreaterThanOrEqual(48);
    expect(calculateCupDeviation("C")).toBeLessThanOrEqual(52);
  });

  test("G cup is clearly above average", () => {
    expect(calculateCupDeviation("G")).toBeGreaterThanOrEqual(60);
  });

  test("J cup is above H cup", () => {
    expect(calculateCupDeviation("J")).toBeGreaterThan(
      calculateCupDeviation("H")
    );
  });

  test("A cup is clearly below average", () => {
    expect(calculateCupDeviation("A")).toBeLessThanOrEqual(40);
  });

  test("larger cups always receive larger deviation scores", () => {
    const cups = EXTENDED_CUP_ORDER.slice(0, 10);
    const deviations = cups.map((cup) => calculateCupDeviation(cup));

    deviations.slice(1).forEach((score, index) => {
      expect(score).toBeGreaterThan(deviations[index]);
    });
  });
});
