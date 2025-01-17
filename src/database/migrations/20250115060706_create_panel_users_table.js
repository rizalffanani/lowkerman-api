/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('panel_users', (table) => {
        table.increments('id').primary()
        table.string('username', 50).notNullable().unique()
        table.string('password', 255).notNullable()
        table.string('nama').notNullable()
        table.string('foto').nullable().defaultTo('default.png')
        table.enum('role', ['admin', 'user']).defaultTo('user')
        table.enum('active', ['0', '1']).defaultTo('0')
        table.timestamp('created_at').defaultTo(knex.fn.now())
    })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
    return knex.schema.dropTable('panel_users')
}
