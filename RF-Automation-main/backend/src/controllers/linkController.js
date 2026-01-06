const googleSheetService = require('../services/googleSheetService');
const fpingService = require('../services/fpingService');

exports.getLinkStatus = async (req, res) => {
    try {
        // 1. Fetch Inventory from Google Sheet
        const inventory = await googleSheetService.getInventory(); // Returns array of Link Objects
        
        // 2. Extract all Unique IPs to ping
        const uniqueIPs = new Set();
        inventory.forEach(link => {
            if(link.Client_IP) uniqueIPs.add(link.Client_IP);
            if(link.Base_IP) uniqueIPs.add(link.Base_IP);
            if(link.Gateway_IP) uniqueIPs.add(link.Gateway_IP);
            if(link.Loopback_IP) uniqueIPs.add(link.Loopback_IP);
        });

        // 3. Run Bulk fping
        const pingResults = await fpingService.runBulkPing(Array.from(uniqueIPs));

        // 4. Diagnose each link (The Core Logic)
        const monitoredLinks = inventory.map(link => {
            return {
                ...link,
                diagnosis: diagnoseLink(link, pingResults)
            };
        });

        // 5. Group by POP for Frontend
        const grouped = monitoredLinks.reduce((acc, link) => {
            (acc[link.POP_Name] = acc[link.POP_Name] || []).push(link);
            return acc;
        }, {});

        res.json(grouped);

    } catch (error) {
        console.error("NOC Automation Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// CORE DIAGNOSIS LOGIC
function diagnoseLink(link, pingResults) {
    // Get Ping Status for each hop
    const rClient = pingResults[link.Client_IP] || { alive: false };
    const rBase = pingResults[link.Base_IP] || { alive: false };
    const rGateway = pingResults[link.Gateway_IP] || { alive: false };
    const rLoop = pingResults[link.Loopback_IP] || { alive: false };

    // Logic Tree
    if (rClient.alive) {
        return {
            status: 'UP',
            color: 'green',
            message: 'Link Healthy',
            latency: rClient.latency
        };
    }
    
    if (rBase.alive) {
        return {
            status: 'DEGRADED',
            color: 'orange', // Issue is at remote site only
            message: 'Client Radio Down (Check Remote Power/Config)',
            failedHop: 'Client IP'
        };
    }
    
    if (rGateway.alive) {
        return {
            status: 'DOWN',
            color: 'red',
            message: 'Base Radio / Switch Fault',
            failedHop: 'Base IP'
        };
    }
    
    if (rLoop.alive) {
        return {
            status: 'CRITICAL',
            color: 'darkred',
            message: 'Gateway Router / Backbone Link Issue',
            failedHop: 'Gateway IP'
        };
    }

    return {
        status: 'CRITICAL',
        color: 'black',
        message: 'Site Power Failure or Uplink Total Loss',
        failedHop: 'All'
    };
}
