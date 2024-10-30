import "./config.js";
import express from "express";
import cors from 'cors';
import authorize from "./authorization.js";

const app = express();
const port = 4001;

app.use(express.json())
app.use(cors())

app.get("/organizations", authorize, async (req, res) => {
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

app.post("/organizations", authorize, async (req, res) => {
  res.send({
    "message": "Organization created"
  });
});

app.listen(port, () => {
  console.log(`PipelineCI backend listening on port ${port}`)
})
