// Cup visualization QA harness.
//
// For each image in a curated sample set, uploads the image to the live
// /analyze page, waits for diagnosis to complete, captures a screenshot of
// the visualization section, and records the result fields into a manifest.
//
// Outputs are written under local-data/cup-visualization-qa/ which is gitignored.
// The script is read-only against the deployed app and does not push or modify
// anything in the repository besides the local-data/ outputs.
//
// Usage examples:
//   node scripts/verify-cup-visualization.mjs --url http://localhost:3001/body-type-analyzer/analyze
//   node scripts/verify-cup-visualization.mjs --url https://jim-auto.github.io/body-type-analyzer/analyze --limit 10
//   node scripts/verify-cup-visualization.mjs --only fukada_kyoko,hamabe_minami

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

// Curated sample set. Names refer to public/images/<name>.webp files that
// exist at the time of writing. The script skips any missing file and reports
// which ones were skipped.
const SAMPLE_IMAGES = [
  // 正面/全身
  { category: "frontal", name: "fukada_kyoko" },
  { category: "frontal", name: "baba_fumika" },
  { category: "frontal", name: "asahina_aya" },
  { category: "frontal", name: "kakei_miwako" },
  { category: "frontal", name: "koike_eiko" },
  // 上半身寄り
  { category: "upper-body", name: "shinozaki_ai" },
  { category: "upper-body", name: "hara_mikie" },
  { category: "upper-body", name: "hashimoto_manami" },
  { category: "upper-body", name: "danmitsu" },
  { category: "upper-body", name: "isoyama_sayaka" },
  // 細身/低カップ寄り
  { category: "slim-low-cup", name: "aragaki_yui" },
  { category: "slim-low-cup", name: "hamabe_minami" },
  { category: "slim-low-cup", name: "hashimoto_kanna" },
  { category: "slim-low-cup", name: "honda_tsubasa" },
  { category: "slim-low-cup", name: "kitagawa_keiko" },
  // グラビア/高カップ寄り
  { category: "high-cup", name: "inoue_waka" },
  { category: "high-cup", name: "yasuda_misako" },
  { category: "high-cup", name: "sugihara_anri" },
  { category: "high-cup", name: "yunocy" },
  { category: "high-cup", name: "sasaki_nozomi" },
  // Other reference faces (variety / pose)
  { category: "variety", name: "ayase_haruka" },
  { category: "variety", name: "nagasawa_masami" },
  { category: "variety", name: "nanao" },
  { category: "variety", name: "kashiwagi_yuki" },
  { category: "variety", name: "shiraishi_mai" },
];

function parseArgs(argv) {
  const args = {
    url: "http://localhost:3001/body-type-analyzer/analyze",
    outDir: path.join(REPO_ROOT, "local-data", "cup-visualization-qa"),
    limit: null,
    only: null,
    headless: true,
    failFast: false,
    timeoutMs: 90_000,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => argv[(index += 1)];

    if (arg === "--url") {
      args.url = next();
    } else if (arg === "--out") {
      args.outDir = path.resolve(next());
    } else if (arg === "--limit") {
      args.limit = Number(next());
    } else if (arg === "--only") {
      args.only = String(next())
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
    } else if (arg === "--headed") {
      args.headless = false;
    } else if (arg === "--fail-fast") {
      args.failFast = true;
    } else if (arg === "--timeout-ms") {
      args.timeoutMs = Number(next());
    } else if (arg === "--help" || arg === "-h") {
      console.log(
        [
          "Usage:",
          "  node scripts/verify-cup-visualization.mjs [options]",
          "",
          "Options:",
          "  --url <url>          analyze page URL (default localhost dev server)",
          "  --out <dir>          output directory (default local-data/cup-visualization-qa)",
          "  --limit <n>          process only the first <n> sample entries",
          "  --only <a,b,c>       process only the listed names (matches without .webp)",
          "  --headed             run browser with a visible window",
          "  --fail-fast          stop on first per-image failure",
          "  --timeout-ms <n>     per-image diagnosis timeout (default 90000)",
        ].join("\n")
      );
      process.exit(0);
    } else {
      console.warn(`[warn] unknown arg ${arg}`);
    }
  }

  return args;
}

function selectSamples(args) {
  let samples = SAMPLE_IMAGES;
  if (args.only) {
    const wanted = new Set(args.only);
    samples = samples.filter((sample) => wanted.has(sample.name));
  }
  if (args.limit !== null && Number.isFinite(args.limit)) {
    samples = samples.slice(0, args.limit);
  }
  return samples;
}

async function ensureOutputDirs(outDir) {
  await mkdir(path.join(outDir, "screenshots"), { recursive: true });
}

function pad(value, width) {
  return String(value).padStart(width, "0");
}

function tidyText(value) {
  if (typeof value !== "string") return value;
  return value.replace(/\s+/g, " ").trim();
}

function extractCupLetter(text) {
  const match = String(text ?? "").match(/([A-Z])カップ/);
  return match ? match[1] : null;
}

function extractConfidencePercent(text) {
  const match = String(text ?? "").match(/(\d+)\s*%/);
  return match ? Number(match[1]) : null;
}

function extractMaskCoveragePercent(text) {
  const match = String(text ?? "").match(/(\d+)\s*%/);
  return match ? Number(match[1]) : null;
}

function extractHeightCm(text) {
  const match = String(text ?? "").match(/(\d+(?:\.\d+)?)\s*cm/);
  return match ? Number(match[1]) : null;
}

function summarizeNeighborCupDistribution(similarCelebrities) {
  const counts = new Map();
  for (const line of similarCelebrities) {
    const cup = extractCupLetter(line);
    if (!cup) continue;
    counts.set(cup, (counts.get(cup) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  return sorted.map(([cup, count]) => `${cup}:${count}`).join(" ");
}

const NOISY_CONSOLE_PATTERNS = [
  /OpenGL error checking is disabled/,
  /Created TensorFlow Lite XNNPACK delegate/,
  /Feedback manager requires a model with a single signature/,
  /landmark_projection_calculator/,
  /GPU stall due to ReadPixels/,
  /Failed to load resource: the server responded with a status of 404/,
];

function isInBounds(value) {
  return typeof value === "number" && value >= 0 && value <= 100;
}

function computePoseStats(keypoints) {
  const flags = [];
  let inBoundsCount = 0;
  let totalKeypoints = 0;
  let lowVisibilityCount = 0;
  const visibilities = [];

  for (const name of [
    "nose",
    "leftShoulder",
    "rightShoulder",
    "leftHip",
    "rightHip",
  ]) {
    const point = keypoints?.[name];
    if (!point) continue;
    totalKeypoints += 1;
    const inBounds =
      isInBounds(point.xPercent) && isInBounds(point.yPercent);
    if (inBounds) inBoundsCount += 1;
    if (typeof point.opacity === "number") {
      visibilities.push(point.opacity);
      if (point.opacity < 0.5) lowVisibilityCount += 1;
    }
    if (!inBounds) flags.push(`${name}-out-of-bounds`);
  }

  const noseY = keypoints?.nose?.yPercent;
  const lShoulderY = keypoints?.leftShoulder?.yPercent;
  const rShoulderY = keypoints?.rightShoulder?.yPercent;
  const lHipY = keypoints?.leftHip?.yPercent;
  const rHipY = keypoints?.rightHip?.yPercent;

  const shoulderY =
    typeof lShoulderY === "number" && typeof rShoulderY === "number"
      ? (lShoulderY + rShoulderY) / 2
      : typeof lShoulderY === "number"
        ? lShoulderY
        : rShoulderY;
  const hipY =
    typeof lHipY === "number" && typeof rHipY === "number"
      ? (lHipY + rHipY) / 2
      : typeof lHipY === "number"
        ? lHipY
        : rHipY;

  if (typeof noseY === "number" && typeof shoulderY === "number" && noseY > shoulderY) {
    flags.push("nose-below-shoulder");
  }
  if (typeof shoulderY === "number" && typeof hipY === "number" && shoulderY > hipY) {
    flags.push("shoulder-below-hip");
  }

  return {
    totalKeypoints,
    inBoundsCount,
    lowVisibilityCount,
    avgVisibility:
      visibilities.length > 0
        ? Number(
            (
              visibilities.reduce((sum, value) => sum + value, 0) /
              visibilities.length
            ).toFixed(2)
          )
        : null,
    noseYPercent: noseY ?? null,
    shoulderYPercent: shoulderY ?? null,
    hipYPercent: hipY ?? null,
    flags,
  };
}

function filterInterestingConsole(messages) {
  return messages.filter((message) => {
    return !NOISY_CONSOLE_PATTERNS.some((pattern) => pattern.test(message));
  });
}

async function diagnoseOneImage({ page, sample, sampleIndex, args, imagePath }) {
  const consoleMessages = [];
  const pageErrors = [];
  const requestFailures = [];

  const consoleHandler = (msg) => {
    const type = msg.type();
    if (type === "error" || type === "warning") {
      consoleMessages.push(`[${type}] ${msg.text()}`);
    }
  };
  const pageErrorHandler = (err) => {
    pageErrors.push(err.message);
  };
  const requestFailedHandler = (req) => {
    requestFailures.push(`${req.url()} :: ${req.failure()?.errorText ?? "unknown"}`);
  };

  page.on("console", consoleHandler);
  page.on("pageerror", pageErrorHandler);
  page.on("requestfailed", requestFailedHandler);

  const result = {
    image: `public/images/${sample.name}.webp`,
    name: sample.name,
    category: sample.category,
    status: "unknown",
  };

  try {
    await page.goto(args.url, { waitUntil: "networkidle", timeout: args.timeoutMs });
    await page.waitForSelector("#diagnosis-image", { state: "attached", timeout: 15_000 });
    await page.setInputFiles("#diagnosis-image", imagePath);

    await page.waitForSelector("text=Complete", { timeout: args.timeoutMs });
    await page.waitForSelector("section[aria-label='カップ推定の可視化']", {
      timeout: args.timeoutMs,
    });
    // Brief settle for animations / mask drawing.
    await page.waitForTimeout(500);

    const heightText = tidyText(
      await page
        .locator("article", { hasText: "推定身長" })
        .first()
        .innerText()
        .catch(() => "")
    );
    const cupText = tidyText(
      await page
        .locator("article", { hasText: "推定カップ" })
        .first()
        .innerText()
        .catch(() => "")
    );
    const confidenceText = tidyText(
      await page
        .locator("article", { hasText: "AI信頼度" })
        .first()
        .innerText()
        .catch(() => "")
    );
    const silhouetteText = tidyText(
      await page
        .locator("article", { hasText: "シルエットタイプ" })
        .first()
        .innerText()
        .catch(() => "")
    );

    const visualizationSection = page.locator("section[aria-label='カップ推定の可視化']");
    const chestBoxSourceText = tidyText(
      await visualizationSection.locator("span", { hasText: /Pose ROI|Crop fallback/ })
        .first()
        .innerText()
        .catch(() => "")
    );
    const maskCoverageText = tidyText(
      await visualizationSection.locator("text=マスク面積").first().innerText().catch(() => "")
    );

    const similarSection = page.locator("section", { hasText: "あなたに近い有名人" });
    const similarRaw = await similarSection
      .locator("article")
      .allInnerTexts()
      .catch(() => []);
    const similarCelebrities = similarRaw.map((text) => tidyText(text)).slice(0, 5);

    const qualityWarningVisible = await page
      .locator("text=画像品質に関する注意")
      .isVisible()
      .catch(() => false);

    const poseKeypoints = await page.evaluate(() => {
      const names = [
        "nose",
        "leftShoulder",
        "rightShoulder",
        "leftHip",
        "rightHip",
      ];
      const result = {};
      for (const name of names) {
        const element = document.querySelector(`[data-testid='pose-keypoint-${name}']`);
        if (!(element instanceof HTMLElement)) {
          result[name] = null;
          continue;
        }
        const left = parseFloat(element.style.left);
        const top = parseFloat(element.style.top);
        const opacity = parseFloat(element.style.opacity || "1");
        result[name] = {
          xPercent: Number.isFinite(left) ? left : null,
          yPercent: Number.isFinite(top) ? top : null,
          opacity: Number.isFinite(opacity) ? opacity : null,
        };
      }
      return result;
    });

    const poseStats = computePoseStats(poseKeypoints);

    const screenshotName = `${pad(sampleIndex + 1, 3)}_${sample.name}.png`;
    const screenshotPath = path.join(args.outDir, "screenshots", screenshotName);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    Object.assign(result, {
      status: "passed",
      estimatedHeightText: heightText,
      estimatedHeightCm: extractHeightCm(heightText),
      estimatedCupText: cupText,
      estimatedCup: extractCupLetter(cupText),
      confidenceText,
      confidencePercent: extractConfidencePercent(confidenceText),
      silhouette: silhouetteText,
      chestBoxSource: chestBoxSourceText,
      maskCoverageText,
      maskCoveragePercent: extractMaskCoveragePercent(maskCoverageText),
      neighborCupDistribution: summarizeNeighborCupDistribution(similarCelebrities),
      similarCelebrities,
      qualityWarning: qualityWarningVisible,
      poseKeypoints,
      poseStats,
      screenshot: path
        .relative(REPO_ROOT, screenshotPath)
        .replace(/\\/g, "/"),
      manualReview: "",
      interestingConsole: filterInterestingConsole(consoleMessages),
      pageErrors,
    });
  } catch (error) {
    result.status = "failed";
    result.error = error?.message ?? String(error);
    result.consoleErrors = consoleMessages;
    result.pageErrors = pageErrors;
    result.requestFailures = requestFailures;
    try {
      const failName = `${pad(sampleIndex + 1, 3)}_${sample.name}_FAIL.png`;
      const failPath = path.join(args.outDir, "screenshots", failName);
      await page.screenshot({ path: failPath, fullPage: true });
      result.screenshot = path.relative(REPO_ROOT, failPath).replace(/\\/g, "/");
    } catch (screenshotError) {
      result.screenshotError = screenshotError?.message ?? String(screenshotError);
    }
  } finally {
    page.off("console", consoleHandler);
    page.off("pageerror", pageErrorHandler);
    page.off("requestfailed", requestFailedHandler);
  }

  return result;
}

function summarizeManifest(manifest) {
  const summary = {
    total: manifest.length,
    passed: 0,
    failed: 0,
    skipped: 0,
    poseRoi: 0,
    cropFallback: 0,
    qualityWarnings: 0,
    cupHistogram: {},
    maskCoverageMin: null,
    maskCoverageMax: null,
    maskCoverageAvg: null,
    confidenceMin: null,
    confidenceMax: null,
    confidenceAvg: null,
    poseFiveKeypoints: 0,
    poseAllInBounds: 0,
    poseHipOutOfBounds: 0,
    poseNoseBelowShoulder: 0,
    poseShoulderBelowHip: 0,
    poseAvgVisibility: null,
  };
  const maskValues = [];
  const confidenceValues = [];
  const visibilityValues = [];

  for (const entry of manifest) {
    if (entry.status === "passed") summary.passed += 1;
    else if (entry.status === "failed") summary.failed += 1;
    else if (entry.status === "skipped") summary.skipped += 1;

    if (entry.chestBoxSource === "Pose ROI") summary.poseRoi += 1;
    else if (entry.chestBoxSource === "Crop fallback") summary.cropFallback += 1;

    if (entry.qualityWarning) summary.qualityWarnings += 1;

    if (entry.estimatedCup) {
      summary.cupHistogram[entry.estimatedCup] =
        (summary.cupHistogram[entry.estimatedCup] ?? 0) + 1;
    }
    if (typeof entry.maskCoveragePercent === "number") {
      maskValues.push(entry.maskCoveragePercent);
    }
    if (typeof entry.confidencePercent === "number") {
      confidenceValues.push(entry.confidencePercent);
    }

    const stats = entry.poseStats;
    if (stats) {
      if (stats.totalKeypoints === 5) summary.poseFiveKeypoints += 1;
      if (stats.totalKeypoints === stats.inBoundsCount && stats.totalKeypoints > 0) {
        summary.poseAllInBounds += 1;
      }
      if (
        stats.flags?.includes("leftHip-out-of-bounds") ||
        stats.flags?.includes("rightHip-out-of-bounds")
      ) {
        summary.poseHipOutOfBounds += 1;
      }
      if (stats.flags?.includes("nose-below-shoulder")) summary.poseNoseBelowShoulder += 1;
      if (stats.flags?.includes("shoulder-below-hip")) summary.poseShoulderBelowHip += 1;
      if (typeof stats.avgVisibility === "number") visibilityValues.push(stats.avgVisibility);
    }
  }

  if (maskValues.length > 0) {
    summary.maskCoverageMin = Math.min(...maskValues);
    summary.maskCoverageMax = Math.max(...maskValues);
    summary.maskCoverageAvg = Number(
      (maskValues.reduce((a, b) => a + b, 0) / maskValues.length).toFixed(1)
    );
  }
  if (confidenceValues.length > 0) {
    summary.confidenceMin = Math.min(...confidenceValues);
    summary.confidenceMax = Math.max(...confidenceValues);
    summary.confidenceAvg = Number(
      (confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length).toFixed(1)
    );
  }
  if (visibilityValues.length > 0) {
    summary.poseAvgVisibility = Number(
      (
        visibilityValues.reduce((a, b) => a + b, 0) / visibilityValues.length
      ).toFixed(2)
    );
  }

  return summary;
}

function buildReportMarkdown({ args, samples, manifest, summary }) {
  const generatedAt = new Date().toISOString();
  const lines = [];
  lines.push("# Cup Visualization QA Report");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`URL: ${args.url}`);
  lines.push(`Samples processed: ${samples.length}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Total: ${summary.total}`);
  lines.push(`- Passed (diagnosis completed): ${summary.passed}`);
  lines.push(`- Failed (timeout / error): ${summary.failed}`);
  lines.push(`- Skipped (file missing): ${summary.skipped}`);
  lines.push(`- Pose ROI: ${summary.poseRoi}`);
  lines.push(`- Crop fallback: ${summary.cropFallback}`);
  lines.push(`- Quality warnings shown: ${summary.qualityWarnings}`);
  if (summary.maskCoverageAvg !== null) {
    lines.push(
      `- Mask coverage: avg ${summary.maskCoverageAvg}% (min ${summary.maskCoverageMin}% / max ${summary.maskCoverageMax}%)`
    );
  }
  if (summary.confidenceAvg !== null) {
    lines.push(
      `- Confidence: avg ${summary.confidenceAvg}% (min ${summary.confidenceMin}% / max ${summary.confidenceMax}%)`
    );
  }
  const cupHistogramEntries = Object.entries(summary.cupHistogram).sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  if (cupHistogramEntries.length > 0) {
    lines.push(
      `- Estimated cup histogram: ${cupHistogramEntries
        .map(([cup, count]) => `${cup}=${count}`)
        .join(" ")}`
    );
  }
  lines.push("");
  lines.push("### Pose stats");
  lines.push("");
  lines.push(`- Images with all 5 keypoints exported: ${summary.poseFiveKeypoints}`);
  lines.push(`- Images with all keypoints inside frame: ${summary.poseAllInBounds}`);
  lines.push(`- Images with at least one hip out of bounds: ${summary.poseHipOutOfBounds}`);
  lines.push(`- Images with nose-below-shoulder anomaly: ${summary.poseNoseBelowShoulder}`);
  lines.push(`- Images with shoulder-below-hip anomaly: ${summary.poseShoulderBelowHip}`);
  if (summary.poseAvgVisibility !== null) {
    lines.push(`- Avg keypoint visibility (opacity proxy): ${summary.poseAvgVisibility}`);
  }
  lines.push("");
  lines.push("## Manual review buckets");
  lines.push("");
  lines.push("Fill `manualReview` per entry in manifest.json with one of:");
  lines.push("");
  lines.push("- `OK`     — chest ROI clearly on chest/upper torso, cup feature region covers relevant area");
  lines.push("- `Minor`  — ROI slightly off (high/low/wide/narrow) but still reasonable");
  lines.push("- `NG`     — ROI on face, abdomen, arm, background, or another person");
  lines.push("- `Unknown`— image cropping makes visual judgement impossible");
  lines.push("");
  lines.push("Tally manually after reviewing screenshots in `screenshots/`.");
  lines.push("");
  lines.push("## Per-image table");
  lines.push("");
  lines.push(
    "| # | Category | Name | Status | ROI Src | Mask% | Est. Cup | Conf% | Neighbor cups | Manual |"
  );
  lines.push(
    "|---|----------|------|--------|---------|-------|----------|-------|---------------|--------|"
  );
  manifest.forEach((entry, index) => {
    const cell = (value) =>
      value === null || value === undefined ? "" : String(value).replace(/\|/g, "\\|");
    lines.push(
      `| ${index + 1} | ${cell(entry.category)} | ${cell(entry.name)} | ${cell(
        entry.status
      )} | ${cell(entry.chestBoxSource)} | ${cell(entry.maskCoveragePercent)} | ${cell(
        entry.estimatedCup
      )} | ${cell(entry.confidencePercent)} | ${cell(
        entry.neighborCupDistribution
      )} | ${cell(entry.manualReview)} |`
    );
  });
  lines.push("");
  lines.push("## Notes");
  lines.push("");
  lines.push(
    "- Screenshots were captured against the URL listed above. Re-run with `--url` to refresh after a deploy."
  );
  lines.push(
    "- The `bodyMaskDataUrl` is a generated body-region overlay, not semantic segmentation. Treat low/high mask coverage as a sanity check only."
  );
  lines.push(
    "- If `Crop fallback` rate is high, MediaPipe Pose did not produce stable landmarks for those images."
  );
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv);
  const samples = selectSamples(args);

  console.log(`[info] target URL: ${args.url}`);
  console.log(`[info] samples: ${samples.length}`);
  console.log(`[info] output: ${args.outDir}`);

  await ensureOutputDirs(args.outDir);

  const browser = await chromium.launch({ headless: args.headless });
  const context = await browser.newContext();

  const manifest = [];

  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index];
    const imagePath = path.join(REPO_ROOT, "public", "images", `${sample.name}.webp`);

    console.log(
      `\n[${pad(index + 1, 3)}/${pad(samples.length, 3)}] ${sample.category} :: ${sample.name}`
    );

    if (!existsSync(imagePath)) {
      console.warn(`  skipped — file not found at ${imagePath}`);
      manifest.push({
        image: `public/images/${sample.name}.webp`,
        name: sample.name,
        category: sample.category,
        status: "skipped",
        reason: "file-not-found",
      });
      continue;
    }

    const page = await context.newPage();
    let entry;
    try {
      entry = await diagnoseOneImage({ page, sample, sampleIndex: index, args, imagePath });
    } finally {
      await page.close().catch(() => undefined);
    }
    manifest.push(entry);

    if (entry.status === "passed") {
      console.log(
        `  OK  cup=${entry.estimatedCup ?? "?"} conf=${entry.confidencePercent ?? "?"}% mask=${entry.maskCoveragePercent ?? "?"}% neighbors=${entry.neighborCupDistribution ?? ""}`
      );
    } else {
      console.log(`  FAIL ${entry.error ?? "(no error message)"}`);
      if (args.failFast) {
        break;
      }
    }
  }

  await browser.close();

  const summary = summarizeManifest(manifest);
  const manifestPath = path.join(args.outDir, "manifest.json");
  await writeFile(
    manifestPath,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), url: args.url, summary, entries: manifest }, null, 2)}\n`,
    "utf-8"
  );

  const reportPath = path.join(args.outDir, "report.md");
  await writeFile(
    reportPath,
    `${buildReportMarkdown({ args, samples, manifest, summary })}\n`,
    "utf-8"
  );

  console.log("\n========== SUMMARY ==========");
  console.log(`total       ${summary.total}`);
  console.log(`passed      ${summary.passed}`);
  console.log(`failed      ${summary.failed}`);
  console.log(`skipped     ${summary.skipped}`);
  console.log(`pose roi    ${summary.poseRoi}`);
  console.log(`crop back   ${summary.cropFallback}`);
  console.log(`quality wn  ${summary.qualityWarnings}`);
  console.log(`manifest    ${path.relative(REPO_ROOT, manifestPath)}`);
  console.log(`report      ${path.relative(REPO_ROOT, reportPath)}`);

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("[fatal]", error);
  process.exitCode = 2;
});
