import db from '../config/knex.js';

async function getAll(search, sort, order, limit = 10, page = 1, selectColumns, provKota, jenisLoker, lokasiLoker, userId) {
    const offset = (page - 1) * limit;
    const allowedSort = ['id_job', 'name_job', 'name', 'job_types', 'job_location', 'name_city', 'id_user', 'view', 'created_at'];
    sort = allowedSort.includes(sort) ? sort : 'id_job';
    order = ['asc', 'desc'].includes(order) ? order : 'desc';

    const baseJoin = q =>
        q.leftJoin('location_provinces', 'jobs.id_province', 'location_provinces.id_province')
            .leftJoin('location_cities', 'jobs.id_city', 'location_cities.id_city')
            .leftJoin('companies', 'jobs.id_company', 'companies.id_company')
            .leftJoin('users', 'jobs.id_user', 'users.id_user');

    const applyFilters = q => {
        if (selectColumns?.includes('jobs.slug AS slug')) q.where('jobs.active', '1');

        if (provKota) {
            const [type, id] = provKota.split('_');
            const map = { c: 'id_country', p: 'id_province', default: 'id_city' };
            q.where(`jobs.${map[type] || map.default}`, id);
        }
        if (jenisLoker) q.where('jobs.job_types', jenisLoker);
        if (lokasiLoker) q.where('jobs.job_location', lokasiLoker);
        if (userId) q.where('users.username', userId);
        if (search) {
            q.where(function () {
                this.where('jobs.name_job', 'like', `%${search}%`).orWhere('companies.name', 'like', `%${search}%`);
            });
        }
        return q;
    };

    const query = applyFilters(baseJoin(db('jobs').select(selectColumns)))
        .orderBy(sort, order)
        .limit(limit)
        .offset(offset);

    const countQuery = applyFilters(baseJoin(db('jobs'))).count('jobs.id_job as count').first();

    try {
        const [data, totalResult] = await Promise.all([query, countQuery]);
        const total = Number(totalResult?.count || 0);
        return [data, total];
    } catch (err) {
        console.error('Database Query Error:', err);
        throw new Error('Failed to fetch job data.');
    }
}

export default { getAll };