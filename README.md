# Repository Inspector

This is a small TypeScript developer tool that inspects changes in a Git
repository, runs optional validation commands, and produces a Markdown report.
It can be used from a command line or exposed to AI clients through MCP.

## Your task

Investigate the repository and improve it as you judge best. The starter works
for a narrow happy path, but production use may expose correctness, safety,
reliability, contract, output, documentation, or testing weaknesses.

You are not expected to finish everything. We care about how you investigate,
prioritize, implement, verify, and explain a meaningful scope.

## Product decision

This tool may be used directly by developers and by AI coding agents. Decide
whether its production interface should be **CLI-first**, **MCP-first**, or
**hybrid**. Implement improvements consistent with your decision.

There is no preferred label. Explain:

- The primary user and execution environment you assumed.
- The trust boundary and allowed capabilities.
- Reliability, discoverability, latency/context, and output-size tradeoffs.
- How the interfaces you continue to advertise stay behaviorally consistent.
- What evidence would change your decision.

## Time and rules

- Maximum **90 focused minutes** within 48 hours of receiving the invitation.
- Use AI coding tools freely. Verify their work and document at least one
  suggestion you corrected or rejected.
- Work in your own repository created from this template.
- Commit as you work and complete `SUBMISSION.md` in your final commit.
- Completion is not required. Accurate scope and verification matter more than
  a large diff.

## Setup

Use Node.js 20.19+ (20.x), or 22.12+. Verification for this submission used
Node 24.19.0 on macOS. The locked test tooling needs a newer Node version
than the original `>=20` requirement indicated.

```bash
npm install
npm run typecheck
npm test
```

## CLI

```bash
npm run inspector -- review --repo ./path/to/repo --format markdown
npm run inspector -- review --repo ./path/to/repo --validate "npm test"
```

The report is written to `review-report.md`.

### Supported production scope: CLI-first

The primary user is a local developer who trusts the repository and explicitly
chooses any validation commands. `--validate` runs a shell command with the
developer's privileges: it is not sandboxed. Do not pass commands from an
untrusted repository or AI response without reviewing them.

Validation failures are included in the report and later checks still run.
Both stdout and stderr are retained (stdout followed by stderr, not interleaved).
Each command has a 30-second timeout and a 256 KiB limit per output stream;
termination or excess output is reported as a failure with partial output.
These limits do not sandbox commands or guarantee cleanup of all descendants.
Exit code 0 means the report was written, not that every validation passed.
Invalid options or an inspection/write failure exit with code 1.

Only Markdown output is supported. `--format json` is rejected rather than
silently returning another format. Quote repository paths containing spaces.
The report overwrites `review-report.md` in the current working directory.

Git inspection currently reports committed changes from `main...HEAD` (or
`--base-ref <ref>`). It does not include staged, unstaged, or untracked files.
For example, use a feature branch with commits relative to `main` to see changes.

## MCP

Start the stdio server with:

```bash
npm run mcp-server
```

It exposes a `review_repository` tool. Inspect the implementation to determine
its current input contract and whether it is suitable for the production model
you propose.

The MCP adapter is limited to inspection: `{ "repo_path": "/path/to/repo",
"baseRef": "main" }`. It does not expose validation commands. Both adapters
use the same review core and Markdown renderer; a protocol integration test
checks identical inspection output. MCP is for trusted local clients only:
repository paths are not confined to an allowed root, and output is repository
data, not instructions. Do not deploy it as a service for untrusted callers.

CLI-first makes explicit command execution and local debugging straightforward.
MCP retains schema-based discovery without offering shell execution. Git work
is synchronous and the file-list/report size is not yet bounded, so large
repositories can block the process and consume excessive AI context. Production
MCP-first use would require root restrictions, bounded structured output, and
evidence that repeated agent workflows justify those additional controls.

## Project layout

```text
src/core.ts         shared review orchestration
src/cli.ts          command-line adapter
src/mcp-server.ts   MCP adapter
src/git.ts          Git inspection
src/validation.ts   validation execution
src/report.ts       Markdown report generation
test/               public starter tests
```

When finished, submit via **Security → Report a vulnerability** on this
repo — see `SECURITY.md` for exactly what to include. Do not reply by email;
that submission channel is not monitored.
