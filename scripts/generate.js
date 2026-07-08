#!/usr/bin/env bun
/**
 * Standalone CLI: generate an ATS-friendly resume PDF from a JSON data file.
 *
 * Usage:
 *   bun scripts/generate.js <data.json> [output.pdf]
 *
 * Design note: this script does NOT require the web app (TanStack Start)
 * to be running. It calls the render engine (src/render.js) directly,
 * so it works standalone on a bare VPS -- which is exactly what the
 * Hermes Agent skill needs to call.
 */

const path = require("path");
const fs = require("fs");
const { renderResumePdf } = require("../src/render");

async function main() {
  const [, , dataPathArg, outputPathArg] = process.argv;

  if (!dataPathArg) {
    console.error("Usage: bun scripts/generate.js <data.json> [output.pdf]");
    process.exit(1);
  }

  const dataPath = path.resolve(process.cwd(), dataPathArg);
  if (!fs.existsSync(dataPath)) {
    console.error(`Data file not found: ${dataPath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  const slug = (data.basics && data.basics.name ? data.basics.name : "resume")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const outputPath = outputPathArg
    ? path.resolve(process.cwd(), outputPathArg)
    : path.resolve(process.cwd(), `${slug}-resume.pdf`);

  await renderResumePdf(data, outputPath);
  console.log(outputPath);
}

main().catch((err) => {
  console.error("Failed to generate resume PDF:", err.message);
  process.exit(1);
});
