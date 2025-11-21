# E-commerce API

A scalable e-commerce backend system built with NestJS, PostgreSQL, and TypeORM.

## 🚀 Quick Start

```bash
# 1. Install dependencies
yarn install

# 2. Start PostgreSQL with Docker (or use your own PostgreSQL instance)
docker-compose up -d

# 3. Configure environment (update .env if needed)
cp .env.example .env

# 4. Run the application
yarn start:dev

# 5. Open Swagger Documentation
open http://localhost:3000/api
```

That's it! The API is now running and you can test it via Swagger UI or see [API_TESTING.md](./API_TESTING.md) for curl examples.

## Features

- **User Management**: User registration and JWT-based authentication with role-based access control (Customer/Admin)
- **Product Management**: CRUD operations for products with pagination and filtering
- **Category Management**: Organize products into categories
- **Shopping Cart**: Add, update, remove items from cart
- **Order Management**: Place orders from cart with stock management
- **API Documentation**: Interactive Swagger/OpenAPI documentation

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT (Passport)
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Package Manager**: Yarn

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- Yarn

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd 32Co-BE-Home-test
```

### 2. Install dependencies

```bash
yarn install
```

### 3. Database Setup

Create a PostgreSQL database:

```bash
createdb ecommerce
```

Or using psql:

```sql
CREATE DATABASE ecommerce;
```

### 4. Environment Configuration

Copy the example environment file and update with your database credentials:

```bash
cp .env.example .env
```

Update the `.env` file:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=ecommerce

JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRATION=1h

PORT=3000
```

### 5. Run the Application

```bash
# Development mode
yarn start:dev

# Production mode
yarn build
yarn start:prod
```

The API will be available at `http://localhost:3000`

### 6. (Optional) Seed Database with Test Data

```bash
yarn db:seed
```

This will create:
- Admin user: `admin@example.com` / `admin123`
- Customer user: `customer@example.com` / `customer123`
- Sample categories and products

### 7. Access API Documentation

Open your browser and navigate to:
```
http://localhost:3000/api
```

This provides an interactive Swagger UI where you can test all API endpoints.

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register a new user | No |
| POST | `/auth/login` | Login user | No |

### Categories

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/categories` | Get all categories | No |
| GET | `/categories/:id` | Get category by ID | No |
| POST | `/categories` | Create category | Admin |
| PATCH | `/categories/:id` | Update category | Admin |
| DELETE | `/categories/:id` | Delete category | Admin |

### Products

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/products` | Get all products (with pagination/filters) | No |
| GET | `/products/:id` | Get product by ID | No |
| POST | `/products` | Create product | Admin |
| PATCH | `/products/:id` | Update product | Admin |
| DELETE | `/products/:id` | Delete product | Admin |

**Query Parameters for GET /products:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `categoryId` (string): Filter by category
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter

### Cart

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/cart` | Get current user's cart | Customer/Admin |
| POST | `/cart/items` | Add product to cart | Customer/Admin |
| PATCH | `/cart/items/:itemId` | Update cart item quantity | Customer/Admin |
| DELETE | `/cart/items/:itemId` | Remove item from cart | Customer/Admin |
| DELETE | `/cart` | Clear cart | Customer/Admin |

### Orders

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/orders` | Create order from cart | Customer/Admin |
| GET | `/orders` | Get all orders (Admin: all, Customer: own) | Customer/Admin |
| GET | `/orders/my-orders` | Get current user's orders | Customer/Admin |
| GET | `/orders/:id` | Get order by ID | Customer/Admin |

## Example API Requests

### 1. Register a User

```bash
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

### 2. Login

```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "customer"
  }
}
```

### 3. Create a Category (Admin)

```bash
POST http://localhost:3000/categories
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Electronics",
  "description": "Electronic devices and gadgets"
}
```

### 4. Create a Product (Admin)

```bash
POST http://localhost:3000/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Laptop",
  "description": "High performance laptop",
  "price": 999.99,
  "stockQuantity": 10,
  "categoryId": "category-uuid"
}
```

### 5. Get Products with Filters

```bash
GET http://localhost:3000/products?page=1&limit=10&categoryId=<uuid>&minPrice=100&maxPrice=1000
```

### 6. Add to Cart

```bash
POST http://localhost:3000/cart/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "product-uuid",
  "quantity": 2
}
```

### 7. Place Order

```bash
POST http://localhost:3000/orders
Authorization: Bearer <token>
```

## Database Schema

### Users Table
```sql
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- password (VARCHAR)
- name (VARCHAR)
- role (ENUM: customer, admin)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

### Categories Table
```sql
- id (UUID, PK)
- name (VARCHAR, UNIQUE)
- description (TEXT)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

### Products Table
```sql
- id (UUID, PK)
- name (VARCHAR)
- description (TEXT)
- price (DECIMAL(10,2))
- stockQuantity (INTEGER)
- categoryId (UUID, FK -> categories.id)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

### Carts Table
```sql
- id (UUID, PK)
- userId (UUID, FK -> users.id)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

### Cart Items Table
```sql
- id (UUID, PK)
- cartId (UUID, FK -> carts.id)
- productId (UUID, FK -> products.id)
- quantity (INTEGER)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

### Orders Table
```sql
- id (UUID, PK)
- userId (UUID, FK -> users.id)
- totalPrice (DECIMAL(10,2))
- status (ENUM: pending, completed, cancelled)
- createdAt (TIMESTAMP)
```

### Order Items Table
```sql
- id (UUID, PK)
- orderId (UUID, FK -> orders.id)
- productId (UUID, FK -> products.id)
- quantity (INTEGER)
- priceAtPurchase (DECIMAL(10,2))
```

## Architecture & Design Decisions

### Architecture Pattern

The application follows a **layered architecture** with clear separation of concerns:

1. **Controllers**: Handle HTTP requests/responses, route management
2. **Services**: Business logic and data manipulation
3. **Entities**: TypeORM entities representing database tables
4. **DTOs**: Data Transfer Objects for request validation
5. **Guards**: Authentication and authorization logic
6. **Decorators**: Custom decorators for cleaner code

### Key Design Decisions

1. **Repository Pattern**: Used TypeORM repositories for data access, making it easy to swap databases if needed

2. **JWT Authentication**: Stateless authentication using JWT tokens for scalability

3. **Role-Based Access Control**: Admin and Customer roles with guards to protect endpoints

4. **Validation**: class-validator for automatic DTO validation at the controller level

5. **Cart Management**: Each user has one cart that persists across sessions

6. **Order Flow**:
   - Validates cart is not empty
   - Checks stock availability
   - Creates order with items
   - Deducts stock automatically
   - Clears cart after order

7. **Database Relations**:
   - One-to-Many: User → Orders, Category → Products
   - One-to-One: User → Cart
   - Many-to-One: Product → Category, CartItem → Product, OrderItem → Product

8. **Soft Deletes**: Not implemented (can be added using TypeORM's soft delete feature)

9. **Pagination**: Implemented for products list to handle large datasets

10. **Price Storage**: Stored as DECIMAL for precision in financial calculations

## Assumptions & Trade-offs

### Assumptions

1. **Single Currency**: All prices are in the same currency
2. **No Payment Integration**: Order creation doesn't involve payment processing
3. **Stock Management**: Simple stock deduction, no reservation system
4. **Cart Persistence**: Cart is tied to user, not session
5. **Order Status**: Simple status management (pending, completed, cancelled)
6. **No Product Variants**: Products don't have variants (size, color, etc.)
7. **Single Address**: No shipping address management

### Trade-offs

1. **TypeORM Synchronize**: Set to `true` for development convenience, should be `false` in production with proper migrations

2. **Password Hashing**: Using bcrypt with 10 rounds (balance between security and performance)

3. **No Caching**: Not implemented for simplicity, but Redis could be added for product/cart caching

4. **No Rate Limiting**: Should be added in production using NestJS throttler

5. **Error Handling**: Basic HTTP exceptions, could be enhanced with custom exception filters

6. **No Audit Trail**: Order history is tracked, but changes to orders are not logged

7. **Stock Concurrency**: No optimistic/pessimistic locking (race condition possible in high-traffic scenarios)

8. **File Upload**: Product images not implemented (could use AWS S3 or similar)

9. **Pagination Strategy**: Offset-based pagination (cursor-based would be better for large datasets)

10. **Testing**: Basic project structure without tests (see Testing section below)

## Testing (Bonus - Not Implemented Yet)

To add tests, you can use:

```bash
# Unit tests
yarn test

# E2E tests
yarn test:e2e

# Test coverage
yarn test:cov
```

Example test structure:
```typescript
describe('ProductsService', () => {
  it('should create a product', async () => {
    // Test implementation
  });
  
  it('should throw error when product not found', async () => {
    // Test implementation
  });
});
```

## Future Enhancements

1. Add comprehensive unit and integration tests
2. Implement product search functionality
3. Add product reviews and ratings
4. Implement wishlist functionality
5. Add order cancellation and refund logic
6. Implement email notifications
7. Add product images upload
8. Implement coupon/discount system
9. Add admin dashboard endpoints (analytics, reports)
10. Implement rate limiting and request throttling
11. Add database migrations instead of sync
12. Implement Redis caching for products
13. Add logging system (Winston/Pino)
14. Implement monitoring and health checks
15. Add API versioning

## Project Structure

```
src/
├── auth/                 # Authentication module
│   ├── dto/             # Login/Register DTOs
│   ├── strategies/      # JWT strategy
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── users/               # Users module
│   ├── entities/       # User entity
│   └── users.module.ts
├── products/            # Products module
│   ├── dto/
│   ├── entities/
│   ├── products.controller.ts
│   ├── products.service.ts
│   └── products.module.ts
├── categories/          # Categories module
│   ├── dto/
│   ├── entities/
│   ├── categories.controller.ts
│   ├── categories.service.ts
│   └── categories.module.ts
├── cart/                # Cart module
│   ├── dto/
│   ├── entities/
│   ├── cart.controller.ts
│   ├── cart.service.ts
│   └── cart.module.ts
├── orders/              # Orders module
│   ├── entities/
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   └── orders.module.ts
├── common/              # Shared resources
│   ├── decorators/     # Custom decorators
│   └── guards/         # Auth & role guards
├── app.module.ts
└── main.ts
```

## License

MIT

## Contact

For questions or support, please contact the development team.
