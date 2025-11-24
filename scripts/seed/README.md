# Database Seed Scripts

Scripts for populating the database with test data.

## 📄 Files

### seed-database.js (Recommended)
Node.js script that:
- Connects to PostgreSQL
- Clears existing data
- Properly hashes passwords with bcrypt
- Creates test users (admin & customer)
- Creates categories and products
- Creates a cart for the customer

**Usage:**
```bash
yarn db:seed
# or
node scripts/seed/seed-database.js
```

**Test Accounts Created:**
- Admin: `admin@example.com` / `admin123`
- Customer: `customer@example.com` / `customer123`

**Test Data:**
- 2 Users (1 admin, 1 customer)
- 4 Categories (Electronics, Clothing, Books, Home & Garden)
- 12 Products with varying stock levels

### seed.sql
Raw SQL file for manual database seeding.

**Usage:**
```bash
psql -d ecommerce -f scripts/seed/seed.sql
```

**Note:** This file uses placeholder password hashes. Use `seed-database.js` for properly hashed passwords.

## 🔧 Configuration

The seed script uses these environment variables (with defaults):

```javascript
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=ecommerce
```

## 🔄 Resetting Database

To completely reset and reseed:

```bash
# Stop and remove Docker containers
yarn docker:down

# Start fresh
yarn docker:up

# Seed data
yarn db:seed
```

## ✅ Verification

After seeding, verify the data:

```bash
# Run quick test
yarn test:quick

# Or check database directly
docker exec -it ecommerce-postgres psql -U postgres -d ecommerce
# Then run: SELECT * FROM users;
```
