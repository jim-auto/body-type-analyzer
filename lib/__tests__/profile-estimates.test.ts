import {
  getAdjustedEstimatedCup,
  getCupDifference,
  getEstimatedHeight,
} from "@/lib/profile-estimates";
import { femaleProfilePool, maleProfilePool } from "@/lib/source-profiles";

function mean(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

describe("profile-estimates", () => {
  test("estimated height stays deterministic for the same name", () => {
    expect(getEstimatedHeight(168, "橋本マナミ")).toBe(
      getEstimatedHeight(168, "橋本マナミ")
    );
  });

  test("estimated height stays within a tighter +/-1cm band", () => {
    const estimatedHeight = getEstimatedHeight(168, "橋本マナミ");

    expect(Math.abs(estimatedHeight - 168)).toBeLessThanOrEqual(1);
  });

  test("adjusted estimated cup returns null when bust is unknown", () => {
    expect(getAdjustedEstimatedCup(null, "C")).toBeNull();
  });

  test("adjusted estimated cup trusts actual cup when bust is in the typical band", () => {
    expect(getAdjustedEstimatedCup(85, "D")).toBe("D");
    expect(getAdjustedEstimatedCup(80, "E")).toBe("E");
  });

  test("adjusted estimated cup can still stay one size off for bust outliers", () => {
    expect(getAdjustedEstimatedCup(88, "C")).toBe("D");
    expect(getAdjustedEstimatedCup(70, "B")).toBe("C");
  });

  test("cup difference supports H cup comparisons", () => {
    expect(getCupDifference("H", "H")).toBe(0);
    expect(getCupDifference("H", "G")).toBe(-1);
    expect(getCupDifference("K", "I")).toBe(-2);
  });

  test("height calibration keeps dataset-wide mean absolute error low", () => {
    const femaleHeightMae = mean(
      femaleProfilePool.map((profile) =>
        Math.abs(getEstimatedHeight(profile.actualHeight, profile.name) - profile.actualHeight)
      )
    );
    const maleHeightMae = mean(
      maleProfilePool.map((profile) =>
        Math.abs(getEstimatedHeight(profile.actualHeight, profile.name) - profile.actualHeight)
      )
    );

    expect(femaleHeightMae).toBeLessThanOrEqual(0.21);
    expect(maleHeightMae).toBeLessThanOrEqual(0.2);
  });

  test("cup calibration keeps dataset-wide mean absolute error low", () => {
    const cupDiffs = femaleProfilePool
      .map((profile) => getCupDifference(profile.cup, getAdjustedEstimatedCup(profile.bust, profile.cup)))
      .filter((value): value is number => value !== null);

    expect(mean(cupDiffs.map((value) => Math.abs(value)))).toBeLessThanOrEqual(0.1);
  });
});
