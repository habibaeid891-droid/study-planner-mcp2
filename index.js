import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const app = express();
app.use(express.json());

const server = new McpServer({
  name: "study-planner-mcp",
  version: "1.0.0",
});

server.tool("ping", {}, async () => ({
  content: [{ type: "text", text: "pong 🏓" }],
}));

const transport = new StreamableHTTPServerTransport({});

app.get("/", (_req, res) => res.status(200).send("HELLO FROM CLOUD RUN"));

app.all("/mcp", async (req, res) => {
  await transport.handleRequest(req, res, req.body);
});

const port = Number(process.env.PORT || 8080);
app.listen(port, "0.0.0.0", () => {
  console.log("Listening on", port);
  server.connect(transport).then(() => {
    console.log("MCP connected ✅");
  });
});
