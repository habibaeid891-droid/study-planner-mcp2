import express from "express";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import admin from "firebase-admin";

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  storageBucket: "ai-students-85242.appspot.com",
});

const app = express();
app.use(express.json({ limit: "1mb" }));

/** MCP server */
const server = new McpServer({
  name: "study-planner-mcp",
  version: "1.0.0",
});

/** Tool 1: load_curriculum from Firebase */
server.tool(
  "load_curriculum",
  { yearId: z.string() },
  async ({ yearId }) => {
    const bucket = admin.storage().bucket();
    const file = bucket.file(`curriculums/${yearId}.json`);

    const [exists] = await file.exists();
    if (!exists) {
      return {
        isError: true,
        content: [{ type: "text", text: "❌ المنهج غير موجود" }],
      };
    }

    const [buffer] = await file.download();
    const curriculum = JSON.parse(buffer.toString());

    return {
      content: [{ type: "text", text: "📘 تم تحميل المنهج بنجاح" }],
      structuredContent: curriculum,
    };
  }
);

/** Tool 2: generate schedule from curriculum */
server.tool(
  "generate_schedule_from_curriculum",
  {
    curriculum: z.object({
      yearId: z.string(),
      subjects: z.array(
        z.object({
          name: z.string(),
          lessons: z.array(
            z.object({
              lessonId: z.string(),
              title: z.string(),
            })
          ),
        })
      ),
    }),
    lessonsPerDay: z.number().int().min(1).max(5),
  },
  async ({ curriculum, lessonsPerDay }) => {
    const allLessons = curriculum.subjects.flatMap((s) =>
      s.lessons.map((l) => ({
        subject: s.name,
        lessonId: l.lessonId,
        title: l.title,
      }))
    );

    const schedule = [];
    let index = 0;
    let day = 1;

    while (index < allLessons.length) {
      schedule.push({
        day,
        lessons: allLessons.slice(index, index + lessonsPerDay),
      });
      index += lessonsPerDay;
      day++;
    }

    return {
      content: [{ type: "text", text: "📅 جدول مبني على المنهج" }],
      structuredContent: {
        yearId: curriculum.yearId,
        schedule,
      },
    };
  }
);

/** Routes */
app.get("/", (_req, res) => res.status(200).send("HELLO FROM CLOUD RUN"));

app.all("/mcp", async (req, res) => {
  try {
    const transport = new StreamableHTTPServerTransport({});
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

/** Start the server */
const port = Number(process.env.PORT || 8080);

async function startServer() {
  try {
    /** Connect MCP */
    const transport = new StreamableHTTPServerTransport({});
    await server.connect(transport);
    console.log("MCP connected ✅");
    
    /** Start Express server */
    app.listen(port, "0.0.0.0", () => {
      console.log("Server listening on", port);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
