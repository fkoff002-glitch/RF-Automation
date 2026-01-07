const googleSheetService = require('../services/googleSheetService');
const fpingService = require('../services/fpingService');

exports.getLinkStatus = async (req, res) => {
    try {
        console.log('1. Fetching inventory from Google Sheets...');
        const inventory = await googleSheetService.getInventory();
        
        if (!inventory || inventory.length === 0) {
            console.log('⚠️ No links found in Google Sheet.');
            return res.json({});
        }

        // 2. Extract all IPs to ping (Client, Base, Gateway, Loopback)
        console.log('2. Preparing IPs for ping...');
        const ipSet = new Set();
        
        inventory.forEach(item => {
            if (item.Client_IP) ipSet.add(item.Client_IP);
            if (item.Base_IP) ipSet.add(item.Base_IP);
            if (item.Gateway_IP) ipSet.add(item.Gateway_IP);
            if (item.Loopback_IP && item.Loopback_IP !== 'N/A') ipSet.add(item.Loopback_IP);
        });

        const ipList = Array.from(ipSet).filter(ip => ip && ip.match(/^\d+\.\d+\.\d+\.\d+$/));
        console.log(`   Running fping on ${ipList.length} unique IPs...`);

        // 3. Run Active Diagnostics (fping)
        const pingResults = await fpingService.runBulkPing(ipList);

        // 4. Map results to Links & Group by POP
        console.log('3. Analyzing results & grouping by POP...');
        const groupedData = {};

        inventory.forEach(link => {
            const clientStatus = pingResults[link.Client_IP] || { alive: false };
            const baseStatus = pingResults[link.Base_IP] || { alive: false };
            const gatewayStatus = pingResults[link.Gateway_IP] || { alive: false };
            
            // Determine Link Status
            let status = 'DOWN';
            let color = 'red';
            let message = 'Complete outage';
            let failedHop = 'Client';

            if (clientStatus.alive) {
                status = 'UP';
                color = 'green';
                message = 'Link Operational';
                failedHop = null;
            } else if (baseStatus.alive) {
                status = 'DOWN';
                color = 'orange';
                message = 'Base up, Client down';
                failedHop = 'Client';
            } else if (gatewayStatus.alive) {
                status = 'CRITICAL';
                color = 'red';
                message = 'Base Station down';
                failedHop = 'Base';
            } else {
                message = 'Gateway/Backhaul down';
                failedHop = 'Gateway';
            }

            // Construct the diagnosis object
            const diagnosis = {
                status,
                color,
                message,
                latency: clientStatus.latency,
                failedHop
            };

            // Add to Group
            const popName = link.POP_Name || 'Unknown POP';
            if (!groupedData[popName]) {
                groupedData[popName] = [];
            }

            // Combine Inventory Data + Diagnosis
            groupedData[popName].push({
                ...link,
                diagnosis
            });
        });

        console.log(`✅ Sending status for ${Object.keys(groupedData).length} POPs`);
        res.json(groupedData);

    } catch (error) {
        console.error('❌ Error in getLinkStatus:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message
        });
    }
};
