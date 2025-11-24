-- E-commerce Database Seed Data
-- Run this with: psql -d ecommerce -f seed.sql

-- Clear existing data (optional - comment out if you want to preserve existing data)
TRUNCATE TABLE order_items, orders, cart_items, carts, products, categories, users CASCADE;

-- Create Admin User
-- Password: admin123 (hashed with bcrypt, 10 rounds)
INSERT INTO users (id, email, password, name, role, "createdAt", "updatedAt") 
VALUES (
  gen_random_uuid(),
  'admin@example.com',
  '$2b$10$rN7xJ9EhJ4pXZ5h5h5h5hOMxKxXZGQXZGQXZGQXZGQXZGQXZGQXZ2',
  'Admin User',
  'admin',
  NOW(),
  NOW()
);

-- Create Customer User
-- Password: customer123 (hashed with bcrypt, 10 rounds)
INSERT INTO users (id, email, password, name, role, "createdAt", "updatedAt") 
VALUES (
  gen_random_uuid(),
  'customer@example.com',
  '$2b$10$rN7xJ9EhJ4pXZ5h5h5h5hOMxKxXZGQXZGQXZGQXZGQXZGQXZGQXZ2',
  'Test Customer',
  'customer',
  NOW(),
  NOW()
);

-- Create Categories
INSERT INTO categories (id, name, description, "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), 'Electronics', 'Electronic devices and gadgets', NOW(), NOW()),
  (gen_random_uuid(), 'Clothing', 'Fashion and apparel', NOW(), NOW()),
  (gen_random_uuid(), 'Books', 'Books and literature', NOW(), NOW()),
  (gen_random_uuid(), 'Home & Garden', 'Home and garden products', NOW(), NOW());

-- Create Products (using category IDs from above)
INSERT INTO products (id, name, description, price, "stockQuantity", "categoryId", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  'Laptop Dell XPS 15',
  'High-performance laptop with 16GB RAM and 512GB SSD',
  1299.99,
  50,
  id,
  NOW(),
  NOW()
FROM categories WHERE name = 'Electronics'
LIMIT 1;

INSERT INTO products (id, name, description, price, "stockQuantity", "categoryId", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  'iPhone 15 Pro',
  'Latest model smartphone with advanced features',
  999.99,
  100,
  id,
  NOW(),
  NOW()
FROM categories WHERE name = 'Electronics'
LIMIT 1;

INSERT INTO products (id, name, description, price, "stockQuantity", "categoryId", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  'Wireless Headphones',
  'Noise-canceling Bluetooth headphones',
  199.99,
  75,
  id,
  NOW(),
  NOW()
FROM categories WHERE name = 'Electronics'
LIMIT 1;

INSERT INTO products (id, name, description, price, "stockQuantity", "categoryId", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  'Smart Watch',
  'Fitness tracking smartwatch',
  299.99,
  60,
  id,
  NOW(),
  NOW()
FROM categories WHERE name = 'Electronics'
LIMIT 1;

INSERT INTO products (id, name, description, price, "stockQuantity", "categoryId", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  'Cotton T-Shirt',
  'Comfortable cotton t-shirt',
  19.99,
  200,
  id,
  NOW(),
  NOW()
FROM categories WHERE name = 'Clothing'
LIMIT 1;

INSERT INTO products (id, name, description, price, "stockQuantity", "categoryId", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  'Blue Jeans',
  'Classic blue denim jeans',
  49.99,
  150,
  id,
  NOW(),
  NOW()
FROM categories WHERE name = 'Clothing'
LIMIT 1;

INSERT INTO products (id, name, description, price, "stockQuantity", "categoryId", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  'Programming Book',
  'Learn advanced programming concepts',
  39.99,
  80,
  id,
  NOW(),
  NOW()
FROM categories WHERE name = 'Books'
LIMIT 1;

INSERT INTO products (id, name, description, price, "stockQuantity", "categoryId", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  'Fiction Novel',
  'Bestselling fiction novel',
  14.99,
  120,
  id,
  NOW(),
  NOW()
FROM categories WHERE name = 'Books'
LIMIT 1;

-- Create cart for customer user
INSERT INTO carts (id, "userId", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  id,
  NOW(),
  NOW()
FROM users WHERE email = 'customer@example.com'
LIMIT 1;

-- Display success message
SELECT 'Database seeded successfully!' as message;
SELECT '✅ Test Users Created:' as info;
SELECT 'Admin: admin@example.com / admin123' as admin_user;
SELECT 'Customer: customer@example.com / customer123' as customer_user;
