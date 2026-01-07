const express = require('express');
const cors = require('cors');

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

// CORS configuration - ALLOW FRONTEND ACCESS
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
app.use(express.json()); // Important: Allows parsing JSON bodies for POST requests
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// ================= ROUTES =================

// 1. Get Inventory List (No Ping - Safe for Firewall)
// This loads the client list from Google Sheets or Cache
app.get('/api/links', linkController.getInventory);

// 2. Run On-Demand Ping (Triggered by Button)
// This accepts a list of IPs and pings ONLY those targets
app.post('/api/ping', linkController.runOnDemandPing);

// ==========================================

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'RF-Automation Backend',
        version: '1.2.0', // Updated version
        timestamp: new Date().toISOString(),
        mode: 'On-Demand Pinging'
    });
});

// Root Endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'RF Automation Backend API',
        endpoints: {
            inventory: 'GET /api/links',
            ping: 'POST /api/ping',
            health: 'GET /health'
        },
        frontend: 'https://deft-kitten-7ca5fb.netlify.app'
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
        message: `Cannot ${req.method} ${req.url}`
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    console.log(`📊 API Inventory: http://localhost:${PORT}/api/links`);
    console.log(`⚡ API Ping: POST http://localhost:${PORT}/api/ping`);
});
