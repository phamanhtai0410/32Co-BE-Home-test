const bcrypt = require('bcrypt');
const { Client } = require('pg');

// Database configuration - update these if needed
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5433,
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'ecommerce',
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function seedDatabase() {
  const client = new Client(dbConfig);

  try {
    log('\n🌱 Starting database seeding...', colors.cyan);
    await client.connect();
    log('✓ Connected to database', colors.green);

    // Clear existing data
    log('\n🗑️  Clearing existing data...', colors.yellow);
    await client.query('TRUNCATE TABLE order_items, orders, cart_items, carts, products, categories, users CASCADE');
    log('✓ Data cleared', colors.green);

    // Hash passwords
    log('\n🔐 Hashing passwords...', colors.cyan);
    const adminPassword = await bcrypt.hash('admin123', 10);
    const customerPassword = await bcrypt.hash('customer123', 10);
    log('✓ Passwords hashed', colors.green);

    // Create users
    log('\n👤 Creating users...', colors.cyan);
    
    const adminResult = await client.query(
      `INSERT INTO users (email, password, name, role, "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, NOW(), NOW()) 
       RETURNING id`,
      ['admin@example.com', adminPassword, 'Admin User', 'admin']
    );
    log(`✓ Admin created: admin@example.com / admin123`, colors.green);

    const customerResult = await client.query(
      `INSERT INTO users (email, password, name, role, "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, NOW(), NOW()) 
       RETURNING id`,
      ['customer@example.com', customerPassword, 'Test Customer', 'customer']
    );
    log(`✓ Customer created: customer@example.com / customer123`, colors.green);

    const customerId = customerResult.rows[0].id;

    // Create categories
    log('\n📁 Creating categories...', colors.cyan);
    const categories = [
      ['Electronics', 'Electronic devices and gadgets'],
      ['Clothing', 'Fashion and apparel'],
      ['Books', 'Books and literature'],
      ['Home & Garden', 'Home and garden products'],
    ];

    const categoryIds = {};
    for (const [name, description] of categories) {
      const result = await client.query(
        `INSERT INTO categories (name, description, "createdAt", "updatedAt") 
         VALUES ($1, $2, NOW(), NOW()) 
         RETURNING id`,
        [name, description]
      );
      categoryIds[name] = result.rows[0].id;
      log(`✓ Category created: ${name}`, colors.green);
    }

    // Create products
    log('\n📦 Creating products...', colors.cyan);
    const products = [
      ['Laptop Dell XPS 15', 'High-performance laptop with 16GB RAM and 512GB SSD', 1299.99, 50, 'Electronics'],
      ['iPhone 15 Pro', 'Latest model smartphone with advanced features', 999.99, 100, 'Electronics'],
      ['Wireless Headphones', 'Noise-canceling Bluetooth headphones', 199.99, 75, 'Electronics'],
      ['Smart Watch', 'Fitness tracking smartwatch', 299.99, 60, 'Electronics'],
      ['Mechanical Keyboard', 'RGB mechanical gaming keyboard', 149.99, 40, 'Electronics'],
      ['Cotton T-Shirt', 'Comfortable cotton t-shirt', 19.99, 200, 'Clothing'],
      ['Blue Jeans', 'Classic blue denim jeans', 49.99, 150, 'Clothing'],
      ['Winter Jacket', 'Warm winter jacket', 89.99, 80, 'Clothing'],
      ['Programming Book', 'Learn advanced programming concepts', 39.99, 80, 'Books'],
      ['Fiction Novel', 'Bestselling fiction novel', 14.99, 120, 'Books'],
      ['Cookbook', 'Delicious recipes for home cooking', 24.99, 60, 'Books'],
      ['Garden Tools Set', 'Complete set of garden tools', 79.99, 30, 'Home & Garden'],
    ];

    let productCount = 0;
    for (const [name, description, price, stock, categoryName] of products) {
      await client.query(
        `INSERT INTO products (name, description, price, "stockQuantity", "categoryId", "createdAt", "updatedAt") 
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
        [name, description, price, stock, categoryIds[categoryName]]
      );
      productCount++;
    }
    log(`✓ Created ${productCount} products`, colors.green);

    // Create cart for customer
    log('\n🛒 Creating cart for customer...', colors.cyan);
    await client.query(
      `INSERT INTO carts ("userId", "createdAt", "updatedAt") 
       VALUES ($1, NOW(), NOW())`,
      [customerId]
    );
    log('✓ Cart created', colors.green);

    // Summary
    log('\n' + '='.repeat(60), colors.green);
    log('✅ Database seeded successfully!', colors.green);
    log('='.repeat(60), colors.green);
    
    log('\n📝 Test Accounts:', colors.cyan);
    log('   Admin:    admin@example.com / admin123', colors.yellow);
    log('   Customer: customer@example.com / customer123', colors.yellow);
    
    log('\n📊 Data Summary:', colors.cyan);
    log(`   Users: 2 (1 admin, 1 customer)`, colors.yellow);
    log(`   Categories: ${categories.length}`, colors.yellow);
    log(`   Products: ${productCount}`, colors.yellow);
    
    log('\n🔗 Quick Links:', colors.cyan);
    log('   API:     http://localhost:3000', colors.yellow);
    log('   Swagger: http://localhost:3000/api', colors.yellow);
    
    log('\n🧪 Run Tests:', colors.cyan);
    log('   Quick:   yarn test:quick', colors.yellow);
    log('   Full:    yarn test:api', colors.yellow);
    log('');

  } catch (error) {
    log('\n❌ Error seeding database:', colors.red);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedDatabase();
