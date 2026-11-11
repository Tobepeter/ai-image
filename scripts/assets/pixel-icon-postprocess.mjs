#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const [, , input, outputRoot, stem, ...sizes] = process.argv;

if (!input || !outputRoot || !stem) {
  console.error("Usage: pixel-icon-postprocess.mjs <input.png> <output-root> <stem> [sizes...]");
  process.exit(2);
}

if (!existsSync(input)) {
  console.error(`Input not found: ${input}`);
  process.exit(1);
}

const assetSizes = sizes.length ? sizes.map(Number).filter(Boolean) : [128];
const previewDir = path.join(outputRoot, "processed", "preview-512");
mkdirSync(previewDir, { recursive: true });

for (const size of assetSizes) {
  const assetDir = path.join(outputRoot, "processed", `${size}x${size}`);
  mkdirSync(assetDir, { recursive: true });

  const assetPath = path.join(assetDir, `${stem}.png`);
  const previewPath = path.join(previewDir, `${stem}-${size}x-preview.png`);

  run("magick", [
    input,
    "-filter",
    "point",
    "-resize",
    `${size}x${size}!`,
    assetPath,
  ]);

  run("magick", [
    assetPath,
    "-filter",
    "point",
    "-resize",
    "512x512!",
    previewPath,
  ]);
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
