const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const path = require('path');

// dotenv is optional on Render if vars are set in Dashboard, 
// but we keep it for local development.
require('dotenv').config();

const app = express();

// --- 1. MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- 2. CONFIGURATION & AUTH ---

// NOTE: On Render, ensure these are set in the Environment tab.
const SPREADSHEET_ID = process.env.SHEET_ID;
const CREDENTIALS_BASE64 = process.env.GOOGLE_CREDENTIALS_BASE64;

// Validate Config safely
let sheets = null;
let authError = null;

try {
    if (!SPREADSHEET_ID) {
        console.error("❌ CRITICAL: SHEET_ID is missing from Environment Variables.");
        console.error("   Please add it to the Render Dashboard Environment settings.");
        throw new Error("SHEET_ID missing");
    }

    if (!CREDENTIALS_BASE64) {
        console.error("❌ CRITICAL: GOOGLE_CREDENTIALS_BASE64 is missing from Environment Variables.");
        throw new Error("Credentials missing");
    }

    // Decode Credentials
    const buffer = Buffer.from(CREDENTIALS_BASE64, 'base64');
    const credentials = JSON.parse(buffer);

    const auth = new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key,
        ['https://www.googleapis.com/auth/spreadsheets.readonly']
    );

    sheets = google.sheets({ version: 'v4', auth });
    console.log("✅ Google Auth Initialized (JWT)");
    console.log(`📊 Target Sheet ID: ${SPREADSHEET_ID}`);

} catch (e) {
    console.error("❌ Initialization Failed:", e.message);
    authError = e.message;
}

// --- 3. API ROUTES ---

// GET /api/links
app.get('/api/links', async (req, res) => {
    if (!sheets) {
        return res.status(503).json({ 
            error: "Service Unavailable", 
            details: `Configuration Error: ${authError}` 
        });
    }

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'RADIO_LINKS!A2:I', // Adjust if header count changes
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return res.json({});
        }

        const grouped = {};

        rows.forEach(row => {
            if (row.length < 5) return;

            const link = {
                Link_ID: row[0],
                POP_Name: row[1] || 'Unknown POP',
                BTS_Name: row[2],
                Client_Name: row[3],
                Client_IP: row[4],
                Base_IP: row[5],
                Gateway_IP: row[6],
                Loopback_IP: row[7],
                Location: row[8]
            };

            if (!grouped[link.POP_Name]) grouped[link.POP_Name] = [];
            grouped[link.POP_Name].push(link);
        });

        res.json(grouped);

    } catch (error) {
        console.error("API Data Fetch Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/ping
app.post('/api/ping', async (req, res) => {
    const { ips } = req.body;
    if (!ips || !Array.isArray(ips)) return res.status(400).json({ error: "Invalid body" });

    const results = {};
    const { exec } = require('child_process');
    
    const ping = (ip) => new Promise(resolve => {
        // Using fping if available is faster, otherwise standard ping
        const cmd = process.platform === 'win32' ? `ping -n 1 -w 2000 ${ip}` : `ping -c 1 -W 2 ${ip}`;
        exec(cmd, (error, stdout) => {
            if (error) resolve({ alive: false, latency: 0 });
            else {
                const match = stdout.match(/time[=<](\d+(\.\d+)?)/);
                const latency = match ? parseFloat(match[1]) : 0;
                resolve({ alive: true, latency });
            }
        });
    });

    const promises = ips.map(ip => ping(ip).then(r => results[ip] = r));
    await Promise.all(promises);
    
    res.json(results);
});

// --- 4. START SERVER ---

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    console.log(`🔗 Frontend: https://fkoff002-glitch.github.io/RF-Automation/`);
});
