import db from '../config/knex.js';

async function getAllProducts(search, sort, order, limit, page, id) {
    limit = Number(limit) > 0 ? Number(limit) : 10;
    page = Number(page) >= 0 ? Number(page) : 0;
    const offset = (page - 1) * limit;
    const allowedSort = [
        'id_product', 'name_product', 'name_product_category', 'type_payment', 'real_price', 'order', 'view', 'rating'
    ];
    sort = allowedSort.includes(sort) ? sort : 'view';
    order = (order && ['asc', 'desc'].includes(order)) ? order : 'desc';

    const selectColumns = [
        'products.*',
        'product_categories.slug_product_category',
        'product_categories.name_product_category',
        'users.username',
    ];

    let query = db('products')
        .select(selectColumns)
        .leftJoin('product_categories', 'products.id_product_category', 'product_categories.id_product_category')
        .leftJoin('users', 'products.id_user', 'users.id_user');

    if (search) {
        query = query.where(function () {
            this.where('products.name_product', 'like', `%${search}%`)
                .orWhere('product_categories.name_product_category', 'like', `%${search}%`);
        });
    }

    query = query.orderBy(sort, order).limit(limit).offset(offset);

    let countQuery = db('products')
        .leftJoin('product_categories', 'products.id_product_category', 'product_categories.id_product_category')
        .leftJoin('users', 'products.id_user', 'users.id_user');

    if (search) {
        countQuery = countQuery.where(function () {
            this.where('products.name_product', 'like', `%${search}%`)
                .orWhere('product_categories.name_product_category', 'like', `%${search}%`);
        });
    }

    countQuery = countQuery.count('products.id_product as count').first();

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
    getAllProducts
};