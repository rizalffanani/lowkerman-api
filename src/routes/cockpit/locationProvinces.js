import express from 'express';
import { authenticateToken, authorizeRole } from '../../middlewares/auth.js';
import pagination from '../../middlewares/pagination.js';
import db from '../../config/knex.js';

const router = express.Router();
const TABLE = 'location_provinces';
const ID_COLUMN = 'id_province';

const MESSAGES = {
    DATABASE_ERROR: 'Database error',
    REQUIRED_FIELDS: 'All fields are required',
    DATA_EXISTS: 'Province already exists',
    DATA_NOT_FOUND: 'Province not found',
    DATA_ADDED: 'Data added',
    DATA_UPDATED: 'Province updated',
    DATA_DELETED: 'Province deleted',
    STATUS_UPDATED: 'Status updated successfully',
    INVALID_STATUS: 'Active status is required'
};

const handleError = (res, err) => res.status(500).json({ message: MESSAGES.DATABASE_ERROR, error: err.message });

router.get('/', authenticateToken, authorizeRole(['admin']), pagination, async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    try {
        const offset = (page - 1) * limit;
        const FIELDS_KEY = 'name_province'
        const [data, totalData] = await Promise.all([
            db(TABLE)
                .select('*')
                .where(FIELDS_KEY, 'like', `%${search}%`)
                .orderBy(ID_COLUMN, 'desc')
                .offset(offset)
                .limit(limit),
            db(TABLE)
                .count(`${ID_COLUMN} as count`)
                .where(FIELDS_KEY, 'like', `%${search}%`)
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
    const { id_country, code, name_province } = req.body;
    if (!id_country || !code || !name_province) return res.status(400).json({ message: MESSAGES.REQUIRED_FIELDS });
    try {
        const exists = await db(TABLE).where({ name_province }).first();
        if (exists) return res.status(400).json({ message: MESSAGES.DATA_EXISTS });
        const [id] = await db(TABLE).insert({ id_country, code, name_province });
        res.status(201).json({ message: MESSAGES.DATA_ADDED, result: { id, id_country, code, name_province } });
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
        const { id_country, code, name_province } = req.body;
        if (!id_country || !code || !name_province) return res.status(400).json({ message: MESSAGES.REQUIRED_FIELDS });
        try {
            const updated = await db(TABLE).where({ [ID_COLUMN]: req.params.id }).update({ id_country, code, name_province });
            if (!updated) return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND });
            res.status(200).json({ message: MESSAGES.DATA_UPDATED, result: { id: req.params.id, id_country, code, name_province } });
        } catch (err) { handleError(res, err); }
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
