/**
* @param { import("knex").Knex } knex
* @returns { Promise<void> }
*/
exports.seed = async function (knex) {
    // Deletes ALL existing entries
    await knex('companies').del()
    await knex('companies').insert([
        { slug: 'tech', name: 'TechCorp', desc: 'TechCorp', address: '123 Tech Street' },
        { slug: 'innova', name: 'Innovate In', desc: 'TechCorp', address: '123 Tech Street' },
    ])
}
