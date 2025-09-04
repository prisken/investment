const axios = require('axios');

async function testBackend() {
  console.log('🧪 Testing Investment App Backend...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test market endpoints
    console.log('\n2. Testing market endpoints...');
    const usIndicesResponse = await axios.get('http://localhost:3000/api/market/indices/us');
    console.log('✅ US indices endpoint working');
    
    const hkIndicesResponse = await axios.get('http://localhost:3000/api/market/indices/hk');
    console.log('✅ HK indices endpoint working');
    
    // Test stock endpoints
    console.log('\n3. Testing stock endpoints...');
    const popularUSResponse = await axios.get('http://localhost:3000/api/stocks/popular/US');
    console.log('✅ Popular US stocks endpoint working');
    
    const popularHKResponse = await axios.get('http://localhost:3000/api/stocks/popular/HK');
    console.log('✅ Popular HK stocks endpoint working');
    
    console.log('\n🎉 All backend tests passed!');
    
  } catch (error) {
    console.error('\n❌ Backend test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Backend server is not running. Start it with:');
      console.log('   cd backend && npm run dev');
    }
  }
}

// Run the test
testBackend();
