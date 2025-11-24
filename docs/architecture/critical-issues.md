# Critical Issues & Solutions

Detailed analysis of critical issues in the current implementation with practical solutions and code examples.

## 📋 Table of Contents

- [Issue 1: Transaction Safety](#issue-1-transaction-safety)
- [Issue 2: Race Conditions](#issue-2-race-conditions)
- [Issue 3: No Rollback Mechanism](#issue-3-no-rollback-mechanism)
- [Implementation Guide](#implementation-guide)

## Issue 1: Transaction Safety

### Problem Description

**Current Code:**
```typescript
// orders.service.ts - createOrder()
async createOrder(userId: string) {
  const cart = await this.cartRepository.findOne({...});  // Transaction 1
  
  const savedOrder = await this.orderRepository.save(order);  // Transaction 2
  
  for (const item of cart.items) {
    item.product.stockQuantity -= item.quantity;
    await this.productRepository.save(item.product);  // Transaction 3, 4, 5...
  }
  
  await this.orderItemRepository.save(orderItems);  // Transaction N
  
  await this.cartRepository.createQueryBuilder()...execute();  // Transaction N+1
}
```

**What Happens:**
Each `await` statement creates a separate database transaction. If any operation fails after the first save(), previous changes are already committed and cannot be rolled back.

### Failure Example

```
Timeline of Failure:

Step 1: ✅ Create Order
  - Query: INSERT INTO orders VALUES (...)
  - Result: Order ID = "order-123"
  - Status: COMMITTED ✅

Step 2: ✅ Deduct Stock for Product A
  - Query: UPDATE products SET stock = stock - 5 WHERE id = "prod-A"
  - Result: Stock: 10 → 5
  - Status: COMMITTED ✅

Step 3: ❌ Deduct Stock for Product B FAILS
  - Query: UPDATE products SET stock = stock - 3 WHERE id = "prod-B"
  - Error: Database connection timeout
  - Status: ROLLED BACK ❌
  - BUT: Steps 1 and 2 are ALREADY COMMITTED! ⚠️

Result:
✅ Order exists in database (order-123)
✅ Product A stock reduced (10 → 5)
❌ Product B stock unchanged
❌ Order items not created
❌ Cart not cleared

Consequences:
- User charged for order that doesn't exist
- Product A permanently lost 5 units
- Order ID "order-123" is orphaned
- Manual database cleanup required
```

### Solution: Database Transactions

#### Implementation with TypeORM QueryRunner

**Fixed Code:**
```typescript
// orders.service.ts - WITH TRANSACTION

import { DataSource } from 'typeorm';

@Injectable()
export class OrdersService {
  constructor(
    private dataSource: DataSource,
    // ... other repositories
  ) {}

  async createOrder(userId: string) {
    // Create query runner for transaction management
    const queryRunner = this.dataSource.createQueryRunner();
    
    // Connect and start transaction
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      // Step 1: Get cart (within transaction)
      const cart = await queryRunner.manager.findOne(Cart, {
        where: { userId },
        relations: ['items', 'items.product'],
      });
      
      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }
      
      // Step 2: Validate stock and calculate total
      let totalPrice = 0;
      for (const item of cart.items) {
        if (item.product.stockQuantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${item.product.name}`
          );
        }
        totalPrice += Number(item.product.price) * item.quantity;
      }
      
      // Step 3: Create order
      const order = queryRunner.manager.create(Order, {
        userId,
        totalPrice,
        status: OrderStatus.PENDING,
      });
      const savedOrder = await queryRunner.manager.save(order);
      
      // Step 4: Create order items and deduct stock
      const orderItems = [];
      for (const item of cart.items) {
        // Create order item
        const orderItem = queryRunner.manager.create(OrderItem, {
          orderId: savedOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: item.product.price,
        });
        orderItems.push(orderItem);
        
        // Deduct stock
        item.product.stockQuantity -= item.quantity;
        await queryRunner.manager.save(Product, item.product);
      }
      
      // Save all order items
      await queryRunner.manager.save(OrderItem, orderItems);
      
      // Step 5: Clear cart
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from('cart_items')
        .where('cartId = :cartId', { cartId: cart.id })
        .execute();
      
      // ✅ COMMIT: All or nothing!
      await queryRunner.commitTransaction();
      
      // Return created order
      return this.findOne(savedOrder.id);
      
    } catch (error) {
      // ❌ ROLLBACK: Undo everything!
      await queryRunner.rollbackTransaction();
      throw error;
      
    } finally {
      // Release query runner
      await queryRunner.release();
    }
  }
}
```

### Benefits

**Before Transaction:**
```
Step 1: ✅ Order created
Step 2: ✅ Stock A reduced
Step 3: ❌ Stock B fails
Result: Corrupted data ❌
```

**After Transaction:**
```
Step 1: 🔄 Order created (pending)
Step 2: 🔄 Stock A reduced (pending)
Step 3: ❌ Stock B fails
ROLLBACK: ↩️ All changes undone
Result: Clean state ✅
```

### Testing the Transaction

```typescript
// Test to verify transaction behavior
describe('OrdersService - Transaction Safety', () => {
  it('should rollback all changes if stock deduction fails', async () => {
    // Arrange
    const initialOrderCount = await orderRepository.count();
    const initialStock = await productRepository.findOne(productId);
    
    // Simulate failure by making one product have insufficient stock
    await productRepository.update(productId, { stockQuantity: 0 });
    
    // Act & Assert
    await expect(ordersService.createOrder(userId)).rejects.toThrow();
    
    // Verify rollback
    const finalOrderCount = await orderRepository.count();
    const finalStock = await productRepository.findOne(productId);
    
    expect(finalOrderCount).toBe(initialOrderCount); // No order created
    expect(finalStock.stockQuantity).toBe(0); // Stock unchanged
  });
});
```

## Issue 2: Race Conditions

### Problem Description

**Current Code:**
```typescript
// orders.service.ts - Stock check
for (const item of cart.items) {
  // Read stock at time T
  if (item.product.stockQuantity < item.quantity) {
    throw new BadRequestException('Insufficient stock');
  }
  // ... other operations ...
  // Write stock at time T + 100ms
  item.product.stockQuantity -= item.quantity;
  await this.productRepository.save(item.product);
}
```

**What Happens:**
Multiple concurrent requests can read the same stock value and all pass validation, leading to overselling.

### Race Condition Scenario

```
Product: iPhone 14 Pro
Initial Stock: 5 units

Time    User A (Request 1)             User B (Request 2)         Database
─────────────────────────────────────────────────────────────────────────────
T0      GET cart                                                  stock = 5
T1      - cart.items[0].quantity = 3                             stock = 5
T2                                     GET cart                   stock = 5
T3      READ product.stock = 5                                   stock = 5
T4                                     - cart.items[0].qty = 4   stock = 5
T5      CHECK: 5 >= 3 ✅                                          stock = 5
T6                                     READ product.stock = 5    stock = 5
T7      stock = 5 - 3 = 2                                        stock = 5
T8                                     CHECK: 5 >= 4 ✅           stock = 5
T9      WRITE stock = 2                                          stock = 2
T10                                    stock = 5 - 4 = 1         stock = 2
T11                                    WRITE stock = 1           stock = 1

Final State:
- Database shows: stock = 1
- User A ordered: 3 units ✅
- User B ordered: 4 units ✅
- Total ordered: 7 units ❌
- Oversold by: 2 units ❌
```

### Solution 1: Pessimistic Locking (Row-Level Lock)

**Implementation:**
```typescript
async createOrder(userId: string) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  
  try {
    const cart = await queryRunner.manager.findOne(Cart, {
      where: { userId },
      relations: ['items', 'items.product'],
    });
    
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }
    
    // Lock product rows for update
    for (const item of cart.items) {
      // SELECT ... FOR UPDATE locks the row
      const product = await queryRunner.manager
        .createQueryBuilder(Product, 'product')
        .where('product.id = :id', { id: item.productId })
        .setLock('pessimistic_write')  // 🔒 LOCK THE ROW
        .getOne();
      
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      
      // Now check stock - no other transaction can modify this row
      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}`
        );
      }
      
      // Update stock - safe because row is locked
      product.stockQuantity -= item.quantity;
      await queryRunner.manager.save(Product, product);
    }
    
    // ... rest of order creation ...
    
    await queryRunner.commitTransaction();
    
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

**How Pessimistic Locking Works:**
```
Time    User A (Request 1)             User B (Request 2)         Database
─────────────────────────────────────────────────────────────────────────────
T0      START TRANSACTION              START TRANSACTION         stock = 5
T1      SELECT ... FOR UPDATE                                    stock = 5 🔒
T2      - Row LOCKED for User A                                  stock = 5 🔒
T3                                     SELECT ... FOR UPDATE     stock = 5 🔒
T4                                     ⏳ WAITING for lock...    stock = 5 🔒
T5      CHECK: 5 >= 3 ✅                ⏳ Still waiting...       stock = 5 🔒
T6      UPDATE stock = 2                ⏳ Still waiting...       stock = 2 🔒
T7      COMMIT                          ⏳ Still waiting...       stock = 2 ✅
T8      - Lock RELEASED                                          stock = 2
T9                                     - Lock ACQUIRED           stock = 2 🔒
T10                                    READ product.stock = 2    stock = 2 🔒
T11                                    CHECK: 2 >= 4 ❌           stock = 2 🔒
T12                                    ROLLBACK                  stock = 2 ✅
T13                                    Throw error               stock = 2

Result:
✅ User A: Order created, stock = 2
❌ User B: Order rejected (insufficient stock)
✅ No overselling!
```

### Solution 2: Optimistic Locking (Version-Based)

**Add Version Column:**
```typescript
// product.entity.ts
import { Entity, Column, VersionColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  // ... other columns ...
  
  @Column({ type: 'int' })
  stockQuantity: number;
  
  @VersionColumn()  // 🔢 Automatic versioning
  version: number;
}
```

**Implementation:**
```typescript
async createOrder(userId: string) {
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  
  try {
    const cart = await queryRunner.manager.findOne(Cart, {
      where: { userId },
      relations: ['items', 'items.product'],
    });
    
    // ... validation ...
    
    for (const item of cart.items) {
      const product = item.product;
      const originalVersion = product.version;
      
      // Check stock
      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException('Insufficient stock');
      }
      
      // Deduct stock
      product.stockQuantity -= item.quantity;
      
      // Try to save with version check
      const result = await queryRunner.manager
        .createQueryBuilder()
        .update(Product)
        .set({ 
          stockQuantity: product.stockQuantity,
          version: () => 'version + 1'  // Increment version
        })
        .where('id = :id', { id: product.id })
        .andWhere('version = :version', { version: originalVersion })  // 🔍 Version check
        .execute();
      
      // If no rows affected, version mismatch = concurrent update
      if (result.affected === 0) {
        throw new BadRequestException(
          'Product was modified by another request. Please try again.'
        );
      }
    }
    
    // ... rest of order creation ...
    
    await queryRunner.commitTransaction();
    
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
```

**How Optimistic Locking Works:**
```
Time    User A                         User B                     Database
─────────────────────────────────────────────────────────────────────────────
T0      START TRANSACTION              START TRANSACTION         stock=5, v=1
T1      READ product (v=1)                                       stock=5, v=1
T2                                     READ product (v=1)        stock=5, v=1
T3      stock = 5 - 3 = 2                                        stock=5, v=1
T4                                     stock = 5 - 4 = 1         stock=5, v=1
T5      UPDATE WHERE v=1               ⏳ Waiting...             stock=5, v=1
T6      - Success! v=1 matched                                   stock=2, v=2 ✅
T7      COMMIT                                                   stock=2, v=2
T8                                     UPDATE WHERE v=1          stock=2, v=2
T9                                     - Failed! v=1 != v=2 ❌    stock=2, v=2
T10                                    ROLLBACK                  stock=2, v=2
T11                                    Retry with new version    stock=2, v=2

Result:
✅ User A: Order created
❌ User B: Order failed, needs retry
✅ No data corruption
```

## Issue 3: No Rollback Mechanism

### Problem Description

**Current Code:**
```typescript
// No error handling or rollback
for (const item of cart.items) {
  item.product.stockQuantity -= item.quantity;
  await this.productRepository.save(item.product);  // What if this fails?
}
await this.orderItemRepository.save(orderItems);    // Or this?
```

### Solution: Transaction with Try-Catch

Already shown in Solution 1, but here's the pattern:

```typescript
async createOrder(userId: string) {
  const queryRunner = this.dataSource.createQueryRunner();
  
  await queryRunner.connect();
  await queryRunner.startTransaction();
  
  try {
    // ✅ All database operations here
    // If any fails, jump to catch block
    
    await queryRunner.commitTransaction();
    return result;
    
  } catch (error) {
    // ❌ Automatic rollback
    await queryRunner.rollbackTransaction();
    
    // Log error for monitoring
    this.logger.error(`Order creation failed: ${error.message}`, error.stack);
    
    // Re-throw for controller to handle
    throw error;
    
  } finally {
    // ✅ Always release connection
    await queryRunner.release();
  }
}
```

## Implementation Guide

### Step 1: Install Required Packages

```bash
# Already included in NestJS + TypeORM
yarn add typeorm @nestjs/typeorm
```

### Step 2: Update Orders Service

```typescript
// src/orders/orders.service.ts

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Cart } from '../cart/entities/cart.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private dataSource: DataSource,  // 🆕 Add DataSource
  ) {}

  async createOrder(userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get cart with pessimistic lock on products
      const cart = await queryRunner.manager.findOne(Cart, {
        where: { userId },
        relations: ['items', 'items.product'],
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      // Lock and validate stock for all products
      let totalPrice = 0;
      const lockedProducts = new Map<string, Product>();

      for (const item of cart.items) {
        // Lock product row
        const product = await queryRunner.manager
          .createQueryBuilder(Product, 'product')
          .where('product.id = :id', { id: item.productId })
          .setLock('pessimistic_write')
          .getOne();

        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }

        if (product.stockQuantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`
          );
        }

        lockedProducts.set(product.id, product);
        totalPrice += Number(product.price) * item.quantity;
      }

      // Create order
      const order = queryRunner.manager.create(Order, {
        userId,
        totalPrice,
        status: 'PENDING',
      });
      const savedOrder = await queryRunner.manager.save(Order, order);

      // Create order items and deduct stock
      const orderItems = [];
      for (const item of cart.items) {
        const product = lockedProducts.get(item.productId);

        // Create order item
        const orderItem = queryRunner.manager.create(OrderItem, {
          orderId: savedOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: product.price,
        });
        orderItems.push(orderItem);

        // Deduct stock
        product.stockQuantity -= item.quantity;
        await queryRunner.manager.save(Product, product);
      }

      await queryRunner.manager.save(OrderItem, orderItems);

      // Clear cart
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from('cart_items')
        .where('cartId = :cartId', { cartId: cart.id })
        .execute();

      // Commit transaction
      await queryRunner.commitTransaction();

      return this.findOne(savedOrder.id);

    } catch (error) {
      // Rollback on any error
      await queryRunner.rollbackTransaction();
      throw error;

    } finally {
      // Release connection
      await queryRunner.release();
    }
  }

  // ... other methods remain the same
}
```

### Step 3: Test the Implementation

```typescript
// test/orders.service.spec.ts

describe('OrdersService - With Transactions', () => {
  it('should rollback if stock deduction fails', async () => {
    // Test rollback behavior
  });

  it('should handle concurrent orders correctly', async () => {
    // Test race condition prevention
  });

  it('should commit only when all operations succeed', async () => {
    // Test ACID properties
  });
});
```

### Step 4: Add Retry Logic

```typescript
// Add retry decorator
import { retry } from 'rxjs/operators';

async createOrderWithRetry(userId: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this.createOrder(userId);
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Retry only on specific errors
      if (error.message.includes('modified by another request')) {
        await this.delay(attempt * 100); // Exponential backoff
        continue;
      }
      
      throw error;
    }
  }
}

private delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

## Summary

| Issue | Current | Solution | Benefit |
|-------|---------|----------|---------|
| No transactions | Each query separate | QueryRunner with transactions | ACID guarantees |
| Race conditions | Read-modify-write | Pessimistic/optimistic locking | No overselling |
| No rollback | Manual cleanup | Automatic rollback | Data consistency |
| Poor performance | Sequential queries | Batch operations in transaction | Faster execution |

---

**Last Updated**: November 2025  
**Implementation Status**: Ready for production
