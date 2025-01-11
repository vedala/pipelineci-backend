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
  allowedHeaders: corsAllowedHeaders
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
  console.log("req.body=", req.body);
  const organizationName = req.body.orgName;
  const userId = req.body.userId;
  const insertOrgsResponse = await knex(process.env.ORGANIZATIONS_TABLE_NAME)
    .insert({
      name: organizationName,
      user_id: userId,
    })
    .returning('id')
  .catch((err) => { console.error(err); throw err });

  res.send(JSON.stringify(insertOrgsResponse[0]));
});

app.post("/projects", authorize, async (req, res) => {
  const projectName = req.body.projectName;
  const projectRepo = req.body.projectRepo;

  const insertProjectsResponse = await knex(process.env.PROJECTS_TABLE_NAME)
    .insert({
      name: projectName,
      repo: projectRepo,
    })
    .returning('id')
    .catch((err) => { console.error(err); throw err });

  res.send(JSON.stringify(insertProjectsResponse[0]));
});

app.get("/projects", authorize, async (req, res) => {
  const orgId = req.query.orgId;
  const rows = await knex(process.env.AUTHORIZED_REPOS_TABLE_NAME)
    .select('id', 'name')
    .where('organization_id', orgId)
    .orderBy('id')
    .catch((err) => { console.error(err); throw err; });

  res.send(rows);
});

app.get("/runs", authorize, async (req, res) => {
  const projectId = req.query.projectId;
  const rows = await knex(process.env.RUNS_TABLE_NAME)
    .select('id', 'sha', 'branch')
    .where('project_id', projectId)
    .orderBy('id', 'desc')
    .catch((err) => { console.error(err); throw err; });

  res.send(rows);
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

  // if (process.env.NODE_ENV === "development") {
  //   redirectUrl = process.env.CALLBACK_TUNNEL_URL;
  // }

  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: GITHUB_APP_IDENTIFIER,
      privateKey,
      installationId
    },
  });

  const installationDetailsResponse = await octokit.request("GET /app/installations/{installation_id}", {
    installation_id: installationId
  });

console.log("installationDetailsResponse.data=", installationDetailsResponse.data);

  const owner = installationDetailsResponse.data.account.login;

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

  // update organizations table with owner and git_provider

  const updateCount = await knex(process.env.ORGANIZATIONS_TABLE_NAME)
    .where('id', '=', organizationId)
    .update({
      owner,
      git_provider: 'GITHUB'
    });

console.log(`${updateCount} record(s) updated.`);

  res.redirect(`${redirectUrl}/home`);
});

app.listen(port, () => {
  console.log(`PipelineCI backend listening on port ${port}`)
})
