import "./config.js";
import express from "express";
import cors from 'cors';
import fs from "fs";
import authorize from "./authorization.js";
import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import getKnexObj from "./knexObj.js";

const app = express();

const port = process.env.PORT;
const privateKeyPath = process.env.PRIVATE_KEY_PATH;
const GITHUB_APP_IDENTIFIER = process.env.GITHUB_APP_IDENTIFIER;

const knex = getKnexObj();

const privateKey = fs.readFileSync(privateKeyPath, "utf8");
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
  const organizationName = req.body.orgName;
  const insertOrgsResponse = await knex(process.env.ORGANIZATIONS_TABLE_NAME).insert({name: organizationName}).returning('id')
  .catch((err) => { console.error(err); throw err });

  res.send({
    "message": "Organization created"
  });
});

app.get("/setup-endpoint", async (req, res) => {
  // const installationId = req.query?.installation_id;
//   const setupAction = req.query?.setup_action;

// console.log("installationId=", installationId);
// console.log("setupAction=", setupAction);
  console.log("received by setup-endpoint");

  res.redirect('http://localhost:4000/home');
});

app.get("/callback-endpoint", async (req, res) => {

console.log("callback-endpoint: req.query=", req.query);
  const installationId = req.query?.installation_id;

  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: GITHUB_APP_IDENTIFIER,
      privateKey,
      installationId
    },
  });

  const reposResponse = await octokit.request("GET /installation/repositories");
console.log("reposResponse=", reposResponse.data);

res.redirect('http://localhost:4000/home');
});

app.listen(port, () => {
  console.log(`PipelineCI backend listening on port ${port}`)
})
