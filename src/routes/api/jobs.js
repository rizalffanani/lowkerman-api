import express from 'express';
import pagination from '../../middlewares/pagination.js';
import db from '../../config/knex.js';
import jobService from '../../services/jobs.services.js';
import { bundleDetail } from "../../helpers/jobHelper.js";

const router = express.Router();

const TABLE = 'jobs';
const ID_COLUMN = 'jobs.id_job';

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

router.get('/', pagination, async (req, res) => {
    const { keyLoker = '', provKota = '', jenisLoker = '', lokasiLoker = '', userId = '', perpage = '6', page = '1' } = req.query;
    const selectColumns = [
        'jobs.id_job AS id_loker',
        'jobs.slug AS slug',
        'jobs.name_job AS nama_loker',
        'jobs.desc AS detail_loker',
        'jobs.poster AS poster',
        'jobs.created_at AS tanggal_posting',
        'jobs.active AS status_loker',
        'jobs.job_types AS jenis_loker',
        'jobs.job_education AS jenjang_pendidikan',
        'jobs.job_location AS lokasi_loker',
        'jobs.url AS eksternal',
        'jobs.id_province AS id_prov',
        'location_provinces.name_province AS nama_prov',
        'jobs.id_city AS id_kota',
        'location_cities.name_city AS nama_kota',
        'jobs.id_company AS id_perusahaan',
        'companies.name AS nama_perusahaan',
        'companies.slug AS slug_p',
        'companies.logo AS logo',
        'companies.ig AS urlCompany',
        'jobs.id_user AS id_userpost',
        'jobs.view AS total_view',
        'users.username AS username',
        'users.name AS first_name'
    ];
    try {
        const [data, totalData] = await jobService.getAll(keyLoker, '', '', perpage, page, selectColumns, provKota, jenisLoker, lokasiLoker, userId);
        res.status(200).json({
            total: totalData,
            page,
            perpage,
            totalPages: Math.ceil(totalData / perpage),
            data: data.map(bundleDetail),
        });
    } catch (err) { handleError(res, err); }
});

router.route('/:id').get(async (req, res) => {
    try {
        const getData = await db(TABLE).where({ [ID_COLUMN]: req.params.id }).first();
        if (!getData) return res.status(404).json({ message: MESSAGES.DATA_NOT_FOUND });
        res.status(200).json({ getData });
    } catch (err) { handleError(res, err); }
});

export default router;
