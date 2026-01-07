const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleSheetService {
    constructor() {
        this.auth = null;
        this.sheets = null;
        this.initializeAuth();
    }

    async initializeAuth() {
        try {
            let credentials;
            
            // OPTION 1: Base64 encoded credentials from environment (for Render)
            if (process.env.GOOGLE_CREDENTIALS_BASE64) {
                console.log('🔐 Using Base64 credentials from environment');
                const credentialsJson = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64').toString();
                credentials = JSON.parse(credentialsJson);
            }
            // OPTION 2: Credentials file (for local development)
            else if (process.env.GOOGLE_CREDENTIALS_PATH) {
                console.log('📁 Using credentials file:', process.env.GOOGLE_CREDENTIALS_PATH);
                const credentialsPath = path.join(__dirname, process.env.GOOGLE_CREDENTIALS_PATH);
                credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
            }
            // OPTION 3: Default path
            else {
                const defaultPath = path.join(__dirname, '../../../google-credentials.json');
                console.log('📁 Using default credentials path:', defaultPath);
                if (fs.existsSync(defaultPath)) {
                    credentials = JSON.parse(fs.readFileSync(defaultPath, 'utf8'));
                } else {
                    throw new Error('No Google credentials found. Set GOOGLE_CREDENTIALS_BASE64 or GOOGLE_CREDENTIALS_PATH');
                }
            }

            // Create auth with credentials
            this.auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
            });

            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            console.log('✅ Google Sheets authentication initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Google Sheets auth:', error.message);
            throw error;
        }
    }

    async getInventory() {
        // Wait for auth to initialize if needed
        if (!this.auth) {
            await this.initializeAuth();
        }

        try {
            const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
            if (!SPREADSHEET_ID) {
                throw new Error('GOOGLE_SHEETS_ID environment variable is not set');
            }

            const RANGE = 'RADIO_LINKS!A2:I';
            console.log(`📊 Fetching from Sheet ID: ${SPREADSHEET_ID}, Range: ${RANGE}`);

            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: RANGE
            });

            const rows = response.data.values || [];
            console.log(`📈 Retrieved ${rows.length} rows from Google Sheets`);

            // Map rows to link objects
            const inventory = rows.map(row => ({
                Link_ID: row[0] || 'N/A',
                POP_Name: row[1] || 'Unknown',
                BTS_Name: row[2] || 'Unknown',
                Client_Name: row[3] || 'Unknown',
                Client_IP: row[4] || '',
                Base_IP: row[5] || '',
                Gateway_IP: row[6] || '',
                Loopback_IP: row[7] || '',
                Location: row[8] || 'Unknown'
            }));

            console.log(`✅ Processed ${inventory.length} inventory items`);
            return inventory;

        } catch (error) {
            console.error('❌ Error reading Google Sheet:', error.message);
            throw error;
        }
    }
}

module.exports = new GoogleSheetService();
