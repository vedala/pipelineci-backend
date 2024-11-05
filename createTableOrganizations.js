import dotenv from 'dotenv';
dotenv.config();
import knexOptions from './knexoptions.js';
const knexOptionsEnv = knexOptions[process.env.NODE_ENV]

import Knex from 'knex';
const knex = Knex(knexOptionsEnv);

knex.schema.createTable('organizations', (table) => {
  table.increments('id')
  table.string('name')
}).then( () => console.log("table created"))
.catch( (err) => { console.log(err); throw err })
.finally( () => {
  knex.destroy();
});
