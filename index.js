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

/** TEMP curriculum (مؤقت) */
const TEMP_CURRICULUM = {
  yearId: "year_1_secondary",
  yearName: "الصف الأول الثانوي",
  subjects: [
    {
      subjectId: "arabic",
      name: "اللغة العربية",
      lessons: [
        { lessonId: "ar_l1", title: "النحو: الجملة الاسمية والفعلية" },
        { lessonId: "ar_l2", title: "البلاغة: التشبيه" },
        { lessonId: "ar_l3", title: "القراءة: نصوص أدبية" }
      ]
    },
    {
      subjectId: "english",
      name: "اللغة الإنجليزية",
      lessons: [
        { lessonId: "en_l1", title: "Grammar: Tenses Review" },
        { lessonId: "en_l2", title: "Reading Comprehension" },
        { lessonId: "en_l3", title: "Writing: Paragraph Writing" }
      ]
    }
  ]
};

/** Tool: load_curriculum (TEMP) */
server.tool(
  "load_curriculum",
  { yearId: z.string() },
  async ({ yearId }) => {
    return {
      content: [{ type: "text", text: "📘 Curriculum loaded (TEMP)" }],
      structuredContent: {
        yearId,
        subjects: TEMP_CURRICULUM.subjects,
      },
    };
  }
);

/** Tool: generate_schedule_preview */
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

      schedule.push({ day, lessons: dayLessons });
    }

    return {
      content: [{ type: "text", text: "📅 تم إنشاء جدول مبدئي (Preview)" }],
      structuredContent: { daysPerWeek, lessonsPerDay, schedule },
    };
  }
);

/** Tool: generate_schedule_from_curriculum */
server.tool(
  "generate_schedule_from_curriculum",
  {
    lessonsPerDay: z.number().int().min(1).max(5),
  },
  async ({ lessonsPerDay }) => {
    const allLessons = TEMP_CURRICULUM.subjects.flatMap((s) =>
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
      content: [{ type: "text", text: "📅 جدول مبدئي مبني على المنهج" }],
      structuredContent: {
        yearId: TEMP_CURRICULUM.yearId,
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
