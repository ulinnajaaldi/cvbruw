#!/usr/bin/env bun
import path from "node:path";
import fs from "node:fs";
import { renderResumePdf } from "../src/render.js";

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
