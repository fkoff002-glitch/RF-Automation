const { google } = require('googleapis');
const path = require('path');

class GoogleSheetService {
    constructor() {
        // Use environment variable or fallback
        const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH || 
            path.join(__dirname, '../../google-credentials.json');
        
        this.auth = new google.auth.GoogleAuth({
            keyFile: credentialsPath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });
        this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    }

    async getInventory() {
        try {
            // Use environment variable
            const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '1wQk9X...YOUR_ID...';
            const RANGE = process.env.GOOGLE_SHEETS_RANGE || 'RADIO_LINKS!A2:I';

            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: RANGE
            });

            const rows = response.data.values || [];
            
            return rows.map(row => ({
                Link_ID: row[0] || '',
                POP_Name: row[1] || '',
                BTS_Name: row[2] || '',
                Client_Name: row[3] || '',
                Client_IP: row[4] || '',
                Base_IP: row[5] || '',
                Gateway_IP: row[6] || '',
                Loopback_IP: row[7] || '',
                Location: row[8] || ''
            }));

        } catch (error) {
            console.error('Error reading Google Sheet:', error);
            return [];
        }
    }
}

module.exports = new GoogleSheetService();
