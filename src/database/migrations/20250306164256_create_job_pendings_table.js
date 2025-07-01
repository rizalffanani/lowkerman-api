/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
    return knex.schema.createTable('job_pendings', (table) => {
        table.increments('id_pending').primary()
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
        table.string('type_post', 20).nullable()
        table.string('name_company', 100).notNullable()
        table.string('wa_number', 20).notNullable()
        table.text('link_company').notNullable()
        table.string('logo', 100).nullable().defaultTo('default.png')
        table.integer('id_user').nullable()
        table.enum('active', ['0', '1', '2']).defaultTo('1')
        table.timestamp('created_at').defaultTo(knex.fn.now())
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
    return knex.schema.dropTable('job_pendings')
};
