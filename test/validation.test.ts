import { describe, expect, it } from "vitest";
import { runValidation, runValidations } from "../src/validation.js";

const command = (code: string) => `"${process.execPath}" -e '${code}'`;

describe("validation execution", () => {
  it("preserves both stdout and stderr", async () => {
    const result = await runValidation(command('console.log("out"); console.error("err")'), process.cwd());
    expect(result.status).toBe("passed");
    expect(result.output).toContain("out");
    expect(result.output).toContain("err");
  });

  it("records failure and continues to the next check", async () => {
    const results = await runValidations([
      command('console.error("broken"); process.exit(2)'),
      command('console.log("next check")'),
    ], process.cwd());
    expect(results.map(result => result.status)).toEqual(["failed", "passed"]);
    expect(results[0].output).toContain("broken");
    expect(results[1].output).toContain("next check");
  });

  it("terminates a slow command and records the failure", async () => {
    const result = await runValidation(command('setInterval(() => {}, 1000)'), process.cwd(), {
      timeout: 100, maxBuffer: 1024,
    });
    expect(result.status).toBe("failed");
    expect(result.output).toContain("terminated");
  });

  it("bounds excessive command output", async () => {
    const result = await runValidation(command('console.log("x".repeat(100000))'), process.cwd(), {
      timeout: 1000, maxBuffer: 1024,
    });
    expect(result.status).toBe("failed");
    expect(result.output.length).toBeLessThan(2000);
  });
});
