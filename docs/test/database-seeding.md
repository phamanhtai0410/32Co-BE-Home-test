# Database Seeding Guide

Complete guide for populating your database with test data using the seeding script.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Usage](#quick-usage)
- [What Gets Created](#what-gets-created)
- [Configuration](#configuration)
- [Advanced Usage](#advanced-usage)
- [Troubleshooting](#troubleshooting)

## Overview

The database seeding script (`scripts/seed/seed-database.js`) automatically populates your PostgreSQL database with realistic test data including:
- User accounts (admin and customer)
- Product categories
- Sample products with stock and pricing
- Properly hashed passwords using bcrypt

**Duration**: ~5 seconds  
**Data Created**: 2 users, 4 categories, 12 products

## Prerequisites

### 1. Database Running

```bash
# Start PostgreSQL via Docker
docker-compose up -d

# Verify database is running
docker ps | grep postgres
# Should show container on port 5433
```

### 2. Dependencies Installed

```bash
# Install required packages
yarn install

# Key dependencies:
# - bcrypt (password hashing)
# - pg (PostgreSQL client)
```

## Quick Usage

### Basic Seeding

```bash
# Seed the database
yarn db:seed
```

### Expected Output

```
🌱 Starting database seeding...
✓ Connected to database

🗑️  Clearing existing data...
✓ Data cleared

🔐 Hashing passwords...
✓ Passwords hashed

👤 Creating users...
✓ Admin user created (ID: abc-123...)
✓ Customer user created (ID: def-456...)

📁 Creating categories...
✓ Created category: Electronics
✓ Created category: Clothing
✓ Created category: Books
✓ Created category: Home & Garden

📦 Creating products...
✓ Created product: Laptop (Electronics) - $999.99
✓ Created product: Smartphone (Electronics) - $699.99
✓ Created product: T-Shirt (Clothing) - $29.99
✓ Created product: Jeans (Clothing) - $59.99
✓ Created product: Novel (Books) - $19.99
✓ Created product: Cookbook (Books) - $24.99
... [6 more products]

✨ Database seeding completed successfully!

📊 Summary:
   • 2 users created
   • 4 categories created
   • 12 products created
```

## What Gets Created

### 1. Users (2)

#### Admin User
```json
{
  "email": "admin@example.com",
  "password": "admin123",
  "name": "Admin User",
  "role": "admin"
}
```

**Capabilities**:
- Manage products (create, update, delete)
- Manage categories (create, update, delete)
- View all orders
- Full API access

#### Customer User
```json
{
  "email": "customer@example.com",
  "password": "customer123",
  "name": "Customer User",
  "role": "customer"
}
```

**Capabilities**:
- Browse products
- Manage shopping cart
- Create orders
- View own orders

### 2. Categories (4)

| ID | Name | Description |
|----|------|-------------|
| uuid-1 | Electronics | Electronic devices and gadgets |
| uuid-2 | Clothing | Apparel and fashion items |
| uuid-3 | Books | Books and reading materials |
| uuid-4 | Home & Garden | Home improvement and garden supplies |

### 3. Products (12)

#### Electronics Category
| Product | Price | Stock | Description |
|---------|-------|-------|-------------|
| Laptop | $999.99 | 50 | High-performance laptop |
| Smartphone | $699.99 | 100 | Latest model smartphone |
| Headphones | $149.99 | 200 | Wireless noise-canceling |

#### Clothing Category
| Product | Price | Stock | Description |
|---------|-------|-------|-------------|
| T-Shirt | $29.99 | 500 | Cotton t-shirt |
| Jeans | $59.99 | 300 | Denim jeans |
| Sneakers | $89.99 | 150 | Comfortable sneakers |

#### Books Category
| Product | Price | Stock | Description |
|---------|-------|-------|-------------|
| Novel | $19.99 | 100 | Fiction novel |
| Cookbook | $24.99 | 80 | Recipe collection |
| Tech Book | $39.99 | 60 | Programming guide |

#### Home & Garden Category
| Product | Price | Stock | Description |
|---------|-------|-------|-------------|
| Plant Pot | $15.99 | 300 | Ceramic plant pot |
| Garden Tools | $49.99 | 100 | Complete tool set |
| Lamp | $79.99 | 120 | Modern table lamp |

## Configuration

### Database Connection

The script uses environment variables with fallback defaults:

```javascript
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5433,
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'ecommerce',
};
```

### Custom Configuration

Create a `.env` file in the project root:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5433
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=ecommerce
```

### Password Hashing

Passwords are hashed using bcrypt with 10 salt rounds:

```javascript
const adminPassword = await bcrypt.hash('admin123', 10);
const customerPassword = await bcrypt.hash('customer123', 10);
```

This matches the application's authentication configuration.

## Advanced Usage

### Customizing Seed Data

Edit `/scripts/seed/seed-database.js` to customize the data:

#### 1. Add More Users

```javascript
const newUserResult = await client.query(
  `INSERT INTO users (email, password, name, role, "createdAt", "updatedAt") 
   VALUES ($1, $2, $3, $4, NOW(), NOW()) 
   RETURNING id`,
  ['newuser@example.com', await bcrypt.hash('password123', 10), 'New User', 'customer']
);
```

#### 2. Add More Categories

```javascript
const categoryResult = await client.query(
  `INSERT INTO categories (name, description, "createdAt", "updatedAt") 
   VALUES ($1, $2, NOW(), NOW()) 
   RETURNING id`,
  ['Sports', 'Sports equipment and apparel']
);
```

#### 3. Add More Products

```javascript
await client.query(
  `INSERT INTO products (name, description, price, stock, "categoryId", "createdAt", "updatedAt") 
   VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
  [
    'New Product',
    'Product description',
    99.99,
    100,
    categoryId
  ]
);
```

### Running with Custom Script

```bash
# Create custom seed script
cp scripts/seed/seed-database.js scripts/seed/custom-seed.js

# Edit custom-seed.js with your data

# Run custom seed
node scripts/seed/custom-seed.js
```

### Seeding from JSON File

Create a data file:

```json
{
  "users": [...],
  "categories": [...],
  "products": [...]
}
```

Modify script to read from file:

```javascript
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./seed-data.json', 'utf8'));
```

## Data Cleanup

The seed script **automatically clears all existing data** before inserting new data:

```javascript
await client.query('TRUNCATE TABLE order_items, orders, cart_items, carts, products, categories, users CASCADE');
```

### Tables Cleared (in order)

1. `order_items` - Order line items
2. `orders` - Customer orders
3. `cart_items` - Shopping cart items
4. `carts` - Shopping carts
5. `products` - Product catalog
6. `categories` - Product categories
7. `users` - User accounts

**Important**: This is a destructive operation. All data is permanently deleted.

## Use Cases

### 1. Initial Setup

```bash
# First time setup
docker-compose up -d
yarn install
yarn db:seed
yarn start:dev
```

### 2. Development Reset

```bash
# When data becomes messy during development
yarn db:seed
# Fresh, clean test data ready
```

### 3. Pre-Testing

```bash
# Before running tests
yarn db:seed
yarn test:api
```

### 4. Demo Preparation

```bash
# Before showing the application
yarn db:seed
# Consistent demo data every time
```

### 5. CI/CD Pipeline

```yaml
# In your CI workflow
- run: yarn db:seed
- run: yarn test:api
```

## Verification

After seeding, verify the data:

```bash
# Using psql
docker exec -it <container-id> psql -U postgres -d ecommerce

# Check users
SELECT email, name, role FROM users;

# Check categories
SELECT name FROM categories;

# Check products
SELECT p.name, p.price, c.name as category 
FROM products p 
JOIN categories c ON p."categoryId" = c.id;
```

Or use the quick test:

```bash
yarn test:quick
```

## Troubleshooting

### Connection Refused

```
✗ Error: connect ECONNREFUSED 127.0.0.1:5433
```

**Solution**:
```bash
# Start database
docker-compose up -d

# Wait a few seconds for startup
sleep 5

# Try again
yarn db:seed
```

### Authentication Failed

```
✗ Error: password authentication failed
```

**Solution**:
```bash
# Check credentials in .env or use defaults
# Default: postgres/postgres

# Or update script with correct credentials
```

### Table Does Not Exist

```
✗ Error: relation "users" does not exist
```

**Solution**:
```bash
# Run migrations first
yarn migration:run

# Then seed
yarn db:seed
```

### Foreign Key Constraint

```
✗ Error: violates foreign key constraint
```

**Solution**:
```bash
# The seed script uses CASCADE to handle this
# If error persists, manually clear tables:

docker exec -it <container-id> psql -U postgres -d ecommerce -c "
  TRUNCATE TABLE users, categories, products, carts, cart_items, orders, order_items CASCADE;
"

# Then seed
yarn db:seed
```

## Best Practices

1. **Always seed before testing** - Ensures consistent test data
2. **Re-seed when data becomes messy** - Quick reset during development
3. **Don't modify seed data during testing** - Create separate test data
4. **Use environment variables** - For different environments (dev, staging)
5. **Version control seed script** - Track changes to test data structure
6. **Document custom modifications** - If you add custom seed data

## Integration with Tests

The testing workflow typically follows this pattern:

```bash
# 1. Seed database with known data
yarn db:seed

# 2. Run tests that use this data
yarn test:api

# 3. Tests verify expected behavior with seeded data
```

Tests rely on this data:
- **Authentication tests** use admin@example.com and customer@example.com
- **Product tests** filter by seeded categories
- **Cart tests** add seeded products
- **Order tests** create orders with seeded products

## Next Steps

- **Run Tests**: [Quick Start Guide](./quick-start.md)
- **Comprehensive Testing**: [Comprehensive Testing Guide](./comprehensive-testing.md)
- **Manual Testing**: [Manual Testing Guide](./manual-testing.md)

---

**Last Updated**: November 2025
