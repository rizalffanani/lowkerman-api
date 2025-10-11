import express from 'express';
import { authenticateToken, authorizeRole } from '../../middlewares/auth.js';
import pagination from '../../middlewares/pagination.js';
import { createFileUploader } from '../../config/multer.js'

import db from '../../config/knex.js';
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const router = express.Router();
const digitalUploader = createFileUploader('src/assets/img/produk/digital')
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const TABLE = 'digitals';
const ID_COLUMN = 'digitals.id_digital';

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
    try {
        let { search = '', sort = '', order = '', page = 1, limit = 8, idProduct = '' } = req.query;
        const offset = (page - 1) * limit;

        const allowedSort = ['title_digital'];
        sort = allowedSort.includes(sort) ? sort : 'id_digital';
        order = (order && ['asc', 'desc'].includes(order)) ? order : 'desc';

        // Query data
        let query = db(TABLE)
            .select('*')
            .where('title_digital', 'like', `%${search}%`);

        if (idProduct) {
            query = query.andWhere('id_product', idProduct);
        }

        const dataQuery = query.orderBy(sort, order).limit(limit).offset(offset);

        // Query total count
        const totalQuery = db(TABLE)
            .count(`${ID_COLUMN} as count`)
            .where('title_digital', 'like', `%${search}%`);

        if (idProduct) {
            totalQuery.andWhere('id_product', idProduct);
        }

        const [data, totalData] = await Promise.all([dataQuery, totalQuery.first()]);

        res.status(200).json({
            total: totalData.count,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(totalData.count / limit),
            data,
        });
    } catch (err) {
        handleError(res, err);
    }
});

router.post('/', authenticateToken, authorizeRole('admin'), digitalUploader.single('file_digital'), async (req, res) => {
    const { id_product, title_digital, type_digital, link_digital } = req.body;
    if (!id_product || !title_digital || !type_digital) return res.status(400).json({ message: MESSAGES.REQUIRED_FIELDS });
    const file_digital = req.file ? req.file.filename : ''

    try {
        const [id] = await db(TABLE).insert({
            id_product,
            title_digital,
            type_digital,
            link_digital,
            file_digital,
        });
        res.status(201).json({ message: MESSAGES.DATA_ADDED, result: { id, title_digital } });
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
    .put(authenticateToken, authorizeRole('admin'), digitalUploader.single('file_digital'), async (req, res) => {
        const { id_product, title_digital, type_digital, link_digital } = req.body;
        if (!id_product || !title_digital || !type_digital) return res.status(400).json({ message: MESSAGES.REQUIRED_FIELDS });
        const file_digital = req.file ? req.file.filename : null;

        try {
            const data_last = await db(TABLE).where({ [ID_COLUMN]: req.params.id }).first();
            if (!data_last) return res.status(404).json({ message: 'Data not found' });

            if (type_digital === 'link' && !link_digital)
                return res.status(400).json({ message: 'Invalid input' });

            if (type_digital === 'file' && !file_digital && !data_last.file_digital)
                return res.status(400).json({ message: 'Invalid input' });

            let newFile = data_last.file_digital;
            let newLink = link_digital;

            // Jika upload file baru
            if (file_digital) {
                newFile = file_digital;
                if (data_last.file_digital) {
                    const oldPath = path.join(__dirname, '..', '..', 'assets', 'img', 'produk', 'digital', data_last.file_digital)
                    fs.existsSync(oldPath) && fs.unlinkSync(oldPath);
                }
            }

            // Jika type_digital = link, hapus file lama
            if (type_digital === 'link' && data_last.file_digital) {
                const oldPath = path.join(__dirname, '..', '..', 'assets', 'img', 'produk', 'digital', data_last.file_digital)
                fs.existsSync(oldPath) && fs.unlinkSync(oldPath);
                newFile = '';
            }

            // Jika type_digital = file, kosongkan link
            if (type_digital === 'file') newLink = '';

            await db(TABLE)
                .where({ [ID_COLUMN]: req.params.id })
                .update({
                    id_product,
                    title_digital,
                    type_digital,
                    link_digital: newLink,
                    file_digital: newFile,
                });

            res.status(200).json({ message: 'Data updated', result: { id: req.params.id } });
        } catch (err) { handleError(res, err); }
    })
    .delete(authenticateToken, authorizeRole('admin'), async (req, res) => {
        try {
            const data_last = await db(TABLE).where({ [ID_COLUMN]: req.params.id }).first();
            if (!data_last) return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND });

            if (data_last.file_digital) {
                const oldPath = path.join(__dirname, '..', '..', 'assets', 'img', 'produk', 'digital', data_last.file_digital)
                fs.existsSync(oldPath) && fs.unlinkSync(oldPath);
            }

            const deleted = await db(TABLE).where({ [ID_COLUMN]: req.params.id }).del()
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
