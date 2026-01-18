import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.status(200).send("HELLO FROM CLOUD RUN");
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("🚀 Server listening on", PORT);
});
