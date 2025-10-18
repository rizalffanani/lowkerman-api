import express from 'express';
import axios from 'axios';
import { parse } from 'node-html-parser';
import { authenticateToken, authorizeRole } from '../../middlewares/auth.js';
import pagination from '../../middlewares/pagination.js';
import { nameToSlug } from '../../utils/slugify.js'
import db from '../../config/knex.js';
import jobPendingService from '../../services/jobpending.services.js';

const router = express.Router();

const TABLE = 'job_pendings';
const ID_COLUMN = 'job_pendings.id_pending';

const MESSAGES = {
    DATABASE_ERROR: 'Database error',
    REQUIRED_FIELDS: 'All fields are required',
    DATA_EXISTS: 'Jobs already exists',
    DATA_NOT_FOUND: 'Jobs not found',
    DATA_ADDED: 'Jobs added',
    DATA_UPDATED: 'Jobs updated',
    DATA_DELETED: 'Jobs deleted',
    STATUS_UPDATED: 'Status updated successfully',
    INVALID_STATUS: 'Active status is required'
};

const handleError = (res, err) => res.status(500).json({ message: MESSAGES.DATABASE_ERROR, error: err.message });

router.get('/', authenticateToken, authorizeRole(['admin']), pagination, async (req, res) => {
    const { search = '', sort = '', order = '', limit = 10, page = 1 } = req.query;
    try {
        const [data, totalData] = await jobPendingService.getAll(search, sort, order, limit, page);
        res.status(200).json({
            total: totalData,
            page, limit,
            totalPages: Math.ceil(totalData / limit),
            data,
        });
    } catch (err) { handleError(res, err); }
});

router.post('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { urls } = req.body || {};
    if (!urls) return res.status(400).json({ message: "Invalid input" });

    const insertData = [];

    const getText = (root, selector) => root.querySelector(selector)?.text.trim() || null;
    const getAttr = (root, selector, attr) => root.querySelector(selector)?.getAttribute(attr) || null;

    for (const url of urls) {
        try {
            const { data: html } = await axios.get(url, {
                headers: { "User-Agent": "Mozilla/5.0" },
            });

            const root = parse(html);

            const nama_loker = getText(root, "h1:last-of-type");
            const deskripsi = getText(root, ".deskripsi-block");
            const nama_perusahaan = getText(root, "h1 span.perusahaan");
            const email_perusahaan = getText(root, ".email + li .txt");
            const nowa = getText(root, ".telepon + li .txt");
            const alamat = getText(root, ".kirim-lamaran-block .lokasi + li");
            const prov_kota = getText(root, ".lokasi + li");
            const jenjang_pendidikan = getText(root, ".pendidikan + li");
            const link = getAttr(root, ".link a", "href");
            const logo = getAttr(root, ".img-perusahaan a img", "src");

            // ambil detail loker
            const detail_loker = [];
            root.querySelectorAll(".loker-detail ul").forEach((ul) => {
                const lines = ul.querySelectorAll("li").map(li => li.text.trim());
                detail_loker.push(lines);
            });

            let desc = `${deskripsi}<br>Alamat: ${alamat}<br>Kota: ${prov_kota}<br>Jenjang: ${jenjang_pendidikan}<br>Email: ${email_perusahaan}<br>Link: ${link}<ul>`;
            detail_loker.forEach((reqs) => {
                reqs.forEach((r) => (desc += `<li>${r}</li>`));
            });
            desc += "</ul>";

            const data = {
                slug: "tes",
                name_job: nama_loker,
                desc,
                id_country: 0,
                id_province: 0,
                id_city: 0,
                job_types: "fulltime",
                job_location: "onsite",
                job_education: "sma",
                type_post: "free",
                name_company: nama_perusahaan,
                wa_number: nowa,
                link_company: url,
                logo,
                active: '0',
                created_at: new Date(),
            };

            insertData.push(data);
            await db("job_pendings").insert(data);
        } catch (err) {
            console.error(`Gagal scrape ${url}:`, err.message);
            return res.status(500).json({
                message: `Gagal memproses permintaan scraping untuk ${url}.`,
                error_detail: err.message
            })
        }
    }

    return res.json({ message: "berhasil kak", data: insertData });
});

router.route('/:id')
    .put(authenticateToken, authorizeRole('admin'), async (req, res) => {
        const {
            name_job, desc, id_country, id_province, id_city,
            job_types, job_location, job_education, type_post,
            id_company, name_company, wa_number = "", link_company = "0", id_user = "1"
        } = req.body;
        if (!name_company || !name_job || !desc || !job_types || !job_location || !job_education || !type_post) return res.status(400).json({ message: MESSAGES.REQUIRED_FIELDS });
        try {
            const updated = await db(TABLE).where({ [ID_COLUMN]: req.params.id }).update({
                id_company, name_company, wa_number, link_company,
                id_user, name_job, desc,
                id_country, id_province, id_city,
                job_types, job_location, job_education,
                type_post
            });
            if (!updated) return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND });
            res.status(200).json({ message: MESSAGES.DATA_UPDATED, result: { id: req.params.id, name_job } });
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
        const getData = await db(TABLE).where({ [ID_COLUMN]: req.params.id }).first();
        if (!getData) return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND });

        const updated = await db(TABLE).where({ [ID_COLUMN]: req.params.id }).update({ active });
        if (!updated) return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND });

        const [id] = await db('jobs').insert({
            id_company: getData.id_company || 1,
            id_user: getData.id_user || 1,
            slug: nameToSlug(getData.name_job),
            name_job: getData.name_job,
            desc: getData.desc,
            id_country: getData.id_country,
            id_province: getData.id_province,
            id_city: getData.id_city,
            job_types: getData.job_types,
            job_location: getData.job_location,
            job_education: getData.job_education,
            type_post: getData.type_post,
            active: '0'
        });
        res.status(200).json({ message: MESSAGES.STATUS_UPDATED, result: { id } });
    } catch (err) { handleError(res, err); }
});

export default router;
