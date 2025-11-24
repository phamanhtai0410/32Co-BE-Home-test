# Current Architecture Analysis

Comprehensive analysis of the current e-commerce API implementation, focusing on the order creation flow and stock management.

## 📋 Table of Contents

- [Overview](#overview)
- [Current Flow Analysis](#current-flow-analysis)
- [Code Review](#code-review)
- [Identified Issues](#identified-issues)
- [Why This Approach Was Used](#why-this-approach-was-used)

## Overview

### Architecture Type
**Simple Synchronous Monolithic Architecture**

### Key Characteristics
- Direct database access via TypeORM
- Synchronous query execution
- No transaction management
- In-process business logic
- Single-node deployment

### Technology Stack
```
┌─────────────────────────────────────┐
│         NestJS Application          │
│  (Single Process, Single Thread)    │
├─────────────────────────────────────┤
│          TypeORM ORM                │
├─────────────────────────────────────┤
│      PostgreSQL Database            │
│     (Single Instance)               │
└─────────────────────────────────────┘
```

## Current Flow Analysis

### Order Creation Flow

```typescript
// Current implementation in orders.service.ts

async createOrder(userId: string) {
  // Step 1: Get cart with items
  const cart = await this.cartRepository.findOne({...}); // Query 1
  
  // Step 2: Validate stock (in-memory check)
  for (const item of cart.items) {
    if (item.product.stockQuantity < item.quantity) {
      throw new BadRequestException(...);
    }
  }
  
  // Step 3: Create order
  const order = this.orderRepository.create({...});
  const savedOrder = await this.orderRepository.save(order); // Query 2
  
  // Step 4: Create order items and deduct stock
  for (const item of cart.items) {
    const orderItem = this.orderItemRepository.create({...});
    orderItems.push(orderItem);
    
    // ISSUE: Separate query for each product
    item.product.stockQuantity -= item.quantity;
    await this.productRepository.save(item.product); // Query 3, 4, 5...
  }
  
  await this.orderItemRepository.save(orderItems); // Query N
  
  // Step 5: Clear cart
  await this.cartRepository.createQueryBuilder()...execute(); // Query N+1
  
  return this.findOne(savedOrder.id); // Query N+2
}
```

### Query Execution Timeline

```
Time ──────────────────────────────────────────────────────>

│
├─ Query 1: SELECT cart (with items, products)
│   └─ Result: cart = {..., items: [{product: {stock: 10}}, ...]}
│
├─ Validation: Check stock in memory
│   └─ OK: item.quantity (5) <= product.stock (10)
│
├─ Query 2: INSERT INTO orders (...)
│   └─ Result: order.id = "uuid-123"
│
├─ Query 3: UPDATE products SET stock = 5 WHERE id = "prod-1"
│   ⚠️  ISSUE: No transaction, other requests can modify same product
│
├─ Query 4: UPDATE products SET stock = 8 WHERE id = "prod-2"
│   ⚠️  ISSUE: If this fails, Query 3 already committed!
│
├─ Query 5: INSERT INTO order_items (...)
│   ⚠️  ISSUE: If this fails, stock already deducted!
│
├─ Query 6: DELETE FROM cart_items WHERE cartId = "cart-1"
│   ⚠️  ISSUE: If this fails, cart not cleared but order created!
│
└─ Query 7: SELECT order with relations
    └─ Return final order
```

### Stock Management Flow

```typescript
// Current stock check (cart.service.ts)

async addToCart(userId: string, addToCartDto: AddToCartDto) {
  const product = await this.productRepository.findOne({...}); // Query 1
  
  // ISSUE: Stock check is stale by the time we save
  if (product.stockQuantity < quantity) {
    throw new BadRequestException('Insufficient stock');
  }
  
  // ... other logic ...
  
  // ISSUE: Between check and save, stock might have changed
  await this.cartItemRepository.save(cartItem); // Query 2
}
```

### Race Condition Scenario

```
Timeline with 2 concurrent requests:

Product Initial Stock: 10 units

Request A (User 1)          Request B (User 2)          Database State
────────────────────────────────────────────────────────────────────────
READ stock = 10                                         stock = 10
                            READ stock = 10             stock = 10
CHECK: 10 >= 8 (OK)                                     stock = 10
                            CHECK: 10 >= 5 (OK)         stock = 10
WRITE stock = 2                                         stock = 2
                            WRITE stock = 5             stock = 5 ⚠️

Result: Stock should be -3 (oversold by 3 units!)
Database shows: stock = 5 (last write wins)
```

## Code Review

### ✅ What Works Well

1. **Clear Business Logic**
   ```typescript
   // Easy to understand and maintain
   if (cart.items.length === 0) {
     throw new BadRequestException('Cart is empty');
   }
   ```

2. **Proper Use of TypeORM Relations**
   ```typescript
   relations: ['items', 'items.product']
   // Eager loading reduces N+1 queries
   ```

3. **Price Calculation**
   ```typescript
   totalPrice += Number(item.product.price) * item.quantity;
   // Correct calculation logic
   ```

4. **Status Management**
   ```typescript
   status: OrderStatus.PENDING
   // Clear order state
   ```

### ❌ Critical Issues

#### Issue 1: No Transaction Management

**Problem:**
```typescript
// Each operation is a separate transaction
const savedOrder = await this.orderRepository.save(order); // Transaction 1
await this.productRepository.save(item.product);          // Transaction 2
await this.orderItemRepository.save(orderItems);          // Transaction 3
```

**Impact:**
- If Query 2 fails, Query 1 already committed
- No automatic rollback
- System left in inconsistent state

**Example Failure Scenario:**
```
✅ Order created (ID: "order-123")
✅ Stock deducted for Product A (10 → 5)
❌ Stock deduction fails for Product B (database error)
❌ Order items creation fails

Result:
- Order exists in database but has no items
- Product A stock permanently reduced
- User's money charged but no items ordered
- Manual cleanup required
```

#### Issue 2: Race Conditions in Stock Management

**Problem:**
```typescript
// Check and modify in separate operations
if (product.stockQuantity < quantity) { // Read at time T
  throw new BadRequestException();
}
// ... other code ...
product.stockQuantity -= quantity;      // Write at time T+100ms
await this.productRepository.save();
```

**Impact:**
- Multiple concurrent requests can pass the check
- Stock oversold
- Negative inventory possible

**Real-world Scenario:**
```
Black Friday Sale - iPhone at 50% off:
- Initial stock: 100 units
- 200 users click "buy" simultaneously
- All 200 requests read stock = 100
- All 200 requests pass validation
- All 200 requests decrement stock
- Final stock: Unpredictable (could be negative!)
```

#### Issue 3: No Rollback Mechanism

**Problem:**
```typescript
for (const item of cart.items) {
  item.product.stockQuantity -= item.quantity;
  await this.productRepository.save(item.product); // What if this fails?
}
// No try-catch or rollback logic
```

**Impact:**
- Partial updates committed
- No way to undo changes
- Manual intervention required

#### Issue 4: Sequential Query Execution

**Problem:**
```typescript
// Loop executes queries one by one
for (const item of cart.items) {
  await this.productRepository.save(item.product); // Blocking
}
// 10 items = 10 sequential queries = slow
```

**Impact:**
- Poor performance
- Long request duration
- Increased chance of timeout
- Higher failure probability

## Identified Issues

### 1. Transaction Safety Issues

| Issue | Description | Risk Level | Impact |
|-------|-------------|------------|--------|
| No ACID guarantees | Operations not wrapped in transaction | 🔴 Critical | Data corruption |
| No rollback | Failed operations leave partial data | 🔴 Critical | Inconsistent state |
| Multiple commits | Each save() is separate transaction | 🔴 Critical | Can't undo changes |

### 2. Concurrency Issues

| Issue | Description | Risk Level | Impact |
|-------|-------------|------------|--------|
| Race conditions | No locking mechanism | 🔴 Critical | Stock oversold |
| Read-modify-write | Not atomic | 🔴 Critical | Lost updates |
| Stale reads | Check time vs. write time gap | 🟡 High | Inconsistent data |

### 3. Scalability Issues

| Issue | Description | Risk Level | Impact |
|-------|-------------|------------|--------|
| Single node only | Can't scale horizontally | 🟡 High | Limited throughput |
| No distributed locking | Multi-node causes conflicts | 🔴 Critical | Data races |
| No caching | Every request hits database | 🟡 High | High DB load |
| Sequential execution | Slow performance | 🟡 High | Poor UX |

### 4. Reliability Issues

| Issue | Description | Risk Level | Impact |
|-------|-------------|------------|--------|
| No error recovery | Failures require manual fix | 🟡 High | Operational burden |
| No idempotency | Retry causes duplicates | 🟡 High | Duplicate orders |
| No circuit breaker | Cascading failures possible | 🟠 Medium | System-wide outage |

## Why This Approach Was Used

### Valid Reasons (Advantages)

1. **Simplicity**
   - Easy to understand and maintain
   - Minimal code complexity
   - Quick to implement

2. **Development Speed**
   - Rapid prototyping
   - Fast iteration
   - Good for MVP/proof of concept

3. **Low Learning Curve**
   - Standard TypeORM patterns
   - No advanced concepts needed
   - Easy for junior developers

4. **Sufficient for Small Scale**
   - Works fine for < 100 concurrent users
   - Acceptable for internal tools
   - Good for demos and testing

### When This Approach is Acceptable

✅ **Use Cases:**
- Development environment
- Testing and QA
- Small internal applications
- Proof of concept
- Low-traffic MVP (< 1000 users/day)
- Single-tenant applications

❌ **Not Suitable For:**
- Production e-commerce platform
- Multi-tenant SaaS
- High-traffic applications
- Financial transactions
- Inventory-critical systems
- Applications requiring horizontal scaling

## Current System Limitations

### Scalability Limits

```
Maximum Safe Concurrent Users: ~50-100
Maximum Orders/Second: ~5-10
Maximum Products: Unlimited (but slow with many)
Maximum Cart Size: ~50 items (performance degrades)
Geographic Distribution: Single region only
```

### Failure Scenarios

#### Scenario 1: Database Connection Lost
```
During order creation:
1. Order saved ✅
2. Connection lost ❌
3. Stock not deducted ❌
4. Cart not cleared ❌

Result: Ghost order + incorrect stock
```

#### Scenario 2: Concurrent Stock Updates
```
Product stock: 10
User A orders: 8 units
User B orders: 5 units (simultaneously)

Both read stock = 10
Both pass validation
Both write back
Result: Final stock = 5 or 2 (unpredictable)
Actual: Should be out of stock!
```

#### Scenario 3: Partial Order Completion
```
Order with 5 items:
1. Order created ✅
2. Item 1 stock deducted ✅
3. Item 2 stock deducted ✅
4. Item 3 fails ❌
5. Items 1-2 already committed ❌

Result: Inconsistent order state
```

## Summary

### Current State
- ✅ Simple and maintainable
- ✅ Works for development and testing
- ❌ Not production-ready
- ❌ Not scalable
- ❌ Not reliable under load

### Next Steps
1. Review [Critical Issues & Solutions](./critical-issues.md) for immediate fixes
2. Study [Scalability Solutions](./scalability-solutions.md) for production readiness
3. Consider [Event-Driven Architecture](./event-driven-design.md) for long-term strategy

---

**Last Updated**: November 2025  
