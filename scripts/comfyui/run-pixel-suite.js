#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const COMFY_OUTPUT = "/Users/tobe/Documents/ComfyUI/output";
const API = process.env.COMFYUI_API ?? "http://127.0.0.1:8000";
const paramsPaths = process.argv.slice(2);

if (paramsPaths.length === 0) {
  console.error("Usage: scripts/comfyui/run-pixel-suite.js <params.yaml> [<params.yaml> ...]");
  process.exit(2);
}

if (!(await apiAlive())) {
  throw new Error(`ComfyUI API is not reachable at ${API}`);
}

for (const paramsPath of paramsPaths) {
  const params = readYaml(path.resolve(ROOT, paramsPath));
  const suite = readYaml(path.resolve(ROOT, mustGet(params, "prompt_suite")));
  const template = JSON.parse(readFileSync(path.resolve(ROOT, mustGet(mustGet(params, "workflow"), "api")), "utf8"));
  const seeds = mustGet(mustGet(params, "generation"), "seeds");
  const outputRoot = mustGet(mustGet(params, "output"), "root");

  const results = [];
  for (const caseData of mustGet(suite, "cases")) {
    for (const seed of seeds) {
      const prompt = {
        id: mustGet(caseData, "id"),
        positive: mustGet(caseData, "positive"),
        negative: caseData.negative ?? mustGet(suite, "default_negative"),
      };

      const before = await ramFreeGb();
      const workflow = mutateWorkflow(template, params, prompt, seed, mustGet(suite, "id"));
      const started = Date.now();
      const response = await httpPost("/prompt", { prompt: workflow, client_id: randomUUID() });
      const history = await waitForHistory(mustGet(response, "prompt_id"));
      const duration = Number(((Date.now() - started) / 1000).toFixed(2));
      const target = path.join(outputRoot, "raw", `${prompt.id}-seed${seed}.png`);
      const source = copyOutput(history, path.resolve(ROOT, target));
      const processed = postprocess(params, path.resolve(ROOT, target), prompt.id);
      const after = await ramFreeGb();

      results.push({
        id: prompt.id,
        zh: caseData.zh,
        seed,
        source,
        target,
        processed,
        duration_sec: duration,
        ram_free_before_gb: before === null ? null : Number(before.toFixed(2)),
        ram_free_after_gb: after === null ? null : Number(after.toFixed(2)),
        sha256: sha256File(path.resolve(ROOT, target)),
        positive: prompt.positive,
        negative: prompt.negative,
        status: "success",
      });

      console.log(`generated ${mustGet(suite, "id")}/${prompt.id} seed=${seed} duration=${duration}s`);
    }
  }

  const manifest = writeManifest(params, suite, results);
  const report = writeReport(params, suite, results, manifest);
  console.log(`manifest ${manifest}`);
  console.log(`report ${report}`);
}

async function httpGet(route) {
  const response = await fetch(new URL(route, API));
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`GET ${route} failed: ${response.status} ${body}`);
  }
  return JSON.parse(body);
}

async function httpPost(route, body) {
  const response = await fetch(new URL(route, API), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`POST ${route} failed: ${response.status} ${text}`);
  }
  return JSON.parse(text);
}

async function apiAlive() {
  try {
    await httpGet("/system_stats");
    return true;
  } catch {
    return false;
  }
}

async function ramFreeGb() {
  try {
    const stats = await httpGet("/system_stats");
    return Number(stats.system.ram_free) / 1024 / 1024 / 1024;
  } catch {
    return null;
  }
}

function mutateWorkflow(template, params, prompt, seed, suiteId) {
  const workflow = structuredClone(template);
  const generation = mustGet(params, "generation");
  const model = mustGet(params, "model");

  workflow["4"].inputs.ckpt_name = mustGet(model, "checkpoint");
  workflow["10"].inputs.lora_name = mustGet(model, "lora");
  workflow["10"].inputs.strength_model = mustGet(model, "lora_strength_model");
  workflow["10"].inputs.strength_clip = mustGet(model, "lora_strength_clip");
  workflow["5"].inputs.width = mustGet(generation, "width");
  workflow["5"].inputs.height = mustGet(generation, "height");
  workflow["5"].inputs.batch_size = generation.batch_size ?? 1;
  workflow["3"].inputs.seed = seed;
  workflow["3"].inputs.steps = mustGet(generation, "steps");
  workflow["3"].inputs.cfg = mustGet(generation, "cfg");
  workflow["3"].inputs.sampler_name = mustGet(generation, "sampler");
  workflow["3"].inputs.scheduler = mustGet(generation, "scheduler");
  workflow["3"].inputs.denoise = generation.denoise ?? 1.0;
  workflow["6"].inputs.text = prompt.positive;
  workflow["7"].inputs.text = prompt.negative;
  workflow["9"].inputs.filename_prefix = `ai-image/built-in/${suiteId}/raw/${prompt.id}-seed${seed}`;

  return workflow;
}

async function waitForHistory(promptId) {
  const started = Date.now();
  while (true) {
    const history = await httpGet(`/history/${promptId}`);
    if (history[promptId]) {
      return history[promptId];
    }
    if (Date.now() - started > 900_000) {
      throw new Error(`Timed out waiting for ${promptId}`);
    }
    await sleep(5000);
  }
}

function copyOutput(history, target) {
  const images = Object.values(mustGet(history, "outputs")).flatMap((output) => output.images ?? []);
  if (images.length === 0) {
    throw new Error("No output image in history");
  }

  const image = images.at(-1);
  const source = path.join(COMFY_OUTPUT, image.subfolder ?? "", mustGet(image, "filename"));
  if (!existsSync(source)) {
    throw new Error(`ComfyUI output not found: ${source}`);
  }

  mkdirSync(path.dirname(target), { recursive: true });
  copyFileSync(source, target);
  return source;
}

function postprocess(params, target, promptId) {
  const post = params.postprocess ?? {};
  if (!post.enabled) return [];

  const sizes = post.asset_sizes ?? [];
  if (sizes.length === 0) return [];

  const outputRoot = path.resolve(ROOT, mustGet(mustGet(params, "output"), "root"));
  const script = path.resolve(ROOT, "scripts/assets/pixel-icon-postprocess.mjs");
  const command = ["node", script, target, outputRoot, promptId, ...sizes.map(String)];
  const result = spawnSync(command[0], command.slice(1), { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`Postprocess failed for ${target}`);
  }

  return sizes.flatMap((size) => [
    path.join(mustGet(mustGet(params, "output"), "root"), "processed", `${size}x${size}`, `${promptId}.png`),
    path.join(mustGet(mustGet(params, "output"), "root"), "processed", "preview-512", `${promptId}-${size}x-preview.png`),
  ]);
}

function writeManifest(params, suite, results) {
  const outputRoot = path.resolve(ROOT, mustGet(mustGet(params, "output"), "root"));
  const manifestPath = path.join(outputRoot, "manifest.json");
  const payload = {
    run_id: `${mustGet(suite, "id")}-seed${mustGet(mustGet(params, "generation"), "seeds").join("-")}`,
    generated_at: new Date().toISOString(),
    api: API,
    workflow: mustGet(mustGet(params, "workflow"), "api"),
    prompt_suite: mustGet(params, "prompt_suite"),
    model: mustGet(params, "model"),
    generation: mustGet(params, "generation"),
    postprocess: params.postprocess ?? {},
    results,
  };

  mkdirSync(outputRoot, { recursive: true });
  writeFileSync(manifestPath, `${JSON.stringify(payload, null, 2)}\n`);
  return manifestPath;
}

function writeReport(params, suite, results, manifestPath) {
  const report = path.resolve(ROOT, mustGet(mustGet(params, "output"), "report"));
  const reportDir = path.dirname(report);
  mkdirSync(reportDir, { recursive: true });

  const lines = [];
  lines.push(`# ${mustGet(suite, "id")} 测试报告`);
  lines.push("");
  lines.push("## 概览");
  lines.push("");
  lines.push("- 运行入口：ComfyUI Desktop API");
  lines.push(`- API 地址：\`${API}\``);
  lines.push(`- 工作流：[${path.basename(mustGet(mustGet(params, "workflow"), "api"))}](${rel(reportDir, path.resolve(ROOT, mustGet(mustGet(params, "workflow"), "api")))})`);
  lines.push(`- 参数文件：\`${mustGet(params, "id")}\``);
  lines.push(`- 提示词套件：[${path.basename(mustGet(params, "prompt_suite"))}](${rel(reportDir, path.resolve(ROOT, mustGet(params, "prompt_suite")))})`);
  lines.push(`- 模型：\`${mustGet(mustGet(params, "model"), "checkpoint")}\``);
  lines.push(`- LoRA：\`${mustGet(mustGet(params, "model"), "lora")}\``);
  lines.push(`- LoRA 强度：model \`${mustGet(mustGet(params, "model"), "lora_strength_model")}\` / clip \`${mustGet(mustGet(params, "model"), "lora_strength_clip")}\``);
  lines.push(`- 尺寸：\`${mustGet(mustGet(params, "generation"), "width")}x${mustGet(mustGet(params, "generation"), "height")}\``);
  lines.push(`- steps：\`${mustGet(mustGet(params, "generation"), "steps")}\``);
  lines.push(`- CFG：\`${mustGet(mustGet(params, "generation"), "cfg")}\``);
  lines.push(`- seed：\`${mustGet(mustGet(params, "generation"), "seeds").join(", ")}\``);
  lines.push(`- manifest：[manifest.json](${rel(reportDir, manifestPath)})`);
  lines.push("");
  lines.push("## 生成结果");
  lines.push("");
  lines.push("| 用例 | 中文 | 耗时 | 原图 | 处理后 | SHA256 |");
  lines.push("|---|---|---:|---|---|---|");

  for (const result of results) {
    const raw = rel(reportDir, path.resolve(ROOT, result.target));
    const processed = (result.processed ?? [])
      .map((item) => `[${path.basename(item)}](${rel(reportDir, path.resolve(ROOT, item))})`)
      .join("<br>");
    lines.push(`| \`${result.id}\` | ${result.zh ?? ""} | \`${result.duration_sec}s\` | [图片](${raw}) | ${processed || "-"} | \`${result.sha256}\` |`);
  }

  lines.push("");
  lines.push("## 预览");
  lines.push("");
  for (const result of results) {
    const raw = rel(reportDir, path.resolve(ROOT, result.target));
    lines.push(`### ${result.id}`);
    lines.push("");
    lines.push(`![${result.id}](${raw})`);
    lines.push("");
  }

  lines.push("## 快速观察");
  lines.push("");
  lines.push("- 本报告先记录自动生成结果；是否继续深入以人工验收为准");
  lines.push("- 透明背景不作为本轮验收条件，本轮主要看像素风、轮廓、可识别性和图集/单体路线是否成立");
  lines.push("");

  writeFileSync(report, lines.join("\n"));
  return report;
}

function readYaml(filePath) {
  return YAML.parse(readFileSync(filePath, "utf8"));
}

function mustGet(value, key) {
  if (!value || value[key] === undefined || value[key] === null) {
    throw new Error(`Missing required key: ${key}`);
  }
  return value[key];
}

function sha256File(filePath) {
  const hash = createHash("sha256");
  hash.update(readFileSync(filePath));
  return hash.digest("hex");
}

function rel(from, to) {
  return path.relative(from, to).split(path.sep).join("/");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
