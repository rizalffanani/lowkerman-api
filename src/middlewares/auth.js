import jwt from 'jsonwebtoken'
import { isBlacklisted } from '../config/tokenBlacklist.js'
import dotenv from 'dotenv'

dotenv.config()

export const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]

    if (!token) return res.status(401).json({ message: 'Access Denied' })

    if (isBlacklisted(token)) {
        return res.status(403).json({ message: 'Token has been blacklisted' })
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) return res.status(403).json({ message: 'Invalid or expired token' })
            req.user = user // Simpan informasi user dari token
            next()
        })
    } catch (err) {
        res.status(403).json({ message: `Invalid Token` })
    }
}

export const authorizeRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Access Denied: Insufficient Permissions' })
    }
    next()
}
