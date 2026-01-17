import express from "express";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server";

const app = express();
app.use(express.json());

const server = new McpServer({
  name: "study-planner-mcp",
  version: "1.0.0",
});

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
          text: `Curriculum for ${yearId}: Math, Arabic, English`,
        },
      ],
    };
  }
);

const transport = new StreamableHTTPServerTransport({
  endpoint: "/mcp",
});

app.get("/", (_req, res) => {
  res.send("MCP server running");
});

app.all("/mcp", async (req, res) => {
  await transport.handleRequest(req, res, req.body);
});

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", async () => {
  console.log("Listening on", port);
  await server.connect(transport);
});
