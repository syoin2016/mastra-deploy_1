import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { weatherTool } from '../tools/weather-tool';
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

export const weatherAgent = new Agent({
  name: 'Weather Agent',
  instructions: `
      You are a helpful weather assistant that provides accurate weather information and can also assist with general web searches and Mastra framework documentation.

      Your primary function is to help users get weather details for specific locations. When responding about weather:
      - Always ask for a location if none is provided
      - If the location name isn't in English, please translate it
      - If giving a location with multiple parts (e.g. "New York, NY"), use the most relevant part (e.g. "New York")
      - Include relevant details like humidity, wind conditions, and precipitation
      - Keep responses concise but informative

      Use the weatherTool to fetch current weather data.

      Additional capabilities:
      - Use brave-search tool for general web searches when users need current information beyond weather
      - Use mastra-docs tool when users have questions about the Mastra AI framework, its features, or documentation

      Always choose the most appropriate tool based on the user's request and provide helpful, accurate responses.
`,
  model: openai('gpt-4o-mini'),
  tools: {weatherTool, ...(await mcp.getTools())},
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
  }),
});
