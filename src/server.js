const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')

const app = express()
app.use(bodyParser.json())

// Import routes
const authRoutes = require('./routes/auth')
const companiesRoutes = require('./routes/companies')

// Gunakan routes
app.use('/api/auth', authRoutes)
app.use('/api/companies', companiesRoutes)
app.use('/assets/img/company', express.static(path.join(__dirname, "./assets/img/company")))

app.get('/', (req, res) => {
    res.send('hello')
})

const PORT = 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))