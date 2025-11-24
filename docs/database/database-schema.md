# Database Schema Design

## Entity Relationship Diagram (ERD)

```
┌─────────────────────┐
│       USERS         │
├─────────────────────┤
│ id (PK, UUID)       │
│ email (UNIQUE)      │
│ password            │
│ name                │
│ role (ENUM)         │
│ createdAt           │
│ updatedAt           │
└─────────────────────┘
         │
         │ 1:1
         │
         ▼
┌─────────────────────┐
│       CARTS         │
├─────────────────────┤
│ id (PK, UUID)       │
│ userId (FK)         │──────────┐
│ createdAt           │          │
│ updatedAt           │          │
└─────────────────────┘          │
         │                       │
         │ 1:N                   │
         │                       │
         ▼                       │
┌─────────────────────┐          │
│    CART_ITEMS       │          │
├─────────────────────┤          │
│ id (PK, UUID)       │          │
│ cartId (FK)         │          │
│ productId (FK)      │─────┐    │
│ quantity            │     │    │
│ createdAt           │     │    │
│ updatedAt           │     │    │
└─────────────────────┘     │    │
                            │    │
┌─────────────────────┐     │    │
│    CATEGORIES       │     │    │
├─────────────────────┤     │    │
│ id (PK, UUID)       │     │    │
│ name (UNIQUE)       │     │    │
│ description         │     │    │
│ createdAt           │     │    │
│ updatedAt           │     │    │
└─────────────────────┘     │    │
         │                  │    │
         │ 1:N              │    │
         │                  │    │
         ▼                  │    │
┌─────────────────────┐     │    │
│     PRODUCTS        │◄────┘    │
├─────────────────────┤          │
│ id (PK, UUID)       │          │
│ name                │          │
│ description         │          │
│ price (DECIMAL)     │          │
│ stockQuantity (INT) │          │
│ categoryId (FK)     │          │
│ createdAt           │          │
│ updatedAt           │          │
└─────────────────────┘          │
         │                       │
         │ 1:N                   │
         │                       │
         ▼                       │
┌─────────────────────┐          │
│   ORDER_ITEMS       │          │
├─────────────────────┤          │
│ id (PK, UUID)       │          │
│ orderId (FK)        │──┐       │
│ productId (FK)      │  │       │
│ quantity            │  │       │
│ priceAtPurchase     │  │       │
└─────────────────────┘  │       │
                         │       │
         ┌───────────────┘       │
         │                       │
         ▼                       │
┌─────────────────────┐          │
│      ORDERS         │          │
├─────────────────────┤          │
│ id (PK, UUID)       │          │
│ userId (FK)         │◄─────────┘
│ totalPrice          │ 1:N
│ status (ENUM)       │
│ createdAt           │
└─────────────────────┘

```

## Relationships

### One-to-One
- **User → Cart**: Each user has exactly one cart

### One-to-Many
- **User → Orders**: A user can have multiple orders
- **Category → Products**: A category can contain multiple products
- **Cart → CartItems**: A cart can have multiple items
- **Order → OrderItems**: An order contains multiple items

### Many-to-One
- **Product → Category**: Multiple products belong to one category
- **CartItem → Product**: Multiple cart items reference the same product
- **CartItem → Cart**: Multiple items belong to one cart
- **OrderItem → Product**: Multiple order items reference the same product
- **OrderItem → Order**: Multiple items belong to one order
- **Order → User**: Multiple orders belong to one user

## SQL Schema

```sql
-- Create ENUM types
CREATE TYPE user_role AS ENUM ('customer', 'admin');
CREATE TYPE order_status AS ENUM ('pending', 'completed', 'cancelled');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    category_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Carts table
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Cart items table
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status order_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Order items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity INTEGER NOT NULL,
    price_at_purchase DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Create indexes for performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_created ON orders(created_at);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
```

## Normalization

The database follows **Third Normal Form (3NF)**:

1. **First Normal Form (1NF)**: All tables have atomic values, no repeating groups
2. **Second Normal Form (2NF)**: All non-key attributes are fully functionally dependent on the primary key
3. **Third Normal Form (3NF)**: No transitive dependencies - all attributes depend only on the primary key

## Indexing Strategy

Key indexes are created on:
- **Foreign Keys**: To speed up JOIN operations
- **Price**: For filtering products by price range
- **Created timestamps**: For sorting orders by date
- **Unique constraints**: On email and category names for fast lookups

## Data Types

- **UUIDs**: Used for primary keys to avoid ID prediction and enable distributed systems
- **VARCHAR**: For text fields with reasonable length limits
- **TEXT**: For longer descriptions
- **DECIMAL(10,2)**: For monetary values to ensure precision
- **INTEGER**: For quantities and counts
- **TIMESTAMP**: For date/time tracking
- **ENUM**: For constrained string values (roles, status)

## Cascading Rules

- **User deletion**: Cascades to carts and orders (ON DELETE CASCADE)
- **Cart deletion**: Cascades to cart items (ON DELETE CASCADE)
- **Order deletion**: Cascades to order items (ON DELETE CASCADE)
- **Category deletion**: Sets product category to NULL (ON DELETE SET NULL)
- **Product deletion**: Does not affect existing orders (historical data preserved)

## Data Integrity

- **Unique Constraints**: Email, category names
- **Not Null Constraints**: Critical fields like email, password, product name, price
- **Check Constraints**: Could be added for price > 0, quantity >= 0
- **Foreign Key Constraints**: Maintain referential integrity across tables
