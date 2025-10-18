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
import usersRoutes from './routes/cockpit/users.js'
import panelUsersRoutes from './routes/cockpit/panelUsers.js'
import panelCountriesRoutes from './routes/cockpit/locationCountries.js'
import panelProvincesRoutes from './routes/cockpit/locationProvinces.js'
import panelCitiesRoutes from './routes/cockpit/locationCities.js'
import jobsRoutes from './routes/cockpit/jobs.js'
import jobPendingRoutes from './routes/cockpit/jobpending.js'
import freelanceRoutes from './routes/cockpit/freelance.js'
import freelanceCatRoutes from './routes/cockpit/freelanceCat.js'
import productRoutes from './routes/cockpit/product.js'
import productCatRoutes from './routes/cockpit/productCat.js'
import digitalRoutes from './routes/cockpit/digitals.js'
import testcatRoutes from './routes/cockpit/testCat.js'
import testtypeRoutes from './routes/cockpit/testType.js'
import coinRoutes from './routes/cockpit/coin.js'
import paymentRoutes from './routes/cockpit/payment.js'
import scrapperRoutes from './routes/cockpit/scrapper.js'

// Gunakan routes
app.use('/cockpit/auth', authRoutes)
app.use('/cockpit/company', companiesRoutes)
app.use('/cockpit/user', usersRoutes)
app.use('/cockpit/panel-user', panelUsersRoutes)
app.use('/cockpit/country', panelCountriesRoutes)
app.use('/cockpit/province', panelProvincesRoutes)
app.use('/cockpit/city', panelCitiesRoutes)
app.use('/cockpit/job', jobsRoutes)
app.use('/cockpit/jobpending', jobPendingRoutes)
app.use('/cockpit/freelance', freelanceRoutes)
app.use('/cockpit/freelancecat', freelanceCatRoutes)
app.use('/cockpit/product', productRoutes)
app.use('/cockpit/productcat', productCatRoutes)
app.use('/cockpit/digital', digitalRoutes)
app.use('/cockpit/testcat', testcatRoutes)
app.use('/cockpit/testtype', testtypeRoutes)
app.use('/cockpit/coin', coinRoutes)
app.use('/cockpit/payment', paymentRoutes)
app.use('/cockpit/scrapper', scrapperRoutes)
app.use('/image/web', express.static(path.join(__dirname, './assets/img/web')))
app.use('/image/company', express.static(path.join(__dirname, './assets/img/company')))
app.use('/image/profil', express.static(path.join(__dirname, './assets/img/profil')))
app.use('/image/product', express.static(path.join(__dirname, './assets/img/product')))
app.use('/image/product/digital', express.static(path.join(__dirname, './assets/file')))

app.get('/', (req, res) => {
    res.send('lowkerman')
})

// Handle preflight requests for all routes
app.options('*', cors());

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
