import express from "express";

const app = express();

app.use(express.json());

// Health check endpoint (required for Cloud Run)
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    service: "study-planner-mcp"
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.send("Study Planner MCP Server is running!");
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
