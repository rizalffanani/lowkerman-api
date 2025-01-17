import express from 'express'
import bodyParser from 'body-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()
const PORT = process.env.PORT || 5000

// Tentukan direktori saat ini
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(bodyParser.json())

// Import routes
import authRoutes from './routes/auth.js'
import companiesRoutes from './routes/companies.js'

// Gunakan routes
app.use('/cockpit/auth', authRoutes)
app.use('/cockpit/companies', companiesRoutes)
app.use('/assets/img/company', express.static(path.join(__dirname, './assets/img/company')))

app.get('/', (req, res) => {
    res.send('lowkerman')
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
