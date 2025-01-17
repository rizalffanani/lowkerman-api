import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Tentukan direktori saat ini
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());

// Import routes
import authRoutes from './routes/auth.js';
import companiesRoutes from './routes/companies.js';

// Gunakan routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/assets/img/company', express.static(path.join(__dirname, './assets/img/company')));

app.get('/', (req, res) => {
    res.send('hello');
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
