import jwt from 'jsonwebtoken'
import { isBlacklisted } from '../config/tokenBlacklist.js'

export const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']
    if (!token) return res.status(401).json({ message: 'Access Denied' })

    const tokenValue = token.split(' ')[1]

    if (isBlacklisted(tokenValue)) {
        return res.status(403).json({ message: 'Token has been revoked' })
    }

    try {
        const verified = jwt.verify(token.split(' ')[1], 'lowkerman_secret_key_api')
        req.user = verified
        next()
    } catch (err) {
        res.status(403).json({ message: 'Invalid Token' })
    }
}

export const authorizeRole = (role) => (req, res, next) => {
    if (req.user.role !== role) {
        return res.status(403).json({ message: 'Access Denied: Insufficient Permissions' })
    }
    next()
}