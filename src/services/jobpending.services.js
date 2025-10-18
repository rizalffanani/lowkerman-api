import db from '../config/knex.js';

async function getAll(search, sort, order, limit, page, id) {
    limit = Number(limit) > 0 ? Number(limit) : 10;
    page = Number(page) >= 0 ? Number(page) : 0;
    const offset = (page - 1) * limit;
    sort = 'id_pending';
    order = (order && ['asc', 'desc'].includes(order)) ? order : 'desc';

    const selectColumns = [
        'job_pendings.*',
        'users.username',
        'location_cities.name_city'
    ];

    let query = db('job_pendings')
        .select(selectColumns)
        .leftJoin('location_cities', 'job_pendings.id_city', 'location_cities.id_city')
        .leftJoin('users', 'job_pendings.id_user', 'users.id_user');

    if (search) {
        query = query.where(function () {
            this.where('job_pendings.name_job', 'like', `%${search}%`)
                .orWhere('job_pendings.name_company', 'like', `%${search}%`);
        });
    }

    query = query.orderBy(sort, order).limit(limit).offset(offset);

    let countQuery = db('job_pendings')
        .leftJoin('location_cities', 'job_pendings.id_city', 'location_cities.id_city')
        .leftJoin('users', 'job_pendings.id_user', 'users.id_user');

    if (search) {
        countQuery = countQuery.where(function () {
            this.where('job_pendings.name_job', 'like', `%${search}%`)
                .orWhere('job_pendings.name_company', 'like', `%${search}%`);
        });
    }

    countQuery = countQuery.count('job_pendings.id_pending as count').first();

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