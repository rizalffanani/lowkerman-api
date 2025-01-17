const jwt = require('jsonwebtoken')

const adminOnly = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]
    if (!token) {
        return res.status(403).json({ message: 'Access denied' })
    }

    try {
        const decoded = jwt.verify(token, 'lowkerman_secret_key_api')
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Admins only' })
        }

        req.user = decoded
        next()
    } catch (err) {
        res.status(401).json({ message: 'Invalid or expired token' })
    }
}

module.exports = adminOnly
