import getKnexObj from "./knexObj.js";

const knex = getKnexObj();

const saveRepos = async (reposToInsert) => {
  const reposIdArr = await knex(process.env.PROJECTS_TABLE_NAME)
    .insert(reposToInsert).returning('id')
    .catch((err) => { console.error(err); throw err; });

  return reposIdArr;
}

export { saveRepos };
