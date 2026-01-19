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

/** Tool 1: Example tool */
server.tool(
  "test_tool",
  { name: z.string() },
  async ({ name }) => {
    return {
      content: [{ 
        type: "text", 
        text: `Hello ${name} from Study Planner MCP!` 
      }],
    };
  }
);

/** Routes */
app.get("/", (_req, res) => {
  console.log("Root endpoint called");
  res.status(200).send("HELLO FROM STUDY PLANNER MCP");
});

app.get("/health", (_req, res) => {
  console.log("Health check called");
  res.status(200).json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    service: "study-planner-mcp"
  });
});

// Handle MCP requests
app.all("/mcp", async (req, res) => {
  console.log("MCP endpoint called", req.method);
  
  try {
    const transport = new StreamableHTTPServerTransport({});
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP error:", error);
    res.status(500).json({ 
      error: "MCP server error", 
      message: error.message 
    });
  }
});

// Handle 404
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handling middleware
app.use((error, _req, res, _next) => {
  console.error("Server error:", error);
  res.status(500).json({ 
    error: "Internal server error", 
    message: error.message 
  });
});

/** Start the server */
const port = Number(process.env.PORT || 8080);

app.listen(port, "0.0.0.0", () => {
  console.log(`✅ Server started successfully on port ${port}`);
  console.log(`✅ Available endpoints:`);
  console.log(`   - GET  http://localhost:${port}/`);
  console.log(`   - GET  http://localhost:${port}/health`);
  console.log(`   - ALL  http://localhost:${port}/mcp`);
});
