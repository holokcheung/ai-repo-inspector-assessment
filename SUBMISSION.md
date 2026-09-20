# Submission

Prepared with Codex implementation assistance and an independent Claude review.
AI contributions and verification are identified explicitly below.

## What did you investigate first, and why?

The investigation traced CLI and MCP inputs through the shared review core,
Git inspection, validation execution, and report rendering. A review tool needs
to preserve failed-check evidence, so validation failure handling was prioritized.
The baseline typecheck passed. After resolving a local runtime issue, the one
starter test passed. Two new regression tests then failed on the original code:
stderr was discarded when stdout existed, and a failed check rejected the whole
review before subsequent checks ran.

## What did you choose to implement or fix?

- Preserve failed validations as report results and continue subsequent checks.
- Retain stdout and stderr, label passed/failed checks, and protect validation
  output/commands containing Markdown backticks with a sufficiently long fence.
- Limit each validation to 30 seconds and 256 KiB per output stream. Record
  termination/output-limit failures with partial output.
- Preserve CLI paths containing spaces and reject unknown/missing options and
  unsupported JSON output. Exit 0 means report generation succeeded.
- Correct MCP's repo_path mapping and remove shell commands from its schema.
- Correct the built executable path and Node engine requirement.
- Add regression and real CLI/MCP integration tests; exclude compiled duplicate
  tests from discovery.

## What did you intentionally not do?

No full Git parser rewrite, JSON implementation, remote service, sandbox,
validation allowlist, dependency upgrades, or comprehensive report sanitization.
The changes focus on a usable local review workflow and explicit boundaries.

## Interface decision

- Decision: CLI-first, with a limited inspection-only MCP adapter.
- Primary user and execution environment: A developer on a trusted local machine
  reviewing committed branch changes and explicitly choosing shell validations.
  Local verification used macOS and Node 24.19.0; CI uses Linux and Node 20.x.
- Trust boundary and allowed capabilities: CLI validations run with the user's
  privileges in the selected repository. They are not sandboxed. MCP does not
  accept validation commands, but still permits arbitrary repository paths and
  must only be connected to trusted local clients.
- Reliability, discoverability, latency/context, and output tradeoffs: CLI makes
  command execution explicit and easy to debug; MCP offers schema discovery for
  inspection. Both return Markdown. Sequential validations are predictable but
  add latency. Per-command limits bound validation execution/output, but Git and
  total report size remain unbounded and synchronous Git blocks the process.
- How supported interfaces remain consistent: Both use the shared review core
  and renderer. An SDK stdio integration test compares MCP inspection output
  byte-for-byte with the CLI report. CLI alone supports explicit validations.
- Evidence that would change this decision: Frequent agent-only use needing
  structured, bounded responses would justify MCP-first investment with allowed
  repository roots, asynchronous Git, and a constrained validation capability.

## How did you use an AI coding agent?

Codex inspected the repository, proposed the CLI-first scope, wrote the code
and tests, ran verification, and drafted documentation. I asked it to explain
the work, reread the requirements, and double-check its results. I also brought
Claude into the task and explicitly asked the two tools to work together, with
Claude independently reviewing and Codex handling repository changes.

## Where did you check, correct, or reject an AI suggestion? (required)

I challenged moving straight to final submission preparation by asking Codex to
"double check everything" and arranging an independent Claude review. During
that additional check, Codex reproduced a crash in its own Markdown fence
implementation with 200,000 separate backtick runs, then replaced argument
spreading with an iterative scan and added a regression test. This was an
AI-implemented correction prompted by my request for more verification; I did
not personally identify or write the code fix.

Earlier, Codex also corrected a misleading 22-test count caused by discovering
compiled copies as well as source tests. The source-only configuration initially
reported 11 tests; the additional backtick regression brought the total to 12.
Claude independently confirmed typechecking, the 12 tests after build, and the
built CLI smoke test. Claude could not independently access the GitHub run API;
Codex verified the CI result directly.

Independent review follow-up: Claude flagged the stale JSON type contract,
which was narrowed to Markdown, and unclear MCP discovery text, which now
states inspection-only behavior and limits. Empty CLI values were also found
to reach execution; they now fail argument validation, with added test cases.
Claude suggested accepting bare flag-like validation values and automatically
resolving alternate base branches. Those suggestions were not adopted: values
starting with -- are explicitly reserved as options, and the documented main
base should not silently switch. Users can pass --base-ref explicitly. Rename
parsing and richer Git errors remain known limitations rather than claiming
that the passing validation tests cover them.

## Commands used to verify the result, with outcomes

- npm ci --ignore-scripts --include=optional: installed dependencies using Node
  24.19.0. npm reported eight dependency advisories (five moderate, three high);
  those were not investigated or fixed in this scope.
- npm test before fixes: one starter test passed; then the two new regression
  tests failed, demonstrating the bugs.
- npm run typecheck: passed after changes.
- npm run build: passed after changes.
- npm test after the final review: 17 tests passed across three source files.
  Coverage includes failure continuation, both streams, timeout/output bounds,
  Markdown fences (including 200,000 separate backtick runs), CLI paths/options,
  and a real MCP stdio round trip. The large-backtick regression first failed
  with a RangeError, then passed after replacing argument spreading with a loop.
- node dist/src/cli.js review --repo . --base-ref 19af983 --format markdown
  --validate "npm run typecheck": passed and generated the expected change list
  and successful validation output.
- git diff --check: passed.
- GitHub Actions: Public checks passed on commit 9fb482e (Linux/Node 20.x),
  https://github.com/holokcheung/ai-repo-inspector-assessment/actions/runs/35537151342.

## A blocker you hit and how you approached it

The local default Node 20.16.0 was below the locked test dependencies' supported
version and the first test run lacked a native Rolldown binding. A targeted
installation attempt failed in npm. Switching to the available Node 24.19.0 and
reinstalling the locked dependencies with optional packages restored the test
runner without dependency upgrades. The declared Node requirement was corrected.

## Known limitations and the next three things you would do

1. Improve Git inspection: explicit working-tree semantics, NUL-separated path
   parsing, rename handling, invalid-base diagnostics, and command limits.
2. Tighten execution and reporting: descendant-process cleanup, total request
   budgets, report-size limits, escaping repository/file fields, and opt-in
   validation-failure exit codes for CI. Current timeouts are not a sandbox.
3. Investigate dependency advisories and harden MCP for broader deployment with
   allowed roots, clearer errors, and bounded structured output.

The integration tests use POSIX shell commands; Windows behavior is unverified.
Git inspection currently includes only committed base...HEAD changes. Report
creation overwrites review-report.md in the working directory.

## Approximate focused-work time

- Start: Approximately 2026-09-20 13:35 Pacific, based on the timestamped
  conversation where I said I was starting the test. Repository setup followed
  at 13:37 and agent code inspection at 13:38.
- Finish: 2026-09-20 13:57 Pacific for code, review, and this submission document.
- Approximately 22 minutes elapsed, including setup and review, using conversation
  timestamps as an estimate rather than a separate stopwatch. Private form
  submission is still pending application-email confirmation and browser login.
