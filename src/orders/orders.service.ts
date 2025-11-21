import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Cart } from '../cart/entities/cart.entity';
import { Product } from '../products/entities/product.entity';
import { UserRole } from '../users/entities/user.entity';

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
  ) {}

  async createOrder(userId: string) {
    const cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items', 'items.product'],
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate stock and calculate total
    let totalPrice = 0;
    for (const item of cart.items) {
      if (item.product.stockQuantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${item.product.name}`,
        );
      }
      totalPrice += Number(item.product.price) * item.quantity;
    }

    // Create order
    const order = this.orderRepository.create({
      userId,
      totalPrice,
      status: OrderStatus.PENDING,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Create order items and deduct stock
    const orderItems = [];
    for (const item of cart.items) {
      const orderItem = this.orderItemRepository.create({
        orderId: savedOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.product.price,
      });
      orderItems.push(orderItem);

      // Deduct stock
      item.product.stockQuantity -= item.quantity;
      await this.productRepository.save(item.product);
    }

    await this.orderItemRepository.save(orderItems);

    // Clear cart
    await this.cartRepository
      .createQueryBuilder()
      .relation(Cart, 'items')
      .of(cart)
      .remove(cart.items);

    return this.findOne(savedOrder.id);
  }

  async findAll(userId?: string, userRole?: string) {
    const query = this.orderRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .orderBy('order.createdAt', 'DESC');

    // If customer, only show their orders
    if (userRole === UserRole.CUSTOMER && userId) {
      query.where('order.userId = :userId', { userId });
    }

    return await query.getMany();
  }

  async findOne(id: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'user'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async findUserOrders(userId: string) {
    return await this.orderRepository.find({
      where: { userId },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }
}
