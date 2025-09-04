# 🆓 Free Market Data API Setup Guide

## **Overview**
This guide will help you set up **completely free** market data APIs for your investment app. Total cost: **$0**.

---

## **🚀 Quick Start (5 minutes)**

### **Step 1: Alpha Vantage (Primary API)**
1. Go to: https://www.alphavantage.co/support/#api-key
2. Click "Get a free API key today"
3. Fill in basic info (name, email)
4. **Copy your API key** (looks like: `ABC123DEF456GHI789`)
5. **Rate limit**: 500 requests/day, 5/minute

### **Step 2: Finnhub (Backup API)**
1. Go to: https://finnhub.io/register
2. Sign up with email
3. **Copy your API key** (looks like: `c123456789abcdef`)
4. **Rate limit**: 60 requests/minute

### **Step 3: Polygon.io (Secondary Backup)**
1. Go to: https://polygon.io/
2. Click "Get Started Free"
3. Sign up with email
4. **Copy your API key** (looks like: `ABC123DEF456GHI789`)
5. **Rate limit**: 5 requests/minute

---

## **📊 What You Get for FREE:**

| API | Daily Requests | Per Minute | Coverage | Best For |
|-----|----------------|-------------|----------|----------|
| **Alpha Vantage** | 500 | 5 | US stocks, forex, crypto | Primary data source |
| **Finnhub** | 86,400 | 60 | US stocks, forex | Real-time quotes |
| **Polygon** | 7,200 | 5 | US stocks, forex | Historical data |
| **Yahoo Finance** | Unlimited | Unlimited | Global markets | Fallback option |

---

## **🔑 Environment Setup**

### **1. Copy the template:**
```bash
cd backend
cp env.market-data .env
```

### **2. Edit your .env file:**
```bash
# Alpha Vantage (Primary)
ALPHA_VANTAGE_API_KEY=ABC123DEF456GHI789

# Finnhub (Backup)
FINNHUB_API_KEY=c123456789abcdef

# Polygon (Secondary backup)
POLYGON_API_KEY=ABC123DEF456GHI789

# Yahoo Finance (No key needed)
YAHOO_FINANCE_ENABLED=true
```

---

## **⚡ Smart Rate Limiting Strategy**

### **Primary Strategy: Alpha Vantage**
- **500 requests/day** = ~20 requests/hour
- **5 requests/minute** = 300 requests/hour
- **Use for**: Stock quotes, market data, company info

### **Backup Strategy: Finnhub**
- **60 requests/minute** = 3,600 requests/hour
- **Use for**: Real-time quotes when Alpha Vantage is busy

### **Fallback Strategy: Yahoo Finance**
- **Unlimited requests** (be respectful)
- **Use for**: Emergency fallback, HK market data

---

## **🎯 Data Coverage by API**

### **Alpha Vantage (Best Free Tier)**
✅ **US Stocks**: Real-time quotes, historical data  
✅ **Market Indices**: S&P 500, Dow Jones, NASDAQ  
✅ **Forex**: Major currency pairs  
✅ **Crypto**: Bitcoin, Ethereum, etc.  
✅ **Commodities**: Gold, oil, etc.  
❌ **HK Stocks**: Limited coverage  

### **Finnhub (Good Real-time)**
✅ **US Stocks**: Real-time quotes  
✅ **Market Indices**: Basic index data  
✅ **Forex**: Major pairs  
❌ **Historical Data**: Limited  
❌ **HK Stocks**: No coverage  

### **Polygon (Good Historical)**
✅ **US Stocks**: Historical data  
✅ **Market Indices**: Index data  
❌ **Real-time**: Limited  
❌ **HK Stocks**: No coverage  

### **Yahoo Finance (Global Coverage)**
✅ **US Stocks**: Full coverage  
✅ **HK Stocks**: Full coverage  
✅ **Global Markets**: Worldwide  
✅ **Real-time**: Yes  
❌ **API Stability**: Variable (web scraping)  

---

## **💡 Smart Usage Tips**

### **1. Cache Everything**
```javascript
// Cache stock quotes for 1 minute
CACHE_STOCK_QUOTES_MS=60000

// Cache company info for 24 hours
CACHE_COMPANY_INFO_MS=86400000
```

### **2. Batch Requests**
```javascript
// Instead of 5 separate requests
// Make 1 request for multiple symbols
const symbols = ['AAPL', 'GOOGL', 'MSFT'];
const batchData = await getBatchQuotes(symbols);
```

### **3. Use Fallbacks Wisely**
```javascript
// Primary: Alpha Vantage
// Backup: Finnhub  
// Emergency: Yahoo Finance
```

---

## **🚨 Rate Limit Monitoring**

### **Alpha Vantage Limits:**
- **Daily**: 500 requests
- **Per Minute**: 5 requests
- **Reset Time**: Midnight UTC

### **Finnhub Limits:**
- **Per Minute**: 60 requests
- **No daily limit**
- **Reset**: Every minute

### **Polygon Limits:**
- **Per Minute**: 5 requests
- **Daily**: 7,200 requests
- **Reset**: Midnight UTC

---

## **📱 Testing Your APIs**

### **Test Alpha Vantage:**
```bash
curl "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey=YOUR_KEY"
```

### **Test Finnhub:**
```bash
curl "https://finnhub.io/api/v1/quote?symbol=AAPL&token=YOUR_KEY"
```

### **Test Polygon:**
```bash
curl "https://api.polygon.io/v2/aggs/ticker/AAPL/prev?apikey=YOUR_KEY"
```

---

## **🔧 Troubleshooting**

### **Common Issues:**

1. **"Invalid API Key"**
   - Check if you copied the key correctly
   - Wait a few minutes after registration

2. **"Rate Limit Exceeded"**
   - Implement caching (we'll do this)
   - Use fallback APIs
   - Wait for rate limit reset

3. **"Service Unavailable"**
   - API might be down temporarily
   - Use fallback APIs
   - Check API status pages

---

## **🎯 Next Steps After Getting Keys:**

1. ✅ **Get your API keys** (5 minutes)
2. 🔧 **Set up environment variables** (2 minutes)  
3. 🚀 **Test API connections** (3 minutes)
4. 📊 **Start implementing market data services** (Next phase!)

---

## **💪 Why This Strategy Works:**

- **$0 Cost**: All APIs are completely free
- **High Reliability**: Multiple fallback options
- **Good Coverage**: US + HK markets covered
- **Smart Caching**: Minimizes API calls
- **Professional Quality**: Production-ready setup

---

## **🎉 You're Ready!**

Once you have your API keys, you'll be able to:
- Fetch real-time stock prices
- Get market data for US and HK markets
- Build professional investment dashboards
- Track portfolios with live data
- All for **$0 cost**!

**Need help with any of these steps?** Let me know!
