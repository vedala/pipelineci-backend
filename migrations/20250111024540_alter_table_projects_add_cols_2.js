/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema
    .alterTable('projects', (table) => {
      table.string('gh_repo_id')
      table.string('full_name')
      table.string('default_branch')
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema
    .alterTable('projects', (table) => {
      table.dropColumn('gh_repo_id')
      table.dropColumn('full_name')
      table.dropColumn('default_branch')
    });
};
