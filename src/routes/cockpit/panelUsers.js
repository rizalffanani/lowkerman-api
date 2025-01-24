import express from 'express'

import { authenticateToken, authorizeRole } from '../../middlewares/auth.js'


import db from '../../config/knex.js'

const router = express.Router()

// GET: Ambil perusahaan berdasarkan ID
router.get('/:id', authenticateToken, authorizeRole(['admin', 'user']), async (req, res) => {
    const { id } = req.params

    try {
        const users = await db('panel_users').where({ id }).first()
        if (!users) {
            return res.status(400).json({ message: 'User not found' })
        }
        res.status(200).json({ users })
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err.message })
    }
})

export default router