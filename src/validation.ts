import { exec } from "node:child_process";
import type { ValidationResult } from "./types.js";

export function runValidation(
  command: string,
  cwd: string,
  limits = { timeout: 30_000, maxBuffer: 256 * 1024 },
): Promise<ValidationResult> {
  return new Promise((resolve) => {
    exec(command, { cwd, ...limits, killSignal: "SIGKILL" }, (error, stdout, stderr) => {
      const output = [stdout, stderr].filter(Boolean).join("\n");
      resolve({
        command,
        status: error ? "failed" : "passed",
        output: error
          ? `${output}\n[Validation failed: ${error.killed ? "terminated (timeout or output limit)" : String(error.code ?? error.message)}]`
          : output,
      });
    });
  });
}

export async function runValidations(commands: string[], cwd: string): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];
  for (const command of commands) {
    results.push(await runValidation(command, cwd));
  }
  return results;
}
