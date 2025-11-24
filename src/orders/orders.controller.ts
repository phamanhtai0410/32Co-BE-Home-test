import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
// import { RolesGuard } from '../common/guards/roles.guard';
// import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create an order from cart' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Cart is empty or insufficient stock',
  })
  createOrder(@CurrentUser() user: { userId: string; role: UserRole }) {
    return this.ordersService.createOrder(user.userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all orders (Admin sees all, Customer sees their own)',
  })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  findAll(@CurrentUser() user: { userId: string; role: UserRole }) {
    return this.ordersService.findAll(user.userId, user.role);
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Get current user order history' })
  @ApiResponse({
    status: 200,
    description: 'Order history retrieved successfully',
  })
  findUserOrders(@CurrentUser() user: { userId: string; role: UserRole }) {
    return this.ordersService.findUserOrders(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
}
