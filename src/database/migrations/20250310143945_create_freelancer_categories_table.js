/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
    return knex.schema.createTable('freelancer_categories', (table) => {
        table.increments('id_freelance_cat').primary()
        table.string('slug').notNullable().unique()
        table.string('name_freelance_cat', 100).notNullable()
        table.integer('view').nullable()
        table.enum('active', ['0', '1', '2']).defaultTo('1')
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
    return knex.schema.dropTable('freelancer_categories')
};
