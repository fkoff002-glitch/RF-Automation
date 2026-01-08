// backend/server.js

const express = require('express');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const cors = require('cors'); // <--- 1. Import CORS
const path = require('path');

const app = express();

// 2. ENABLE CORS (This fixes the issue)
app.use(cors()); 
// If you want to restrict it to only your frontend, use:
// app.use(cors({ origin: 'https://fkoff002-glitch.github.io' }));

app.use(express.json()); // Built-in middleware to parse JSON

// --- CONFIG & AUTH ---
const SPREADSHEET_ID = process.env.SHEET_ID;
const CREDENTIALS_BASE64 = process.env.GOOGLE_CREDENTIALS_BASE64;

// Decode Base64 credentials
let serviceAccountAuth;
if (CREDENTIALS_BASE64) {
    const jsonBuffer = Buffer.from(CREDENTIALS_BASE64, 'base64');
    serviceAccountAuth = new JWT({
        email: JSON.parse(jsonBuffer).client_email,
        key: JSON.parse(jsonBuffer).private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
}

// --- API ROUTES ---

// GET /api/links
app.get('/api/links', async (req, res) => {
    try {
        console.log('📄 Fetching inventory from Google Sheets...');
        const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
        await doc.loadInfo();
        
        const sheet = doc.sheetsByTitle['RADIO_LINKS']; // Ensure sheet name matches
        const rows = await sheet.getRows();
        
        console.log(`📈 Retrieved ${rows.length} rows from Google Sheets`);

        // Group by POP_Name
        const grouped = {};
        rows.forEach(row => {
            const pop = row['POP_Name'];
            const link = {
                Link_ID: row['Link_ID'],
                POP_Name: pop,
                BTS_Name: row['BTS_Name'],
                Client_Name: row['Client_Name'],
                Client_IP: row['Client_IP'],
                Base_IP: row['Base_IP'],
                Gateway_IP: row['Gateway_IP'],
                Loopback_IP: row['Loopback_IP'],
                Location: row['Location']
            };
            
            if (!grouped[pop]) grouped[pop] = [];
            grouped[pop].push(link);
        });

        console.log(`✅ Processed ${Object.keys(grouped).length} POPs`);
        res.json(grouped);

    } catch (error) {
        console.error("❌ Error fetching sheet:", error);
        res.status(500).json({ error: "Failed to fetch inventory" });
    }
});

// POST /api/ping
app.post('/api/ping', async (req, res) => {
    const { ips } = req.body;
    if (!ips || !Array.isArray(ips)) return res.status(400).json({ error: "Invalid body" });

    const results = {};
    const { exec } = require('child_process');
    
    // Helper to wrap ping command
    const ping = (ip) => new Promise(resolve => {
        exec(`ping -c 1 -W 2 ${ip}`, (error, stdout) => {
            if (error) resolve({ alive: false, latency: 0 });
            else resolve({ alive: true, latency: 12 }); // Simplified
        });
    });

    const promises = ips.map(ip => ping(ip).then(r => results[ip] = r));
    await Promise.all(promises);
    
    res.json(results);
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    console.log(`⚡ CORS Enabled`);
});
