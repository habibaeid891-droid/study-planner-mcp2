import express from "express";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

/** MCP server */
const server = new McpServer({
  name: "study-planner-mcp",
  version: "1.0.0",
});

/** Tool: load_curriculum (TEMP fake, بس عشان السيرفر يقوم) */
server.tool(
  "load_curriculum",
  { yearId: z.string() },
  async ({ yearId }) => {
    return {
      content: [{ type: "text", text: "📘 Curriculum loaded (TEMP)" }],
      structuredContent: {
        yearId,
        subjects: [],
      },
    };
  }
);
server.tool(
  "generate_schedule_preview",
  {
    daysPerWeek: z.number().int().min(1).max(7),
    lessonsPerDay: z.number().int().min(1).max(5),
  },
  async ({ daysPerWeek, lessonsPerDay }) => {
    const schedule = [];

    let lessonCounter = 1;

    for (let day = 1; day <= daysPerWeek; day++) {
      const dayLessons = [];

      for (let i = 0; i < lessonsPerDay; i++) {
        dayLessons.push({
          lessonId: `lesson_${lessonCounter}`,
          title: `درس رقم ${lessonCounter}`,
        });
        lessonCounter++;
      }

      schedule.push({
        day,
        lessons: dayLessons,
      });
    }

    return {
      content: [
        {
          type: "text",
          text: "📅 تم إنشاء جدول مبدئي (Preview)",
        },
      ],
      structuredContent: {
        daysPerWeek,
        lessonsPerDay,
        schedule,
      },
    };
  }
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

