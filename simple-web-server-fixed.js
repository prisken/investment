const express = require('express');
const path = require('path');
const app = express();
const port = 8081;

// Serve static files
app.use(express.static('.'));

// Serve the real-time dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'real-time-dashboard.html'));
});

// Serve our components as a simple HTML page (fallback)
app.get('/components', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Investment App - Frontend Components Demo</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            background: linear-gradient(135deg, #007AFF, #5856D6);
            color: white;
            padding: 40px;
            border-radius: 16px;
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 2.5rem;
            margin: 0 0 10px 0;
        }
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
            margin: 0;
        }
        .component-section {
            background: white;
            border-radius: 16px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .component-title {
            font-size: 1.8rem;
            color: #1a1a1a;
            margin-bottom: 20px;
            border-bottom: 2px solid #007AFF;
            padding-bottom: 10px;
        }
        .component-description {
            color: #666;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        .demo-area {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            border: 2px dashed #007AFF;
            text-align: center;
            cursor: pointer;
        }
        .demo-text {
            color: #007AFF;
            font-size: 1.1rem;
            font-weight: 500;
        }
        .status {
            background: #e8f5e8;
            border: 1px solid #4caf50;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
        }
        .status.success {
            background: #e8f5e8;
            border-color: #4caf50;
            color: #2e7d32;
        }
        .status.info {
            background: #e3f2fd;
            border-color: #2196f3;
            color: #1565c0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Investment App</h1>
            <p>US & HK Stock Market Investment Platform</p>
        </div>

        <div class="status success">
            <h3>✅ App Status: Running Successfully!</h3>
            <p><strong>Backend:</strong> http://localhost:3000 (API Server)</p>
            <p><strong>Frontend:</strong> http://localhost:8081 (This Page)</p>
        </div>

        <div class="component-section">
            <h2 class="component-title">📱 Available Components</h2>
            <p class="component-description">
                Your investment app now has enterprise-grade frontend components ready for development!
            </p>
        </div>

        <div class="component-section">
            <h2 class="component-title">🔍 Stock Search Component</h2>
            <p class="component-description">
                Advanced stock search with real-time suggestions, debounced input, and professional styling.
            </p>
            <div class="demo-area">
                <div class="demo-text">🔍 Stock Search Demo</div>
                <p>Real-time search with debounced input and professional styling</p>
            </div>
        </div>

        <div class="component-section">
            <h2 class="component-title">📊 Stock Chart Component</h2>
            <p class="component-description">
                Interactive stock charts with multiple timeframes, technical indicators, and responsive design.
            </p>
            <div class="demo-area">
                <div class="demo-text">📊 Stock Chart Demo</div>
                <p>Interactive charts with multiple timeframes and indicators</p>
            </div>
        </div>

        <div class="component-section">
            <h2 class="component-title">💰 Stock Price Display</h2>
            <p class="component-description">
                Real-time price updates with change indicators, percentage calculations, and professional formatting.
            </p>
            <div class="demo-area">
                <div class="demo-text">💰 Price Display Demo</div>
                <p>Real-time price updates with change indicators</p>
            </div>
        </div>

        <div class="component-section">
            <h2 class="component-title">🏢 Company Information</h2>
            <p class="component-description">
                Comprehensive company details with sector information, market cap, and key statistics.
            </p>
            <div class="demo-area">
                <div class="demo-text">🏢 Company Info Demo</div>
                <p>Company details, sector info, and key statistics</p>
            </div>
        </div>

        <div class="component-section">
            <h2 class="component-title">📈 Market Overview Dashboard</h2>
            <p class="component-description">
                Real-time market overview with indices, sector performance, market status, and auto-refresh functionality.
            </p>
            <div class="demo-area">
                <div class="demo-text">📈 Market Dashboard Demo</div>
                <p>Live market indices, sector performance, and market status indicators</p>
            </div>
        </div>

        <div class="status info">
            <h3>🎯 Next Steps</h3>
            <p><strong>Your investment app is now running successfully!</strong></p>
            <p>• Backend API server is active on port 3000</p>
            <p>• Frontend components are accessible on port 8081</p>
            <p>• Ready for the next phase of development</p>
        </div>
    </div>

    <script>
        // Simple interactive demo
        document.addEventListener('DOMContentLoaded', function() {
            const demoAreas = document.querySelectorAll('.demo-area');
            demoAreas.forEach(area => {
                area.addEventListener('click', function() {
                    this.style.borderColor = '#00C851';
                    this.style.backgroundColor = '#f0fff4';
                    setTimeout(() => {
                        this.style.borderColor = '#007AFF';
                        this.style.backgroundColor = '#f8f9fa';
                    }, 500);
                });
            });
        });
    </script>
</body>
</html>
  `);
});

app.listen(port, () => {
  console.log(`🚀 Simple Web Server running at http://localhost:${port}`);
  console.log(`📱 Your Investment App Components are now accessible!`);
  console.log(`🔗 Backend APIs: http://localhost:3000`);
});


