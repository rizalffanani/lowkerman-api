import express from 'express'
import { authenticateToken, authorizeRole } from '../../middlewares/auth.js'
import pagination from '../../middlewares/pagination.js';
import db from '../../config/knex.js'
import bcrypt from 'bcryptjs'

const router = express.Router()
const TABLE = 'users';
const ID_COLUMN = 'id_user';

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
                .where('username', 'like', `%${search}%`)
                .orWhere('email', 'like', `%${search}%`)
                .orWhere('name', 'like', `%${search}%`)
                .orderBy(ID_COLUMN, 'desc')
                .offset(offset)
                .limit(limit),
            db(TABLE)
                .count(`${ID_COLUMN} as count`)
                .where('username', 'like', `%${search}%`)
                .orWhere('email', 'like', `%${search}%`)
                .orWhere('name', 'like', `%${search}%`)
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
    const { name, username } = req.body;
    if (!name || !username) return res.status(400).json({ message: MESSAGES.REQUIRED_FIELDS });
    try {
        const exists = await db(TABLE).where({ username }).first();
        if (exists) return res.status(400).json({ message: MESSAGES.DATA_EXISTS });
        const hashedPassword = await bcrypt.hash("123456qw", 10)
        const [id] = await db(TABLE).insert({
            username,
            email: `${username}@mail.com`,
            password: hashedPassword,
            name,
            leads: 'whatsapp',
            active: '1',
            created_at: new Date(),
        });
        res.status(201).json({ message: MESSAGES.DATA_ADDED, user: { id, username } });
    } catch (err) { handleError(res, err); }
});

router.route('/:id')
    .put(authenticateToken, authorizeRole('admin'), async (req, res) => {
        const { name, username, type_post, link_url } = req.body;
        let updateData = {};
        let requiredFields = [];

        if (type_post) {
            requiredFields = ['link_url'];
            updateData = { link_url };
        } else {
            requiredFields = ['name', 'username'];
            updateData = { name, username };
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
            res.status(200).json({ message: MESSAGES.DATA_UPDATED, company: { id: req.params.id, username } });
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

export default router