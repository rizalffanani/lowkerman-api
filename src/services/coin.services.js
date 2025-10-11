import db from '../config/knex.js';

async function getAll(search, sort, order, limit, page, id) {
    limit = Number(limit) > 0 ? Number(limit) : 10;
    page = Number(page) >= 0 ? Number(page) : 0;
    const offset = (page - 1) * limit;
    const allowedSort = [
        'id_balance', 'code', 'name', 'date', 'type', 'metode', 'coin_amount', 'total_cost'
    ];
    sort = allowedSort.includes(sort) ? sort : 'id_balance';
    order = (order && ['asc', 'desc'].includes(order)) ? order : 'desc';

    const selectColumns = [
        'balance_history.id_balance',
        'balance_history.code',
        'balance_history.type',
        'balance_history.coin_amount',
        'balance_history.total_cost',
        'balance_history.date',
        'balance_history.time',
        'balance_history.metode',
        'balance_history.status',
        'balance_history.id_user',
        'users.username',
        'users.name',
    ];

    let query = db('balance_history')
        .select(selectColumns)
        .leftJoin('users', 'balance_history.id_user', 'users.id_user');

    if (search) {
        query = query.where(function () {
            this.where('balance_history.code', 'like', `%${search}%`)
                .orWhere('users.name', 'like', `%${search}%`);
        });
    }

    query = query.orderBy(sort, order).limit(limit).offset(offset);

    let countQuery = db('balance_history')
        .leftJoin('users', 'balance_history.id_user', 'users.id_user');

    if (search) {
        countQuery = countQuery.where(function () {
            this.where('balance_history.code', 'like', `%${search}%`)
                .orWhere('users.name', 'like', `%${search}%`);
        });
    }

    countQuery = countQuery.count('balance_history.id_balance as count').first();

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