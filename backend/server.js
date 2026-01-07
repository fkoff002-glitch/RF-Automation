const express = require('express');
const cors = require('cors');
// REMOVE this line: const path = require('path');

// Load environment variables
require('dotenv').config();

const linkController = require('./src/controllers/linkController');

const app = express();
const PORT = process.env.PORT || 3000;

// Debug logging
console.log('=== RF Automation Backend Starting ===');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', PORT);
console.log('Google Sheets ID:', process.env.GOOGLE_SHEETS_ID ? 'Set' : 'Not Set');
console.log('Credentials:', process.env.GOOGLE_CREDENTIALS_BASE64 ? 'Base64 Set' : 'Not Set');

// CORS configuration - ALLOW NETLIFY FRONTEND
const corsOptions = {
    origin: [
        'https://deft-kitten-7ca5fb.netlify.app',  // Your Netlify frontend
        'http://localhost:5500',                    // Local frontend
        'http://localhost:3000',                    // Local dev
        'https://rf-automation-1.onrender.com'      // Render itself
    ],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Routes
app.get('/api/links', linkController.getLinkStatus);

// Enhanced health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'RF-Automation Backend',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        googleSheets: {
            configured: !!process.env.GOOGLE_SHEETS_ID,
            credentials: process.env.GOOGLE_CREDENTIALS_BASE64 ? 'Base64 Set' : 'Not Set'
        }
    });
});

// REMOVE THESE LINES COMPLETELY:
// app.use(express.static(path.join(__dirname, '../frontend')));
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, '../frontend/index.html'));
// });

// ADD THIS SIMPLE ROOT ENDPOINT INSTEAD:
app.get('/', (req, res) => {
    res.json({
        message: 'RF Automation Backend API',
        endpoints: {
            api: '/api/links',
            health: '/health'
        },
        frontend: 'https://deft-kitten-7ca5fb.netlify.app',
        documentation: 'Backend API only - frontend is hosted separately'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.url}`,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 API endpoint: http://localhost:${PORT}/api/links`);
    console.log(`🔗 Frontend: https://deft-kitten-7ca5fb.netlify.app`);
});
