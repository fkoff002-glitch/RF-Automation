const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load environment variables

const linkController = require('./src/controllers/linkController');

const app = express();
const PORT = process.env.PORT || 3000;

// Dynamic CORS configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'development' 
        ? 'http://localhost:5500'  // For local frontend testing
        : process.env.FRONTEND_URL || 'https://your-frontend.netlify.app',
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.get('/api/links', linkController.getLinkStatus);
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.listen(PORT, () => {
    console.log(`RF Automation Backend running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});
