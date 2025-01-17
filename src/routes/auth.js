import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import { authenticateToken, authorizeRole } from '../middlewares/auth.js'
import { addToBlacklist } from '../config/tokenBlacklist.js'
import db from '../config/knex.js'

const router = express.Router()

// Register endpoint
router.post('/register', async (req, res) => {
    const { username, password, nama } = req.body

    if (!username || !password || !nama) {
        return res.status(400).json({ message: 'Username, password, and name are required' })
    }

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        await db('panel_users').insert({
            username,
            password: hashedPassword,
            nama
        })

        res.status(201).json({ message: 'User registered successfully', user: { username } })
    } catch (err) {
        console.error(err)
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Username already exists' })
        }
        res.status(500).json({ message: 'Database error', error: err.message })
    }
})

router.post('/login', async (req, res) => {
    const { username, password } = req.body

    if (!username || !password) {
        return res.status(404).json({ message: 'Username and password are required' })
    }

    try {
        const user = await db('panel_users').where({ username }).first()

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ message: 'Username or Password false' })
        }

        if (user.active === "0") {
            return res.status(400).json({ message: 'User non active' })
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            'lowkerman_secret_key_api', // Ganti dengan secret key yang aman
            { expiresIn: '1h' } // Token berlaku selama 1 jam
        )

        res.status(200).json({ message: 'Login successful', token })
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err.message })
    }
})

router.post('/logout', authenticateToken, (req, res) => {
    const token = req.headers['authorization'].split(' ')[1]
    addToBlacklist(token)
    res.status(200).json({ message: 'Logout successful' })
})

export default router