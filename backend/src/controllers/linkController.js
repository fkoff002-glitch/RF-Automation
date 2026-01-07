const googleSheetService = require('../services/googleSheetService');
const fpingService = require('../services/fpingService');

// Cache inventory to avoid hitting Google Sheets too often
let inventoryCache = {
    data: [],
    lastFetch: 0
};

// 1. GET INVENTORY (No Pinging - Safe for Firewall)
exports.getInventory = async (req, res) => {
    try {
        const now = Date.now();
        // Fetch from Google only if cache is older than 5 minutes
        if (inventoryCache.data.length > 0 && (now - inventoryCache.lastFetch < 300000)) {
            return res.json(inventoryCache.data);
        }

        console.log('📄 Fetching inventory from Google Sheets...');
        const rawRows = await googleSheetService.getInventory();
        
        // Group by POP immediately for easier frontend handling
        const grouped = {};
        rawRows.forEach(row => {
            const pop = row.POP_Name || 'Unknown';
            if (!grouped[pop]) grouped[pop] = [];
            // Add a default "Unknown" diagnosis
            row.diagnosis = { status: 'PENDING', color: 'gray', message: 'Ready to Scan', latency: null };
            grouped[pop].push(row);
        });

        inventoryCache.data = grouped;
        inventoryCache.lastFetch = now;
        
        res.json(grouped);

    } catch (error) {
        console.error('❌ Inventory Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

// 2. ON-DEMAND PING (The new "Live Check" feature)
exports.runOnDemandPing = async (req, res) => {
    try {
        const { targetIPs } = req.body; // Expects array of IPs: ["10.30.x.x", "10.30.y.y"]
        
        if (!targetIPs || !Array.isArray(targetIPs) || targetIPs.length === 0) {
            return res.status(400).json({ error: "No IPs provided" });
        }

        console.log(`⚡ On-Demand Ping requested for ${targetIPs.length} IPs...`);
        
        // Use the existing service to ping just these specific IPs
        const results = await fpingService.runBulkPing(targetIPs);
        
        res.json(results);

    } catch (error) {
        console.error('❌ Ping Error:', error.message);
        res.status(500).json({ error: error.message });
    }
};
