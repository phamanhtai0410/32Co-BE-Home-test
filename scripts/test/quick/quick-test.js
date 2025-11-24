const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Color output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function quickTest() {
  log('\n🚀 Quick E-commerce API Test\n', colors.yellow);

  try {
    // 1. Test API is running
    log('1. Checking if API is running...', colors.cyan);
    await axios.get(`${BASE_URL}/products`);
    log('   ✓ API is running on port 3000', colors.green);

    // 2. Test login
    log('\n2. Testing authentication...', colors.cyan);
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'customer@example.com',
      password: 'customer123',
    });
    const token = loginResponse.data.access_token;
    log('   ✓ Successfully logged in', colors.green);

    // 3. Test getting products
    log('\n3. Testing product retrieval...', colors.cyan);
    const productsResponse = await axios.get(`${BASE_URL}/products?page=1&limit=5`);
    log(`   ✓ Found ${productsResponse.data.data?.length || 0} products`, colors.green);

    // 4. Test getting categories
    log('\n4. Testing category retrieval...', colors.cyan);
    const categoriesResponse = await axios.get(`${BASE_URL}/categories`);
    log(`   ✓ Found ${categoriesResponse.data.length} categories`, colors.green);

    // 5. Test cart access
    log('\n5. Testing cart access...', colors.cyan);
    const cartResponse = await axios.get(`${BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    log('   ✓ Successfully accessed cart', colors.green);

    // 6. Test orders access
    log('\n6. Testing orders access...', colors.cyan);
    const ordersResponse = await axios.get(`${BASE_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    log(`   ✓ Found ${ordersResponse.data.length} orders`, colors.green);

    // Summary
    log('\n' + '='.repeat(50), colors.green);
    log('✓ All basic checks passed!', colors.green);
    log('='.repeat(50), colors.green);
    log('\nYour API appears to be working correctly!', colors.cyan);
    log('Run "yarn test:api" for comprehensive tests.\n', colors.yellow);
  } catch (error) {
    log('\n✗ Test failed!', colors.red);
    if (error.response) {
      log(`   Status: ${error.response.status}`, colors.red);
      log(`   Error: ${JSON.stringify(error.response.data)}`, colors.red);
    } else if (error.request) {
      log('   Could not connect to the API', colors.red);
      log('   Make sure the API is running on http://localhost:3000', colors.yellow);
      log('   Run: yarn start:dev', colors.yellow);
    } else {
      log(`   Error: ${error.message}`, colors.red);
    }
    process.exit(1);
  }
}

quickTest();
