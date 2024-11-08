import dotenv from 'dotenv';
dotenv.config();
import knexOptions from './knexoptions.js';
const knexOptionsEnv = knexOptions[process.env.NODE_ENV]

import Knex from 'knex';
const knex = Knex(knexOptionsEnv);

knex.schema.createTable('authorized_repos', (table) => {
  table.increments('id')
  table.string('gh_repo_id')
  table.integer('organization_id')
  table.string('name')
  table.string('full_name')
  table.string('default_branch')
}).then( () => console.log("table created"))
.catch( (err) => { console.log(err); throw err })
.finally( () => {
  knex.destroy();
});
