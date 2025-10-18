import express from 'express';
import { authenticateToken, authorizeRole } from '../../middlewares/auth.js';
import pagination from '../../middlewares/pagination.js';
import { nameToSlug } from '../../utils/slugify.js'
import db from '../../config/knex.js';
import { createUploader } from '../../config/multer.js'
import productService from '../../services/product.services.js';

const router = express.Router();
const produkPosterUploader = createUploader('src/assets/file')

const TABLE = 'products';
const ID_COLUMN = 'products.id_product';

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
    try {
        const [data, totalData] = await productService.getAllProducts(search, sort, order, limit, page);
        res.status(200).json({
            total: totalData,
            page, limit,
            totalPages: Math.ceil(totalData / limit),
            data,
        });
    } catch (err) { handleError(res, err); }
});

router.post('/', authenticateToken, authorizeRole('admin'), produkPosterUploader.single('image'), async (req, res) => {
    const { active, id_product_category, id_user, tag, name_product, type_payment, real_price, discount_price, desc } = req.body;
    if (!active || !id_product_category || !id_user || !tag || !name_product || !type_payment || !desc) return res.status(400).json({ message: MESSAGES.REQUIRED_FIELDS });
    const image = req.file ? req.file.filename : 'default.webp'
    const slug = nameToSlug(name_product)
    try {
        const [id] = await db(TABLE).insert({
            id_product_category,
            id_user,
            tag,
            slug,
            name_product,
            type_payment,
            real_price,
            discount_price,
            desc,
            image,
            active
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
    .put(authenticateToken, authorizeRole('admin'), produkPosterUploader.single('image'), async (req, res) => {
        const { active, id_product_category, id_user, tag, name_product, type_payment, real_price, discount_price, desc } = req.body;
        if (!active || !id_product_category || !id_user || !tag || !name_product || !type_payment || !desc) return res.status(400).json({ message: MESSAGES.REQUIRED_FIELDS });
        const image = req.file ? req.file.filename : null
        const slug = nameToSlug(name_product)
        try {
            const updated = await db(TABLE).where({ [ID_COLUMN]: req.params.id }).update({
                id_product_category,
                id_user,
                tag,
                slug,
                name_product,
                type_payment,
                real_price,
                discount_price,
                desc,
                ...(image && { image }),
                active
            });
            if (!updated) return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND });
            res.status(200).json({ message: MESSAGES.DATA_UPDATED, result: { id: req.params.id, name_product } });
        } catch (err) { handleError(res, err); }
    })
    .delete(authenticateToken, authorizeRole('admin'), async (req, res) => {
        try {
            const getData = await db(TABLE).where({ [ID_COLUMN]: req.params.id }).first()
            if (!getData) return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND });

            if (getData.image && getData.image !== 'default.webp') {
                const logoPath = path.join(__dirname, '..', '..', 'assets', 'img', 'produk', getData.image)
                if (fs.existsSync(logoPath)) {
                    fs.unlinkSync(logoPath)
                }
            }

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

router.patch('/:id/copas', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const getData = await db(TABLE).where({ [ID_COLUMN]: req.params.id }).first();
        if (!getData) return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND });

        const rowData = { ...getData };
        delete rowData['id_product'];

        const newId = await db(TABLE).insert(rowData);
        if (!newId) return res.status(400).json({ message: MESSAGES.DATA_NOT_FOUND })

        res.status(200).json({ message: MESSAGES.STATUS_UPDATED });
    } catch (err) { handleError(res, err); }
});

export default router;
