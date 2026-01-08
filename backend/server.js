const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// --- 1. MIDDLEWARE ---

// ENABLE CORS (Fixes the frontend error)
app.use(cors());

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files if needed

// --- 2. CONFIGURATION ---

const SPREADSHEET_ID = process.env.SHEET_ID;
const CREDENTIALS_BASE64 = process.env.GOOGLE_CREDENTIALS_BASE64;

// Decode Base64 Service Account
let serviceAccountAuth = null;
try {
    if (CREDENTIALS_BASE64) {
        const buffer = Buffer.from(CREDENTIALS_BASE64, 'base64');
        const credentials = JSON.parse(buffer);
        serviceAccountAuth = new google.auth.JWT(
            credentials.client_email,
            null,
            credentials.private_key,
            ['https://www.googleapis.com/auth/spreadsheets.readonly']
        );
        console.log("✅ Google Auth Initialized (JWT)");
    } else {
        console.warn("⚠️ WARNING: No credentials found in env.");
    }
} catch (e) {
    console.error("❌ Failed to parse credentials:", e.message);
}

// Initialize Sheets API
const sheets = google.sheets({ version: 'v4', auth: serviceAccountAuth });

// --- 3. API ROUTES ---

// GET /api/links
app.get('/api/links', async (req, res) => {
    try {
        if (!SPREADSHEET_ID) throw new Error("SHEET_ID is missing in .env");

        console.log(`📄 Fetching from Sheet ID: ${SPREADSHEET_ID}, Range: RADIO_LINKS!A2:I`);
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'RADIO_LINKS!A2:I', // Assuming headers are in Row 1, data starts Row 2
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            console.log('⚠️ No data found.');
            return res.json({});
        }

        console.log(`📈 Retrieved ${rows.length} rows from Google Sheets`);

        // Mapping Array to Objects
        // Assuming Header Order: Link_ID, POP_Name, BTS_Name, Client_Name, Client_IP, Base_IP, Gateway_IP, Loopback_IP, Location
        const grouped = {};

        rows.forEach(row => {
            // Safety check for incomplete rows
            if (row.length < 5) return;

            const link = {
                Link_ID: row[0] || 'N/A',
                POP_Name: row[1] || 'Unknown POP',
                BTS_Name: row[2] || 'Unknown BTS',
                Client_Name: row[3] || 'Unknown Client',
                Client_IP: row[4] || 'N/A',
                Base_IP: row[5] || 'N/A',
                Gateway_IP: row[6] || 'N/A',
                Loopback_IP: row[7] || 'N/A',
                Location: row[8] || 'Unknown'
            };

            const popName = link.POP_Name;
            if (!grouped[popName]) {
                grouped[popName] = [];
            }
            grouped[popName].push(link);
        });

        console.log(`✅ Processed ${Object.keys(grouped).length} POPs`);
        res.json(grouped);

    } catch (error) {
        console.error("❌ API Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/ping
app.post('/api/ping', async (req, res) => {
    const { ips } = req.body;
    if (!ips || !Array.isArray(ips)) return res.status(400).json({ error: "Invalid body" });

    const results = {};
    const { exec } = require('child_process');
    
    // Helper to ping IP (using fping or standard ping)
    const ping = (ip) => new Promise(resolve => {
        // 'ping -c 1' sends 1 packet. '-W 2' waits 2 seconds max.
        exec(`ping -c 1 -W 2 ${ip}`, (error, stdout) => {
            if (error) {
                resolve({ alive: false, latency: 0 });
            } else {
                // Simple regex to extract time (e.g. time=1.2ms)
                const match = stdout.match(/time=(\d+(\.\d+)?)/);
                const latency = match ? parseFloat(match[1]) : 0;
                resolve({ alive: true, latency });
            }
        });
    });

    // Run pings in parallel
    const promises = ips.map(ip => ping(ip).then(r => results[ip] = r));
    await Promise.all(promises);
    
    res.json(results);
});

// --- 4. START SERVER ---

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    console.log(`📊 API Inventory: http://localhost:${PORT}/api/links`);
    console.log(`⚡ API Ping: POST http://localhost:${PORT}/api/ping`);
});
