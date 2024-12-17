/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema
    .alterTable('runs', (table) => {
      table.dropColumn('owner')
      table.dropColumn('repo')
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema
    .alterTable('runs', (table) => {
      table.string('owner')
      table.string('repo')
    });
};
