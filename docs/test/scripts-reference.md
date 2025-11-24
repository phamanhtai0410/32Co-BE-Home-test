# Test Scripts Reference

Complete technical reference for all testing scripts.

## 📋 Table of Contents

- [Overview](#overview)
- [Script Locations](#script-locations)
- [Quick Test Script](#quick-test-script)
- [Comprehensive Test Script](#comprehensive-test-script)
- [Database Seed Script](#database-seed-script)
- [Manual Test Requests](#manual-test-requests)
- [Package.json Scripts](#packagejson-scripts)

## Overview

All test scripts are located in the `/scripts` directory with a clear organizational structure:

```
scripts/
├── seed/
│   ├── README.md
│   └── seed-database.js       # Database seeding
└── test/
    ├── api/
    │   ├── README.md
    │   ├── test-api.ts         # Comprehensive tests
    │   └── test-requests.http  # Manual REST client
    └── quick/
        ├── README.md
        └── quick-test.js       # Quick smoke test
```

## Script Locations

### Absolute Paths

| Script | Path |
|--------|------|
| Quick Test | `/scripts/test/quick/quick-test.js` |
| Comprehensive Test | `/scripts/test/api/test-api.ts` |
| Database Seed | `/scripts/seed/seed-database.js` |
| Manual Requests | `/scripts/test/api/test-requests.http` |

### Yarn Commands

| Command | Script Executed |
|---------|----------------|
| `yarn test:quick` | `node scripts/test/quick/quick-test.js` |
| `yarn test:api` | `ts-node scripts/test/api/test-api.ts` |
| `yarn db:seed` | `node scripts/seed/seed-database.js` |

## Quick Test Script

### File: `scripts/test/quick/quick-test.js`

#### Purpose
Fast smoke test to verify basic API functionality.

#### Language
JavaScript (Node.js)

#### Dependencies
```json
{
  "axios": "^1.13.2"
}
```

#### Duration
~30 seconds

#### What It Tests
1. API connectivity (port 3000)
2. Authentication (login)
3. Product retrieval
4. Category retrieval
5. Cart access
6. Order access

#### Usage

```bash
# Standard run
yarn test:quick

# Direct execution
node scripts/test/quick/quick-test.js

# With output redirection
yarn test:quick > quick-test-results.log 2>&1
```

#### Configuration

```javascript
const BASE_URL = 'http://localhost:3000';  // Change if API runs on different port
```

#### Output Format

```
🚀 Quick E-commerce API Test

1. Checking if API is running...
   ✓ API is running on port 3000
2. Testing authentication...
   ✓ Successfully logged in
3. Testing product retrieval...
   ✓ Found 12 products
4. Testing category retrieval...
   ✓ Found 4 categories
5. Testing cart access...
   ✓ Successfully accessed cart
6. Testing orders access...
   ✓ Found 0 orders

==================================================
✓ All basic checks passed!
==================================================
```

#### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All tests passed |
| 1 | One or more tests failed |

#### Error Handling

```javascript
// Connection errors
if (error.request) {
  log('Could not connect to the API', colors.red);
  log('Make sure the API is running on http://localhost:3000', colors.yellow);
  process.exit(1);
}

// API errors
if (error.response) {
  log(`Status: ${error.response.status}`, colors.red);
  log(`Error: ${JSON.stringify(error.response.data)}`, colors.red);
}
```

## Comprehensive Test Script

### File: `scripts/test/api/test-api.ts`

#### Purpose
Thorough automated testing of all API endpoints and business logic.

#### Language
TypeScript (compiled via ts-node)

#### Dependencies
```json
{
  "axios": "^1.13.2",
  "@types/node": "^22.10.1",
  "typescript": "^5.7.2",
  "ts-node": "^10.9.2"
}
```

#### Duration
2-3 minutes

#### Lines of Code
750+ lines

#### Test Count
50+ individual tests

#### What It Tests

##### Authentication (5 tests)
- User registration
- Customer login
- Admin login
- Token validation
- Invalid credentials handling

##### Categories (8 tests)
- List all categories
- Get single category
- Create category (admin only)
- Update category (admin only)
- Delete category (admin only)
- Unauthorized access blocking
- Not found handling
- Invalid data validation

##### Products (15 tests)
- List with pagination
- Filter by category
- Search functionality
- Get single product
- Create product (admin only)
- Update product (admin only)
- Delete product (admin only)
- Stock management
- Price validation
- Unauthorized access blocking
- Out of stock handling
- Invalid data validation
- Pagination edge cases
- Sort and order
- Not found handling

##### Cart (10 tests)
- View empty cart
- Add items to cart
- Add multiple items
- Update quantities
- Remove items
- Insufficient stock validation
- Invalid quantity validation
- Non-existent product validation
- Cart authorization
- Total price calculation

##### Orders (12 tests)
- Create order from cart
- Empty cart order validation
- View customer orders
- Get specific order
- Admin view all orders
- Order total calculation
- Stock reduction verification
- Order status tracking
- Order items details
- User isolation
- Not found handling
- Order history pagination

##### Cleanup (2 tests)
- Delete test data
- Verify cleanup

#### Usage

```bash
# Standard run
yarn test:api

# Direct execution
ts-node scripts/test/api/test-api.ts

# Save results to file
yarn test:api > test-results.log 2>&1

# View specific sections
yarn test:api 2>&1 | grep "TESTING PRODUCTS" -A 50

# View summary only
yarn test:api 2>&1 | grep "TEST SUMMARY" -A 20
```

#### Configuration

```typescript
const BASE_URL = 'http://localhost:3000';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

#### Key Functions

##### Helper Functions
```typescript
function log(message: string, color: string = colors.reset)
function success(message: string)
function error(message: string)
function info(message: string)
function section(message: string)
```

##### Test Categories
```typescript
async function testAuthentication()
async function testCategories()
async function testProducts()
async function testCart()
async function testOrders()
async function cleanup()
```

#### Output Format

```
============================================================
  COMPREHENSIVE E-COMMERCE API TEST SUITE
============================================================

============================================================
TESTING AUTHENTICATION
============================================================
✓ Register New User - Status: 201
  User registered with ID: abc-123...
✓ Login with Customer - Status: 200
  Token received
✓ Login with Admin - Status: 200
  Admin token received

... [more sections]

============================================================
  TEST SUMMARY
============================================================
✓ Authentication: All tests passed
✓ Categories: All tests passed
✓ Products: All tests passed
✓ Cart: All tests passed
✓ Orders: All tests passed
✓ Stock Management: Verified

Total tests: 50+
Duration: ~2 minutes
```

#### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All tests completed (may have expected failures) |
| 1 | Unexpected error occurred |

#### Data Flow

```typescript
// Test data is stored globally and passed between tests
let customerToken = '';      // Used for customer endpoints
let adminToken = '';         // Used for admin endpoints
let categoryId = '';         // Category created during tests
let productId = '';          // Product created during tests
let cartItemId = '';         // Cart item for updates
let orderId = '';            // Order for retrieval tests
```

## Database Seed Script

### File: `scripts/seed/seed-database.js`

#### Purpose
Populate database with test data (users, categories, products).

#### Language
JavaScript (Node.js)

#### Dependencies
```json
{
  "bcrypt": "^5.1.1",
  "pg": "^8.13.1"
}
```

#### Duration
~5 seconds

#### What It Creates
- 2 users (admin + customer)
- 4 categories
- 12 products

#### Usage

```bash
# Standard run
yarn db:seed

# Direct execution
node scripts/seed/seed-database.js

# With custom environment
DATABASE_PORT=5432 node scripts/seed/seed-database.js
```

#### Configuration

```javascript
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5433,
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'ecommerce',
};
```

#### Database Operations

##### 1. Clear Existing Data
```javascript
await client.query('TRUNCATE TABLE order_items, orders, cart_items, carts, products, categories, users CASCADE');
```

##### 2. Hash Passwords
```javascript
const adminPassword = await bcrypt.hash('admin123', 10);
const customerPassword = await bcrypt.hash('customer123', 10);
```

##### 3. Insert Users
```javascript
await client.query(
  `INSERT INTO users (email, password, name, role, "createdAt", "updatedAt") 
   VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
  ['admin@example.com', adminPassword, 'Admin User', 'admin']
);
```

##### 4. Insert Categories
```javascript
await client.query(
  `INSERT INTO categories (name, description, "createdAt", "updatedAt") 
   VALUES ($1, $2, NOW(), NOW()) RETURNING id`,
  ['Electronics', 'Electronic devices and gadgets']
);
```

##### 5. Insert Products
```javascript
await client.query(
  `INSERT INTO products (name, description, price, stock, "categoryId", "createdAt", "updatedAt") 
   VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
  ['Laptop', 'High-performance laptop', 999.99, 50, categoryId]
);
```

#### Output Format

```
🌱 Starting database seeding...
✓ Connected to database
🗑️  Clearing existing data...
✓ Data cleared
🔐 Hashing passwords...
✓ Passwords hashed
👤 Creating users...
✓ Admin user created
✓ Customer user created
📁 Creating categories...
✓ Created category: Electronics
... [more categories]
📦 Creating products...
✓ Created product: Laptop - $999.99
... [more products]
✨ Database seeding completed successfully!
```

#### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Seeding completed successfully |
| 1 | Database connection or query error |

## Manual Test Requests

### File: `scripts/test/api/test-requests.http`

#### Purpose
REST client file for manual API testing in VS Code or similar editors.

#### Format
HTTP request format (REST Client extension)

#### Usage

**VS Code with REST Client Extension:**
1. Install "REST Client" extension
2. Open `test-requests.http`
3. Click "Send Request" above each request
4. View response in new tab

**Variables:**
```http
@baseUrl = http://localhost:3000
@customerToken = {{login_customer.response.body.access_token}}
@adminToken = {{login_admin.response.body.access_token}}
```

#### Request Categories

##### Authentication
```http
### Register User
POST {{baseUrl}}/auth/register

### Login Customer
POST {{baseUrl}}/auth/login

### Login Admin
POST {{baseUrl}}/auth/login
```

##### Categories
```http
### Get All Categories
GET {{baseUrl}}/categories

### Create Category (Admin)
POST {{baseUrl}}/categories
Authorization: Bearer {{adminToken}}
```

##### Products
```http
### Get All Products
GET {{baseUrl}}/products?page=1&limit=10

### Filter Products by Category
GET {{baseUrl}}/products?categoryId={{categoryId}}

### Search Products
GET {{baseUrl}}/products?search=laptop
```

##### Cart
```http
### View Cart
GET {{baseUrl}}/cart
Authorization: Bearer {{customerToken}}

### Add to Cart
POST {{baseUrl}}/cart
Authorization: Bearer {{customerToken}}
```

##### Orders
```http
### Create Order
POST {{baseUrl}}/orders
Authorization: Bearer {{customerToken}}

### Get My Orders
GET {{baseUrl}}/orders
Authorization: Bearer {{customerToken}}
```

## Package.json Scripts

### Test Scripts

```json
{
  "scripts": {
    "test:quick": "node scripts/test/quick/quick-test.js",
    "test:api": "ts-node scripts/test/api/test-api.ts",
    "db:seed": "node scripts/seed/seed-database.js"
  }
}
```

### Usage Patterns

#### Development Workflow
```bash
# 1. Start development
yarn start:dev

# 2. Seed database
yarn db:seed

# 3. Quick check
yarn test:quick

# 4. Make changes...

# 5. Quick validation
yarn test:quick

# 6. Before commit
yarn test:api
```

#### CI/CD Pipeline
```bash
# In CI environment
yarn install
yarn db:seed
yarn test:api
```

#### Testing Different Features
```bash
# After auth changes
yarn test:api 2>&1 | grep "AUTHENTICATION"

# After product changes
yarn test:api 2>&1 | grep "PRODUCTS"

# After cart changes
yarn test:api 2>&1 | grep "CART"
```

## Script Comparison

| Feature | Quick Test | Comprehensive Test | Seed Script |
|---------|-----------|-------------------|-------------|
| Language | JavaScript | TypeScript | JavaScript |
| Duration | 30 sec | 2-3 min | 5 sec |
| Test Count | 6 checks | 50+ tests | N/A |
| Purpose | Smoke test | Full validation | Data setup |
| Output | Summary | Detailed | Progress log |
| Exit on Error | Yes | No | Yes |
| Dependencies | axios | axios, ts-node | bcrypt, pg |

## Best Practices

1. **Use quick test during development** - Fast feedback loop
2. **Use comprehensive test before commits** - Full validation
3. **Always seed before testing** - Consistent test data
4. **Review comprehensive output** - Catch edge cases
5. **Keep scripts in version control** - Track changes
6. **Document custom modifications** - Help future developers
7. **Use manual requests for debugging** - Interactive testing

## Next Steps

- **Run Tests**: [Quick Start Guide](./quick-start.md)
- **Detailed Testing**: [Comprehensive Testing Guide](./comprehensive-testing.md)
- **Database Setup**: [Database Seeding Guide](./database-seeding.md)
- **Troubleshooting**: [Troubleshooting Guide](./troubleshooting.md)

---

**Last Updated**: November 2025
