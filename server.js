const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Import routes
const authRoutes = require('./routes/auth');

// Gunakan routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.send('hello')
})

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));