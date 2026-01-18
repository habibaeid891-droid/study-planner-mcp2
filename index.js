import express from "express";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { HTTPServerTransport } from "@modelcontextprotocol/sdk/server/http.js";

const app = express();
app.use(express.json());

/* Health check */
app.get("/", (req, res) => {
  res.status(200).send("OK - study-planner-mcp running");
});

/* 1️⃣ MCP Server */
const server = new McpServer({
  name: "study-planner-mcp",
  version: "1.0.0",
});

/* 2️⃣ 👉 TOOL بتاعتك */
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
          text: `📚 Curriculum for year ${yearId}:\n- Math\n- Arabic\n- English`,
        },
      ],
      structuredContent: {
        yearId,
        subjects: ["Math", "Arabic", "English"],
      },
    };
  }
);

/* 3️⃣ Transport الصح */
const transport = new HTTPServerTransport({
  server,
  endpoint: "/mcp",
});

/* 4️⃣ MCP endpoint */
app.post("/mcp", async (req, res) => {
  try {
    await transport.handleRequest(req, res);
  } catch (err) {
    console.error("MCP error:", err);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  }
});

/* 5️⃣ Listen */
const PORT = Number(process.env.PORT || 8080);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on ${PORT}`);

  server
    .connect(transport)
    .then(() => console.log("✅ MCP connected"))
    .catch(console.error);
});
