# Manual Testing Guide

Guide for manually testing the E-commerce API using REST clients and HTTP tools.

## 📋 Table of Contents

- [Overview](#overview)
- [Testing Methods](#testing-methods)
- [VS Code REST Client](#vs-code-rest-client)
- [Postman Setup](#postman-setup)
- [cURL Examples](#curl-examples)
- [Test Workflows](#test-workflows)

## Overview

While automated tests are great for validation, manual testing is valuable for:
- Debugging specific issues
- Exploring API behavior interactively
- Demonstrating functionality
- Learning the API structure
- Testing edge cases

## Testing Methods

### 1. VS Code REST Client (Recommended)

**Advantages:**
- ✅ Integrated with VS Code
- ✅ Version controlled (`.http` files)
- ✅ Variable support
- ✅ Response chaining
- ✅ No additional software needed

**File:** `/scripts/test/api/test-requests.http`

### 2. Postman

**Advantages:**
- ✅ Feature-rich GUI
- ✅ Collection management
- ✅ Environment variables
- ✅ Team collaboration

### 3. cURL

**Advantages:**
- ✅ Command-line interface
- ✅ Scriptable
- ✅ Universal availability
- ✅ Great for quick tests

## VS Code REST Client

### Setup

1. **Install Extension**
   - Open VS Code
   - Go to Extensions (Cmd+Shift+X)
   - Search "REST Client"
   - Install by Huachao Mao

2. **Open Test File**
   ```bash
   code scripts/test/api/test-requests.http
   ```

3. **Configure Variables**
   ```http
   @baseUrl = http://localhost:3000
   @customerToken = {{login_customer.response.body.access_token}}
   @adminToken = {{login_admin.response.body.access_token}}
   ```

### Basic Usage

#### 1. Authentication

**Register New User:**
```http
### Register User
POST {{baseUrl}}/auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "New User"
}
```

Click "Send Request" above the request.

**Login as Customer:**
```http
### Login Customer
# @name login_customer
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "customer123"
}
```

The `@name` directive allows referencing the response in other requests.

**Login as Admin:**
```http
### Login Admin
# @name login_admin
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

#### 2. Using Tokens

After logging in, the token is automatically captured:

```http
### Get Cart (requires auth)
GET {{baseUrl}}/cart
Authorization: Bearer {{customerToken}}
```

The `{{customerToken}}` references `{{login_customer.response.body.access_token}}`.

#### 3. Categories

**List All Categories:**
```http
### Get All Categories
GET {{baseUrl}}/categories
```

**Create Category (Admin Only):**
```http
### Create Category
# @name create_category
POST {{baseUrl}}/categories
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "name": "New Category",
  "description": "Category description"
}
```

**Update Category:**
```http
### Update Category
# Use ID from create_category response
PATCH {{baseUrl}}/categories/{{create_category.response.body.id}}
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "name": "Updated Category Name"
}
```

#### 4. Products

**List Products with Pagination:**
```http
### Get Products (Page 1)
GET {{baseUrl}}/products?page=1&limit=10
```

**Filter by Category:**
```http
### Get Products by Category
GET {{baseUrl}}/products?categoryId={{create_category.response.body.id}}
```

**Search Products:**
```http
### Search Products
GET {{baseUrl}}/products?search=laptop
```

**Create Product (Admin Only):**
```http
### Create Product
# @name create_product
POST {{baseUrl}}/products
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "name": "New Product",
  "description": "Product description",
  "price": 99.99,
  "stock": 100,
  "categoryId": "{{create_category.response.body.id}}"
}
```

#### 5. Shopping Cart

**View Cart:**
```http
### View Cart
GET {{baseUrl}}/cart
Authorization: Bearer {{customerToken}}
```

**Add to Cart:**
```http
### Add to Cart
# @name add_to_cart
POST {{baseUrl}}/cart
Authorization: Bearer {{customerToken}}
Content-Type: application/json

{
  "productId": "{{create_product.response.body.id}}",
  "quantity": 2
}
```

**Update Cart Item:**
```http
### Update Cart Item
PATCH {{baseUrl}}/cart/{{add_to_cart.response.body.id}}
Authorization: Bearer {{customerToken}}
Content-Type: application/json

{
  "quantity": 5
}
```

**Remove from Cart:**
```http
### Remove Cart Item
DELETE {{baseUrl}}/cart/{{add_to_cart.response.body.id}}
Authorization: Bearer {{customerToken}}
```

#### 6. Orders

**Create Order:**
```http
### Create Order
# @name create_order
POST {{baseUrl}}/orders
Authorization: Bearer {{customerToken}}
```

**View My Orders:**
```http
### Get My Orders
GET {{baseUrl}}/orders
Authorization: Bearer {{customerToken}}
```

**View Specific Order:**
```http
### Get Order Details
GET {{baseUrl}}/orders/{{create_order.response.body.id}}
Authorization: Bearer {{customerToken}}
```

**Admin View All Orders:**
```http
### Admin Get All Orders
GET {{baseUrl}}/orders/all
Authorization: Bearer {{adminToken}}
```

### Response Chaining

One of the most powerful features is response chaining:

```http
### 1. Login
# @name login
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "customer@example.com",
  "password": "customer123"
}

### 2. Get Products (uses token from step 1)
# @name products
GET {{baseUrl}}/products?page=1&limit=1
Authorization: Bearer {{login.response.body.access_token}}

### 3. Add to Cart (uses product ID from step 2)
# @name cart
POST {{baseUrl}}/cart
Authorization: Bearer {{login.response.body.access_token}}
Content-Type: application/json

{
  "productId": "{{products.response.body.data[0].id}}",
  "quantity": 1
}

### 4. Create Order (uses cart from step 3)
POST {{baseUrl}}/orders
Authorization: Bearer {{login.response.body.access_token}}
```

Execute these in sequence to test a complete user flow!

## Postman Setup

### 1. Import Collection

Create a new collection and add these requests:

#### Environment Variables

```json
{
  "baseUrl": "http://localhost:3000",
  "customerToken": "",
  "adminToken": ""
}
```

#### Authentication Requests

**Login Customer:**
- Method: POST
- URL: `{{baseUrl}}/auth/login`
- Body (JSON):
  ```json
  {
    "email": "customer@example.com",
    "password": "customer123"
  }
  ```
- Tests:
  ```javascript
  pm.environment.set("customerToken", pm.response.json().access_token);
  ```

**Login Admin:**
- Method: POST
- URL: `{{baseUrl}}/auth/login`
- Body (JSON):
  ```json
  {
    "email": "admin@example.com",
    "password": "admin123"
  }
  ```
- Tests:
  ```javascript
  pm.environment.set("adminToken", pm.response.json().access_token);
  ```

#### Authenticated Requests

For requests requiring authentication, add header:
```
Authorization: Bearer {{customerToken}}
```

or

```
Authorization: Bearer {{adminToken}}
```

### 2. Collection Runner

Use Postman's Collection Runner for automated sequential testing:

1. Click "Runner" in Postman
2. Select your collection
3. Set iterations and delay
4. Click "Run"

## cURL Examples

### Authentication

**Register:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

**Login:**
```bash
# Save token to variable
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "customer123"
  }' | jq -r '.access_token')

echo $TOKEN
```

### Products

**List Products:**
```bash
curl http://localhost:3000/products?page=1&limit=10
```

**Get Product by ID:**
```bash
curl http://localhost:3000/products/PRODUCT_ID_HERE
```

**Create Product (Admin):**
```bash
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "New Product",
    "description": "Description",
    "price": 99.99,
    "stock": 100,
    "categoryId": "CATEGORY_ID_HERE"
  }'
```

### Cart

**View Cart:**
```bash
curl http://localhost:3000/cart \
  -H "Authorization: Bearer $TOKEN"
```

**Add to Cart:**
```bash
curl -X POST http://localhost:3000/cart \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "productId": "PRODUCT_ID_HERE",
    "quantity": 2
  }'
```

### Orders

**Create Order:**
```bash
curl -X POST http://localhost:3000/orders \
  -H "Authorization: Bearer $TOKEN"
```

**Get Orders:**
```bash
curl http://localhost:3000/orders \
  -H "Authorization: Bearer $TOKEN"
```

## Test Workflows

### Complete Customer Journey

1. **Register/Login**
   ```http
   POST /auth/login
   ```

2. **Browse Products**
   ```http
   GET /products?page=1&limit=10
   ```

3. **View Product Details**
   ```http
   GET /products/:id
   ```

4. **Add to Cart**
   ```http
   POST /cart
   Body: { productId, quantity }
   ```

5. **View Cart**
   ```http
   GET /cart
   ```

6. **Update Quantity**
   ```http
   PATCH /cart/:id
   Body: { quantity }
   ```

7. **Create Order**
   ```http
   POST /orders
   ```

8. **View Order**
   ```http
   GET /orders/:id
   ```

### Admin Workflow

1. **Login as Admin**
   ```http
   POST /auth/login
   Body: { email: "admin@example.com", password: "admin123" }
   ```

2. **Create Category**
   ```http
   POST /categories
   Body: { name, description }
   ```

3. **Create Product**
   ```http
   POST /products
   Body: { name, description, price, stock, categoryId }
   ```

4. **Update Product**
   ```http
   PATCH /products/:id
   Body: { price, stock }
   ```

5. **View All Orders**
   ```http
   GET /orders/all
   ```

### Testing Stock Management

1. **Create Product with Low Stock**
   ```http
   POST /products
   Body: { ..., stock: 2 }
   ```

2. **Add 2 Items to Cart**
   ```http
   POST /cart
   Body: { productId, quantity: 2 }
   ```

3. **Try Adding More (Should Fail)**
   ```http
   POST /cart
   Body: { productId, quantity: 1 }
   Expected: 400 Bad Request
   ```

4. **Create Order**
   ```http
   POST /orders
   ```

5. **Verify Stock Reduced**
   ```http
   GET /products/:id
   Check: stock = 0
   ```

## Best Practices

1. **Start with Login** - Always authenticate first
2. **Use Variables** - Store tokens and IDs
3. **Chain Requests** - Reference previous responses
4. **Test Error Cases** - Try invalid data
5. **Clean Up** - Delete test data after testing
6. **Document Findings** - Note unexpected behavior
7. **Test Edge Cases** - Boundary values, empty data

## Troubleshooting

### 401 Unauthorized

```
Check: Token is valid and not expired
Solution: Re-login to get fresh token
```

### 404 Not Found

```
Check: ID exists in database
Solution: Use ID from previous response or seed database
```

### 400 Bad Request

```
Check: Request body matches DTO
Solution: Review API validation rules
```

### 500 Internal Server Error

```
Check: API logs for details
Solution: Review stack trace, check database connection
```

## Next Steps

- **Automated Testing**: [Quick Start Guide](./quick-start.md)
- **Comprehensive Tests**: [Comprehensive Testing Guide](./comprehensive-testing.md)
- **Script Reference**: [Scripts Reference](./scripts-reference.md)

---

**Last Updated**: November 2025
