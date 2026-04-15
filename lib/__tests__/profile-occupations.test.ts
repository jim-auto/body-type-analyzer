import { femaleProfilePool } from "@/lib/source-profiles";
import {
  FEMALE_PROFILE_COVERAGE_SUMMARY,
  FEMALE_PROFILE_GOAL_SUMMARY,
  hasFemaleProfileOccupation,
} from "@/lib/profile-occupations";

describe("profile occupations", () => {
  test("coverage summary matches the female public pool size", () => {
    expect(FEMALE_PROFILE_COVERAGE_SUMMARY.total).toBe(femaleProfilePool.length);
    expect(FEMALE_PROFILE_COVERAGE_SUMMARY.tagged).toBeGreaterThan(900);
    expect(FEMALE_PROFILE_COVERAGE_SUMMARY.untagged).toBeLessThan(150);
  });

  test("reference coverage stays above the large-cup baseline", () => {
    expect(
      FEMALE_PROFILE_COVERAGE_SUMMARY.referenceCoverage.gravurefitLargeCup.coverageRate
    ).toBeGreaterThan(40);
  });

  test("occupation goals are defined and compute remaining counts", () => {
    const avGoal = FEMALE_PROFILE_GOAL_SUMMARY.occupations.find(
      (entry) => entry.occupation === "av"
    );

    expect(FEMALE_PROFILE_GOAL_SUMMARY.totalTarget).toBe(1800);
    expect(FEMALE_PROFILE_GOAL_SUMMARY.totalCurrent).toBe(
      FEMALE_PROFILE_COVERAGE_SUMMARY.total
    );
    expect(FEMALE_PROFILE_GOAL_SUMMARY.occupations).toHaveLength(
      FEMALE_PROFILE_COVERAGE_SUMMARY.occupations.length
    );
    expect(avGoal).toBeDefined();
    expect(avGoal?.target).toBe(500);
    expect(avGoal?.remaining).toBe(Math.max(500 - (avGoal?.count ?? 0), 0));
  });

  test("known female profiles receive expected occupation tags", () => {
    expect(hasFemaleProfileOccupation("篠崎愛", "gravure")).toBe(true);
    expect(hasFemaleProfileOccupation("菜々緒", "model")).toBe(true);
    expect(hasFemaleProfileOccupation("小向美奈子", "av")).toBe(true);
  });
});
