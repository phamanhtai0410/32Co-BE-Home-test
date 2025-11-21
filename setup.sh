#!/bin/bash

echo "🚀 Starting E-commerce API Setup..."
echo ""

# Check if PostgreSQL is running
echo "📊 Checking PostgreSQL..."
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running!"
    echo "Starting PostgreSQL with Docker Compose..."
    docker-compose up -d
    echo "⏳ Waiting for PostgreSQL to start..."
    sleep 5
fi

echo "✅ PostgreSQL is ready!"
echo ""

# Check if database exists
echo "📦 Setting up database..."
if ! psql -h localhost -U postgres -lqt | cut -d \| -f 1 | grep -qw ecommerce 2>/dev/null; then
    echo "Creating database 'ecommerce'..."
    createdb -h localhost -U postgres ecommerce 2>/dev/null || echo "Database may already exist"
fi

echo "✅ Database ready!"
echo ""

echo "📦 Installing dependencies..."
yarn install --silent

echo ""
echo "🔨 Building application..."
yarn build

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application, run:"
echo "  yarn start:dev"
echo ""
echo "API Documentation will be available at:"
echo "  http://localhost:3000/api"
echo ""
