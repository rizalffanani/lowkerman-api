import db from '../config/knex.js';

async function getAll(search, sort, order, limit, page, id) {
    limit = Number(limit) > 0 ? Number(limit) : 10;
    page = Number(page) >= 0 ? Number(page) : 0;
    const offset = (page - 1) * limit;
    const allowedSort = [
        'id_payment', 'code', 'name', 'date_payment', 'total_payment', 'type_payment', 'metode_payment'
    ];
    sort = allowedSort.includes(sort) ? sort : 'id_payment';
    order = (order && ['asc', 'desc'].includes(order)) ? order : 'desc';

    const selectColumns = [
        'payments.id_payment',
        'payments.category_payment',
        'payments.code',
        'payments.id_user',
        'payments.email',
        'payments.phone',
        'payments.total_payment',
        'payments.type_payment',
        'payments.metode_payment',
        'payments.date_payment',
        'payments.status',
        'users.username',
        'users.name',
    ];

    let query = db('payments')
        .select(selectColumns)
        .leftJoin('users', 'payments.id_user', 'users.id_user');

    if (search) {
        query = query.where(function () {
            this.where('payments.code', 'like', `%${search}%`)
                .orWhere('users.name', 'like', `%${search}%`);
        });
    }

    query = query.orderBy(sort, order).limit(limit).offset(offset);

    let countQuery = db('payments')
        .leftJoin('users', 'payments.id_user', 'users.id_user');

    if (search) {
        countQuery = countQuery.where(function () {
            this.where('payments.code', 'like', `%${search}%`)
                .orWhere('users.name', 'like', `%${search}%`);
        });
    }

    countQuery = countQuery.count('payments.id_payment as count').first();

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
        throw new Error(error.message || 'Failed to fetch data.');
    }
}

export default {
    getAll
};