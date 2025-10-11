import express from 'express';
import { authenticateToken, authorizeRole } from '../../middlewares/auth.js';
import pagination from '../../middlewares/pagination.js';
import { nameToSlug } from '../../utils/slugify.js'
import db from '../../config/knex.js';

const router = express.Router();
const TABLE = 'freelancer_categories';
const ID_COLUMN = 'freelancer_categories.id_freelance_cat';

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
    const { page = 1, limit = 10, search = '' } = req.query;
    try {
        const offset = (page - 1) * limit;
        const [data, totalData] = await Promise.all([
            db(TABLE)
                .select('*')
                .where('name_freelance_cat', 'like', `%${search}%`)
                .orderBy(ID_COLUMN, 'desc')
                .offset(offset)
                .limit(limit),
            db(TABLE)
                .count(`${ID_COLUMN} as count`)
                .where('name_freelance_cat', 'like', `%${search}%`)
                .first()
        ]);
        res.status(200).json({
            total: totalData.count,
            page, limit,
            totalPages: Math.ceil(totalData.count / limit),
            data,
        });
    } catch (err) { handleError(res, err); }
});

router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { name_freelance_cat } = req.body;
    if (!name_freelance_cat) return res.status(400).json({ message: MESSAGES.REQUIRED_FIELDS });
    try {
        const exists = await db(TABLE).where({ name_freelance_cat }).first();
        if (exists) return res.status(400).json({ message: MESSAGES.DATA_EXISTS });
        const [id] = await db(TABLE).insert({
            slug: nameToSlug(name_freelance_cat),
            name_freelance_cat,
            active: '1'
        });
        res.status(201).json({ message: MESSAGES.DATA_ADDED, result: { id, name_freelance_cat } });
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
        const { name_freelance_cat } = req.body;
        if (!name_freelance_cat) return res.status(400).json({ message: MESSAGES.REQUIRED_FIELDS });
        try {
            const updated = await db(TABLE).where({ [ID_COLUMN]: req.params.id }).update({
                slug: nameToSlug(name_freelance_cat),
                name_freelance_cat,
            });
            if (!updated) return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND });
            res.status(200).json({ message: MESSAGES.DATA_UPDATED, result: { id: req.params.id, name_freelance_cat } });
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
