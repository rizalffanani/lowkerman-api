import express from 'express';
import pagination from '../../middlewares/pagination.js';
import db from '../../config/knex.js';
import jobPendingService from '../../services/jobpending.services.js';
import { nameToSlug } from '../../utils/slugify.js'
import fetch from 'node-fetch';

const router = express.Router();
const TABLE = 'job_pendings';

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
    const { userId = '', perpage = '6', page = 1 } = req.query;
    try {
        const [data, totalData] = await jobPendingService.getAll('', '', '', perpage, page, userId);
        res.status(200).json({
            total: totalData,
            page, perpage,
            totalPages: Math.ceil(totalData / perpage),
            data,
        });
    } catch (err) { handleError(res, err); }
});

router.post('/', async (req, res) => {
    const {
        namaLoker, detailLoker, provKota, jenisLoker, lokasiLoker, jenjang, namaPerusahaan, nowa, link, user, recaptchaResponse
    } = req.body;

    console.log(namaLoker)

    if (!namaLoker || !detailLoker || !provKota || !lokasiLoker || !jenjang || !namaPerusahaan || !nowa || !link) return res.status(400).json({ message: MESSAGES.REQUIRED_FIELDS });

    const recaptchaUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const recaptchaSecret = '6Lcu9zMpAAAAAG0CN_0-r5LrwBFPkkxeoQ4iFXQt';
    const response = await fetch(`${recaptchaUrl}?secret=${recaptchaSecret}&response=${recaptchaResponse}`);
    const data = await response.json();
    const recaptchaScore = (process.env.BASE_URL === 'http://localhost:5000/') ? 2 : data.score;
    if (recaptchaScore <= 0.5) {
        return res.status(400).json({ message: 'Gunakan Google Chrome' })
    }

    try {
        let id_prov = 0;
        let id_city = 0;
        if (provKota && provKota.trim() !== "") {
            const [type, id_kota_or_prov = 0, id_prov_temp = 0] = provKota.split("_");
            if (type === "p") {
                id_prov = Number(id_kota_or_prov);
                id_city = 0;
            } else {
                id_city = Number(id_kota_or_prov);
                id_prov = Number(id_prov_temp);
            }
        }
        const slug = nameToSlug(namaLoker)

        const [id] = await db(TABLE).insert({
            slug,
            name_job: namaLoker,
            desc: detailLoker,
            id_country: 1,
            id_province: id_prov,
            id_city: id_city,
            job_types: jenisLoker,
            job_location: lokasiLoker,
            job_education: jenjang,
            type_post: "free",
            name_company: namaPerusahaan,
            wa_number: nowa,
            link_company: link,
            id_user: user ? user : 1,
            active: '0',
            created_at: new Date(),
        });
        res.status(201).json({
            status: true,
            message: MESSAGES.DATA_ADDED,
            link: `https://api.whatsapp.com/send?phone=6287774132558&text=Halo%2C%20saya%20mau%20konfirmasi%20.%20LOKER-1020-${id}`
        });
    } catch (err) { handleError(res, err); }
});

export default router;
