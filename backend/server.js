const express = require('express');
const cors = require('cors'); // <--- MUST INSTALL THIS
const linkController = require('./src/controllers/linkController');

const app = express();
const PORT = process.env.PORT || 3000;

// CRITICAL: Enable CORS for your Netlify domain
app.use(cors({
    origin: '*' // Or strictly 'https://your-project-name.netlify.app'
}));

app.use(express.json());

// Routes
app.get('/api/links', linkController.getLinkStatus);

// Health Check
app.get('/health', (req, res) => res.send('Backend Active'));

app.listen(PORT, () => {
    console.log(`RF Automation Backend running on port ${PORT}`);
});
