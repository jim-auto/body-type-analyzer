import {
  buildFemaleCupDistributionSummary,
  buildMaleHeightDistributionSummary,
} from "@/lib/distributions";
import {
  getFemaleRankingEstimatedCup,
  getMaleRankingEstimatedHeight,
} from "@/lib/ranking-estimates";
import { femaleProfilePool, maleProfilePool } from "@/lib/source-profiles";

describe("distributions", () => {
  test("female cup distribution covers all female profiles in both series", () => {
    const summary = buildFemaleCupDistributionSummary();
    const publicTotal = summary.publicSeries.buckets.reduce(
      (sum, bucket) => sum + bucket.count,
      0
    );
    const estimatedTotal = summary.estimatedSeries.buckets.reduce(
      (sum, bucket) => sum + bucket.count,
      0
    );

    expect(summary.total).toBe(femaleProfilePool.length);
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

  test("female cup distribution public series matches source profile counts", () => {
    const summary = buildFemaleCupDistributionSummary();
    const expectedCounts = femaleProfilePool.reduce<Record<string, number>>(
      (result, entry) => {
        if (entry.cup) {
          result[entry.cup] = (result[entry.cup] ?? 0) + 1;
        }

        return result;
      },
      {}
    );
    const actualCounts = Object.fromEntries(
      summary.publicSeries.buckets.map((bucket) => [bucket.cup, bucket.count])
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
    expect(
      summary.publicSeries.buckets.find((bucket) => bucket.cup === "H")
        ?.referencePercentage
    ).toBeNull();
  });

  test("female cup estimated series matches the adjusted estimate counts", () => {
    const summary = buildFemaleCupDistributionSummary();
    const expectedCounts = femaleProfilePool.reduce<Record<string, number>>(
      (result, entry) => {
        const estimatedCup = getFemaleRankingEstimatedCup(entry);

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

  test("male height distribution covers all male profiles in both series", () => {
    const summary = buildMaleHeightDistributionSummary();
    const publicTotal = summary.publicSeries.buckets.reduce(
      (sum, bucket) => sum + bucket.count,
      0
    );
    const estimatedTotal = summary.estimatedSeries.buckets.reduce(
      (sum, bucket) => sum + bucket.count,
      0
    );

    expect(summary.total).toBe(maleProfilePool.length);
    expect(publicTotal).toBe(summary.total);
    expect(estimatedTotal).toBe(summary.total);
    expect(summary.publicSeries.buckets).toHaveLength(6);
    expect(summary.estimatedSeries.buckets).toHaveLength(6);
  });

  test("male height distribution public series matches source profile counts", () => {
    const summary = buildMaleHeightDistributionSummary();
    const expectedCounts = [0, 0, 0, 0, 0, 0];

    for (const entry of maleProfilePool) {
      if (entry.actualHeight < 165) {
        expectedCounts[0] += 1;
      } else if (entry.actualHeight < 170) {
        expectedCounts[1] += 1;
      } else if (entry.actualHeight < 175) {
        expectedCounts[2] += 1;
      } else if (entry.actualHeight < 180) {
        expectedCounts[3] += 1;
      } else if (entry.actualHeight < 185) {
        expectedCounts[4] += 1;
      } else {
        expectedCounts[5] += 1;
      }
    }

    expect(summary.publicSeries.buckets.map((bucket) => bucket.count)).toEqual(
      expectedCounts
    );
  });

  test("male height estimated series matches the estimated height bucket counts", () => {
    const summary = buildMaleHeightDistributionSummary();
    const expectedCounts = [0, 0, 0, 0, 0, 0];

    for (const entry of maleProfilePool) {
      const estimatedHeight = getMaleRankingEstimatedHeight(entry);

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
