import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("HELLO FROM CLOUD RUN");
});

const server = new McpServer({
  name: "study-planner-mcp",
  version: "1.0.0",
});

const transport = new StreamableHTTPServerTransport({ server });

app.post("/mcp", async (req, res) => {
  await transport.handleRequest(req, res);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("🚀 Server running on", PORT);

  server.connect(transport)
    .then(() => console.log("✅ MCP connected"))
    .catch(console.error);
});
