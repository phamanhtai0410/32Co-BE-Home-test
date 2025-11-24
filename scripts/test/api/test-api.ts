/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unused-vars */
import axios, { AxiosInstance } from 'axios';

// Configuration
const BASE_URL = 'http://localhost:3000';
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Test data storage
let customerToken = '';
let adminToken = '';
let categoryId = '';
let productId = '';
let cartItemId = '';
let orderId = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Helper functions
function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message: string) {
  log(`✓ ${message}`, colors.green);
}

function error(message: string) {
  log(`✗ ${message}`, colors.red);
}

function info(message: string) {
  log(`ℹ ${message}`, colors.cyan);
}

function section(message: string) {
  log(`\n${'='.repeat(60)}`, colors.blue);
  log(message, colors.blue);
  log('='.repeat(60), colors.blue);
}

async function testEndpoint(
  name: string,
  testFn: () => Promise<any>,
  expectedStatus: number = 200,
): Promise<any> {
  try {
    const result = await testFn();
    if (result.status === expectedStatus) {
      success(`${name} - Status: ${result.status}`);
      success(`${name} - Data: ${JSON.stringify(result.data)}`);
      return result.data;
    } else {
      error(`${name} - Expected ${expectedStatus}, got ${result.status}`);
      return null;
    }
  } catch (err) {
    const error_obj = err as {
      response?: { status: number; data: any };
      message?: string;
    };
    if (error_obj.response) {
      error(
        `${name} - Failed with status ${error_obj.response.status}: ${JSON.stringify(error_obj.response.data)}`,
      );
    } else {
      error(`${name} - Error: ${error_obj.message || 'Unknown error'}`);
    }
    return null;
  }
}

// Test functions
async function testAuthRegistration() {
  section('TESTING AUTHENTICATION - REGISTRATION');

  // Test customer registration
  info('Registering customer user...');
  const customerData = await testEndpoint(
    'Register Customer',
    () =>
      api.post('/auth/register', {
        email: `customer_${Date.now()}@test.com`,
        password: 'customer123',
        name: 'Test Customer',
      }),
    201,
  );

  // Test admin registration (you may need to manually create admin in DB)
  info('Registering admin user...');
  const adminData = await testEndpoint(
    'Register Admin',
    () =>
      api.post('/auth/register', {
        email: `admin_${Date.now()}@test.com`,
        password: 'admin123',
        name: 'Test Admin',
        role: 'admin',
      }),
    201,
  );

  // Test duplicate email
  info('Testing duplicate email (should fail)...');
  await testEndpoint(
    'Register Duplicate Email (Expected to fail)',
    () =>
      api.post('/auth/register', {
        email: customerData?.user?.email || 'test@test.com',
        password: 'password123',
        name: 'Duplicate User',
      }),
    409,
  );

  return { customerData, adminData };
}

async function testAuthLogin() {
  section('TESTING AUTHENTICATION - LOGIN');

  // Login as customer
  info('Logging in as customer...');
  try {
    const response = await api.post('/auth/login', {
      email: 'customer@example.com',
      password: 'customer123',
    });

    if (response.data?.access_token) {
      customerToken = response.data.access_token as string;
      success(`Login Customer - Status: ${response.status}`);
      success(`Customer token obtained: ${customerToken.substring(0, 20)}...`);
    }
  } catch (err) {
    const error_obj = err as { message?: string };
    error(`Login Customer failed: ${error_obj.message || 'Unknown error'}`);
  }

  // Login as admin
  info('Logging in as admin...');
  try {
    const response = await api.post('/auth/login', {
      email: 'admin@example.com',
      password: 'admin123',
    });

    if (response.data?.access_token) {
      adminToken = response.data.access_token as string;
      success(`Login Admin - Status: ${response.status}`);
      success(`Admin token obtained: ${adminToken.substring(0, 20)}...`);
    }
  } catch (err) {
    const error_obj = err as { message?: string };
    error(`Login Admin failed: ${error_obj.message || 'Unknown error'}`);
  }

  // Test invalid credentials
  info('Testing invalid credentials (should fail)...');
  await testEndpoint(
    'Login Invalid Credentials (Expected to fail)',
    () =>
      api.post('/auth/login', {
        email: 'invalid@test.com',
        password: 'wrongpassword',
      }),
    401,
  );
}

async function testCategories() {
  section('TESTING CATEGORIES');

  // Create category (Admin only)
  info('Creating category as admin...');
  const category = await testEndpoint(
    'Create Category',
    () =>
      api.post(
        '/categories',
        {
          name: `Test Category ${Date.now()}`,
          description: 'Test category description',
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      ),
    201,
  );

  if (category?.id) {
    categoryId = category.id as string;
    success(`Category created with ID: ${categoryId}`);
  }

  // Try to create category as customer (should fail)
  info('Trying to create category as customer (should fail)...');
  await testEndpoint(
    'Create Category as Customer (Expected to fail)',
    () =>
      api.post(
        '/categories',
        {
          name: `Unauthorized Category ${Date.now()}`,
          description: 'Should not be created',
        },
        {
          headers: { Authorization: `Bearer ${customerToken}` },
        },
      ),
    403,
  );

  // Get all categories (public)
  info('Fetching all categories (public)...');
  const categories = await testEndpoint('Get All Categories', () =>
    api.get('/categories'),
  );

  if (categories && Array.isArray(categories)) {
    success(`Found ${categories.length} categories`);
  }

  // Get category by ID
  if (categoryId) {
    info('Fetching category by ID...');
    await testEndpoint('Get Category by ID', () =>
      api.get(`/categories/${categoryId}`),
    );
  }

  // Update category (Admin only)
  if (categoryId) {
    info('Updating category as admin...');
    await testEndpoint('Update Category', () =>
      api.patch(
        `/categories/${categoryId}`,
        {
          description: 'Updated description',
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      ),
    );
  }
}

async function testProducts() {
  section('TESTING PRODUCTS');

  // Create product (Admin only)
  info('Creating product as admin...');
  const product = await testEndpoint(
    'Create Product',
    () =>
      api.post(
        '/products',
        {
          name: `Test Product ${Date.now()}`,
          description: 'Test product description',
          price: 99.99,
          stockQuantity: 100,
          categoryId: categoryId,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      ),
    201,
  );

  if (product?.id) {
    productId = product.id as string;
    success(`Product created with ID: ${productId}`);
  }

  // Try to create product as customer (should fail)
  info('Trying to create product as customer (should fail)...');
  await testEndpoint(
    'Create Product as Customer (Expected to fail)',
    () =>
      api.post(
        '/products',
        {
          name: `Unauthorized Product ${Date.now()}`,
          description: 'Should not be created',
          price: 50.0,
          stockQuantity: 10,
          categoryId: categoryId,
        },
        {
          headers: { Authorization: `Bearer ${customerToken}` },
        },
      ),
    403,
  );

  // Get all products (public)
  info('Fetching all products with pagination...');
  const products = await testEndpoint('Get All Products', () =>
    api.get('/products?page=1&limit=10'),
  );

  if (products) {
    success(`Products retrieved with pagination`);
  }

  // Get products with filters
  info('Fetching products with filters...');
  await testEndpoint('Get Products with Filters', () =>
    api.get(`/products?categoryId=${categoryId}&minPrice=50&maxPrice=150`),
  );

  // Get product by ID
  if (productId) {
    info('Fetching product by ID...');
    await testEndpoint('Get Product by ID', () =>
      api.get(`/products/${productId}`),
    );
  }

  // Update product (Admin only)
  if (productId) {
    info('Updating product as admin...');
    await testEndpoint('Update Product', () =>
      api.patch(
        `/products/${productId}`,
        {
          price: 89.99,
          stockQuantity: 150,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      ),
    );
  }
}

async function testCart() {
  section('TESTING CART');

  // Get cart (should be empty initially)
  info('Fetching cart...');
  const cart = await testEndpoint('Get Cart', () =>
    api.get('/cart', {
      headers: { Authorization: `Bearer ${customerToken}` },
    }),
  );

  // Add product to cart
  if (productId) {
    info('Adding product to cart...');
    info(`Product ID to add: ${productId}`);
    const cartItem = await testEndpoint(
      'Add to Cart',
      () =>
        api.post(
          '/cart/items',
          {
            productId: productId,
            quantity: 2,
          },
          {
            headers: { Authorization: `Bearer ${customerToken}` },
          },
        ),
      201,
    );

    if (
      cartItem?.items &&
      Array.isArray(cartItem.items) &&
      cartItem.items.length > 0
    ) {
      cartItemId = cartItem.items[0].id as string;
      success(`Item added to cart with ID: ${cartItemId}`);
    }
  }

  // Try to add with insufficient stock (should fail)
  if (productId) {
    info('Trying to add more items than available stock (should fail)...');
    await testEndpoint(
      'Add to Cart - Insufficient Stock (Expected to fail)',
      () =>
        api.post(
          '/cart/items',
          {
            productId: productId,
            quantity: 10000,
          },
          {
            headers: { Authorization: `Bearer ${customerToken}` },
          },
        ),
      400,
    );
  }

  // Update cart item quantity
  if (cartItemId) {
    info('Updating cart item quantity...');
    await testEndpoint('Update Cart Item', () =>
      api.patch(
        `/cart/items/${cartItemId}`,
        {
          quantity: 3,
        },
        {
          headers: { Authorization: `Bearer ${customerToken}` },
        },
      ),
    );
  }

  // Get cart again to see updated items
  info('Fetching cart after updates...');
  await testEndpoint('Get Cart After Updates', () =>
    api.get('/cart', {
      headers: { Authorization: `Bearer ${customerToken}` },
    }),
  );
}

async function testOrders() {
  section('TESTING ORDERS');

  // Create order from cart
  info('Creating order from cart...');
  const order = await testEndpoint(
    'Create Order',
    () =>
      api.post(
        '/orders',
        {},
        {
          headers: { Authorization: `Bearer ${customerToken}` },
        },
      ),
    201,
  );

  if (order?.id) {
    orderId = order.id as string;
    success(`Order created with ID: ${orderId}`);
    success(`Order total: $${order.totalPrice as number}`);
  }

  // Try to create order with empty cart (should fail)
  info('Trying to create order with empty cart (should fail)...');
  await testEndpoint(
    'Create Order with Empty Cart (Expected to fail)',
    () =>
      api.post(
        '/orders',
        {},
        {
          headers: { Authorization: `Bearer ${customerToken}` },
        },
      ),
    400,
  );

  // Get all orders (customer sees only their orders)
  info('Fetching customer orders...');
  const customerOrders = await testEndpoint('Get Customer Orders', () =>
    api.get('/orders', {
      headers: { Authorization: `Bearer ${customerToken}` },
    }),
  );

  if (customerOrders && Array.isArray(customerOrders)) {
    success(`Customer has ${customerOrders.length} order(s)`);
  }

  // Get order by ID
  if (orderId) {
    info('Fetching order by ID...');
    await testEndpoint('Get Order by ID', () =>
      api.get(`/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      }),
    );
  }

  // Get my-orders endpoint
  info('Fetching orders via my-orders endpoint...');
  await testEndpoint('Get My Orders', () =>
    api.get('/orders/my-orders', {
      headers: { Authorization: `Bearer ${customerToken}` },
    }),
  );

  // Admin gets all orders
  info('Fetching all orders as admin...');
  const allOrders = await testEndpoint('Get All Orders (Admin)', () =>
    api.get('/orders', {
      headers: { Authorization: `Bearer ${adminToken}` },
    }),
  );

  if (allOrders && Array.isArray(allOrders)) {
    success(`Admin sees ${allOrders.length} total order(s)`);
  }
}

async function testStockManagement() {
  section('TESTING STOCK MANAGEMENT');

  // Check product stock before order
  info('Checking product stock...');
  const productBefore = await testEndpoint('Get Product Stock Before', () =>
    api.get(`/products/${productId}`),
  );

  if (productBefore) {
    success(`Product stock before: ${productBefore.stockQuantity as number}`);
  }

  // Add to cart and create order to test stock deduction
  if (productId) {
    info('Adding product to cart for stock test...');
    await testEndpoint(
      'Add to Cart for Stock Test',
      () =>
        api.post(
          '/cart/items',
          {
            productId: productId,
            quantity: 5,
          },
          {
            headers: { Authorization: `Bearer ${customerToken}` },
          },
        ),
      201,
    );

    info('Creating order to test stock deduction...');
    await testEndpoint(
      'Create Order for Stock Test',
      () =>
        api.post(
          '/orders',
          {},
          {
            headers: { Authorization: `Bearer ${customerToken}` },
          },
        ),
      201,
    );

    // Check product stock after order
    info('Checking product stock after order...');
    const productAfter = await testEndpoint('Get Product Stock After', () =>
      api.get(`/products/${productId}`),
    );

    if (productAfter) {
      success(`Product stock after: ${productAfter.stockQuantity as number}`);
      if (
        productBefore &&
        (productAfter.stockQuantity as number) <
          (productBefore.stockQuantity as number)
      ) {
        success('Stock was correctly deducted after order!');
      }
    }
  }
}

async function testCartCleanup() {
  section('TESTING CART CLEANUP');

  // Add item to cart
  if (productId) {
    info('Adding product to cart...');
    await testEndpoint(
      'Add to Cart',
      () =>
        api.post(
          '/cart/items',
          {
            productId: productId,
            quantity: 1,
          },
          {
            headers: { Authorization: `Bearer ${customerToken}` },
          },
        ),
      201,
    );
  }

  // Remove specific item from cart
  const cart = await testEndpoint('Get Cart', () =>
    api.get('/cart', {
      headers: { Authorization: `Bearer ${customerToken}` },
    }),
  );

  if (cart?.items && Array.isArray(cart.items) && cart.items.length > 0) {
    const itemToRemove = cart.items[0].id as string;
    info('Removing specific item from cart...');
    await testEndpoint('Remove Cart Item', () =>
      api.delete(`/cart/items/${itemToRemove}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      }),
    );
  }

  // Add item again and clear entire cart
  if (productId) {
    info('Adding product to cart again...');
    await testEndpoint(
      'Add to Cart',
      () =>
        api.post(
          '/cart/items',
          {
            productId: productId,
            quantity: 1,
          },
          {
            headers: { Authorization: `Bearer ${customerToken}` },
          },
        ),
      201,
    );
  }

  info('Clearing entire cart...');
  await testEndpoint('Clear Cart', () =>
    api.delete('/cart', {
      headers: { Authorization: `Bearer ${customerToken}` },
    }),
  );

  // Verify cart is empty
  info('Verifying cart is empty...');
  const emptyCart = await testEndpoint('Get Empty Cart', () =>
    api.get('/cart', {
      headers: { Authorization: `Bearer ${customerToken}` },
    }),
  );

  if (emptyCart?.items && emptyCart.items.length === 0) {
    success('Cart is empty as expected!');
  }
}

async function testDeleteOperations() {
  section('TESTING DELETE OPERATIONS');

  // Delete product (Admin only)
  if (productId) {
    info('Trying to delete product as customer (should fail)...');
    await testEndpoint(
      'Delete Product as Customer (Expected to fail)',
      () =>
        api.delete(`/products/${productId}`, {
          headers: { Authorization: `Bearer ${customerToken}` },
        }),
      403,
    );

    info('Deleting product as admin...');
    await testEndpoint('Delete Product as Admin', () =>
      api.delete(`/products/${productId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      }),
    );
  }

  // Delete category (Admin only)
  if (categoryId) {
    info('Deleting category as admin...');
    await testEndpoint('Delete Category as Admin', () =>
      api.delete(`/categories/${categoryId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      }),
    );
  }
}

// Main test runner
async function runAllTests() {
  log('\n🚀 Starting E-commerce API Tests', colors.yellow);
  log(`📍 Testing against: ${BASE_URL}\n`, colors.yellow);

  try {
    // Test authentication
    await testAuthRegistration();
    await testAuthLogin();

    // Test categories
    await testCategories();

    // Test products
    await testProducts();

    // Test cart operations
    await testCart();

    // Test order creation
    await testOrders();

    // Test stock management
    await testStockManagement();

    // Test cart cleanup
    await testCartCleanup();

    // Test delete operations
    await testDeleteOperations();

    section('TEST SUMMARY');
    success('All tests completed! Check the output above for details.');
    info(`\nMake sure your API is running on ${BASE_URL}`);
    info('You can also test via Swagger UI at http://localhost:3000/api');
  } catch (err) {
    const error_obj = err as { message?: string };
    error(
      `\nFatal error during tests: ${error_obj.message || 'Unknown error'}`,
    );
    process.exit(1);
  }
}

// Run tests
void runAllTests();
