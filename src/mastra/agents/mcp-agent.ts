import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { MCPClient } from "@mastra/mcp";

const mcp = new MCPClient({
  servers: {
    // Stdioの例
    "brave-search": {
      "command": "/usr/local/bin/npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-brave-search"
      ],
      env: {
        "BRAVE_API_KEY": process.env.BRAVE_API_KEY || "",
      },
    },
    // SSEの例
    "mastra-docs": {
      url: new URL("https://gitmcp.io/mastra-ai/mastra")
    },
  },
});

export const mcpAgent = new Agent({
  name: 'MCP Agent',
  instructions: `
      You are a helpful assistant that can perform web searches and provide information about the Mastra AI framework.

      Your capabilities include:
      - Use brave-search tool for general web searches when users need current information from the internet
      - Use mastra-docs tool when users have questions about the Mastra AI framework, its features, documentation, or implementation details

      When responding:
      - Always choose the most appropriate tool based on the user's request
      - Provide accurate and helpful information
      - Keep responses concise but informative
      - If you're unsure which tool to use, ask for clarification about what specific information the user needs

      Always aim to provide helpful, accurate responses using the available tools.
`,
  model: openai('gpt-4o-mini'),
  tools: await mcp.getTools(),
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
  }),
});
