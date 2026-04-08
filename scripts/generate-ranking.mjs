import fs from "node:fs";
import path from "node:path";

const { buildRankingData } = await import("../lib/ranking-builder.ts");

const outputPath = path.join(process.cwd(), "public", "data", "ranking.json");
const rankingData = buildRankingData();

fs.writeFileSync(outputPath, `${JSON.stringify(rankingData, null, 2)}\n`);

console.log(`Generated ${outputPath}`);
