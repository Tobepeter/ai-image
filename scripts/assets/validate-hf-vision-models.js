#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import YAML from "yaml";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: scripts/assets/validate-hf-vision-models.js [manifest.yaml]");
  process.exit(0);
}

const manifestPath = process.argv[2] ?? "configs/models/hf-vision-models.manifest.yaml";
const manifest = YAML.parse(readFileSync(manifestPath, "utf8"));

const results = manifest.models.map((model) => {
  const snapshot = model.snapshot ? path.resolve(model.snapshot) : null;
  const cacheDir = model.cache_dir ? path.resolve(model.cache_dir) : null;
  const requiredFiles = model.required_files ?? [];
  const localCache = model.local_cache ?? {};

  let missing = [];
  if (snapshot && isDirectory(snapshot)) {
    missing = requiredFiles.filter((file) => !existsSync(path.join(snapshot, file)));
  } else if (requiredFiles.length > 0) {
    missing = requiredFiles;
  }

  const localFiles = Object.entries(localCache).map(([id, entry]) => {
    const filePath = entry.path;
    const exists = Boolean(filePath && isFile(filePath));
    const sha256 = exists ? sha256File(filePath) : null;

    return {
      id,
      path: filePath,
      exists,
      sha256,
      sha256_matches: entry.sha256 ? sha256 === entry.sha256 : null,
    };
  });

  const incompleteFiles = cacheDir && isDirectory(cacheDir)
    ? findFiles(cacheDir, (file) => file.endsWith(".incomplete"))
    : [];

  const expectedStatus = model.status;
  const localCacheUsable =
    localFiles.length > 0 &&
    localFiles.every((file) => file.exists && (file.sha256_matches === null || file.sha256_matches));
  const hfSnapshotUsable =
    missing.length === 0 && incompleteFiles.length === 0 && expectedStatus === "downloaded";
  const usable = hfSnapshotUsable || (expectedStatus === "tested" && localCacheUsable);

  return {
    id: model.id,
    repo: model.repo ?? null,
    expected_status: expectedStatus,
    snapshot_exists: snapshot ? isDirectory(snapshot) : false,
    missing_required_files: missing,
    local_files: localFiles,
    incomplete_files: incompleteFiles,
    usable,
  };
});

const output = {
  manifest: manifestPath,
  checked_at: new Date().toISOString(),
  results,
};

console.log(JSON.stringify(output, null, 2));

const hasBrokenDownloadedModel = results.some(
  (result) => result.expected_status === "downloaded" && !result.usable,
);
process.exit(hasBrokenDownloadedModel ? 1 : 0);

function isFile(filePath) {
  try {
    return statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function isDirectory(dirPath) {
  try {
    return statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

function sha256File(filePath) {
  const hash = createHash("sha256");
  hash.update(readFileSync(filePath));
  return hash.digest("hex");
}

function findFiles(root, predicate) {
  const results = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && predicate(fullPath)) {
        results.push(fullPath);
      }
    }
  }

  return results.sort();
}
