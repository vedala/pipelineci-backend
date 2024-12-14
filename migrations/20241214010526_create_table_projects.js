/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema
    .createTable('projects', (table) => {
      table.increments('id')
      table.string('organization_id')
      table.string('name')
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
  return knex.schema.dropTable('projects');
};
