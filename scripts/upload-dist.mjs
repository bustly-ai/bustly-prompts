#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(name);
  if (idx === -1) {
    return null;
  }
  return args[idx + 1] ?? null;
};
const hasFlag = (name) => args.includes(name);

const rawEnv = (getArg("--env") || "test").toLowerCase();
const env = (() => {
  if (rawEnv === "test" || rawEnv === "testing" || rawEnv === "dev" || rawEnv === "development") {
    return "test";
  }
  if (rawEnv === "prod" || rawEnv === "production") {
    return "prod";
  }
  return null;
})();

if (!env) {
  console.error(`[bustly-prompts upload] Unknown env: ${rawEnv} (use test|prod)`);
  process.exit(1);
}

const bucket = env === "prod" ? "www-salerio-global" : "test-www-salerio-global";
const prefixRaw = getArg("--prefix") || "bustly-prompts";
const objectPrefix = prefixRaw.replace(/^\/+|\/+$/g, "");
const sourceDir = path.resolve(getArg("--src") || path.join(projectRoot, "openclaw-prompts"));
const dryRun = hasFlag("--dry-run");

if (!objectPrefix) {
  console.error("[bustly-prompts upload] Empty --prefix is not allowed.");
  process.exit(1);
}

if (!existsSync(sourceDir)) {
  console.error(`[bustly-prompts upload] Source path not found: ${sourceDir}`);
  process.exit(1);
}

const ossutilVersion = spawnSync("ossutil", ["version"], { stdio: "inherit" });
if (ossutilVersion.status !== 0) {
  console.error("[bustly-prompts upload] ossutil not found or failed to run.");
  process.exit(ossutilVersion.status ?? 1);
}

function walkFiles(dir, out = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".DS_Store" || entry.name === ".git") {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, out);
      continue;
    }
    if (entry.isFile()) {
      out.push(fullPath);
    }
  }
  return out;
}

const files = walkFiles(sourceDir);
if (files.length === 0) {
  console.error(`[bustly-prompts upload] No files found in ${sourceDir}`);
  process.exit(1);
}

const publicBaseUrl = `https://${bucket}.oss-us-west-1.aliyuncs.com/${objectPrefix}`;
console.log(
  `[bustly-prompts upload] env=${env} bucket=${bucket} prefix=${objectPrefix} files=${files.length}`,
);
console.log(`[bustly-prompts upload] source=${sourceDir}`);
console.log(`[bustly-prompts upload] publicBaseUrl=${publicBaseUrl}`);
if (dryRun) {
  console.log("[bustly-prompts upload] dry-run mode enabled");
}

for (const filePath of files) {
  const relativePath = path.relative(sourceDir, filePath).split(path.sep).join("/");
  const destination = `oss://${bucket}/${objectPrefix}/${relativePath}`;
  console.log(`[bustly-prompts upload] ${relativePath} -> ${destination}`);
  if (dryRun) {
    continue;
  }
  const result = spawnSync("ossutil", ["cp", filePath, destination, "-f"], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("[bustly-prompts upload] completed");
