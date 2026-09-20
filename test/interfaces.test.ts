import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const cli = resolve("src/cli.ts");
const server = resolve("src/mcp-server.ts");
const tsx = resolve("node_modules/tsx/dist/cli.mjs");
let repo: string;

beforeAll(() => {
  repo = mkdtempSync(join(tmpdir(), "inspector with spaces "));
  const git = (...args: string[]) => execFileSync("git", args, { cwd: repo });
  git("init", "-b", "main");
  git("-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "--allow-empty", "-m", "base");
  git("checkout", "-b", "change");
  writeFileSync(join(repo, "example.txt"), "example");
  git("add", ".");
  git("-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-m", "change");
});
afterAll(() => rmSync(repo, { recursive: true, force: true }));

describe("supported interfaces", () => {
  it("writes a report for a path with spaces even if validation fails", () => {
    const result = spawnSync(process.execPath, [tsx, cli, "review", "--repo", repo,
      "--validate", 'echo validation-failed >&2; exit 2'], { cwd: repo, encoding: "utf8" });
    expect(result.status, result.stderr).toBe(0);
    const report = readFileSync(join(repo, "review-report.md"), "utf8");
    expect(report).toContain("example.txt (added)");
    expect(report).toContain("Validation: failed");
    expect(report).toContain("validation-failed");
  });

  it.each([["--format", "json"], ["--repo"], ["--typo", "value"]])("rejects invalid options %s", (...args) => {
    const result = spawnSync(process.execPath, [tsx, cli, "review", "--repo", repo, ...args], {
      cwd: repo, encoding: "utf8",
    });
    expect(result.status).toBe(1);
  });

  it("MCP accepts its advertised repo_path and returns the same inspection as CLI", async () => {
    const client = new Client({ name: "assessment-test", version: "1.0.0" });
    const transport = new StdioClientTransport({ command: process.execPath, args: [tsx, server] });
    try {
      await client.connect(transport);
      const list = await client.listTools();
      const schema = list.tools.find(tool => tool.name === "review_repository")!.inputSchema;
      expect(schema.properties).toHaveProperty("repo_path");
      expect(schema.properties).not.toHaveProperty("validationCommands");
      const result = await client.callTool({ name: "review_repository", arguments: { repo_path: repo } });
      expect(result.isError).not.toBe(true);
      const cliResult = spawnSync(process.execPath, [tsx, cli, "review", "--repo", repo], { cwd: repo, encoding: "utf8" });
      expect(cliResult.status, cliResult.stderr).toBe(0);
      expect(result.content).toEqual([{ type: "text", text: readFileSync(join(repo, "review-report.md"), "utf8") }]);
    } finally {
      await client.close();
    }
  });
});
