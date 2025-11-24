# Quick Start Testing Guide

Get your E-commerce API tested in just 5 minutes!

## ⚡ Prerequisites Check

Before starting, ensure:

```bash
# 1. Check if API is running
curl http://localhost:3000/products

# 2. Check if database is accessible
# Should connect to PostgreSQL on port 5433

# 3. Verify yarn is installed
yarn --version
```

## 🚀 Three-Step Testing

### Step 1: Seed the Database (30 seconds)

Populate your database with test data:

```bash
yarn db:seed
```

**Expected Output:**
```
🌱 Starting database seeding...
✓ Connected to database
✓ Data cleared
✓ Passwords hashed
✓ Users created
✓ Categories created
✓ Products created
✓ Database seeding completed successfully!
```

**Test Data Created:**
- 2 users (admin + customer)
- 4 categories (Electronics, Clothing, Books, Home & Garden)
- 12 products across categories

### Step 2: Run Quick Test (30 seconds)

Verify basic API functionality:

```bash
yarn test:quick
```

**Expected Output:**
```
🚀 Quick E-commerce API Test

1. Checking if API is running...
   ✓ API is running on port 3000
2. Testing authentication...
   ✓ Successfully logged in
3. Testing product retrieval...
   ✓ Found 5 products
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

### Step 3: Run Comprehensive Tests (2-3 minutes)

Test all API endpoints thoroughly:

```bash
yarn test:api
```

**Expected Output:**
```
============================================================
  COMPREHENSIVE E-COMMERCE API TEST SUITE
============================================================

============================================================
TESTING AUTHENTICATION
============================================================
✓ Register New User - Status: 201
✓ Login with Customer - Status: 200
✓ Login with Admin - Status: 200

============================================================
TESTING CATEGORIES
============================================================
✓ Get All Categories - Status: 200
✓ Create Category (Admin) - Status: 201
✓ Update Category (Admin) - Status: 200
✓ Delete Category (Admin) - Status: 200

... [50+ more tests]

============================================================
  TEST SUMMARY
============================================================
✓ Authentication: All tests passed
✓ Categories: All tests passed
✓ Products: All tests passed
✓ Cart: All tests passed
✓ Orders: All tests passed
✓ Stock Management: All tests passed
```

## 🎯 What Just Happened?

1. **Database Seeding**: Created test users and sample products
2. **Quick Test**: Verified basic API connectivity and authentication
3. **Comprehensive Test**: Validated all endpoints and business logic

## 📋 Test Accounts

Use these credentials for manual testing:

| Email | Password | Role | Use Case |
|-------|----------|------|----------|
| admin@example.com | admin123 | admin | Testing admin features (manage products, categories) |
| customer@example.com | customer123 | customer | Testing customer features (cart, orders) |

## ✅ Success Checklist

- [ ] Database seeded successfully
- [ ] Quick test shows all 6 checks passed
- [ ] Comprehensive test shows 50+ tests passed
- [ ] No error messages in terminal
- [ ] API responding on http://localhost:3000

## ❌ If Something Failed

### API Not Running
```bash
# Start the API
yarn start:dev

# Wait for "Nest application successfully started"
# Then re-run tests
```

### Database Connection Issues
```bash
# Start database via Docker
docker-compose up -d

# Verify database is running
docker ps | grep postgres
```

### Test Failures
```bash
# Re-seed the database (clears old data)
yarn db:seed

# Try again
yarn test:quick
```

## 🔄 Daily Development Workflow

```bash
# Morning: Start fresh
docker-compose up -d          # Start database
yarn start:dev                # Start API
yarn db:seed                  # Seed fresh data
yarn test:quick               # Quick validation

# During development
# ... make changes ...
yarn test:quick               # Quick check after changes

# Before commit
yarn test:api                 # Full validation
```

## 📖 Next Steps

- **For detailed testing**: Read [Comprehensive Testing Guide](./comprehensive-testing.md)
- **For manual testing**: Check [Manual Testing Guide](./manual-testing.md)
- **For issues**: See [Troubleshooting Guide](./troubleshooting.md)
- **For script details**: Review [Scripts Reference](./scripts-reference.md)

## 💡 Pro Tips

1. **Quick iterations**: Use `yarn test:quick` during development
2. **Full validation**: Use `yarn test:api` before commits
3. **Fresh start**: Run `yarn db:seed` when data gets messy
4. **Watch mode**: Keep API running with `yarn start:dev`
5. **Debugging**: Check API logs for detailed error messages

---

**Time Investment**: 5 minutes  
**Confidence Level**: High ✨

You're now ready to test your E-commerce API!
