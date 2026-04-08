import fs from "node:fs";
import path from "node:path";

import rankingData from "../../public/data/ranking.json";

type RankingEntry = {
  name: string;
  score: number;
  image: string;
  cup?: string;
};

type RankingCategory = {
  category: string;
  title: string;
  ranking: RankingEntry[];
};

const validCups = new Set([
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "非公表",
]);

const femaleCategories = rankingData.female as RankingCategory[];
const maleCategories = rankingData.male as RankingCategory[];
const femaleEntries = femaleCategories.flatMap((category) => category.ranking);
const maleEntries = maleCategories.flatMap((category) => category.ranking);

const findEntry = (name: string) => {
  const entry = [...femaleEntries, ...maleEntries].find((item) => item.name === name);

  if (!entry) {
    throw new Error(`Entry not found: ${name}`);
  }

  return entry;
};

describe("ranking.json cup data", () => {
  test("女性の全エントリにcupフィールドが存在すること", () => {
    femaleEntries.forEach((entry) => {
      expect(entry).toHaveProperty("cup");
      expect(typeof entry.cup).toBe("string");
    });
  });

  test("cupの値がA〜Kまたは非公表であること", () => {
    femaleEntries.forEach((entry) => {
      expect(validCups.has(entry.cup as string)).toBe(true);
    });
  });

  test("男性の全エントリにcupフィールドが存在しないこと", () => {
    maleEntries.forEach((entry) => {
      expect(entry).not.toHaveProperty("cup");
    });
  });

  test("女性カテゴリが3つ、男性カテゴリが3つであること", () => {
    expect(femaleCategories).toHaveLength(3);
    expect(maleCategories).toHaveLength(3);
  });

  test("各カテゴリのランキングが5人であること", () => {
    [...femaleCategories, ...maleCategories].forEach((category) => {
      expect(category.ranking).toHaveLength(5);
    });
  });

  test("各カテゴリのスコアが降順であること", () => {
    [...femaleCategories, ...maleCategories].forEach((category) => {
      const scores = category.ranking.map((entry) => entry.score);
      expect(scores).toEqual([...scores].sort((a, b) => b - a));
    });
  });

  test("全エントリのスコアが30〜80の範囲内であること", () => {
    [...femaleEntries, ...maleEntries].forEach((entry) => {
      expect(entry.score).toBeGreaterThanOrEqual(30);
      expect(entry.score).toBeLessThanOrEqual(80);
    });
  });

  test("全エントリにname, score, imageフィールドが存在すること", () => {
    [...femaleEntries, ...maleEntries].forEach((entry) => {
      expect(entry.name).toBeTruthy();
      expect(typeof entry.score).toBe("number");
      expect(entry.image).toBeTruthy();
    });
  });

  test("画像パスが/images/で始まり、対応ファイルが存在すること", () => {
    [...femaleEntries, ...maleEntries].forEach((entry) => {
      expect(entry.image.startsWith("/images/")).toBe(true);

      const imagePath = path.join(process.cwd(), "public", entry.image.replace(/^\//, ""));
      expect(fs.existsSync(imagePath)).toBe(true);
    });
  });

  test("名前が空文字でないこと", () => {
    [...femaleEntries, ...maleEntries].forEach((entry) => {
      expect(entry.name.trim()).not.toBe("");
    });
  });

  test("深田恭子のカップ数が正しいこと", () => {
    expect(findEntry("深田恭子").cup).toBe("E");
  });

  test("石原さとみのカップ数が正しいこと", () => {
    expect(findEntry("石原さとみ").cup).toBe("D");
  });

  test("新垣結衣のカップ数が正しいこと", () => {
    expect(findEntry("新垣結衣").cup).toBe("B");
  });

  test("綾瀬はるかのカップ数が正しいこと", () => {
    expect(findEntry("綾瀬はるか").cup).toBe("F");
  });

  test("長澤まさみのカップ数が正しいこと", () => {
    expect(findEntry("長澤まさみ").cup).toBe("F");
  });

  test("菜々緒のカップ数が正しいこと", () => {
    expect(findEntry("菜々緒").cup).toBe("B");
  });

  test("今田美桜のカップ数が正しいこと", () => {
    expect(findEntry("今田美桜").cup).toBe("F");
  });
});
