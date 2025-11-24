# Scripts Directory

This directory contains all test and utility scripts organized by purpose.

## 📁 Directory Structure

```
scripts/
├── seed/              # Database seeding scripts
│   ├── seed-database.js    # Main seed script (recommended)
│   └── seed.sql            # Raw SQL seed file
│
└── test/              # Testing scripts
    ├── quick/         # Quick smoke tests
    │   └── quick-test.js   # Fast connectivity test
    │
    └── api/           # Comprehensive API tests
        ├── test-api.ts     # Full test suite
        └── test-requests.http  # Manual REST client requests
```

## 🚀 Quick Commands

```bash
# Seed database with test data
yarn db:seed

# Run quick test (30 seconds)
yarn test:quick

# Run comprehensive API tests (1-2 minutes)
yarn test:api
```

## 📋 Script Purposes

### Seed Scripts (`scripts/seed/`)
- **seed-database.js**: Node.js script that properly hashes passwords and seeds the database
- **seed.sql**: Raw SQL file for manual seeding (passwords need to be hashed separately)

### Quick Test (`scripts/test/quick/`)
- **quick-test.js**: Fast connectivity test that verifies:
  - API is running
  - Authentication works
  - Basic endpoints are accessible

### API Tests (`scripts/test/api/`)
- **test-api.ts**: Comprehensive test suite covering all requirements
- **test-requests.http**: Manual REST client file for VS Code

## 📝 Usage

See the main project README and TEST_GUIDE.md for detailed usage instructions.
