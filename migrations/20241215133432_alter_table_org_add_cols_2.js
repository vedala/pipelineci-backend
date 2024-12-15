/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema
    .alterTable('organizations', (table) => {
      table.string('owner')
      table.string('git_provider')
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema
    .alterTable('organizations', (table) => {
      table.dropColumn('owner')
      table.dropColumn('git_provider')
    });
};
