const express = require('express')
const db = require('../config/knex')
const adminOnly = require('../middlewares/adminOnly')
const pagination = require('../middlewares/pagination')
const { nameToSlug } = require('../utils/slugify')
const createUploader = require('../config/multer')

const router = express.Router()
const companyUploader = createUploader('src/assets/img/company')

// GET: Ambil semua perusahaan
router.get('/', adminOnly, pagination, async (req, res) => {
    const { offset, limit } = req.pagination

    try {
        const totalCompanies = await db('companies').count('id_company as count').first()
        const data = await db('companies')
            .select('*')
            .offset(offset)
            .limit(limit)

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
router.post('/', adminOnly, companyUploader.single('logo'), async (req, res) => {
    const { name, desc, address, web, ig, active } = req.body
    const logo = req.file ? req.file.filename : 'default.png'

    if (!name || !address || !ig) {
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
router.get('/:id', adminOnly, async (req, res) => {
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
router.put('/:id', adminOnly, companyUploader.single('logo'), async (req, res) => {
    const { id } = req.params
    const { name, desc, address, web, ig, active } = req.body
    const logo = req.file ? req.file.filename : null

    if (!name || !address || !ig) {
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
router.delete('/:id', adminOnly, async (req, res) => {
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

module.exports = router
