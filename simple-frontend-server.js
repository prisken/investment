const express = require('express');
const path = require('path');
const app = express();
const PORT = 8081;

// Serve static files
app.use(express.static('.'));

// Serve the React Native app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'real-time-demo.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Frontend server running',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Frontend server running on http://localhost:${PORT}`);
    console.log(`📱 Real-time market data demo available at http://localhost:${PORT}`);
    console.log(`🔗 Backend API: http://localhost:3000`);
    console.log(`📊 Click "Fetch Live Market Data" to see real-time data!`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down frontend server...');
    process.exit(0);
});


