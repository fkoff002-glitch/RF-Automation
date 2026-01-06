const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class FpingService {
    
    // Run bulk fping on all IPs found in inventory
    async runBulkPing(ipList) {
        if (ipList.length === 0) return {};

        const tempFilePath = path.join(__dirname, 'ips.txt');
        fs.writeFileSync(tempFilePath, ipList.join('\n'));

        return new Promise((resolve, reject) => {
            // Command optimized for speed (batch processing)
            const command = `fping -i 2 -t 100 -c 2 -f ${tempFilePath}`;
            
            exec(command, (error, stdout, stderr) => {
                fs.unlinkSync(tempFilePath); // Cleanup

                if (error && !stdout) {
                    return reject(error);
                }

                const results = this.parseFpingOutput(stdout);
                resolve(results);
            });
        });
    }

    // Parse fping text output into Object
    parseFpingOutput(output) {
        const lines = output.split('\n');
        const results = {};

        // Regex to extract: IP, Status, Min, Avg, Max
        const regex = /^([0-9.]+)\s+:\s+xmt\/rcv\/%loss\s+=\s+\d+\/\d+\/(\d+)%(?:.*min\/avg\/max\s+=\s+([\d.]+)\/([\d.]+)\/([\d.]+))?/;

        lines.forEach(line => {
            const match = line.match(regex);
            if (match) {
                const [, ip, loss, min, avg, max] = match;
                results[ip] = {
                    alive: loss == 0, // True if 0% loss
                    loss: parseInt(loss),
                    latency: (loss == 0 && avg) ? parseFloat(avg) : null
                };
            } else {
                // If line contains IP but failed to parse basic info (likely 100% loss)
                const simpleMatch = line.match(/^([0-9.]+)/);
                if (simpleMatch) {
                    results[simpleMatch[1]] = { alive: false, loss: 100, latency: null };
                }
            }
        });

        return results;
    }
}

module.exports = new FpingService();
