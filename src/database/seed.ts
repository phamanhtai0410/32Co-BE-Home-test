import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import * as bcrypt from 'bcrypt';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const dataSource = app.get('DataSource');

    console.log('🌱 Seeding database...');

    // Clear existing data
    console.log('Clearing existing data...');
    await dataSource.query('TRUNCATE TABLE order_items, orders, cart_items, carts, products, categories, users CASCADE');

    // Create admin user
    console.log('Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const [admin] = await dataSource.query(
      `INSERT INTO users (email, password, name, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id`,
      ['admin@example.com', adminPassword, 'Admin User', 'admin']
    );

    // Create customer users
    console.log('Creating customer users...');
    const customerPassword = await bcrypt.hash('customer123', 10);
    const [customer] = await dataSource.query(
      `INSERT INTO users (email, password, name, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id`,
      ['customer@example.com', customerPassword, 'John Doe', 'customer']
    );

    // Create categories
    console.log('Creating categories...');
    const [electronics] = await dataSource.query(
      `INSERT INTO categories (name, description) 
       VALUES ($1, $2) 
       RETURNING id`,
      ['Electronics', 'Electronic devices and gadgets']
    );

    const [clothing] = await dataSource.query(
      `INSERT INTO categories (name, description) 
       VALUES ($1, $2) 
       RETURNING id`,
      ['Clothing', 'Fashion and apparel']
    );

    const [books] = await dataSource.query(
      `INSERT INTO categories (name, description) 
       VALUES ($1, $2) 
       RETURNING id`,
      ['Books', 'Books and literature']
    );

    // Create products
    console.log('Creating products...');
    const products = [
      ['Laptop', 'High performance laptop with 16GB RAM', 999.99, 10, electronics.id],
      ['Smartphone', 'Latest model smartphone', 699.99, 15, electronics.id],
      ['Wireless Headphones', 'Noise-canceling headphones', 199.99, 25, electronics.id],
      ['T-Shirt', 'Cotton t-shirt', 19.99, 100, clothing.id],
      ['Jeans', 'Blue denim jeans', 49.99, 50, clothing.id],
      ['Novel', 'Bestselling fiction novel', 14.99, 30, books.id],
      ['Textbook', 'Computer Science textbook', 79.99, 20, books.id],
    ];

    for (const [name, description, price, stock, categoryId] of products) {
      await dataSource.query(
        `INSERT INTO products (name, description, price, "stockQuantity", "categoryId") 
         VALUES ($1, $2, $3, $4, $5)`,
        [name, description, price, stock, categoryId]
      );
    }

    // Create cart for customer
    console.log('Creating cart for customer...');
    await dataSource.query(
      `INSERT INTO carts ("userId") VALUES ($1)`,
      [customer.id]
    );

    console.log('✅ Seeding completed successfully!');
    console.log('\n📝 Test Accounts:');
    console.log('Admin:    admin@example.com / admin123');
    console.log('Customer: customer@example.com / customer123');
    console.log('\n🔗 API: http://localhost:3000');
    console.log('📚 Docs: http://localhost:3000/api');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await app.close();
  }
}

seed();
