import "./config.js";
import express from "express";
import cors from 'cors';
import authorize from "./authorization.js";
import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import getKnexObj from "./knexObj.js";
import { saveRepos } from "./handlers.js";

const app = express();

const port = process.env.PORT || 3000;
const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
const GITHUB_APP_IDENTIFIER = process.env.GITHUB_APP_IDENTIFIER;
const FRONTEND_URL = process.env.FRONTEND_URL;

const knex = getKnexObj();

app.use(express.json());

let corsOrigin;
let corsAllowedHeaders;

if (process.env.NODE_ENV === 'development') {
  corsOrigin = '*';
  corsAllowedHeaders = ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'];
} else {
  corsOrigin = 'https://pipelineci.com';
  corsAllowedHeaders = ['Content-Type', 'Authorization'];
}

console.log("corsOrigin=", corsOrigin);
app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));

app.get("/health", async (req, res) => {
  res.status(200)
  res.send("Backend is alive")
});

app.get("/organizations", authorize, async (req, res) => {
  const rows = await knex(process.env.ORGANIZATIONS_TABLE_NAME).select('id', 'name')
    .orderBy('id')
    .catch((err) => { console.error(err); throw err; });

  res.send(rows);
});

app.post("/organizations", authorize, async (req, res) => {
  const organizationName = req.body.orgName;
  const insertOrgsResponse = await knex(process.env.ORGANIZATIONS_TABLE_NAME).insert({name: organizationName}).returning('id')
  .catch((err) => { console.error(err); throw err });

  res.send(JSON.stringify(insertOrgsResponse[0]));
});

app.get("/setup-endpoint", async (req, res) => {
  // const installationId = req.query?.installation_id;
//   const setupAction = req.query?.setup_action;

// console.log("installationId=", installationId);
// console.log("setupAction=", setupAction);
  console.log("received by setup-endpoint");

  // res.redirect('http://localhost:4000/home');
});

app.get("/callback-endpoint", async (req, res) => {

console.log("callback-endpoint: req.query=", req.query);
  const installationId = req.query?.installation_id;
  const stateObject = JSON.parse(req.query.state);
  const organizationId = stateObject.orgId;
  let redirectUrl = stateObject.redirectUrl;

  if (process.env.NODE_ENV === "development") {
    redirectUrl = process.env.CALLBACK_TUNNEL_URL;
  }

  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: GITHUB_APP_IDENTIFIER,
      privateKey,
      installationId
    },
  });

  const reposResponse = await octokit.request("GET /installation/repositories");

  const repos = reposResponse.data.repositories.map(repo => {
    return {
      gh_repo_id: repo.id,
      organization_id: Number(organizationId),
      name: repo.name,
      full_name: repo.full_name,
      default_branch: repo.default_branch,
    };
  })

  console.log("repos=", repos);

  // save repos to database
  const insertedReposIdArr = await saveRepos(repos);

console.log("insertedReposIdArr=", insertedReposIdArr);

  res.redirect(`${redirectUrl}/home`);
});

app.listen(port, () => {
  console.log(`PipelineCI backend listening on port ${port}`)
})
