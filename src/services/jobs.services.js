import db from '../config/knex.js';

async function getAll(search, sort, order, limit, page, id) {
    limit = Number(limit) > 0 ? Number(limit) : 10;
    page = Number(page) >= 0 ? Number(page) : 0;
    const offset = (page - 1) * limit;
    const allowedSort = [
        'id_job', 'name_job', 'name', 'job_types', 'job_location', 'name_city', 'id_user', 'view', 'created_at'];
    sort = allowedSort.includes(sort) ? sort : 'id_job';
    order = (order && ['asc', 'desc'].includes(order)) ? order : 'desc';

    const selectColumns = [
        'jobs.*',
        'companies.logo',
        'companies.name',
        'users.username',
        'location_cities.name_city'
    ];

    let query = db('jobs')
        .select(selectColumns)
        .leftJoin('location_provinces', 'jobs.id_province', 'location_provinces.id_province')
        .leftJoin('location_cities', 'jobs.id_city', 'location_cities.id_city')
        .leftJoin('companies', 'jobs.id_company', 'companies.id_company')
        .leftJoin('users', 'jobs.id_user', 'users.id_user');

    if (search) {
        query = query.where(function () {
            this.where('jobs.name_job', 'like', `%${search}%`)
                .orWhere('companies.name', 'like', `%${search}%`);
        });
    }

    query = query.orderBy(sort, order).limit(limit).offset(offset);

    let countQuery = db('jobs')
        .leftJoin('location_provinces', 'jobs.id_province', 'location_provinces.id_province')
        .leftJoin('location_cities', 'jobs.id_city', 'location_cities.id_city')
        .leftJoin('companies', 'jobs.id_company', 'companies.id_company')
        .leftJoin('users', 'jobs.id_user', 'users.id_user');

    if (search) {
        countQuery = countQuery.where(function () {
            this.where('jobs.name_job', 'like', `%${search}%`)
                .orWhere('companies.name', 'like', `%${search}%`);
        });
    }

    countQuery = countQuery.count('jobs.id_job as count').first();

    try {
        const data = await query;
        const totalCountResult = await countQuery;
        let total = 0;
        if (totalCountResult && typeof totalCountResult === 'object') {
            if ('count' in totalCountResult) {
                if (typeof totalCountResult.count === 'number') {
                    total = totalCountResult.count;
                } else if (typeof totalCountResult.count === 'string') {
                    total = Number(totalCountResult.count);
                } else {
                    total = 0;
                }
            } else {
                if (Array.isArray(totalCountResult) && totalCountResult.length > 0 && 'count' in totalCountResult[0]) {
                    total = Number(totalCountResult[0].count);
                }
            }
        }
        return [
            data,
            total
        ];
    } catch (error) {
        console.error('Database Query Error:', error);
        throw new Error(error.message || 'Failed to fetch freelancer data.');
    }
}

export default {
    getAll
};