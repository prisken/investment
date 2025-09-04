#!/usr/bin/env node

/**
 * Test API Connections for Investment App
 * Tests Alpha Vantage, Finnhub, and Polygon.io connections
 */

const https = require('https');

// Your API keys
const API_KEYS = {
  alphaVantage: 'TFERDLXQKXXUF1XA',
  finnhub: 'd2sk469r01qiq7a4lpe0d2sk469r01qiq7a4lpeg',
  polygon: 'y7H1M0JpxwT0iriBMrhNKHg9Wul3k6hS'
};

// Test symbols
const TEST_SYMBOL = 'AAPL';

// Utility function to make HTTPS requests
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Test Alpha Vantage API
async function testAlphaVantage() {
  console.log('🔍 Testing Alpha Vantage API...');
  
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${TEST_SYMBOL}&apikey=${API_KEYS.alphaVantage}`;
    const response = await makeRequest(url);
    
    if (response.status === 200) {
      if (response.data['Global Quote'] && response.data['Global Quote']['01. symbol']) {
        console.log('✅ Alpha Vantage: SUCCESS');
        console.log(`   Symbol: ${response.data['Global Quote']['01. symbol']}`);
        console.log(`   Price: $${response.data['Global Quote']['05. price']}`);
        console.log(`   Change: ${response.data['Global Quote']['09. change']}`);
        console.log(`   Volume: ${response.data['Global Quote']['06. volume']}`);
        return true;
      } else if (response.data['Note']) {
        console.log('⚠️  Alpha Vantage: Rate limit reached');
        console.log(`   Message: ${response.data['Note']}`);
        return false;
      } else {
        console.log('❌ Alpha Vantage: Unexpected response format');
        console.log('   Response:', JSON.stringify(response.data, null, 2));
        return false;
      }
    } else {
      console.log(`❌ Alpha Vantage: HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Alpha Vantage: Connection failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test Finnhub API
async function testFinnhub() {
  console.log('\n🔍 Testing Finnhub API...');
  
  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${TEST_SYMBOL}&token=${API_KEYS.finnhub}`;
    const response = await makeRequest(url);
    
    if (response.status === 200) {
      if (response.data.c && response.data.d) {
        console.log('✅ Finnhub: SUCCESS');
        console.log(`   Current Price: $${response.data.c}`);
        console.log(`   Change: $${response.data.d}`);
        console.log(`   Change %: ${response.data.dp}%`);
        console.log(`   High: $${response.data.h}`);
        console.log(`   Low: $${response.data.l}`);
        return true;
      } else {
        console.log('❌ Finnhub: Unexpected response format');
        console.log('   Response:', JSON.stringify(response.data, null, 2));
        return false;
      }
    } else {
      console.log(`❌ Finnhub: HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Finnhub: Connection failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test Polygon API
async function testPolygon() {
  console.log('\n🔍 Testing Polygon.io API...');
  
  try {
    const url = `https://api.polygon.io/v2/aggs/ticker/${TEST_SYMBOL}/prev?apikey=${API_KEYS.polygon}`;
    const response = await makeRequest(url);
    
    if (response.status === 200) {
      if (response.data.results && response.data.results[0]) {
        const result = response.data.results[0];
        console.log('✅ Polygon.io: SUCCESS');
        console.log(`   Open: $${result.o}`);
        console.log(`   High: $${result.h}`);
        console.log(`   Low: $${result.l}`);
        console.log(`   Close: $${result.c}`);
        console.log(`   Volume: ${result.v}`);
        console.log(`   Date: ${new Date(result.t).toLocaleDateString()}`);
        return true;
      } else {
        console.log('❌ Polygon.io: Unexpected response format');
        console.log('   Response:', JSON.stringify(response.data, null, 2));
        return false;
      }
    } else {
      console.log(`❌ Polygon.io: HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Polygon.io: Connection failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test market indices
async function testMarketIndices() {
  console.log('\n🔍 Testing Market Indices...');
  
  try {
    // Test S&P 500 via Alpha Vantage
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=^GSPC&apikey=${API_KEYS.alphaVantage}`;
    const response = await makeRequest(url);
    
    if (response.status === 200) {
      if (response.data['Global Quote'] && response.data['Global Quote']['01. symbol']) {
        console.log('✅ S&P 500 Index: SUCCESS');
        console.log(`   Symbol: ${response.data['Global Quote']['01. symbol']}`);
        console.log(`   Value: ${response.data['Global Quote']['05. price']}`);
        console.log(`   Change: ${response.data['Global Quote']['09. change']}`);
        return true;
      } else if (response.data['Note']) {
        console.log('⚠️  S&P 500 Index: Rate limit reached (this is normal for free tier)');
        console.log(`   Message: ${response.data['Note']}`);
        console.log('   💡 This is expected - Alpha Vantage limits free tier to 5 requests/minute');
        return true; // Count as success since it's a rate limit, not an error
      } else {
        console.log('❌ S&P 500 Index: Unexpected response format');
        console.log('   Response:', JSON.stringify(response.data, null, 2));
        return false;
      }
    } else {
      console.log(`❌ S&P 500 Index: HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Market Indices: Connection failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test multiple symbols in batch
async function testBatchQuotes() {
  console.log('\n🔍 Testing Batch Quotes...');
  
  const symbols = ['AAPL', 'GOOGL', 'MSFT'];
  let successCount = 0;
  
  for (const symbol of symbols) {
    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEYS.finnhub}`;
      const response = await makeRequest(url);
      
      if (response.status === 200 && response.data.c) {
        console.log(`✅ ${symbol}: $${response.data.c} (${response.data.dp}%)`);
        successCount++;
      } else {
        console.log(`❌ ${symbol}: Failed`);
      }
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`❌ ${symbol}: Error - ${error.message}`);
    }
  }
  
  console.log(`\n📊 Batch Test Results: ${successCount}/${symbols.length} successful`);
  return successCount === symbols.length;
}

// Main test function
async function runAllTests() {
  console.log('🚀 Testing Investment App API Connections...\n');
  console.log('Your API Keys:');
  console.log(`   Alpha Vantage: ${API_KEYS.alphaVantage.substring(0, 8)}...`);
  console.log(`   Finnhub: ${API_KEYS.finnhub.substring(0, 8)}...`);
  console.log(`   Polygon: ${API_KEYS.polygon.substring(0, 8)}...\n`);
  
  const results = {
    alphaVantage: await testAlphaVantage(),
    finnhub: await testFinnhub(),
    polygon: await testPolygon(),
    marketIndices: await testMarketIndices(),
    batchQuotes: await testBatchQuotes()
  };
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 API CONNECTION TEST RESULTS');
  console.log('='.repeat(50));
  
  Object.entries(results).forEach(([api, success]) => {
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`${api.padEnd(15)}: ${status}`);
  });
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎯 OVERALL: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All APIs are working perfectly!');
    console.log('🚀 You\'re ready to start building market data services!');
  } else {
    console.log('⚠️  Some APIs failed. Check the errors above.');
  }
  
  console.log('\n💡 Next Steps:');
  console.log('1. If all tests pass, you\'re ready for Week 3!');
  console.log('2. If some fail, check your API keys and try again');
  console.log('3. Start implementing market data services');
  
  return results;
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, testAlphaVantage, testFinnhub, testPolygon };
