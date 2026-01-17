import express from "express";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server";

const app = express();
app.use(express.json());

/**
 * MCP Server
 */
const server = new McpServer({
  name: "study-planner-mcp",
  version: "1.0.0",
});

/**
 * Tool: get_curriculum
 */
server.tool(
  "get_curriculum",
  {
    yearId: z.string(),
  },
  async ({ yearId }) => {
    return {
      content: [
        {
          type: "text",
          text: `📚 Curriculum for ${yearId}: Math, Arabic, English`,
        },
      ],
    };
  }
);

/**
 * MCP HTTP transport
 */
const transport = new StreamableHTTPServerTransport({
  endpoint: "/mcp",
});

/**
 * Routes
 */
app.get("/", (_req, res) => {
  res.send("Study Planner MCP running ✅");
});

app.post("/mcp", async (req, res) => {
  await transport.handleRequest(req, res, req.body);
});

/**
 * Start server
 */
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", async () => {
  console.log(`🚀 Server listening on ${PORT}`);
  await server.connect(transport);
});
