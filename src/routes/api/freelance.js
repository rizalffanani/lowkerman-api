import express from 'express';
import pagination from '../../middlewares/pagination.js';
import db from '../../config/knex.js';
import freelancerService from '../../services/freelance.services.js';
import { bundleDetail } from "../../helpers/freelanceHelper.js";

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

router.get('/', pagination, async (req, res) => {
    const { pkey = '', pkategori = '', ptipe = '', plokasi = '', pbiaya = '',
        pcolumm = 'freelancers.list', porder = 'DESC', perpage = '8', page = '1' } = req.query;
    const selectColumns = [
        'freelancers.id_freelance AS privatId',
        'freelancers.slug',
        'freelancers.id_freelance_cat AS id_privat_kategori',
        'freelancers.id_user',
        'freelancers.view',
        'freelancers.desc AS deskripsi',
        'freelancers.price AS biaya',
        'freelancers.online',
        'freelancers.offline AS tatap_muka',
        'freelancers.id_city AS id_kota',
        'freelancer_categories.name_freelance_cat AS nama_kategori',
        'users.username',
        'users.name AS first_name',
        'users.foto',
        'users.link_url',
        'location_cities.name_city AS nama_kota'
    ];
    try {
        const [data, totalData] = await freelancerService.getAllFreelancers(pkey, pcolumm, porder, perpage, page, selectColumns, pkategori, pbiaya, ptipe, plokasi);
        res.status(200).json({
            total: totalData,
            page,
            perpage,
            totalPages: Math.ceil(totalData / perpage),
            data: data.map(bundleDetail),
        });
    } catch (err) { handleError(res, err); }
});

router.post('/', async (req, res) => {
    const { title, id_freelance_cat, id_user, id_city, price, view, online, offline, desc, link_url } = req.body;
    if (!title || !id_freelance_cat || !id_user || !id_city || !desc || !price || !link_url) return res.status(400).json({ message: MESSAGES.REQUIRED_FIELDS });
    try {
        const exists = await db('users').where({ id_user }).first();
        if (!exists) return res.status(400).json({ message: MESSAGES.DATA_EXISTS });

        const random = Math.floor(Math.random() * 10)
        const slug = `${exists.username}-${id_freelance_cat}${id_city}${online}${offline}${random}`

        const [id] = await db(TABLE).insert({
            title,
            slug,
            id_freelance_cat,
            id_user,
            id_city,
            desc,
            price,
            view,
            online,
            offline,
            active: '0'
        });
        res.status(201).json({ message: MESSAGES.DATA_ADDED, result: { id, slug } });
    } catch (err) { handleError(res, err); }
});

router.route('/:id').put(async (req, res) => {
    const { title, id_freelance_cat, id_user, id_city, price, view, online, offline, desc, link_url } = req.body;
    let requiredFields = ['title', 'id_freelance_cat', 'id_user', 'id_city', 'desc', 'price', 'link_url'];
    let updateData = {
        title,
        id_freelance_cat,
        id_user,
        id_city,
        desc,
        price,
        view,
        online,
        offline,
    };

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
});

export default router;
