/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
    return knex.schema.createTable('jobs', (table) => {
        table.increments('id_job').primary()
        table.integer('id_company').unsigned().references('id_company').inTable('companies').onDelete('CASCADE')
        table.integer('id_user').unsigned().references('id_user').inTable('users').onDelete('CASCADE')
        table.string('slug').notNullable().unique()
        table.string('name_job', 100).notNullable()
        table.text('desc').nullable()
        table.string('poster').nullable()
        table.integer('id_country').unsigned().references('id_country').inTable('location_countries').onDelete('CASCADE')
        table.integer('id_province').unsigned().references('id_province').inTable('location_provinces').onDelete('CASCADE')
        table.integer('id_city').unsigned().references('id_city').inTable('location_cities').onDelete('CASCADE')
        table.string('job_types', 20).notNullable()
        table.string('job_location', 20).notNullable()
        table.string('job_education', 20).notNullable()
        table.text('url').nullable()
        table.string('type_post', 20).nullable()
        table.enum('active', ['0', '1', '2']).defaultTo('1')
        table.timestamp('created_at').defaultTo(knex.fn.now())
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
    return knex.schema.dropTable('jobs')
};
