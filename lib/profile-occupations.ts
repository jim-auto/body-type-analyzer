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

export const FEMALE_PROFILE_OCCUPATIONS = profileOccupations.female;
export const FEMALE_PROFILE_COVERAGE_SUMMARY = profileCoverage.female;

export function getFemaleProfileOccupations(name: string): ProfileOccupation[] {
  return FEMALE_PROFILE_OCCUPATIONS[name] ?? [];
}

export function hasFemaleProfileOccupation(
  name: string,
  occupation: ProfileOccupation
): boolean {
  return getFemaleProfileOccupations(name).includes(occupation);
}
