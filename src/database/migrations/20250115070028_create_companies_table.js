/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = (knex) => {
    return knex.schema.createTable('companies', (table) => {
        table.increments('id_company').primary()
        table.string('slug').notNullable().unique()
        table.string('name').notNullable()
        table.text('desc').nullable()
        table.string('address').nullable()
        table.string('web').nullable()
        table.string('ig').nullable()
        table.string('linkedin').nullable()
        table.string('logo', 100).notNullable().defaultTo('default.png')
        table.enum('active', ['0', '1']).defaultTo('0')
        table.timestamp('created_at').defaultTo(knex.fn.now())
    })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = (knex) => {
    return knex.schema.dropTable('companies')
}
