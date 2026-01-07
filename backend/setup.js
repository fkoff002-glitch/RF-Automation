#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('🛠️  RF Automation Setup');
console.log('======================');

// Check for environment file
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file from template...');
    if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('✅ .env file created. Please edit it with your values.');
    } else {
        console.log('❌ .env.example not found. Creating basic .env...');
        const basicEnv = `# Google Sheets Configuration
GOOGLE_SHEETS_ID=your_spreadsheet_id_here
GOOGLE_CREDENTIALS_PATH=./google-credentials.json

# Server Configuration
PORT=3000
NODE_ENV=development

# Deployment
FRONTEND_URL=http://localhost:5500
`;
        fs.writeFileSync(envPath, basicEnv);
        console.log('✅ Basic .env file created.');
    }
} else {
    console.log('✅ .env file already exists.');
}

// Check for credentials
const credsPath = path.join(__dirname, 'google-credentials.json');
if (!fs.existsSync(credsPath)) {
    console.log('\n⚠️  WARNING: google-credentials.json not found!');
    console.log('To get your credentials:');
    console.log('1. Go to Google Cloud Console');
    console.log('2. Navigate to IAM & Admin > Service Accounts');
    console.log('3. Select your service account');
    console.log('4. Go to Keys tab > Add Key > Create new key > JSON');
    console.log('5. Save as google-credentials.json in this directory\n');
} else {
    console.log('✅ Google credentials found.');
}

console.log('\n📦 Installing dependencies...');
const { execSync } = require('child_process');
execSync('npm install', { stdio: 'inherit' });

console.log('\n🚀 Setup complete!');
console.log('\nNext steps:');
console.log('1. Edit .env file with your Google Sheet ID');
console.log('2. Run: npm start');
console.log('3. Open: http://localhost:3000');
