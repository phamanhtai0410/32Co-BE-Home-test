# Test Scripts

Automated and manual testing scripts for the E-commerce API.

## 📁 Structure

```
test/
├── quick/              # Quick smoke tests
│   └── quick-test.js
│
└── api/                # Comprehensive API tests
    ├── test-api.ts
    └── test-requests.http
```

## 🧪 Test Types

### Quick Test (`quick/`)
Fast connectivity test that verifies basic functionality:
- API is running and accessible
- Authentication endpoints work
- Basic CRUD operations are functional

**Run with:**
```bash
yarn test:quick
# or
node scripts/test/quick/quick-test.js
```

**Duration:** ~30 seconds

### API Test (`api/`)
Comprehensive test suite covering all requirements:
- Authentication & Authorization
- Category Management (CRUD)
- Product Management (CRUD, pagination, filters)
- Shopping Cart Operations
- Order Management
- Stock Validation
- Error Handling

**Run with:**
```bash
yarn test:api
# or
npx ts-node scripts/test/api/test-api.ts
```

**Duration:** 1-2 minutes

### Manual Testing (`api/test-requests.http`)
REST Client file for manual testing in VS Code.

**Usage:**
1. Install "REST Client" extension in VS Code
2. Open `scripts/test/api/test-requests.http`
3. Update variables at the top with your tokens/IDs
4. Click "Send Request" above any request

## 📋 Prerequisites

Before running tests:

1. **Start the API:**
   ```bash
   yarn start:dev
   ```

2. **Seed the database:**
   ```bash
   yarn db:seed
   ```

3. **Verify Docker is running:**
   ```bash
   docker ps | grep ecommerce
   ```

## ✅ Success Criteria

Tests pass if:
- Quick test shows all 6 checks passing ✓
- API test shows mostly green ✓ markers
- No critical 500 errors
- Authorization checks work (403 for unauthorized access)
- Authentication works (JWT tokens are valid)

## 🔍 Troubleshooting

### Tests failing with "Connection Refused"
**Solution:** Make sure API is running on port 3000
```bash
yarn start:dev
```

### Tests failing with "Invalid credentials"
**Solution:** Seed the database
```bash
yarn db:seed
```

### Tests failing with "Unauthorized"
**Solution:** Check that login endpoints return access tokens

## 📊 Test Output

Example of successful test output:

```
============================================================
TESTING AUTHENTICATION - LOGIN
============================================================
ℹ Logging in as customer...
✓ Login Customer - Status: 201
✓ Customer token obtained: eyJhbGciOiJIUzI1NiIs...

============================================================
TESTING PRODUCTS
============================================================
✓ Create Product - Status: 201
✓ Product created with ID: b650fd35-bb94...
✓ Get All Products - Status: 200
✓ Products retrieved with pagination
```

## 📚 Additional Resources

- See `TEST_GUIDE.md` for detailed testing documentation
- See `REQUIREMENTS_CHECKLIST.md` for requirement verification
- Use Swagger UI at http://localhost:3000/api for interactive testing
