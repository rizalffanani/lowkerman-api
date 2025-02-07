/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
    return knex.schema.createTable('location_provinces', (table) => {
        table.increments('id_province').primary()
        table.integer('id_country').unsigned().references('id_country').inTable('location_countries').onDelete('CASCADE')
        table.string('code', 10).notNullable()
        table.string('name_province', 100).notNullable()
        table.enum('active', ['0', '1']).defaultTo('1')
        table.timestamp('created_at').defaultTo(knex.fn.now())
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
    return knex.schema.dropTableIfExists('location_provinces')
};
