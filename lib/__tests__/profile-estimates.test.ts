import {
  getAdjustedEstimatedCup,
  getCupDifference,
  getEstimatedHeight,
} from "@/lib/profile-estimates";

describe("profile-estimates", () => {
  test("estimated height stays deterministic for the same name", () => {
    expect(getEstimatedHeight(168, "橋本マナミ")).toBe(
      getEstimatedHeight(168, "橋本マナミ")
    );
  });

  test("estimated height stays within a tighter +/-4cm band", () => {
    const estimatedHeight = getEstimatedHeight(168, "橋本マナミ");

    expect(Math.abs(estimatedHeight - 168)).toBeLessThanOrEqual(4);
  });

  test("adjusted estimated cup returns null when bust is unknown", () => {
    expect(getAdjustedEstimatedCup(null, "C")).toBeNull();
  });

  test("adjusted estimated cup fully corrects very large misses", () => {
    expect(getAdjustedEstimatedCup(89, "H")).toBe("H");
  });

  test("adjusted estimated cup leaves a one-size gap for medium misses", () => {
    expect(getAdjustedEstimatedCup(88, "F")).toBe("E");
  });

  test("cup difference supports H cup comparisons", () => {
    expect(getCupDifference("H", "H")).toBe(0);
    expect(getCupDifference("H", "G")).toBe(-1);
  });
});
