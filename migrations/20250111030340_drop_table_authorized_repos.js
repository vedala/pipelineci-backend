/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema
    .dropTable('authorized_repos');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema
    .createTable('authorized_repos', (table) => {
      table.increments('id')
      table.string('gh_repo_id')
      table.integer('organization_id')
      table.string('name')
      table.string('full_name')
      table.string('default_branch')
  });
};
