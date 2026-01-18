import express from "express";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const app = express();
app.use(express.json());

/* MCP Server */
const server = new McpServer({
  name: "study-planner-mcp",
  version: "1.0.0",
});

/* TOOL */
server.tool(
  "get_curriculum",
  {
    yearid: z.string(),
  },
  async ({ yearid }) => {
    return {
      content: [
        {
          type: "text",
          text: `📚 المنهج الدراسي للسنة: ${yearid}\n- Math\n- Arabic\n- English`,
        },
      ],
    };
  }
);

/* ✅ Transport (IMPORTANT) */
const transport = new StreamableHTTPServerTransport({
  server,
});

/* MCP endpoint */
app.all("/mcp", async (req, res) => {
  await transport.handleRequest(req, res);
});

/* Health check */
app.get("/", (_, res) => res.status(200).send("OK"));

const PORT = process.env.PORT || 8080;

/* ✅ Start HTTP first */
app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

/* ✅ Connect MCP AFTER server setup */
await server.connect(transport);
