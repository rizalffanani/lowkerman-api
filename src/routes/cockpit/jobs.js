import express from 'express';
import fetch from 'node-fetch'
import { authenticateToken, authorizeRole } from '../../middlewares/auth.js';
import pagination from '../../middlewares/pagination.js';
import { nameToSlug } from '../../utils/slugify.js'
import { encodeCustomId } from '../../utils/encode.js'
import { capitalize } from '../../utils/capitalizeText.js'
import db from '../../config/knex.js';
import { createUploader } from '../../config/multer.js'
import jobService from '../../services/jobs.services.js';

const router = express.Router();
const posterUploader = createUploader('src/assets/img/job/cover')

const TABLE = 'jobs';
const ID_COLUMN = 'jobs.id_job';
const BOT_TOKEN = "8034325444:AAHDRQuIL_MkAmVekEuBbTc6RE4VdM54U_o";
const CHANNEL_ID = "@lokerfreelance_indo";

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
        const [data, totalData] = await jobService.getAll(search, sort, order, limit, page);
        res.status(200).json({
            total: totalData,
            page, limit,
            totalPages: Math.ceil(totalData / limit),
            data,
        });
    } catch (err) { handleError(res, err); }
});

router.post('/', authenticateToken, authorizeRole('admin'), posterUploader.single('image'), async (req, res) => {
    const {
        id_company, id_user, name_job, desc,
        id_country, id_province, id_city,
        job_types, job_location, job_education,
        url, type_post, active
    } = req.body;
    if (!id_company || !id_user || !name_job || !desc ||
        !id_country || !id_province || !id_city || !job_types || !job_location || !job_education ||
        !type_post || !active) return res.status(400).json({ message: MESSAGES.REQUIRED_FIELDS });
    const poster = req.file ? req.file.filename : ''
    const slug = nameToSlug(name_job)
    try {
        const [id] = await db(TABLE).insert({
            id_company, id_user, slug, name_job, desc,
            id_country, id_province, id_city,
            job_types, job_location, job_education,
            url, type_post, poster, active
        });
        res.status(201).json({ message: MESSAGES.DATA_ADDED, result: { id, slug, name_job } });
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
    .put(authenticateToken, authorizeRole('admin'), posterUploader.single('image'), async (req, res) => {
        const {
            id_company, id_user, name_job, desc,
            id_country, id_province, id_city,
            job_types, job_location, job_education,
            url, type_post, active
        } = req.body;
        if (!id_company || !id_user || !name_job || !desc ||
            !id_country || !id_province || !id_city || !job_types || !job_location || !job_education ||
            !type_post || !active) return res.status(400).json({ message: MESSAGES.REQUIRED_FIELDS });
        const poster = req.file ? req.file.filename : null
        const slug = nameToSlug(name_job)
        try {
            const updated = await db(TABLE).where({ [ID_COLUMN]: req.params.id }).update({
                id_company, id_user, slug, name_job, desc,
                id_country, id_province, id_city,
                job_types, job_location, job_education,
                url, type_post, ...(poster && { poster }), active
            });
            if (!updated) return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND });
            res.status(200).json({ message: MESSAGES.DATA_UPDATED, result: { id: req.params.id, slug, name_job } });
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

router.patch('/:id/copas', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const getData = await db(TABLE).where({ [ID_COLUMN]: req.params.id }).first();
        if (!getData) return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND });

        const rowData = { ...getData };
        delete rowData['id_job'];

        const newId = await db(TABLE).insert(rowData);
        if (!newId) return res.status(400).json({ message: MESSAGES.DATA_NOT_FOUND })

        res.status(200).json({ message: MESSAGES.STATUS_UPDATED });
    } catch (err) { handleError(res, err); }
});

router.get('/:id/telegram', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const cek = await db(TABLE).where({ [ID_COLUMN]: req.params.id }).first();
        if (!cek) {
            return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND });
        }

        const baseUrl = 'https://lokerfreelance.com/'; // sesuaikan
        const message = `Info terbaru loker ${cek.name_job} ${baseUrl}loker/${cek.slug}/${encodeCustomId(cek.id_job)}`;

        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const data = {
            chat_id: CHANNEL_ID,
            text: message
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(data)
        });

        const result = await response.json();

        res.json({
            data: result,
            message: response.ok ? 'Message sent successfully!' : 'Failed to send the message.'
        });
    } catch (err) { handleError(res, err); }
});

router.get('/:id/linkedin', authenticateToken, authorizeRole('admin'), async (req, res) => {
    try {
        const job = await db('jobs as j')
            .leftJoin('location_provinces as p', 'j.job_location', '=', 'p.id_province')
            .leftJoin('location_cities as c', 'j.job_location', '=', 'c.id_city')
            .leftJoin('companies as comp', 'j.id_company', '=', 'comp.id_company')
            .select(
                'j.id_job',
                'j.slug',
                'j.name_job',
                'j.desc',
                'j.job_types',
                'j.job_education',
                'j.job_location',
                'p.name_province',
                'c.name_city',
                'comp.name as nama_company'
            )
            .where('j.id_job', req.params.id)
            .first();

        if (!job) {
            return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND });
        }

        // --- 2️⃣ Ambil token LinkedIn ---
        const token = await db('linkedin_tokens').where({ id_token: 1 }).first();
        if (!token) {
            return res.status(401).json({ message: "Token akses LinkedIn tidak ditemukan." });
        }

        // --- 3️⃣ Bersihkan dan format teks ---
        let plainText = job.desc
            .replace(/<li>/g, '• ')
            .replace(/<\/li>/g, '\n')
            .replace(/<[^>]*>/g, '') // hapus semua tag HTML
            .replace(/[ \t]+/g, ' ')
            .trim();

        // --- 4️⃣ Buat pesan postingan ---
        const baseUrl = 'https://lokerfreelance.com/';
        let postMessage = `Info terbaru loker ${job.name_job} ${job.job_types} ${job.job_location}\n`;
        postMessage += `Perusahaan : ${capitalize(job.nama_company)}\n`;
        postMessage += `Lokasi Kerja : ${capitalize(job.name_city)}\n`;
        postMessage += `Pendidikan : ${capitalize(job.job_education)}\n\n`;
        postMessage += `${plainText}\n\n`;
        postMessage += `Silahkan lamar di sini ${baseUrl}loker/${job.slug}/${encodeCustomId(job.id_job)}`;

        // Hapus karakter terlarang
        const postMessageBersih = postMessage.replace(/[()\[\]@]/g, '');

        // --- 5️⃣ Payload untuk LinkedIn API ---
        const payload = {
            author: token.author,
            commentary: postMessageBersih,
            visibility: 'PUBLIC',
            distribution: { feedDistribution: 'MAIN_FEED' },
            lifecycleState: 'PUBLISHED',
            isReshareDisabledByAuthor: false
        };

        // --- 6️⃣ Kirim ke API LinkedIn ---
        const response = await fetch('https://api.linkedin.com/rest/posts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token.access_token}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0',
                'LinkedIn-Version': '202502'
            },
            body: JSON.stringify(payload)
        });

        let responseData;
        try {
            const text = await response.text();
            responseData = text ? JSON.parse(text) : null;
        } catch {
            responseData = null; // tidak bisa parse JSON
        }

        if (response.ok) {
            return res.status(200).json({
                data: postMessage,
                message: 'Postingan berhasil dikirim ke profil LinkedIn Anda!',
                linkedin_response: responseData
            });
        } else {
            return res.status(response.status).json({
                data: responseData,
                message: `Gagal mengirim postingan ke LinkedIn.`,
                raw: responseData
            });
        }
    } catch (err) { handleError(res, err); }
});

export default router;
