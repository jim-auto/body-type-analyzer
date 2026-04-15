import HomePageClient from "@/components/HomePageClient";
import {
  buildFemaleCupDistributionSummary,
  buildMaleHeightDistributionSummary,
} from "@/lib/distributions";
import {
  FEMALE_PROFILE_COVERAGE_SUMMARY,
  FEMALE_PROFILE_GOAL_SUMMARY,
} from "@/lib/profile-occupations";
import type { RankingData } from "@/lib/ranking";
import rankingDataJson from "../public/data/ranking.json";

const rankingData = rankingDataJson as RankingData;
const femaleCupDistribution = buildFemaleCupDistributionSummary();
const maleHeightDistribution = buildMaleHeightDistributionSummary();

export default function Home() {
  return (
    <HomePageClient
      data={rankingData}
      femaleCupDistribution={femaleCupDistribution}
      femaleOccupationCoverage={FEMALE_PROFILE_COVERAGE_SUMMARY}
      femaleOccupationGoals={FEMALE_PROFILE_GOAL_SUMMARY}
      maleHeightDistribution={maleHeightDistribution}
    />
  );
}
