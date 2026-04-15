import coverageJson from "../public/data/profile-coverage.json";
import occupationsJson from "../public/data/profile-occupations.json";

export const PROFILE_OCCUPATION_ORDER = [
  "gravure",
  "av",
  "actress",
  "model",
  "talent",
  "idol",
  "racequeen",
  "cosplayer",
  "announcer",
  "singer",
  "wrestler",
] as const;

export type ProfileOccupation = (typeof PROFILE_OCCUPATION_ORDER)[number];

export const PROFILE_OCCUPATION_LABELS: Record<ProfileOccupation, string> = {
  gravure: "グラビア",
  av: "AV女優",
  actress: "女優",
  model: "モデル",
  talent: "タレント",
  idol: "アイドル",
  racequeen: "レースクイーン",
  cosplayer: "コスプレイヤー",
  announcer: "アナウンサー",
  singer: "歌手",
  wrestler: "プロレスラー",
};

export type ProfileCoverageBucket = {
  occupation: ProfileOccupation;
  label: string;
  count: number;
  percentage: number;
};

export type ProfileCoverageGoalBucket = ProfileCoverageBucket & {
  target: number;
  remaining: number;
  progressRate: number;
};

export type FemaleProfileCoverageSummary = {
  total: number;
  tagged: number;
  untagged: number;
  occupations: ProfileCoverageBucket[];
  referenceCoverage: {
    gravurefitLargeCup: {
      label: string;
      referenceTotal: number;
      matchedProfiles: number;
      coverageRate: number;
    };
  };
  notes: string[];
};

export type FemaleProfileGoalSummary = {
  totalCurrent: number;
  totalTarget: number;
  totalRemaining: number;
  occupations: ProfileCoverageGoalBucket[];
};

type ProfileOccupationsData = {
  generatedAt: string;
  female: Record<string, ProfileOccupation[]>;
  male: Record<string, ProfileOccupation[]>;
};

type ProfileCoverageData = {
  generatedAt: string;
  female: FemaleProfileCoverageSummary;
};

const profileOccupations = occupationsJson as ProfileOccupationsData;
const profileCoverage = coverageJson as ProfileCoverageData;

export const FEMALE_PROFILE_TOTAL_GOAL = 1800;
export const FEMALE_PROFILE_OCCUPATION_GOAL_TARGETS: Record<
  ProfileOccupation,
  number
> = {
  gravure: 800,
  av: 500,
  actress: 950,
  model: 300,
  talent: 650,
  idol: 750,
  racequeen: 100,
  cosplayer: 40,
  announcer: 25,
  singer: 120,
  wrestler: 15,
};

export const FEMALE_PROFILE_OCCUPATIONS = profileOccupations.female;
export const FEMALE_PROFILE_COVERAGE_SUMMARY = profileCoverage.female;

export function buildFemaleProfileGoalSummary(
  summary: FemaleProfileCoverageSummary = FEMALE_PROFILE_COVERAGE_SUMMARY
): FemaleProfileGoalSummary {
  const bucketsByOccupation = new Map(
    summary.occupations.map((bucket) => [bucket.occupation, bucket])
  );

  return {
    totalCurrent: summary.total,
    totalTarget: FEMALE_PROFILE_TOTAL_GOAL,
    totalRemaining: Math.max(FEMALE_PROFILE_TOTAL_GOAL - summary.total, 0),
    occupations: PROFILE_OCCUPATION_ORDER.map((occupation) => {
      const bucket = bucketsByOccupation.get(occupation);
      const count = bucket?.count ?? 0;
      const target = FEMALE_PROFILE_OCCUPATION_GOAL_TARGETS[occupation];

      return {
        occupation,
        label: bucket?.label ?? PROFILE_OCCUPATION_LABELS[occupation],
        count,
        percentage: bucket?.percentage ?? 0,
        target,
        remaining: Math.max(target - count, 0),
        progressRate:
          target === 0
            ? 100
            : Number(((Math.min(count, target) / target) * 100).toFixed(1)),
      };
    }),
  };
}

export const FEMALE_PROFILE_GOAL_SUMMARY = buildFemaleProfileGoalSummary();

export function getFemaleProfileOccupations(name: string): ProfileOccupation[] {
  return FEMALE_PROFILE_OCCUPATIONS[name] ?? [];
}

export function hasFemaleProfileOccupation(
  name: string,
  occupation: ProfileOccupation
): boolean {
  return getFemaleProfileOccupations(name).includes(occupation);
}
