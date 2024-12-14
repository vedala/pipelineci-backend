/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema
    .createTable('runs', (table) => {
      table.increments('id')
      table.string('project_id')
      table.string('owner')
      table.string('repo')
      table.string('sha')
      table.string('branch')
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema.dropTable('runs');
};
