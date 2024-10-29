import "./config.js";
import express from "express";

const app = express();
const port = 3001;

app.get("/organizations", async (req, res) => {
  res.send([
    {
      "id": 1,
      "name": "org1"
    },
    {
      "id": 2,
      "name": "org2"
    }
  ]);
});

app.post("/organizations", async (req, res) => {
  res.send({
    "message": "Organization created"
  });
});

app.listen(port, () => {
  console.log(`PipelineCI backend listening on port ${port}`)
})
