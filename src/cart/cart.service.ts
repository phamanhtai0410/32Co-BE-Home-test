import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Product } from '../products/entities/product.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async getCart(userId: string) {
    let cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      cart = this.cartRepository.create({ userId });
      cart = await this.cartRepository.save(cart);
    }

    if (!cart.items || cart.items.length === 0) {
      return { ...cart, subtotal: '0.00', totalItems: 0, items: [] };
    }
    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );

    return {
      ...cart,
      subtotal: subtotal.toFixed(2),
      totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const { productId, quantity } = addToCartDto;

    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stockQuantity < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    let cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items'],
    });

    if (!cart) {
      cart = this.cartRepository.create({ userId });
      cart = await this.cartRepository.save(cart);
    }

    const existingItem = await this.cartItemRepository.findOne({
      where: { cartId: cart.id, productId },
    });

    if (existingItem) {
      if (product.stockQuantity < existingItem.quantity + quantity) {
        throw new BadRequestException('Insufficient stock');
      }
      existingItem.quantity += quantity;
      await this.cartItemRepository.save(existingItem);
    } else {
      const cartItem = this.cartItemRepository.create({
        cartId: cart.id,
        productId,
        quantity,
      });
      await this.cartItemRepository.save(cartItem);
    }

    return this.getCart(userId);
  }

  async updateCartItem(userId: string, itemId: string, quantity: number) {
    const cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const cartItem = cart.items.find((item) => item.id === itemId);
    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    if (cartItem.product.stockQuantity < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    cartItem.quantity = quantity;
    await this.cartItemRepository.save(cartItem);

    return this.getCart(userId);
  }

  async removeFromCart(userId: string, itemId: string) {
    const cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items'],
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const cartItem = cart.items.find((item) => item.id === itemId);
    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartItemRepository.remove(cartItem);
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items'],
    });

    if (cart && cart.items.length > 0) {
      await this.cartItemRepository.remove(cart.items);
    }

    return this.getCart(userId);
  }
}
