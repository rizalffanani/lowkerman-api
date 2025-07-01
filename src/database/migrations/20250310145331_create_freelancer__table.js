/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
    return knex.schema.createTable('freelancers', (table) => {
        table.increments('id_freelance').primary()
        table.string('slug').notNullable().unique()
        table.integer('id_freelance_cat').unsigned().references('id_freelance_cat').inTable('freelancer_categories').onDelete('CASCADE')
        table.integer('id_user').unsigned().references('id_user').inTable('users').onDelete('CASCADE')
        table.text('desc').nullable()
        table.integer('price', 20).nullable()
        table.enum('online', ['0', '1']).defaultTo('0')
        table.enum('offline', ['0', '1']).defaultTo('0')
        table.integer('id_city').unsigned().references('id_city').inTable('location_cities').onDelete('CASCADE')
        table.integer('view').nullable()
        table.enum('active', ['0', '1', '2']).defaultTo('1')
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
    return knex.schema.dropTable('freelancers')
};
