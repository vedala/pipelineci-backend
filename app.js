import "./config.js";
import express from "express";
import cors from 'cors';
import authorize from "./authorization.js";

const app = express();
const port = process.env.PORT;

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

app.get("/callback-endpoint", async (req, res) => {
  const installationId = req.query?.installation_id;
  const setupAction = req.query?.setup_action;

console.log("installationId=", installationId);
console.log("setupAction=", setupAction);

  res.redirect('http://localhost:4000/home');
});

app.listen(port, () => {
  console.log(`PipelineCI backend listening on port ${port}`)
})
