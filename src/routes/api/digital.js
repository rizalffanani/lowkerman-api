import express from 'express';
import db from '../../config/knex.js';
import { createFileUploader } from '../../config/multer.js'
import { isYoutubeUrl } from "../../helpers/productHelper.js";
import multer from 'multer';

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const router = express.Router();
const digitalUploader = createFileUploader('src/assets/file/digital')
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const TABLE = 'digitals';
const ID_COLUMN = 'digitals.id_digital';

const MESSAGES = {
    DATABASE_ERROR: 'Database error',
    REQUIRED_FIELDS: 'All fields are required',
    DATA_EXISTS: 'Data already exists',
    DATA_NOT_FOUND: 'Data not found',
    DATA_ADDED: 'Data created',
    DATA_UPDATED: 'Data updated',
    DATA_DELETED: 'Data deleted',
    STATUS_UPDATED: 'Status updated successfully',
    INVALID_STATUS: 'Active status is required'
};

const handleError = (res, err) => res.status(500).json({ message: MESSAGES.DATABASE_ERROR, error: err.message });

router.post('/', (req, res, next) => {
    digitalUploader.single('file_digital')(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ message: 'Ukuran file maksimal 2 MB' });
            }
        } else if (err) {
            return res.status(400).json({ message: 'Gagal mengupload file' });
        }
        next();
    });
}, async (req, res) => {
    let { id_product, title_digital, type_digital, link_digital } = req.body;

    if (!id_product || !title_digital || !type_digital) return res.status(400).json({ message: MESSAGES.REQUIRED_FIELDS });
    if (type_digital === "youtube" && !isYoutubeUrl(link_digital)) return res.status(400).json({ message: MESSAGES.REQUIRED_FIELDS });
    const file_digital = req.file ? req.file.filename : ''

    try {
        const [id] = await db(TABLE).insert({
            id_product,
            title_digital,
            type_digital,
            link_digital,
            file_digital
        });
        res.status(201).json({ message: MESSAGES.DATA_ADDED, result: id });
    } catch (err) { handleError(res, err); }
});

router.route('/:id')
    .put(async (req, res) => {
        const { id_product, title_digital, type_digital, link_digital } = req.body;
        if (!id_product || !title_digital || !type_digital) return res.status(400).json({ message: MESSAGES.REQUIRED_FIELDS });

        try {
            const updateData = {
                id_product,
                title_digital,
                type_digital,
                link_digital,
            };
            const updated = await db(TABLE).where({ [ID_COLUMN]: req.params.id }).update(updateData);
            if (!updated) return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND });

            res.status(200).json({ message: MESSAGES.DATA_UPDATED, result: req.params.id });
        } catch (err) {
            handleError(res, err);
        }
    })
    .delete(async (req, res) => {
        try {
            const data_last = await db(TABLE).where({ [ID_COLUMN]: req.params.id }).first();
            if (!data_last) return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND });

            if (data_last.file_digital) {
                const oldPath = path.join(__dirname, '..', '..', 'assets', 'file', 'digital', data_last.file_digital)
                fs.existsSync(oldPath) && fs.unlinkSync(oldPath);
            }

            const deleted = await db(TABLE).where({ [ID_COLUMN]: req.params.id }).del()
            if (!deleted) return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND });

            res.status(200).json({ message: MESSAGES.DATA_DELETED });
        } catch (err) { handleError(res, err); }
    });


export default router;
