import express from 'express';
import { authenticateToken, authorizeRole } from '../../middlewares/auth.js';
import pagination from '../../middlewares/pagination.js';
import db from '../../config/knex.js';
import freelancerService from '../../services/freelance.services.js';

const router = express.Router();
const TABLE = 'freelancers';
const ID_COLUMN = 'freelancers.id_freelance';

const MESSAGES = {
    DATABASE_ERROR: 'Database error',
    REQUIRED_FIELDS: 'All fields are required',
    DATA_EXISTS: 'Data already exists',
    DATA_NOT_FOUND: 'Data not found',
    DATA_ADDED: 'Data added',
    DATA_UPDATED: 'Data updated',
    DATA_DELETED: 'Data deleted',
    STATUS_UPDATED: 'Status updated successfully',
    INVALID_STATUS: 'Active status is required'
};

const handleError = (res, err) => res.status(500).json({ message: MESSAGES.DATABASE_ERROR, error: err.message });

router.get('/', authenticateToken, authorizeRole(['admin']), pagination, async (req, res) => {
    const { search = '', sort = '', order = '', limit = 10, page = 1 } = req.query;
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
    try {
        const [data, totalData] = await freelancerService.getAllFreelancers(search, sort, order, limit, page, selectColumns);
        res.status(200).json({
            total: totalData,
            page, limit,
            totalPages: Math.ceil(totalData / limit),
            data,
        });
    } catch (err) { handleError(res, err); }
});

router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { title, list, id_freelance_cat, id_user, id_city, desc, price, online, offline } = req.body;
    if (!title || !list || !id_freelance_cat || !id_user || !id_city || !desc || !price) return res.status(400).json({ message: MESSAGES.REQUIRED_FIELDS });
    try {
        const exists = await db('users').where({ id_user }).first();
        if (!exists) return res.status(400).json({ message: MESSAGES.DATA_EXISTS });
        const random = Math.floor(Math.random() * 10)
        const slug = `${exists.username}-${id_freelance_cat}${id_city}${online}${offline}${random}`
        const [id] = await db(TABLE).insert({
            title,
            list,
            slug,
            id_freelance_cat,
            id_user,
            id_city,
            desc,
            price,
            online,
            offline,
            active: '1'
        });
        res.status(201).json({ message: MESSAGES.DATA_ADDED, result: { id, slug } });
    } catch (err) { handleError(res, err); }
});

router.route('/:id')
    .get(authenticateToken, authorizeRole('admin'), async (req, res) => {
        try {
            const getData = await db(TABLE).where({ [ID_COLUMN]: req.params.id }).first();
            if (!getData) return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND });
            res.status(200).json({ getData });
        } catch (err) { handleError(res, err); }
    })
    .put(authenticateToken, authorizeRole('admin'), async (req, res) => {
        const { title, list, id_freelance_cat, id_user, id_city, desc, price, online, offline, type_post } = req.body;
        let updateData = {};
        let requiredFields = [];

        if (type_post) {
            requiredFields = ['list'];
            updateData = { list };
        } else {
            requiredFields = ['title', 'list', 'id_freelance_cat', 'id_user', 'id_city', 'desc', 'price'];
            updateData = {
                title,
                list,
                id_freelance_cat,
                id_user,
                id_city,
                desc,
                price,
                online,
                offline,
            };
        }

        const missingField = requiredFields.some(field => !req.body[field]);
        if (missingField) {
            return res.status(400).json({ message: MESSAGES.REQUIRED_FIELDS });
        }

        try {
            const updated = await db(TABLE)
                .where({ [ID_COLUMN]: req.params.id })
                .update(updateData)
            if (!updated) return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND })
            res.status(200).json({ message: MESSAGES.DATA_UPDATED, result: { id: req.params.id } })
        } catch (err) {
            handleError(res, err);
        }
    })
    .delete(authenticateToken, authorizeRole('admin'), async (req, res) => {
        try {
            const deleted = await db(TABLE).where({ [ID_COLUMN]: req.params.id }).del();
            if (!deleted) return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND });
            res.status(200).json({ message: MESSAGES.DATA_DELETED });
        } catch (err) { handleError(res, err); }
    });

router.patch('/:id/status', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { active } = req.body;
    if (active === undefined) return res.status(400).json({ message: MESSAGES.INVALID_STATUS });
    try {
        const updated = await db(TABLE).where({ [ID_COLUMN]: req.params.id }).update({ active });
        if (!updated) return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND });
        res.status(200).json({ message: MESSAGES.STATUS_UPDATED });
    } catch (err) { handleError(res, err); }
});

export default router;
