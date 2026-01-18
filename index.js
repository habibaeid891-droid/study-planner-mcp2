import express from "express";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { Redis } from "@upstash/redis";
const app = express();
app.use(express.json({ limit: "1mb" }));

/** 1) MCP server */
const server = new McpServer({ name: "study-planner-mcp", version: "1.0.0" });

/** 2) ✅ Tool بتاعتك فقط */
server.tool(
  "get_curriculum",
  { yearid: z.string() },
  async ({ yearid }) => {
    return {
      content: [
        {
          type: "text",
          text: `📚 المنهج الدراسي للسنة: ${yearid}\n- Math\n- Arabic\n- English`,
        },
      ],
      structuredContent: {
        yearid,
        subjects: ["Math", "Arabic", "English"],
      },
    };
  }
);

/** 3) Transport (زي الشغال عندك) */
const transport = new StreamableHTTPServerTransport({});

/** 4) Routes */
app.get("/", (_req, res) => res.status(200).send("HELLO FROM CLOUD RUN"));

app.all("/mcp", async (req, res) => {
  try {
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("handleRequest error:", err);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: String(err?.message || err) });
    }
  }
});

/** 5) Listen */
const port = Number(process.env.PORT || 8080);

app.listen(port, "0.0.0.0", () => {
  console.log(`Listening on ${port}`);
});

/** 6) Connect MCP */
server
  .connect(transport)
  .then(() => console.log("MCP server connected ✅"))
  .catch((err) => console.error("MCP connect error:", err));
