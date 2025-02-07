/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
    return knex.schema.createTable('location_countries', (table) => {
        table.increments('id_country').primary()
        table.string('code', 10).notNullable()
        table.string('name_country', 100).notNullable()
        table.string('phone_code', 10).notNullable()
        table.enum('active', ['0', '1']).defaultTo('1')
        table.timestamp('created_at').defaultTo(knex.fn.now())
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
    return knex.schema.dropTable('location_countries')
};
