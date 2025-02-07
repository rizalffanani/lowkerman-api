/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
    return knex.schema.createTable('location_cities', (table) => {
        table.increments('id_city').primary()
        table.integer('id_country').unsigned().references('id_country').inTable('location_countries').onDelete('CASCADE')
        table.integer('id_province').unsigned().references('id_province').inTable('location_provinces').onDelete('CASCADE')
        table.string('code', 10).notNullable()
        table.string('name_city', 100).notNullable()
        table.enum('active', ['0', '1']).defaultTo('1')
        table.timestamp('created_at').defaultTo(knex.fn.now())
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
    return knex.schema.dropTable('location_cities')
};
