#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { reviewRepository } from "./core.js";

type Args = {
  command: string;
  repositoryPath?: string;
  baseRef?: string;
  format?: "markdown";
  validations: string[];
};

function parseArgs(argv: string[]): Args {
  const args: Args = { command: argv[0] ?? "", validations: [] };
  for (let index = 1; index < argv.length; index++) {
    const token = argv[index];
    const value = argv[index + 1];
    if (["--repo", "--base-ref", "--format", "--validate"].includes(token) &&
        (value === undefined || !value.trim() || value.startsWith("--"))) {
      throw new Error(`Missing value for ${token}`);
    }
    if (token === "--repo") {
      args.repositoryPath = argv[++index];
    } else if (token === "--base-ref") {
      args.baseRef = argv[++index];
    } else if (token === "--format") {
      const format = argv[++index];
      if (format !== "markdown") throw new Error("Only --format markdown is supported.");
      args.format = format;
    } else if (token === "--validate") {
      args.validations.push(argv[++index]);
    } else {
      throw new Error(`Unknown option: ${token}`);
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.command !== "review" || !args.repositoryPath) {
    console.error("Usage: inspector review --repo <path> [--base-ref <ref>] [--validate <command>]");
    process.exitCode = 1;
    return;
  }

  const report = await reviewRepository({
    repositoryPath: args.repositoryPath,
    baseRef: args.baseRef,
    validationCommands: args.validations,
    format: args.format,
  });
  writeFileSync("review-report.md", report, "utf8");
  console.log("Review report written to review-report.md");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exitCode = 1;
});
