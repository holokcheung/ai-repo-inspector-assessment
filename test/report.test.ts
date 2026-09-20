import { describe, expect, it } from "vitest";
import { markdownReport } from "../src/report.js";

describe("markdownReport", () => {
  it("handles many separate backticks within the allowed output budget", () => {
    const output = "`x".repeat(200_000);
    expect(() => markdownReport({
      repositoryPath: "/work/sample", changedFiles: [],
      validationResults: [{ command: "check", status: "passed", output }],
    })).not.toThrow();
  });
  it("lists changed files and validation output", () => {
    const report = markdownReport({
      repositoryPath: "/work/sample",
      changedFiles: [{ path: "src/index.ts", status: "modified" }],
      validationResults: [{ command: "npm test", status: "passed", output: "ok" }],
    });

    expect(report).toContain("src/index.ts (modified)");
    expect(report).toContain("npm test");
    expect(report).toContain("ok");
  });

  it("shows failure and contains embedded Markdown fences", () => {
    const report = markdownReport({
      repositoryPath: "/work/sample", changedFiles: [],
      validationResults: [{ command: "check", status: "failed", output: "```\nmisleading heading" }],
    });
    expect(report).toContain("### Validation: failed");
    expect(report).toContain("````\n$ check\n```\nmisleading heading\n````");
  });
});
