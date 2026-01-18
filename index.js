import express from "express";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp";

const app = express();
app.use(express.json());

const server = new McpServer({
  name: "study-planner-mcp",
  version: "1.0.0",
});

server.tool(
  "get_curriculum",
  { yearid: z.string() },
  async ({ yearid }) => ({
    content: [
      {
        type: "text",
        text: `📚 المنهج الدراسي للسنة: ${yearid}\n- Math\n- Arabic\n- English`,
      },
    ],
  })
);

const transport = new StreamableHTTPServerTransport({ server });

app.all("/mcp", async (req, res) => {
  await transport.handleRequest(req, res);
});

app.get("/", (_, res) => res.status(200).send("OK"));

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);

  // ✅ MCP connect AFTER server is listening (NO top-level await)
  server.connect(transport)
    .then(() => console.log("✅ MCP connected"))
    .catch(err => console.error("❌ MCP connect failed", err));
});
