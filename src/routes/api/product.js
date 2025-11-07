import express from 'express';
import pagination from '../../middlewares/pagination.js';
import { nameToSlug } from '../../utils/slugify.js'
import db from '../../config/knex.js';
import { createUploader } from '../../config/multer.js'
import productService from '../../services/product.services.js';
import { bundleDetail } from "../../helpers/productHelper.js";
import multer from 'multer';

const router = express.Router();
const produkPosterUploader = createUploader('src/assets/img/product')

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

router.get('/', pagination, async (req, res) => {
    const { page = '1', perpage = '8', pkey = '', pcategory = '', pprice = '', pcolumm = 'products.list', porder = 'DESC' } = req.query;
    const selectColumns = [
        'products.*',
        'product_categories.slug_product_category',
        'product_categories.name_product_category',
        'users.username',
        'users.name',
        'users.foto',
    ];
    try {
        const [data, totalData] = await productService.getAllProducts(pkey, pcolumm, porder, perpage, page, selectColumns, pcategory, pprice);
        res.status(200).json({
            total: totalData,
            page,
            perpage,
            totalPages: Math.ceil(totalData / perpage),
            data: data.map(bundleDetail),
        });
    } catch (err) { handleError(res, err); }
});

router.post('/', (req, res, next) => {
    produkPosterUploader.single('image')(req, res, function (err) {
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
    let { desc, id_product_category, id_user, name_product, real_price = 0, type_payment } = req.body;
    const discount_price = '0';
    const tag = 'produk';
    if (!desc || !id_product_category || !id_user || !name_product || real_price === undefined || !type_payment || !tag || !req.file) return res.status(400).json({ message: MESSAGES.REQUIRED_FIELDS });
    const image = req.file ? req.file.filename : 'default.webp'
    real_price = real_price === "" ? '0' : real_price;
    try {
        const exists = await db('users').where({ id_user }).first();
        if (!exists) return res.status(400).json({ message: MESSAGES.DATA_EXISTS });

        const random = Math.floor(Math.random() * 10)
        const name = nameToSlug(name_product)
        const slug = `${exists.username}-${name}${random}`

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
            active: '0'
        });
        res.status(201).json({ message: MESSAGES.DATA_ADDED, result: id });
    } catch (err) { handleError(res, err); }
});

router.route('/:id').put(
    (req, res, next) => {
        produkPosterUploader.single('image')(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ message: 'Ukuran file maksimal 2 MB' });
                }
            } else if (err) {
                return res.status(400).json({ message: 'Gagal mengupload file' });
            }
            next();
        });
    },
    async (req, res) => {
        try {
            let { desc, id_product_category, id_user, name_product, real_price = 0, type_payment } = req.body;
            const discount_price = '0';
            const tag = 'produk';

            // Cek data produk
            const exists = await db(TABLE).where({ [ID_COLUMN]: req.params.id }).first();
            if (!exists) return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND });

            // Validasi field wajib
            const requiredFields = ['id_product_category', 'id_user', 'name_product', 'type_payment', 'desc'];
            const missingField = requiredFields.some((field) => !req.body[field]);
            if (missingField) return res.status(400).json({ message: MESSAGES.REQUIRED_FIELDS });

            // Buat slug baru
            const random = Math.floor(Math.random() * 10);
            const name = nameToSlug(name_product);
            const slug = `${exists.username}-${name}${random}`;

            real_price = real_price === "" ? '0' : real_price;
            const image = req.file ? req.file.filename : null

            // Data update
            const updateData = {
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
            };

            if (req.file) updateData.image = req.file.filename;

            const updated = await db(TABLE).where({ [ID_COLUMN]: req.params.id }).update(updateData);
            if (!updated) return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND });

            res.status(200).json({ message: MESSAGES.DATA_UPDATED, result: req.params.id });
        } catch (err) {
            handleError(res, err);
        }
    }
);


export default router;
