# Troubleshooting Guide

Common issues and solutions when testing the E-commerce API.

## 📋 Table of Contents

- [Connection Issues](#connection-issues)
- [Database Issues](#database-issues)
- [Authentication Issues](#authentication-issues)
- [Test Failures](#test-failures)
- [Seeding Issues](#seeding-issues)
- [Performance Issues](#performance-issues)
- [Environment Issues](#environment-issues)

## Connection Issues

### API Not Responding

**Symptoms:**
```
✗ Could not connect to API
✗ Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Solutions:**

1. **Check if API is running:**
   ```bash
   # Look for running process
   lsof -i :3000
   
   # Or check with curl
   curl http://localhost:3000/products
   ```

2. **Start the API:**
   ```bash
   yarn start:dev
   
   # Wait for this message:
   # "Nest application successfully started on port 3000"
   ```

3. **Check for port conflicts:**
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   
   # Then restart
   yarn start:dev
   ```

4. **Verify correct port:**
   ```bash
   # Check .env or configuration
   grep PORT .env
   
   # Update test scripts if using different port
   # Edit: scripts/test/quick/quick-test.js
   # Change: const BASE_URL = 'http://localhost:3000';
   ```

### Wrong Base URL

**Symptoms:**
```
✗ 404 Not Found on all endpoints
```

**Solutions:**

1. **Verify API URL:**
   ```bash
   curl http://localhost:3000
   # Should return HTML or JSON, not 404
   ```

2. **Check API prefix:**
   ```typescript
   // In main.ts, check for global prefix
   app.setGlobalPrefix('api'); // If this exists
   
   // Update BASE_URL to:
   const BASE_URL = 'http://localhost:3000/api';
   ```

### Network Issues

**Symptoms:**
```
✗ Timeout after 30 seconds
```

**Solutions:**

1. **Check firewall settings:**
   ```bash
   # macOS - System Preferences > Security & Privacy > Firewall
   # Ensure Node.js is allowed
   ```

2. **Try localhost alternatives:**
   ```bash
   # Try 127.0.0.1 instead of localhost
   curl http://127.0.0.1:3000/products
   ```

## Database Issues

### Database Connection Failed

**Symptoms:**
```
✗ Error: connect ECONNREFUSED 127.0.0.1:5433
✗ password authentication failed for user "postgres"
```

**Solutions:**

1. **Check Docker container:**
   ```bash
   # List running containers
   docker ps
   
   # Should see postgres:15-alpine
   # If not, start it:
   docker-compose up -d
   
   # Wait a few seconds for startup
   sleep 5
   ```

2. **Verify database is accessible:**
   ```bash
   # Connect via psql
   docker exec -it $(docker ps -q -f "ancestor=postgres:15-alpine") psql -U postgres -d ecommerce
   
   # Should see postgres prompt
   # Type \q to exit
   ```

3. **Check database credentials:**
   ```bash
   # View docker-compose.yml
   cat docker-compose.yml | grep -A 5 "POSTGRES"
   
   # Common defaults:
   # POSTGRES_USER: postgres
   # POSTGRES_PASSWORD: postgres
   # POSTGRES_DB: ecommerce
   # PORT: 5433
   ```

4. **Reset database:**
   ```bash
   # Stop and remove containers
   docker-compose down -v
   
   # Start fresh
   docker-compose up -d
   
   # Wait for startup
   sleep 10
   
   # Run migrations
   yarn migration:run
   
   # Seed data
   yarn db:seed
   ```

### Table Does Not Exist

**Symptoms:**
```
✗ Error: relation "users" does not exist
✗ Error: table "products" not found
```

**Solutions:**

1. **Run migrations:**
   ```bash
   # Generate migrations
   yarn migration:generate src/database/migrations/init
   
   # Run migrations
   yarn migration:run
   ```

2. **Verify tables exist:**
   ```bash
   docker exec -it $(docker ps -q -f "ancestor=postgres:15-alpine") psql -U postgres -d ecommerce -c "\dt"
   
   # Should list tables: users, categories, products, etc.
   ```

3. **Reset database completely:**
   ```bash
   docker-compose down -v
   docker-compose up -d
   sleep 10
   yarn migration:run
   yarn db:seed
   ```

### Foreign Key Constraint Violations

**Symptoms:**
```
✗ Error: violates foreign key constraint "FK_..."
```

**Solutions:**

1. **Re-seed database:**
   ```bash
   yarn db:seed
   # Seed script handles dependencies correctly
   ```

2. **Manual cleanup:**
   ```bash
   docker exec -it $(docker ps -q -f "ancestor=postgres:15-alpine") psql -U postgres -d ecommerce -c "
     TRUNCATE TABLE order_items, orders, cart_items, carts, products, categories, users CASCADE;
   "
   
   yarn db:seed
   ```

## Authentication Issues

### Invalid Credentials

**Symptoms:**
```
✗ Login failed - Status: 401
✗ Unauthorized
```

**Solutions:**

1. **Verify test accounts exist:**
   ```bash
   # Check if users were seeded
   yarn db:seed
   
   # Verify users in database
   docker exec -it $(docker ps -q -f "ancestor=postgres:15-alpine") psql -U postgres -d ecommerce -c "SELECT email, role FROM users;"
   ```

2. **Check password hashing:**
   ```javascript
   // Passwords should be hashed with bcrypt
   // Check seed script uses: bcrypt.hash(password, 10)
   ```

3. **Try default credentials:**
   ```
   Customer:
   - Email: customer@example.com
   - Password: customer123
   
   Admin:
   - Email: admin@example.com
   - Password: admin123
   ```

### Token Expired

**Symptoms:**
```
✗ 401 Unauthorized after some time
```

**Solutions:**

1. **Re-login to get fresh token:**
   ```bash
   # Run login request again
   # Token typically expires after 1 hour
   ```

2. **Check JWT configuration:**
   ```typescript
   // In auth.module.ts
   JwtModule.register({
     secret: process.env.JWT_SECRET,
     signOptions: { expiresIn: '1h' }, // Adjust if needed
   })
   ```

### Missing Authorization Header

**Symptoms:**
```
✗ 401 Unauthorized on protected endpoints
```

**Solutions:**

1. **Verify header format:**
   ```javascript
   // Correct format:
   headers: {
     'Authorization': 'Bearer YOUR_TOKEN_HERE'
   }
   
   // Common mistakes:
   // ❌ 'Authorization': 'YOUR_TOKEN_HERE' (missing 'Bearer')
   // ❌ 'Authorization': 'bearer YOUR_TOKEN_HERE' (lowercase)
   ```

2. **Check token storage:**
   ```javascript
   // In test scripts, verify token is captured
   const response = await axios.post('/auth/login', credentials);
   const token = response.data.access_token; // Check this exists
   ```

## Test Failures

### Tests Pass Locally but Fail in CI

**Symptoms:**
```
✓ Local: All tests pass
✗ CI: Multiple test failures
```

**Solutions:**

1. **Check environment variables:**
   ```yaml
   # In CI configuration
   env:
     DATABASE_HOST: localhost
     DATABASE_PORT: 5433
     NODE_ENV: test
   ```

2. **Ensure database is seeded:**
   ```yaml
   # In CI workflow
   - run: docker-compose up -d
   - run: sleep 10  # Wait for database
   - run: yarn migration:run
   - run: yarn db:seed
   - run: yarn test:api
   ```

3. **Check timing issues:**
   ```javascript
   // Add delays if needed
   await new Promise(resolve => setTimeout(resolve, 1000));
   ```

### Intermittent Test Failures

**Symptoms:**
```
Sometimes passes, sometimes fails
```

**Solutions:**

1. **Check for race conditions:**
   ```typescript
   // Ensure sequential execution
   await testAuthentication();
   await testCategories(); // Don't run in parallel
   ```

2. **Verify data cleanup:**
   ```bash
   # Re-seed before each test run
   yarn db:seed && yarn test:api
   ```

3. **Add retries for flaky tests:**
   ```typescript
   // Implement retry logic
   for (let i = 0; i < 3; i++) {
     try {
       await testFunction();
       break;
     } catch (err) {
       if (i === 2) throw err;
       await sleep(1000);
     }
   }
   ```

### Specific Endpoint Failures

**Symptoms:**
```
✗ Create Order - Status: 500
```

**Solutions:**

1. **Check API logs:**
   ```bash
   # View logs while running tests
   yarn start:dev
   # Watch for error stack traces
   ```

2. **Test endpoint manually:**
   ```bash
   # Use manual testing to debug
   # See manual-testing.md
   ```

3. **Verify request payload:**
   ```typescript
   // Log request before sending
   console.log('Request:', JSON.stringify(payload, null, 2));
   ```

## Seeding Issues

### Seed Script Fails

**Symptoms:**
```
✗ Error during seeding
✗ Database seeding failed
```

**Solutions:**

1. **Check database connection:**
   ```bash
   # Verify database is running
   docker ps | grep postgres
   ```

2. **Verify dependencies:**
   ```bash
   # Install missing packages
   yarn install
   
   # Specifically check:
   yarn list bcrypt
   yarn list pg
   ```

3. **Run with debugging:**
   ```bash
   # Add console logs to seed script
   # Or run with node debug mode
   node --inspect scripts/seed/seed-database.js
   ```

### Duplicate Key Errors

**Symptoms:**
```
✗ Error: duplicate key value violates unique constraint
```

**Solutions:**

1. **Clear data first:**
   ```bash
   # Seed script should truncate first
   # If not, manually clear:
   docker exec -it $(docker ps -q -f "ancestor=postgres:15-alpine") psql -U postgres -d ecommerce -c "
     TRUNCATE TABLE users, categories, products CASCADE;
   "
   ```

2. **Verify seed script clears data:**
   ```javascript
   // In seed-database.js, ensure this exists:
   await client.query('TRUNCATE TABLE ... CASCADE');
   ```

## Performance Issues

### Tests Running Slowly

**Symptoms:**
```
Tests take longer than expected
Comprehensive test taking > 5 minutes
```

**Solutions:**

1. **Check database performance:**
   ```bash
   # Monitor Docker stats
   docker stats
   
   # Check disk space
   df -h
   ```

2. **Optimize database:**
   ```sql
   -- Connect to database
   docker exec -it $(docker ps -q -f "ancestor=postgres:15-alpine") psql -U postgres -d ecommerce
   
   -- Vacuum and analyze
   VACUUM ANALYZE;
   ```

3. **Reduce test load:**
   ```typescript
   // Reduce pagination size in tests
   // Reduce number of test products
   ```

### High Memory Usage

**Symptoms:**
```
System slowdown during tests
Out of memory errors
```

**Solutions:**

1. **Limit Docker resources:**
   ```yaml
   # In docker-compose.yml
   services:
     postgres:
       mem_limit: 512m
   ```

2. **Close unused applications:**
   ```bash
   # Free up system memory
   ```

3. **Run tests in batches:**
   ```bash
   # Run specific test sections
   yarn test:api 2>&1 | grep "PRODUCTS"
   ```

## Environment Issues

### Missing Dependencies

**Symptoms:**
```
✗ Error: Cannot find module 'axios'
✗ Error: Cannot find module 'bcrypt'
```

**Solutions:**

1. **Install all dependencies:**
   ```bash
   # Remove node_modules
   rm -rf node_modules
   
   # Clear cache
   yarn cache clean
   
   # Reinstall
   yarn install
   ```

2. **Check package.json:**
   ```bash
   # Verify dependencies exist
   cat package.json | grep -A 20 "dependencies"
   ```

### TypeScript Compilation Errors

**Symptoms:**
```
✗ Error: Cannot compile TypeScript
✗ TS2304: Cannot find name
```

**Solutions:**

1. **Check TypeScript version:**
   ```bash
   yarn list typescript
   # Should be ^5.7.2
   ```

2. **Verify tsconfig.json:**
   ```bash
   cat tsconfig.json
   # Check compilerOptions
   ```

3. **Install type definitions:**
   ```bash
   yarn add -D @types/node @types/jest
   ```

### Node Version Mismatch

**Symptoms:**
```
✗ Error: Unsupported Node.js version
```

**Solutions:**

1. **Check Node version:**
   ```bash
   node --version
   # Should be >= 18.x
   ```

2. **Use nvm to switch:**
   ```bash
   nvm install 18
   nvm use 18
   ```

3. **Update .nvmrc:**
   ```bash
   echo "18" > .nvmrc
   nvm use
   ```

## Quick Fixes Checklist

When tests fail, try these in order:

- [ ] Is the API running? (`yarn start:dev`)
- [ ] Is the database running? (`docker ps`)
- [ ] Did you seed the database? (`yarn db:seed`)
- [ ] Are dependencies installed? (`yarn install`)
- [ ] Are there any API errors? (check console)
- [ ] Did you try restarting everything?
  ```bash
  docker-compose down -v
  docker-compose up -d
  sleep 10
  yarn migration:run
  yarn db:seed
  yarn start:dev
  ```

## Getting More Help

### View Detailed Errors

```bash
# Run tests with full output
yarn test:api 2>&1 | tee test-output.log

# Check API logs
yarn start:dev | tee api-logs.log

# View database logs
docker logs $(docker ps -q -f "ancestor=postgres:15-alpine")
```

### Debug Mode

```bash
# Run Node in debug mode
node --inspect scripts/test/quick/quick-test.js

# Or with TypeScript
node --inspect -r ts-node/register scripts/test/api/test-api.ts
```

### Contact Information

If you're still stuck:
1. Review API source code for clues
2. Check database schema
3. Review recent commits
4. Consult with team members
5. Create a detailed bug report

## Prevention

### Best Practices

1. **Always seed before testing**
2. **Keep dependencies updated**
3. **Monitor logs during development**
4. **Use version control for scripts**
5. **Document environment setup**
6. **Test in clean environment regularly**
7. **Keep Docker images updated**

### Regular Maintenance

```bash
# Weekly cleanup
docker system prune -a
yarn cache clean
rm -rf node_modules
yarn install

# Monthly updates
yarn upgrade-interactive
```

---

**Last Updated**: November 2025
