const googleSheetService = require('../services/googleSheetService');
const fpingService = require('../services/fpingService');

// CACHE STORAGE
let cache = {
    data: null,
    lastFetch: 0
};

exports.getLinkStatus = async (req, res) => {
    try {
        const now = Date.now();
        const CACHE_DURATION = 60 * 1000; // 60 Seconds

        // 1. USE CACHE IF VALID (Prevents Google API overload)
        if (cache.data && (now - cache.lastFetch < CACHE_DURATION)) {
            console.log('⚡ Serving data from cache');
            return res.json(cache.data);
        }

        console.log('1. Fetching inventory from Google Sheets...');
        const inventory = await googleSheetService.getInventory();
        
        if (!inventory || inventory.length === 0) {
            return res.json({});
        }

        // 2. Preparing IPs
        const ipSet = new Set();
        inventory.forEach(item => {
            if (item.Client_IP) ipSet.add(item.Client_IP);
            if (item.Base_IP) ipSet.add(item.Base_IP);
            if (item.Gateway_IP) ipSet.add(item.Gateway_IP);
            if (item.Loopback_IP && item.Loopback_IP !== 'N/A') ipSet.add(item.Loopback_IP);
        });

        const ipList = Array.from(ipSet).filter(ip => ip && ip.match(/^\d+\.\d+\.\d+\.\d+$/));
        console.log(`   Running ping on ${ipList.length} unique IPs...`);

        // 3. Run Pings
        const pingResults = await fpingService.runBulkPing(ipList);

        // 4. Group Results
        console.log('3. Analyzing results & grouping by POP...');
        const groupedData = {};

        inventory.forEach(link => {
            const clientStatus = pingResults[link.Client_IP] || { alive: false };
            const baseStatus = pingResults[link.Base_IP] || { alive: false };
            const gatewayStatus = pingResults[link.Gateway_IP] || { alive: false };
            
            let status = 'DOWN';
            let color = 'red';
            let message = 'Complete outage';

            if (clientStatus.alive) {
                status = 'UP';
                color = 'green';
                message = 'Link Operational';
            } else if (baseStatus.alive) {
                status = 'DOWN';
                color = 'orange';
                message = 'Base up, Client down';
            } else if (gatewayStatus.alive) {
                status = 'CRITICAL';
                color = 'red';
                message = 'Base Station down';
            } else {
                message = 'Gateway/Backhaul down';
            }

            const diagnosis = {
                status,
                color,
                message,
                latency: clientStatus.latency
            };

            const popName = link.POP_Name || 'Unknown POP';
            if (!groupedData[popName]) {
                groupedData[popName] = [];
            }

            groupedData[popName].push({ ...link, diagnosis });
        });

        // 5. UPDATE CACHE
        cache.data = groupedData;
        cache.lastFetch = now;

        console.log(`✅ Sending status for ${Object.keys(groupedData).length} POPs`);
        res.json(groupedData);

    } catch (error) {
        console.error('❌ Error in getLinkStatus:', error.message);
        // Serve old cache if Google fails
        if (cache.data) {
            console.log('⚠️ Serving stale cache due to error');
            return res.json(cache.data);
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
