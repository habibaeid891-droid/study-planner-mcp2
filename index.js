import express from "express";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import admin from "firebase-admin";

const app = express();
app.use(express.json({ limit: "1mb" }));

/** 🔥 Firebase Admin init */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket: "ai-students-85242.appspot.com",
  });
}

/** 1) MCP server */
const server = new McpServer({
  name: "study-planner-mcp",
  version: "1.0.0",
});

/** 2) load curriculum from Firebase Storage */
server.tool(
  "load_curriculum",
  {
    yearId: z.string(),
  },
  async ({ yearId }) => {
    const bucket = admin.storage().bucket();
    const file = bucket.file(`curriculum_${yearId}.json`);

    const [exists] = await file.exists();
    if (!exists) {
      return {
        isError: true,
        content: [{ type: "text", text: "❌ Curriculum file not found" }],
      };
    }

    const [buffer] = await file.download();
    const curriculum = JSON.parse(buffer.toString());

    return {
      content: [{ type: "text", text: "📘 Curriculum loaded" }],
      structuredContent: curriculum,
    };
  }
);

/** 3) generate schedule (اقتراح فقط) */
server.tool(
  "generate_schedule",
  {
    curriculum: z.any(),
    weeks: z.number().int().positive(),
  },
  async ({ curriculum, weeks }) => {
    const schedule = [];

    const lessons = curriculum.subjects.flatMap((s) =>
      s.lessons.map((l) => ({
        subjectId: s.subjectId,
        subjectName: s.name,
        lessonId: l.lessonId,
        title: l.title,
        estimatedMinutes: l.estimatedMinutes,
      }))
    );

    let index = 0;
    for (let w = 1; w <= weeks; w++) {
      schedule.push({
        week: w,
        lessons: lessons.slice(index, index + 3),
      });
      index += 3;
    }

    return {
      content: [{ type: "text", text: "📅 Proposed schedule generated" }],
      structuredContent: { schedule },
    };
  }
);

/** 4) save approved schedule */
server.tool(
  "save_schedule",
  {
    yearId: z.string(),
    schedule: z.any(),
  },
  async ({ yearId, schedule }) => {
    const bucket = admin.storage().bucket();
    const file = bucket.file(`schedules/schedule_${yearId}.json`);

    await file.save(JSON.stringify(schedule, null, 2), {
      contentType: "application/json",
    });

    return {
      content: [{ type: "text", text: "✅ Schedule saved" }],
      structuredContent: { ok: true },
    };
  }
);

/** 5) Transport */
const transport = new StreamableHTTPServerTransport({});

/** 6) Routes */
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

/** 7) Listen */
const port = Number(process.env.PORT || 8080);

app.listen(port, "0.0.0.0", () => {
  console.log(`Listening on ${port}`);
});

/** 8) Connect MCP */
server
  .connect(transport)
  .then(() => console.log("MCP server connected ✅"))
  .catch((err) => console.error("MCP connect error:", err));
