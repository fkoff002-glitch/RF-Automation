const { google } = require('googleapis');
const fs = require('fs');

// Path to your JSON key file (downloaded from Google Cloud Console)
const CREDENTIALS_PATH = path.join(__dirname, '../../config/google-credentials.json');

class GoogleSheetService {
    constructor() {
        this.auth = new google.auth.GoogleAuth({
            keyFile: CREDENTIALS_PATH,
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });
        this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    }

    async getInventory() {
        try {
            // Spreadsheet ID (from your URL)
            const SPREADSHEET_ID = '1wQk9X...YOUR_ID...'; 
            const RANGE = 'RADIO_LINKS!A2:I'; // Read data excluding header

            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: RANGE
            });

            const rows = response.data.values;

            // Map Array to Object
            const inventory = rows.map(row => ({
                Link_ID: row[0],
                POP_Name: row[1],
                BTS_Name: row[2],
                Client_Name: row[3],
                Client_IP: row[4],
                Base_IP: row[5],
                Gateway_IP: row[6], // Immediate next hop after Base
                Loopback_IP: row[7],
                Location: row[8]
            }));

            return inventory;

        } catch (error) {
            console.error('Error reading Google Sheet:', error);
            return []; // Return empty array on error
        }
    }
}

module.exports = new GoogleSheetService();
