import express from "express";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import admin from "firebase-admin";

const app = express();
app.use(express.json({ limit: "1mb" }));

/** 🔥 Firebase init (NO STORAGE) */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
  console.log("Firebase initialized ✅");
}

/** MCP server */
const server = new McpServer({
  name: "study-planner-mcp",
  version: "1.0.0",
});

/** Tool مؤقتة جدًا */
server.tool(
  "ping",
  {},
  async () => ({
    content: [{ type: "text", text: "pong 🏓" }],
  })
);

/** Transport */
const transport = new StreamableHTTPServerTransport({});

/** Routes */
app.get("/", (_req, res) => res.status(200).send("HELLO FROM CLOUD RUN"));

app.all("/mcp", async (req, res) => {
  try {
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

/** Listen */
const port = Number(process.env.PORT || 8080);
app.listen(port, "0.0.0.0", () => {
  console.log("Listening on", port);
});

/** Connect MCP */
server.connect(transport).then(() => {
  console.log("MCP connected ✅");
});
