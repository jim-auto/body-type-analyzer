import {
  buildFemaleCupDistributionSummary,
  buildMaleHeightDistributionSummary,
} from "@/lib/distributions";
import {
  getAdjustedEstimatedCup,
  getEstimatedHeight,
} from "@/lib/profile-estimates";
import { femaleProfilePool, maleProfilePool } from "@/lib/source-profiles";

describe("distributions", () => {
  test("female cup distribution covers all 100 profiles in both series", () => {
    const summary = buildFemaleCupDistributionSummary();
    const publicTotal = summary.publicSeries.buckets.reduce(
      (sum, bucket) => sum + bucket.count,
      0
    );
    const estimatedTotal = summary.estimatedSeries.buckets.reduce(
      (sum, bucket) => sum + bucket.count,
      0
    );

    expect(summary.total).toBe(100);
    expect(publicTotal).toBe(summary.total);
    expect(estimatedTotal).toBe(summary.total);
    expect(summary.publicSeries.buckets.map((bucket) => bucket.cup)).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
    ]);
    expect(summary.estimatedSeries.buckets.map((bucket) => bucket.cup)).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
    ]);
  });

  test("female cup distribution keeps the known public counts", () => {
    const summary = buildFemaleCupDistributionSummary();
    const counts = Object.fromEntries(
      summary.publicSeries.buckets.map((bucket) => [bucket.cup, bucket.count])
    );

    expect(counts).toEqual({
      A: 7,
      B: 22,
      C: 26,
      D: 22,
      E: 13,
      F: 6,
      G: 3,
      H: 1,
    });
    expect(
      summary.publicSeries.buckets.find((bucket) => bucket.cup === "H")
        ?.referencePercentage
    ).toBeNull();
  });

  test("female cup estimated series matches the adjusted estimate counts", () => {
    const summary = buildFemaleCupDistributionSummary();
    const expectedCounts = femaleProfilePool.reduce<Record<string, number>>(
      (result, entry) => {
        const estimatedCup = getAdjustedEstimatedCup(entry.bust, entry.cup);

        if (estimatedCup) {
          result[estimatedCup] = (result[estimatedCup] ?? 0) + 1;
        }

        return result;
      },
      {}
    );
    const actualCounts = Object.fromEntries(
      summary.estimatedSeries.buckets.map((bucket) => [bucket.cup, bucket.count])
    );

    expect(actualCounts).toEqual({
      A: expectedCounts.A ?? 0,
      B: expectedCounts.B ?? 0,
      C: expectedCounts.C ?? 0,
      D: expectedCounts.D ?? 0,
      E: expectedCounts.E ?? 0,
      F: expectedCounts.F ?? 0,
      G: expectedCounts.G ?? 0,
      H: expectedCounts.H ?? 0,
    });
  });

  test("male height distribution covers all 100 profiles in both series", () => {
    const summary = buildMaleHeightDistributionSummary();
    const publicTotal = summary.publicSeries.buckets.reduce(
      (sum, bucket) => sum + bucket.count,
      0
    );
    const estimatedTotal = summary.estimatedSeries.buckets.reduce(
      (sum, bucket) => sum + bucket.count,
      0
    );

    expect(summary.total).toBe(100);
    expect(publicTotal).toBe(summary.total);
    expect(estimatedTotal).toBe(summary.total);
    expect(summary.publicSeries.buckets).toHaveLength(6);
    expect(summary.estimatedSeries.buckets).toHaveLength(6);
  });

  test("male height distribution keeps the expected public bucket counts", () => {
    const summary = buildMaleHeightDistributionSummary();

    expect(summary.publicSeries.buckets.map((bucket) => bucket.count)).toEqual([
      0, 3, 32, 33, 28, 4,
    ]);
  });

  test("male height estimated series matches the estimated height bucket counts", () => {
    const summary = buildMaleHeightDistributionSummary();
    const expectedCounts = [0, 0, 0, 0, 0, 0];

    for (const entry of maleProfilePool) {
      const estimatedHeight = getEstimatedHeight(entry.actualHeight, entry.name);

      if (estimatedHeight < 165) {
        expectedCounts[0] += 1;
      } else if (estimatedHeight < 170) {
        expectedCounts[1] += 1;
      } else if (estimatedHeight < 175) {
        expectedCounts[2] += 1;
      } else if (estimatedHeight < 180) {
        expectedCounts[3] += 1;
      } else if (estimatedHeight < 185) {
        expectedCounts[4] += 1;
      } else {
        expectedCounts[5] += 1;
      }
    }

    expect(summary.estimatedSeries.buckets.map((bucket) => bucket.count)).toEqual(
      expectedCounts
    );
  });
});
