exports.getLinkStatus = async (req, res) => {
    try {
        console.log('Fetching radio links from Google Sheets...');
        
        // Mock data for testing
        const mockData = {
            "POP-1": [
                {
                    "Client_Name": "Test Site A",
                    "Client_IP": "192.168.1.100",
                    "Link_ID": "LNK-001",
                    "Base_IP": "10.0.0.1",
                    "Gateway_IP": "10.0.0.254",
                    "Loopback_IP": "127.0.0.1",
                    "diagnosis": {
                        "status": "UP",
                        "message": "All hops responding",
                        "color": "green",
                        "latency": "45ms"
                    }
                }
            ],
            "POP-2": [
                {
                    "Client_Name": "Test Site B",
                    "Client_IP": "192.168.1.101",
                    "Link_ID": "LNK-002",
                    "Base_IP": "10.0.0.2",
                    "Gateway_IP": "10.0.0.253",
                    "Loopback_IP": "127.0.0.1",
                    "diagnosis": {
                        "status": "DOWN",
                        "message": "No response from gateway",
                        "color": "red",
                        "latency": null,
                        "failedHop": "Gateway"
                    }
                }
            ]
        };
        
        res.json(mockData);
        
    } catch (error) {
        console.error('Error in getLinkStatus:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
};
