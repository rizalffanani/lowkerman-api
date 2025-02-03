import express from 'express'
import bodyParser from 'body-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import cors from 'cors';

dotenv.config()
const PORT = process.env.PORT || 5000

// Tentukan direktori saat ini
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
// Enable CORS
app.use(cors({
    origin: 'http://localhost:3000', // Allow requests from your frontend origin
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'], // Allowed HTTP methods
    credentials: true// Allow cookies and authorization headers if needed
}));

app.use(bodyParser.json())

// Import routes
import authRoutes from './routes/cockpit/auth.js'
import companiesRoutes from './routes/cockpit/companies.js'
import panelUsersRoutes from './routes/cockpit/panelUsers.js'

// Gunakan routes
app.use('/cockpit/auth', authRoutes)
app.use('/cockpit/companies', companiesRoutes)
app.use('/cockpit/panel-users', panelUsersRoutes)
app.use('/assets/img/company', express.static(path.join(__dirname, './assets/img/company')))

app.get('/', (req, res) => {
    res.send('lowkerman')
})

// Handle preflight requests for all routes
app.options('*', cors());

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
