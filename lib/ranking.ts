export type Gender = "female" | "male";

export type FemaleRankingEntry = {
  name: string;
  score: number;
  image: string;
  cup: string | null;
  displayCup: string | null;
  actualHeight: number;
  actualWeight: number | null;
  estimatedWeight: number;
  bust: number | null;
  estimatedHeight: number;
  heightDiff: number;
  estimatedCup: string | null;
  cupDiff: number | null;
  displayCupDiff: number | null;
};

export type MaleRankingEntry = {
  name: string;
  score: number;
  image: string;
  actualHeight: number;
  actualWeight: null;
  estimatedWeight: number;
  estimatedHeight: number;
  heightDiff: number;
};

export type RankingEntry = FemaleRankingEntry | MaleRankingEntry;

export type RankingCategory<TEntry extends RankingEntry = RankingEntry> = {
  category: string;
  title: string;
  ranking: TEntry[];
};

export type RankingData = {
  female: RankingCategory<FemaleRankingEntry>[];
  male: RankingCategory<MaleRankingEntry>[];
};

export function isFemaleEntry(entry: RankingEntry): entry is FemaleRankingEntry {
  return "bust" in entry;
}

export function hasPublicCup(entry: RankingEntry): entry is FemaleRankingEntry {
  return isFemaleEntry(entry) && entry.displayCup !== null;
}
