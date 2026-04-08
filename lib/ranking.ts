export type Gender = "female" | "male";

export type FemaleRankingEntry = {
  name: string;
  score: number;
  image: string;
  cup: string | null;
  actualHeight: number;
  bust: number | null;
};

export type MaleRankingEntry = {
  name: string;
  score: number;
  image: string;
  actualHeight: number;
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
  return isFemaleEntry(entry) && entry.cup !== null;
}
