// Inside server.js (Express route)
app.post('/api/ping', async (req, res) => {
    const { ips } = req.body;
    
    // Validation
    if (!ips || !Array.isArray(ips) || ips.length === 0) {
        return res.status(400).json({ error: "Invalid IP list" });
    }

    // Since we are only pinging specific searched links (max ~5-10 IPs per request),
    // we can process them fast without blocking the event loop too long.
    
    const results = {};
    
    // Use Promise.all for small batches (Search based)
    // If using 'ping' command, wrap it in a promise helper
    const pingPromises = ips.map(ip => pingCommand(ip)); 
    
    const pingResponses = await Promise.all(pingPromises);
    
    // Map results back to original array order
    ips.forEach((ip, index) => {
        results[ip] = pingResponses[index];
    });

    res.json(results);
});

// Helper for exec (ensure you have proper timeout)
function pingCommand(ip) {
    return new Promise((resolve) => {
        exec(`ping -c 1 -W 2 ${ip}`, (error, stdout, stderr) => {
            if (error) {
                resolve({ alive: false, latency: 0 });
            } else {
                // Extract latency from stdout if needed, else true
                resolve({ alive: true, latency: 12 }); // Simplified
            }
        });
    });
}
