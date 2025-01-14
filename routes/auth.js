const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const router = express.Router()
const { authenticateToken, authorizeRole } = require('../middlewares/auth.js')

const users = [] // Sementara simpan data di array (nanti bisa pakai database)

// Register endpoint
router.post('/register', async (req, res) => {
    const { username, password, role } = req.body
    console.log(req.body)

    if (!username || !password) {
        return res.status(400).json({ message: 'Username, password, and role are required' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Simpan user
    const newUser = { username, password: hashedPassword, role: "user" }
    users.push(newUser)

    res.status(201).json({ message: 'User registered successfully', user: { username, role } })
})

router.post('/login', async (req, res) => {
    const { username, password } = req.body

    if (!username || !password) {
        return res.status(404).json({ message: 'Username and password are required' })
    }

    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
        { username: user.username, role: user.role },
        'lowkerman_secret_key_api', // Ganti dengan secret key yang aman
        { expiresIn: '1h' } // Token berlaku selama 1 jam
    );

    res.status(200).json({ message: 'Login successful', token });
})

router.get('/admin', authenticateToken, authorizeRole('user'), (req, res) => {
    res.status(200).json({ message: `Welcome Admin ${req.user.username}` });
});

module.exports = router
