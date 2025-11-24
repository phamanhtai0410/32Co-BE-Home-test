# Comprehensive Testing Guide

Complete guide for running thorough API tests using the automated test suite.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Test Suite Structure](#test-suite-structure)
- [Running Tests](#running-tests)
- [Understanding Test Output](#understanding-test-output)
- [Test Coverage](#test-coverage)
- [Advanced Usage](#advanced-usage)

## Overview

The comprehensive test suite (`scripts/test/api/test-api.ts`) is a 750-line automated testing script that validates:
- All API endpoints
- Authentication and authorization
- Business logic
- Data validation
- Error handling
- CRUD operations

**Duration**: 2-3 minutes  
**Test Count**: 50+ tests  
**Coverage**: All API requirements

## Prerequisites

### 1. Environment Setup

```bash
# Ensure API is running
yarn start:dev
# Wait for: "Nest application successfully started"

# Verify API is responding
curl http://localhost:3000/products
```

### 2. Database Setup

```bash
# Start PostgreSQL via Docker
docker-compose up -d

# Seed test data
yarn db:seed
```

### 3. Dependencies

```bash
# Install all dependencies (if not already done)
yarn install

# Key testing dependencies:
# - axios@1.13.2 (HTTP client)
# - typescript@5.7.2 (TypeScript support)
```

## Test Suite Structure

The test suite is organized into logical sections:

```typescript
┌─────────────────────────────────────┐
│    AUTHENTICATION TESTS             │
├─────────────────────────────────────┤
│ • Register new user                 │
│ • Login (customer & admin)          │
│ • Token validation                  │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│    CATEGORIES TESTS                 │
├─────────────────────────────────────┤
│ • List all categories               │
│ • Create category (admin)           │
│ • Update category (admin)           │
│ • Delete category (admin)           │
│ • Get single category               │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│    PRODUCTS TESTS                   │
├─────────────────────────────────────┤
│ • List with pagination              │
│ • Filter by category                │
│ • Search products                   │
│ • Create product (admin)            │
│ • Update product (admin)            │
│ • Delete product (admin)            │
│ • Get single product                │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│    CART TESTS                       │
├─────────────────────────────────────┤
│ • View cart                         │
│ • Add items to cart                 │
│ • Update cart quantities            │
│ • Remove cart items                 │
│ • Cart validation                   │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│    ORDERS TESTS                     │
├─────────────────────────────────────┤
│ • Create order from cart            │
│ • View customer orders              │
│ • Get specific order                │
│ • Admin view all orders             │
│ • Stock reduction validation        │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│    CLEANUP                          │
├─────────────────────────────────────┤
│ • Clean up test data                │
│ • Verify cleanup                    │
└─────────────────────────────────────┘
```

## Running Tests

### Basic Usage

```bash
# Run all tests
yarn test:api
```

### Advanced Options

```bash
# Run with output saved to file
yarn test:api > test-results.log 2>&1

# Run specific sections (grep filter)
yarn test:api 2>&1 | grep "TESTING PRODUCTS"

# Run and view only summary
yarn test:api 2>&1 | grep "TEST SUMMARY" -A 20
```

## Understanding Test Output

### 1. Section Headers

```
============================================================
TESTING PRODUCTS
============================================================
```

Each major feature has a header to organize test results.

### 2. Individual Test Results

```
✓ Get All Products with Pagination - Status: 200
  Products found: 12
  Current page: 1, Total pages: 3
```

- `✓` = Test passed
- `✗` = Test failed
- Status code indicates HTTP response
- Additional details show key data

### 3. Test Data Display

```
✓ Create Product (Admin) - Status: 201
  Product created: {
    id: "uuid-here",
    name: "Test Product",
    price: 99.99,
    stock: 50
  }
```

Important data created during tests is displayed for verification.

### 4. Expected Failures

```
✗ Create Product without Auth (Expected to fail) - Status 401
  This is correct behavior!
```

Some tests verify that protected endpoints properly reject unauthorized access.

### 5. Test Summary

```
============================================================
  TEST SUMMARY
============================================================
✓ Authentication: All tests passed
✓ Categories: All tests passed
✓ Products: All tests passed
✓ Cart: All tests passed
✓ Orders: All tests passed
✓ Stock Management: Verified

Total Duration: ~2 minutes
```

## Test Coverage

### Authentication Module (5 tests)

| Test | Validates |
|------|-----------|
| Register User | User registration endpoint |
| Login Customer | Customer authentication |
| Login Admin | Admin authentication |
| Invalid Credentials | Error handling |
| Token Generation | JWT token creation |

### Categories Module (8 tests)

| Test | Validates |
|------|-----------|
| List Categories | GET /categories |
| Get Category by ID | GET /categories/:id |
| Create Category | POST /categories (admin) |
| Update Category | PATCH /categories/:id (admin) |
| Delete Category | DELETE /categories/:id (admin) |
| Unauthorized Access | Non-admin protection |
| Invalid Data | Validation rules |
| Not Found | 404 handling |

### Products Module (15 tests)

| Test | Validates |
|------|-----------|
| List Products | Pagination |
| Filter by Category | Query parameters |
| Search Products | Search functionality |
| Get Product by ID | Single product retrieval |
| Create Product | POST /products (admin) |
| Update Product | PATCH /products/:id (admin) |
| Delete Product | DELETE /products/:id (admin) |
| Stock Management | Stock updates |
| Price Validation | Decimal handling |
| Unauthorized Access | Role protection |
| Out of Stock | Stock validation |
| Invalid Data | DTO validation |
| Pagination Edge Cases | Page 0, negative pages |
| Sort & Order | Sorting functionality |
| Not Found | 404 handling |

### Cart Module (10 tests)

| Test | Validates |
|------|-----------|
| View Empty Cart | Initial cart state |
| Add to Cart | POST /cart |
| Add Multiple Items | Batch operations |
| Update Quantity | PATCH /cart/:id |
| Remove Item | DELETE /cart/:id |
| Insufficient Stock | Stock validation |
| Invalid Quantity | Quantity validation |
| Non-existent Product | Product validation |
| Cart Authorization | User isolation |
| Cart Total | Price calculation |

### Orders Module (12 tests)

| Test | Validates |
|------|-----------|
| Create Order | POST /orders |
| Empty Cart Order | Validation |
| View Customer Orders | GET /orders |
| Get Order by ID | GET /orders/:id |
| Admin View Orders | Admin access |
| Order Total | Price calculation |
| Stock Reduction | Inventory update |
| Order Status | Status tracking |
| Order Items | Item details |
| Authorization | User isolation |
| Not Found | 404 handling |
| Order History | Pagination |

## Advanced Usage

### Customizing the Test Suite

Edit `/scripts/test/api/test-api.ts` to:

1. **Change API URL**:
```typescript
const BASE_URL = 'http://localhost:3000'; // Change port if needed
```

2. **Add Custom Tests**:
```typescript
async function testCustomFeature() {
  section('TESTING CUSTOM FEATURE');
  try {
    const response = await api.get('/custom-endpoint');
    success(`Custom Test - Status: ${response.status}`);
  } catch (err) {
    error(`Custom Test Failed - ${err.message}`);
  }
}
```

3. **Modify Test Data**:
```typescript
const testProduct = {
  name: 'My Test Product',
  price: 199.99,
  stock: 100,
  // ... other fields
};
```

### Running Tests Programmatically

```typescript
// In your own script
import { exec } from 'child_process';

exec('yarn test:api', (error, stdout, stderr) => {
  if (error) {
    console.error(`Test failed: ${error}`);
    return;
  }
  console.log(stdout);
});
```

### CI/CD Integration

```yaml
# Example GitHub Actions workflow
- name: Run API Tests
  run: |
    yarn db:seed
    yarn test:api
    
- name: Check Test Results
  run: |
    if grep -q "✗" test-output.log; then
      echo "Tests failed"
      exit 1
    fi
```

## Interpreting Results

### All Tests Pass ✅

```
============================================================
  TEST SUMMARY
============================================================
✓ Authentication: All tests passed
✓ Categories: All tests passed
✓ Products: All tests passed
✓ Cart: All tests passed
✓ Orders: All tests passed
```

**Meaning**: API is working correctly, all requirements met.

### Some Tests Fail ❌

```
✗ Create Product (Admin) - Status: 500
  Error: Internal server error
```

**Action Required**:
1. Check API logs for detailed error
2. Verify database connection
3. Review product validation rules
4. Re-seed database if data is corrupted

### Connection Errors 🔌

```
✗ Could not connect to API
  Make sure API is running on http://localhost:3000
```

**Action Required**:
1. Start API: `yarn start:dev`
2. Check port 3000 is not in use
3. Verify API startup logs

## Best Practices

1. **Always seed before testing**: `yarn db:seed && yarn test:api`
2. **Run tests before commits**: Ensure changes don't break functionality
3. **Monitor test duration**: Significant slowdown may indicate performance issues
4. **Review failed tests carefully**: Some failures are expected (authorization tests)
5. **Keep test data consistent**: Re-seed when data becomes unpredictable

## Troubleshooting

See [Troubleshooting Guide](./troubleshooting.md) for common issues and solutions.

## Next Steps

- **Manual Testing**: [Manual Testing Guide](./manual-testing.md)
- **Database Seeding**: [Database Seeding Guide](./database-seeding.md)
- **Quick Tests**: [Quick Start Guide](./quick-start.md)

---

**Last Updated**: November 2025
