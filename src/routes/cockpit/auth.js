import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

import { authenticateToken } from '../../middlewares/auth.js'
import db from '../../config/knex.js'
import { addToBlacklist } from '../../config/tokenBlacklist.js'

dotenv.config()
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
        return res.status(401).json({ message: 'Username and password are required' })
    }

    try {
        const user = await db('panel_users').where({ username }).first()

        if (!user) {
            return res.status(401).json({ message: 'User not found' })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ message: 'Username or Password false' })
        }

        if (user.active === "0") {
            return res.status(400).json({ message: 'User non active' })
        }

        const accessToken = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET, // Ganti dengan secret key yang aman
            { expiresIn: '10m' } // Token berlaku selama 1 jam
        )

        const refreshToken = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' } // Refresh token valid selama 7 hari
        )

        await db('panel_refresh_tokens').insert({ token: refreshToken, user_id: user.id })

        res.status(200).json({
            message: 'Login successful',
            access_token: accessToken,
            refresh_token: refreshToken,
            user: {
                id: user.id,
                username: user.username,
                name: user.nama,
                role: user.role,
                email: user.email, // Sesuaikan dengan kolom yang tersedia di tabel Anda
                active: user.active
            }
        })
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err.message })
    }
})

router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body

    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' })
    }

    try {
        // Cek apakah token ada di database
        const tokenExists = await db('panel_refresh_tokens').where({ token: refreshToken }).first()
        if (!tokenExists) {
            return res.status(403).json({ message: 'Invalid refresh token' })
        }

        // Validasi refresh token
        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
            if (err) return res.status(403).json({ message: 'Invalid refresh token' })

            const accessToken = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, {
                expiresIn: '2m',
            })
            res.status(200).json({ accessToken })
        })
    } catch (err) {
        res.status(403).json({ message: 'Invalid or expired refresh token' })
    }
})

router.post('/logout', authenticateToken, async (req, res) => {
    const { refreshToken } = req.body
    const token = req.headers.authorization?.split(' ')[1]

    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' })
    }

    try {
        const tokenExists = await db('panel_refresh_tokens').where({ token: refreshToken }).first()

        if (!tokenExists) {
            return res.status(403).json({ message: 'Invalid refresh token' })
        }

        await db('panel_refresh_tokens').where({ token: refreshToken }).del()
        if (token) addToBlacklist(token)

        res.status(200).json({ message: 'Logout successful' })
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message })
    }
})

export default router