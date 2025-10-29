import db from '../config/knex.js';

async function getAllFreelancers(search, sort = 'view', order = 'desc', limit = 10, page = 1, selectColumns, category, price, isOnline, city) {
    limit = +limit || 10;
    page = +page || 1;
    const offset = (page - 1) * limit;
    const allowedSort = ['view', 'list', 'name_freelance_cat', 'name', 'id_freelance', 'name_city', 'price',
        'freelancers.list', 'freelancers.view', 'freelancers.id_freelance'
    ];
    sort = allowedSort.includes(sort) ? sort : 'view';
    order = ['asc', 'desc', 'ASC', 'DESC'].includes(order) ? order : 'desc';

    const baseQuery = db('freelancers')
        .leftJoin('freelancer_categories', 'freelancers.id_freelance_cat', 'freelancer_categories.id_freelance_cat')
        .leftJoin('users', 'freelancers.id_user', 'users.id_user')
        .leftJoin('location_cities', 'freelancers.id_city', 'location_cities.id_city');

    const applyFilters = (query) => {
        query.where('freelancers.active', selectColumns[1] === 'freelancers.slug' ? '1' : '!=', '3');
        if (price) query.where('freelancers.price', '<=', price);
        if (category) query.where('freelancers.id_freelance_cat', category);
        if (isOnline === 'online') query.where('freelancers.online', '1');
        if (isOnline === 'offline') query.where('freelancers.offline', '1');
        if (city) query.where('freelancers.id_city', city);
        if (search) {
            query.where(q => {
                q.where('users.name', 'like', `%${search}%`)
                    .orWhere('freelancer_categories.name_freelance_cat', 'like', `%${search}%`)
                    .orWhere('freelancers.title', 'like', `%${search}%`)
                    .orWhere('freelancers.desc', 'like', `%${search}%`);
            });
        }
    };

    const dataQuery = baseQuery.clone().select(selectColumns);
    applyFilters(dataQuery);
    dataQuery.orderBy(sort, order).limit(limit).offset(offset);

    const countQuery = baseQuery.clone().count('freelancers.id_freelance as count').first();
    applyFilters(countQuery);

    try {
        const [data, totalCountResult] = await Promise.all([dataQuery, countQuery]);
        const total = Number(totalCountResult?.count || 0);
        return [data, total];
    } catch (error) {
        console.error('Database Query Error:', error);
        throw new Error(error.message || 'Failed to fetch freelancer data.');
    }
}

export default { getAllFreelancers };