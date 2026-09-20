#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { reviewRepository } from "./core.js";

const server = new McpServer({ name: "repository-inspector", version: "2.0.0" });

server.tool(
  "review_repository",
  "Inspects committed Git changes relative to baseRef (default main) and returns Markdown. Does not run validation commands. Trusted local use only; repository paths and total output size are unrestricted.",
  {
    repo_path: z.string().describe("Repository path to inspect."),
    baseRef: z.string().optional(),
  },
  async (input) => {
    const report = await reviewRepository({
      repositoryPath: input.repo_path,
      baseRef: input.baseRef,
    });
    return { content: [{ type: "text", text: report }] };
  },
);

await server.connect(new StdioServerTransport());
