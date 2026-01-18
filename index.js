import express from "express";
import { z } from "zod";
import {
  McpServer
} from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  StreamableHTTPServerTransport
} from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const app = express();
app.use(express.json());

/* MCP Server edit*/
const server = new McpServer({
  name: "study-planner-mcp",
  version: "1.0.0",
});

/* TOOL */
server.tool(
  "get_curriculum",
  {
    yearid: z.string()
  },
  async ({ yearid }) => {
    return {
      content: [
        {
          type: "text",
          text: `📚 المنهج الدراسي للسنة: ${yearid}\n- Math\n- Arabic\n- English`
        }
      ]
    };
  }
);

/* Transport */
const transport = new StreamableHTTPServerTransport();

/* MCP endpoint */
app.all("/mcp", async (req, res) => {
  await transport.handleRequest(req, res, req.body);
});

/* Health check */
app.get("/", (_, res) => res.send("OK"));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("Server running on", PORT);
});

/* Connect MCP */
await server.connect(transport);

