/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
    return knex.schema.createTable('users', (table) => {
        table.increments('id_user').primary()
        table.string('username', 50).notNullable().unique()
        table.string('email', 255).notNullable().unique()
        table.string('google_sso', 255).notNullable().unique()
        table.string('password', 255).notNullable()
        table.string('name').notNullable()
        table.string('bio').nullable()
        table.string('leads', 50).nullable()
        table.string('plan_code', 50).nullable()
        table.date('plan_start').nullable()
        table.date('plan_end').nullable()
        table.string('foto').nullable().defaultTo('default.png')
        table.enum('active', ['0', '1']).defaultTo('0')
        table.string('ip_public').notNullable()
        table.datetime('last_login').notNullable()
        table.timestamp('created_at').defaultTo(knex.fn.now())
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
    return knex.schema.dropTable('users')
};
