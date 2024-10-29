import "./config.js";
import express from "express";

const app = express();
const port = 3001;

app.get("/", (req, res) => {
  res.send("ok");
});

app.listen(port, () => {
  console.log(`PipelineCI backend listening on port ${port}`)
})
