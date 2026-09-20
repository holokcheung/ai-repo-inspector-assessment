import type { ChangedFile, ValidationResult } from "./types.js";

type ReportInput = {
  repositoryPath: string;
  changedFiles: ChangedFile[];
  validationResults: ValidationResult[];
};

export function markdownReport(input: ReportInput): string {
  const lines = [`# Review Report: ${input.repositoryPath}`, "", "## Changed files"];
  for (const file of input.changedFiles) {
    lines.push(`- ${file.path} (${file.status})`);
  }
  lines.push("", "## Validation output");
  for (const result of input.validationResults) {
    let longestFence = 2;
    for (const match of `${result.command}\n${result.output}`.matchAll(/`+/g)) {
      longestFence = Math.max(longestFence, match[0].length);
    }
    const fence = "`".repeat(longestFence + 1);
    lines.push(`### Validation: ${result.status}`, fence, `$ ${result.command}`, result.output, fence);
  }
  return lines.join("\n");
}
