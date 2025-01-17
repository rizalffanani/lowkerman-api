import dotenv from 'dotenv'
dotenv.config()
/**
* @type { Object.<string, import("knex").Knex.Config> }
*/
export default {
    development: {
        client: 'mysql2',
        connection: {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'lowkerman',
        },
        migrations: {
            directory: './src/database/migrations',
        },
        seeds: {
            directory: './src/database/seeds',
        },
    },

    staging: {
        client: 'mysql2',
        connection: {
            user: process.env.STAGING_DB_USER || 'username',
            password: process.env.STAGING_DB_PASSWORD || 'password',
            database: process.env.STAGING_DB_NAME || 'my_db',
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            tableName: 'knex_migrations',
        },
    },

    production: {
        client: 'mysql2',
        connection: {
            user: process.env.PRODUCTION_DB_USER || 'username',
            password: process.env.PRODUCTION_DB_PASSWORD || 'password',
            database: process.env.PRODUCTION_DB_NAME || 'my_db',
        },
        pool: {
            min: 2,
            max: 10,
        },
        migrations: {
            tableName: 'knex_migrations',
        },
    },
}
