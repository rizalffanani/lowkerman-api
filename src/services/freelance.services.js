import db from '../config/knex.js';

async function getAllFreelancers(search, sort, order, limit, page, id) {
    limit = Number(limit) > 0 ? Number(limit) : 10;
    page = Number(page) >= 0 ? Number(page) : 0;
    const offset = (page - 1) * limit;
    const allowedSort = [
        'view', 'list', 'name_freelance_cat', 'name', 'id_freelance', 'name_city', 'price'
    ];
    sort = allowedSort.includes(sort) ? sort : 'view';
    order = (order && ['asc', 'desc'].includes(order)) ? order : 'desc';

    const selectColumns = [
        'freelancers.id_freelance',
        'freelancers.list',
        'freelancers.slug',
        'freelancers.id_freelance_cat',
        'freelancers.id_user',
        'freelancers.title',
        'freelancers.desc',
        'freelancers.price',
        'freelancers.online',
        'freelancers.offline',
        'freelancers.id_city',
        'freelancers.view',
        'freelancers.active',
        'freelancer_categories.name_freelance_cat',
        'users.username',
        'users.name',
        'users.foto',
        'users.link_url',
        'location_cities.name_city'
    ];

    let query = db('freelancers')
        .select(selectColumns)
        .leftJoin('freelancer_categories', 'freelancers.id_freelance_cat', 'freelancer_categories.id_freelance_cat')
        .leftJoin('users', 'freelancers.id_user', 'users.id_user')
        .leftJoin('location_cities', 'freelancers.id_city', 'location_cities.id_city')
        .where('freelancers.active', '!=', '3');

    if (search) {
        query = query.where(function () {
            this.where('users.name', 'like', `%${search}%`)
                .orWhere('freelancer_categories.name_freelance_cat', 'like', `%${search}%`)
                .orWhere('freelancers.title', 'like', `%${search}%`)
                .orWhere('freelancers.desc', 'like', `%${search}%`);
        });
    }

    query = query.orderBy(sort, order).limit(limit).offset(offset);

    let countQuery = db('freelancers')
        .leftJoin('freelancer_categories', 'freelancers.id_freelance_cat', 'freelancer_categories.id_freelance_cat')
        .leftJoin('users', 'freelancers.id_user', 'users.id_user')
        .where('freelancers.active', '!=', '3');

    if (search) {
        countQuery = countQuery.where(function () {
            this.where('users.name', 'like', `%${search}%`)
                .orWhere('freelancer_categories.name_freelance_cat', 'like', `%${search}%`)
                .orWhere('freelancers.title', 'like', `%${search}%`)
                .orWhere('freelancers.desc', 'like', `%${search}%`);
        });
    }

    countQuery = countQuery.count('freelancers.id_freelance as count').first();

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
    getAllFreelancers
};