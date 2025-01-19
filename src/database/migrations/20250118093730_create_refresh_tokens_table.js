/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = (knex) => {
    return knex.schema.createTable('panel_refresh_tokens', (table) => {
        table.increments('id').primary();
        table.string('token').notNullable();
        table.integer('user_id').unsigned().references('id').inTable('panel_users').onDelete('CASCADE');
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = (knex) => {
    return knex.schema.dropTableIfExists('refresh_tokens');
};
