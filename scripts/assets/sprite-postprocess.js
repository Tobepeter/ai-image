#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import YAML from "yaml";

const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const [, , caseManifestArg, processorArg, outputRootArg] = process.argv;
const wantsHelp =
  process.argv.includes("--help") || process.argv.includes("-h");

if (wantsHelp || !caseManifestArg || !processorArg) {
  console.error(
    "Usage: scripts/assets/sprite-postprocess.js <case-manifest.yaml> <processor.yaml> [output-root]",
  );
  process.exit(wantsHelp ? 0 : 2);
}

const caseManifestPath = path.resolve(caseManifestArg);
const processorPath = path.resolve(processorArg);
const caseManifest = YAML.parse(readFileSync(caseManifestPath, "utf8"));
const processor = YAML.parse(readFileSync(processorPath, "utf8"));

const caseId = mustGet(caseManifest, "id");
const runId = mustGet(processor, "id");
const caseDir = path.dirname(caseManifestPath);
const outputRoot = path.resolve(
  outputRootArg ??
    path.join(
      ROOT,
      "data/outputs/assets/sprite-postprocess",
      caseId,
      "runs",
      runId,
    ),
);

mkdirSync(outputRoot, { recursive: true });
for (const dir of [
  "input",
  "transparent",
  "masks",
  "debug",
  "sprites",
  "atlases",
  "previews",
  "logs",
]) {
  mkdirSync(path.join(outputRoot, dir), { recursive: true });
}

writeFileSync(
  path.join(outputRoot, "config.snapshot.yaml"),
  YAML.stringify({
    case: caseManifest,
    processor,
    created_at: new Date().toISOString(),
  }),
);

const allResults = [];

for (const inputEntry of mustGet(caseManifest, "inputs")) {
  const inputId = mustGet(inputEntry, "id");
  const inputPath = path.join(caseDir, mustGet(inputEntry, "path"));
  if (!existsSync(inputPath)) {
    throw new Error(`Input not found: ${inputPath}`);
  }

  const inputSnapshot = path.join(
    outputRoot,
    "input",
    path.basename(inputPath),
  );
  copyFileSync(inputPath, inputSnapshot);

  const transparentPath = path.join(
    outputRoot,
    "transparent",
    `${inputId}.alpha.png`,
  );
  const maskPath = path.join(outputRoot, "masks", `${inputId}.mask.png`);
  const componentsPath = path.join(
    outputRoot,
    "debug",
    `${inputId}.components.json`,
  );
  const overlayPath = path.join(
    outputRoot,
    "debug",
    `${inputId}.bbox-overlay.png`,
  );
  const previewPath = path.join(
    outputRoot,
    "previews",
    `${inputId}.contact-sheet.png`,
  );
  const atlasPath = path.join(outputRoot, "atlases", `${inputId}.atlas.png`);
  const atlasJsonPath = path.join(
    outputRoot,
    "atlases",
    `${inputId}.atlas.json`,
  );

  const background = mustGet(processor, "background");
  const fuzz = `${mustGet(background, "fuzz_percent")}%`;
  const keyColor = mustGet(background, "key_color");

  run("magick", [
    inputPath,
    "-alpha",
    "set",
    "-fuzz",
    fuzz,
    "-transparent",
    keyColor,
    transparentPath,
  ]);

  run("magick", [
    transparentPath,
    "-alpha",
    "extract",
    "-threshold",
    "1%",
    maskPath,
  ]);

  const connected = run("magick", [
    maskPath,
    "-define",
    "connected-components:verbose=true",
    "-connected-components",
    "8",
    "null:",
  ]);

  const [imageW, imageH] = identifySize(inputPath);
  const componentConfig = mustGet(processor, "components");
  const minArea = Number(componentConfig.min_area ?? 1000);
  const maxComponents = Number(
    componentConfig.max_components ??
      (inputEntry.expected_objects ?? []).length,
  );
  const padding = Number(componentConfig.padding ?? 0);

  const foregroundComponents = parseComponents(
    `${connected.stdout}\n${connected.stderr}`,
  ).filter((component) => component.mean_color.includes("gray(255)"));
  const grouping = componentConfig.grouping ?? {};
  const mergeDetached = grouping.merge_detached === true;
  let components = mergeDetached
    ? mergeDetachedComponents(foregroundComponents, {
        maxComponents,
        seedMinArea: minArea,
        mergeMinArea: Number(grouping.merge_min_area ?? 12),
        xMargin: Number(grouping.x_margin ?? padding),
      })
    : foregroundComponents
        .filter((component) => component.area >= minArea)
        .sort((a, b) => b.area - a.area)
        .slice(0, maxComponents);

  components = components
    .map((component) => paddedBox(component, imageW, imageH, padding))
    .sort((a, b) => a.x - b.x || a.y - b.y);

  const expectedNames = inputEntry.expected_objects ?? [];
  components = components.map((component, index) => ({
    ...component,
    name: expectedNames[index] ?? `${inputId}-sprite-${index + 1}`,
  }));

  writeJson(componentsPath, {
    input_id: inputId,
    source_image: mustGet(inputEntry, "path"),
    background,
    components,
  });

  drawRectangles(inputPath, overlayPath, components);

  const spritePaths = [];
  const frames = {};
  let atlasX = 0;
  let atlasH = 0;

  for (const component of components) {
    const spritePath = path.join(
      outputRoot,
      "sprites",
      `${component.name}.png`,
    );
    run("magick", [
      transparentPath,
      "-crop",
      `${component.w}x${component.h}+${component.x}+${component.y}`,
      "+repage",
      spritePath,
    ]);

    const [spriteW, spriteH] = identifySize(spritePath);
    spritePaths.push(spritePath);
    frames[component.name] = { x: atlasX, y: 0, w: spriteW, h: spriteH };
    atlasX += spriteW;
    atlasH = Math.max(atlasH, spriteH);
  }

  if (spritePaths.length > 0) {
    run("magick", [
      ...spritePaths,
      "-background",
      "none",
      "+append",
      atlasPath,
    ]);
    run("magick", [
      ...spritePaths,
      "-resize",
      "160x160",
      "-background",
      "#22272e",
      "-gravity",
      "center",
      "-extent",
      "180x180",
      "+append",
      previewPath,
    ]);
  }

  writeJson(atlasJsonPath, {
    meta: {
      case_id: caseId,
      run_id: runId,
      input_id: inputId,
      image: path.basename(atlasPath),
      width: atlasX,
      height: atlasH,
    },
    frames,
  });

  allResults.push({
    input_id: inputId,
    input: mustGet(inputEntry, "path"),
    transparent: relativeTo(outputRoot, transparentPath),
    mask: relativeTo(outputRoot, maskPath),
    components: relativeTo(outputRoot, componentsPath),
    overlay: relativeTo(outputRoot, overlayPath),
    sprites: spritePaths.map((spritePath) =>
      relativeTo(outputRoot, spritePath),
    ),
    atlas: relativeTo(outputRoot, atlasPath),
    atlas_json: relativeTo(outputRoot, atlasJsonPath),
    preview: relativeTo(outputRoot, previewPath),
  });
}

writeJson(path.join(outputRoot, "..", "..", "manifest.json"), {
  case_id: caseId,
  latest_run: runId,
  updated_at: new Date().toISOString(),
});

writeJson(path.join(outputRoot, "run.manifest.json"), {
  case_id: caseId,
  run_id: runId,
  processor,
  results: allResults,
});

console.log(`Wrote ${outputRoot}`);

function mustGet(value, key) {
  if (!value || value[key] === undefined || value[key] === null) {
    throw new Error(`Missing required key: ${key}`);
  }
  return value[key];
}

function run(command, args) {
  const result = spawnSync(command, args.map(String), { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      [
        `Command failed: ${command} ${args.join(" ")}`,
        result.stdout,
        result.stderr,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
  return { stdout: result.stdout, stderr: result.stderr };
}

function identifySize(filePath) {
  const result = run("magick", ["identify", "-format", "%w %h", filePath]);
  return result.stdout.trim().split(/\s+/).map(Number);
}

function parseComponents(text) {
  const components = [];
  const pattern =
    /^\s*(\d+):\s+(\d+)x(\d+)\+(-?\d+)\+(-?\d+)\s+([\d.]+),([\d.]+)\s+([\deE.+-]+)\s+(.*)$/;

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(pattern);
    if (!match) continue;

    components.push({
      id: Number(match[1]),
      w: Number(match[2]),
      h: Number(match[3]),
      x: Number(match[4]),
      y: Number(match[5]),
      centroid_x: Number(match[6]),
      centroid_y: Number(match[7]),
      area: Number(match[8]),
      mean_color: match[9].trim(),
    });
  }

  return components;
}

function paddedBox(component, imageW, imageH, padding) {
  const x = Math.max(component.x - padding, 0);
  const y = Math.max(component.y - padding, 0);
  const right = Math.min(component.x + component.w + padding, imageW);
  const bottom = Math.min(component.y + component.h + padding, imageH);

  return {
    ...component,
    x,
    y,
    w: right - x,
    h: bottom - y,
  };
}

function mergeDetachedComponents(components, options) {
  const seeds = components
    .filter((component) => component.area >= options.seedMinArea)
    .sort((a, b) => b.area - a.area)
    .slice(0, options.maxComponents);
  const groups = seeds.map((seed) => ({
    ...seed,
    member_ids: [seed.id],
  }));
  const seedIds = new Set(seeds.map((seed) => seed.id));

  for (const component of components) {
    if (seedIds.has(component.id) || component.area < options.mergeMinArea)
      continue;

    const group = groups.find((candidate) => {
      const left = candidate.x - options.xMargin;
      const right = candidate.x + candidate.w + options.xMargin;
      return component.centroid_x >= left && component.centroid_x <= right;
    });

    if (!group) continue;

    mergeBox(group, component);
    group.area += component.area;
    group.member_ids.push(component.id);
  }

  return groups;
}

function mergeBox(target, component) {
  const left = Math.min(target.x, component.x);
  const top = Math.min(target.y, component.y);
  const right = Math.max(target.x + target.w, component.x + component.w);
  const bottom = Math.max(target.y + target.h, component.y + component.h);
  target.x = left;
  target.y = top;
  target.w = right - left;
  target.h = bottom - top;
}

function drawRectangles(input, output, components) {
  const drawArgs = components.flatMap((component) => [
    "-draw",
    `rectangle ${component.x},${component.y} ${component.x + component.w},${component.y + component.h}`,
  ]);
  run("magick", [
    input,
    "-fill",
    "none",
    "-stroke",
    "red",
    "-strokewidth",
    "4",
    ...drawArgs,
    output,
  ]);
}

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function relativeTo(from, to) {
  return path.relative(from, to).split(path.sep).join("/");
}
