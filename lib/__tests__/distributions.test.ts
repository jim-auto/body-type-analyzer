import {
  buildFemaleCupDistributionSummary,
  buildMaleHeightDistributionSummary,
} from "@/lib/distributions";

describe("distributions", () => {
  test("female cup distribution covers all 100 profiles", () => {
    const summary = buildFemaleCupDistributionSummary();
    const total = summary.buckets.reduce((sum, bucket) => sum + bucket.count, 0);

    expect(summary.total).toBe(100);
    expect(total).toBe(summary.total);
    expect(summary.buckets.map((bucket) => bucket.cup)).toEqual([
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

  test("female cup distribution keeps the known counts", () => {
    const summary = buildFemaleCupDistributionSummary();
    const counts = Object.fromEntries(
      summary.buckets.map((bucket) => [bucket.cup, bucket.count])
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
    expect(summary.buckets.find((bucket) => bucket.cup === "H")?.referencePercentage).toBeNull();
  });

  test("male height distribution covers all 100 profiles", () => {
    const summary = buildMaleHeightDistributionSummary();
    const total = summary.buckets.reduce((sum, bucket) => sum + bucket.count, 0);

    expect(summary.total).toBe(100);
    expect(total).toBe(summary.total);
  });

  test("male height distribution keeps the expected bucket counts", () => {
    const summary = buildMaleHeightDistributionSummary();
    const counts = Object.fromEntries(
      summary.buckets.map((bucket) => [bucket.label, bucket.count])
    );

    expect(counts).toEqual({
      "165cm未満": 0,
      "165-169cm": 3,
      "170-174cm": 32,
      "175-179cm": 33,
      "180-184cm": 28,
      "185cm以上": 4,
    });
  });
});
