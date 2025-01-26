import express from 'express'

import { authenticateToken, authorizeRole } from '../../middlewares/auth.js'
import pagination from '../../middlewares/pagination.js'
import { nameToSlug } from '../../utils/slugify.js'
import createUploader from '../../config/multer.js'

import db from '../../config/knex.js'

const router = express.Router()
const companyUploader = createUploader('src/assets/img/company')

// GET: Ambil semua perusahaan
router.get('/', authenticateToken, authorizeRole(['admin']), pagination, async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;

    try {
        const offset = (page - 1) * limit;
        const data = await db('companies')
            .select('*')
            .where('name', 'like', `%${search}%`)
            .orderBy('id_company', 'desc')
            .offset(offset)
            .limit(limit)

        const totalCompanies = await db('companies').count('id_company as count').where('name', 'like', `%${search}%`).first()

        res.status(200).json({
            total: totalCompanies.count,
            page: req.pagination.page,
            limit: req.pagination.limit,
            totalPages: Math.ceil(totalCompanies.count / limit),
            data: data,
        })
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err.message })
    }
})

// POST: Tambah perusahaan baru
router.post('/', authenticateToken, authorizeRole('admin'), companyUploader.single('logo'), async (req, res) => {
    const { name, desc, address, web, ig, active } = req.body
    const logo = req.file ? req.file.filename : 'default.png'

    if (!name || !ig) {
        return res.status(400).json({ message: 'Name, address, IG are required' })
    }

    const slug = nameToSlug(name)

    try {
        const company = await db('companies').where({ "slug": slug }).first()
        if (company) {
            return res.status(404).json({ message: 'Company Already exist' })
        }

        const [id] = await db('companies').insert({
            slug,
            name,
            desc,
            address,
            web,
            ig,
            logo,
            active
        })

        res.status(201).json({ message: 'Company added', company: { id, name, address, logo } })
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err.message })
    }
})

// GET: Ambil perusahaan berdasarkan ID
router.get('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { id } = req.params

    try {
        const company = await db('companies').where({ "id_company": id }).first()
        if (!company) {
            return res.status(404).json({ message: 'Company not found' })
        }
        res.status(200).json({ company })
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err.message })
    }
})

// PUT: Update perusahaan berdasarkan ID
router.put('/:id', authenticateToken, authorizeRole('admin'), companyUploader.single('logo'), async (req, res) => {
    const { id } = req.params
    const { name, desc, address, web, ig, active } = req.body
    const logo = req.file ? req.file.filename : null

    if (!name || !ig) {
        return res.status(400).json({ message: 'Name, address, IG are required' })
    }

    try {
        const updated = await db('companies').where({ "id_company": id }).update({
            name,
            desc,
            address,
            web,
            ig,
            ...(logo && { logo }),
            active
        })

        if (!updated) {
            return res.status(404).json({ message: 'Company not found' })
        }
        res.status(200).json({ message: 'Company updated', company: { id, name, address } })
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err.message })
    }
})

// DELETE: Hapus perusahaan berdasarkan ID
router.delete('/:id', authenticateToken, authorizeRole('admin'), async (req, res) => {
    const { id } = req.params

    try {
        const deleted = await db('companies').where({ "id_company": id }).del()
        if (!deleted) {
            return res.status(404).json({ message: 'Company not found' })
        }
        res.status(200).json({ message: 'Company deleted' })
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err.message })
    }
})

export default router