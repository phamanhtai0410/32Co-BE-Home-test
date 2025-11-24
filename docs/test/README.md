# Testing Documentation

This directory contains comprehensive documentation for testing the E-commerce API.

## 📑 Documentation Files

1. **[Quick Start Guide](./quick-start.md)** - Get started with testing in 5 minutes
2. **[Comprehensive Testing Guide](./comprehensive-testing.md)** - Detailed guide for running all tests
3. **[Database Seeding Guide](./database-seeding.md)** - How to populate test data
4. **[Test Scripts Reference](./scripts-reference.md)** - Complete reference for all test scripts
5. **[Manual Testing Guide](./manual-testing.md)** - Using REST clients for manual testing
6. **[Troubleshooting](./troubleshooting.md)** - Common issues and solutions

## 🚀 Quick Reference

### Prerequisites
- API running on `http://localhost:3000`
- PostgreSQL running on port `5433`
- All dependencies installed: `yarn install`

### Quick Commands

```bash
# Seed the database with test data
yarn db:seed

# Run quick smoke test (30 seconds)
yarn test:quick

# Run comprehensive test suite (2-3 minutes)
yarn test:api
```

### Test Accounts

After seeding, use these accounts:

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | admin123 | admin |
| customer@example.com | customer123 | customer |

## 📂 Test Scripts Location

All test scripts are organized under `/scripts`:

```
scripts/
├── seed/
│   └── seed-database.js       # Database seeding script
└── test/
    ├── api/
    │   ├── test-api.ts         # Comprehensive automated tests
    │   └── test-requests.http  # Manual REST client requests
    └── quick/
        └── quick-test.js       # Quick smoke test
```

## 🎯 What Gets Tested

### Authentication
- User registration
- User login
- JWT token validation
- Role-based access control

### Products
- CRUD operations (Create, Read, Update, Delete)
- Pagination
- Filtering by category
- Search functionality
- Stock management

### Categories
- CRUD operations
- Listing all categories
- Admin-only access for modifications

### Shopping Cart
- Add items to cart
- Update item quantities
- Remove items from cart
- View cart contents
- Cart validation (stock availability)

### Orders
- Create orders from cart
- View order history
- View specific order details
- Admin order management
- Automatic stock reduction

## 🔍 Test Coverage

The comprehensive test suite covers:
- ✅ 50+ API endpoints
- ✅ All CRUD operations
- ✅ Authentication & authorization
- ✅ Pagination & filtering
- ✅ Error handling
- ✅ Business logic (stock management, cart validation)
- ✅ Role-based access control
- ✅ Data cleanup

## 📊 Expected Results

### Quick Test
- **Duration**: ~30 seconds
- **Checks**: 6 basic connectivity tests
- **Output**: Pass/fail for each check

### Comprehensive Test
- **Duration**: 2-3 minutes
- **Tests**: 50+ endpoint tests
- **Output**: Detailed results for each test with request/response data

## 🔗 Related Documentation

- [Main README](../../README.md) - Project overview and setup
- [Database Schema](../../database-schema.md) - Database structure
- [API Documentation](../api/README.md) - API endpoint reference (if available)

## 💡 Tips

1. **Always seed the database first** before running tests to ensure consistent test data
2. **Check the API is running** on port 3000 before testing
3. **Use quick test** for fast validation during development
4. **Use comprehensive test** before submitting or deploying
5. **Review troubleshooting guide** if tests fail

## 🆘 Getting Help

If you encounter issues:
1. Check the [Troubleshooting Guide](./troubleshooting.md)
2. Verify prerequisites (API running, database connected)
3. Review test output for specific error messages
4. Check application logs for detailed error information

---

**Last Updated**: November 2025
