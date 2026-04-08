import HomePageClient from "@/components/HomePageClient";
import {
  buildFemaleCupDistributionSummary,
  buildMaleHeightDistributionSummary,
} from "@/lib/distributions";
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
      maleHeightDistribution={maleHeightDistribution}
    />
  );
}
