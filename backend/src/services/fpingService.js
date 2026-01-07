const { exec } = require('child_process');

class FpingService {
    
    // Scan all IPs using standard system ping with batching
    async runBulkPing(ipList) {
        if (!ipList || ipList.length === 0) return {};

        console.log(`🚀 Starting ping check for ${ipList.length} IPs using standard Ping...`);
        const results = {};
        
        // Process in batches of 50 to prevent system overload
        // (1000+ IPs will take approx 25-30 seconds)
        const BATCH_SIZE = 50; 
        
        for (let i = 0; i < ipList.length; i += BATCH_SIZE) {
            const batch = ipList.slice(i, i + BATCH_SIZE);
            // Run this batch in parallel and wait for all to finish
            await Promise.all(batch.map(ip => this.pingSingle(ip, results)));
        }
        
        return results;
    }

    // Ping a single IP and store result
    pingSingle(ip, results) {
        return new Promise((resolve) => {
            // Linux ping command:
            // -c 1 : Send only 1 packet
            // -W 1 : Wait max 1 second for reply
            const command = `ping -c 1 -W 1 ${ip}`;
            
            exec(command, (error, stdout, stderr) => {
                // If error is null, exit code was 0 (Success/Alive)
                const isAlive = !error; 
                
                let latency = null;
                if (isAlive) {
                    // Extract time=XX.X ms from output
                    const match = stdout.match(/time=([\d.]+)\s*ms/);
                    if (match) latency = parseFloat(match[1]);
                }

                results[ip] = {
                    alive: isAlive,
                    loss: isAlive ? 0 : 100,
                    latency: latency
                };
                resolve();
            });
        });
    }
}

module.exports = new FpingService();
