# Model Testing Guide

## Quick Start

To test all your system models quickly, run:

```bash
npm run test:models
```

This will test all core models in your restaurant management system and provide a detailed report.

## What Gets Tested

The test script validates the following models and their functionality:

### 🏷️ Categories Model
- ✅ Create new categories
- ✅ Read category data
- ✅ Update category properties
- ✅ Delete categories
- ✅ Color and description handling

### 🍕 Products Model
- ✅ Create products with categories
- ✅ Stock quantity management
- ✅ Low stock threshold detection
- ✅ Price and rating handling
- ✅ Kitchen display settings

### 📋 Orders Model
- ✅ Create orders with items
- ✅ Order status workflow (pending → preparing → ready → served → paid)
- ✅ Customer information handling
- ✅ Order total calculations
- ✅ Table number assignment

### 🪑 Tables Model
- ✅ Create and manage tables
- ✅ Availability status tracking
- ✅ Zone organization
- ✅ Capacity management
- ✅ Status updates (active, reserved, etc.)

### 👥 Staff Model
- ✅ Staff profile creation
- ✅ Role assignment (cashier, kitchen, admin)
- ✅ Active/inactive status
- ✅ Contact information

### ⚙️ Settings Model
- ✅ System configuration management
- ✅ Cafe information (name, location, phone)
- ✅ JSON configuration handling
- ✅ Feature toggles (auto-print, notifications)

### 📅 Reservations Model
- ✅ Reservation creation and management
- ✅ Date and time handling
- ✅ Customer information
- ✅ Status workflow (pending → confirmed → completed)
- ✅ Special requests handling

## Test Output

The script provides:

- ✅ **Real-time feedback** with color-coded results
- 📊 **Summary statistics** (passed/failed tests)
- 🔍 **Detailed error messages** for failed tests
- ⏱️ **Performance timing** for test execution
- 📈 **Success rate percentage**

## Example Output

```
🚀 Starting Model Testing Suite
=====================================

=== Testing Categories Model ===
✓ Category creation
✓ Category name matches
✓ Category fetch
✓ Category color matches
✓ Category update
✓ Category name updated
✓ Category deletion

=== Testing Products Model ===
✓ Product creation
✓ Product price matches
✓ Product stock matches
✓ Product stock update
✓ Stock quantity updated correctly
✓ Low stock query works

... (continues for all models)

=====================================
📊 Test Results Summary
=====================================
✅ Passed: 45
❌ Failed: 0
⏱️  Duration: 2.34s

📈 Success Rate: 100.0%

🎉 All tests passed! Your models are working correctly.
```

## Prerequisites

Before running the tests, ensure:

1. **Environment Variables**: Your `.env.local` file contains:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Database Access**: Your Supabase database is accessible and contains the required tables

3. **Dependencies**: Run `npm install` to ensure all dependencies are installed

## Troubleshooting

### Common Issues

**❌ "Cannot connect to database"**
- Check your Supabase URL and keys in `.env.local`
- Verify your internet connection
- Ensure Supabase project is active

**❌ "Table does not exist"**
- Run your database migrations
- Check if all tables are created in Supabase
- Verify table names match your schema

**❌ "Permission denied"**
- Check your Row Level Security (RLS) policies
- Ensure service role key has proper permissions
- Verify API key permissions in Supabase dashboard

**❌ "Test data conflicts"**
- The script uses unique test identifiers to avoid conflicts
- If tests fail due to existing data, check for duplicate constraints
- Ensure test cleanup is working properly

### Manual Testing

You can also test individual models by importing the functions:

```javascript
const { testProductsModel, testOrdersModel } = require('./scripts/test-models.js');

// Test only products
testProductsModel().then(() => console.log('Products test complete'));

// Test only orders
testOrdersModel().then(() => console.log('Orders test complete'));
```

## Next Steps

After running the model tests:

1. **Fix any failing tests** before proceeding with development
2. **Review the TESTING-PLAN.md** for comprehensive testing strategies
3. **Check TESTING-IMPLEMENTATION-GUIDE.md** for advanced testing setups
4. **Run integration tests** to test complete workflows
5. **Set up automated testing** in your CI/CD pipeline

## Integration with Development Workflow

Consider running model tests:

- ✅ **Before deploying** to production
- ✅ **After database schema changes**
- ✅ **When adding new features**
- ✅ **During debugging** to isolate issues
- ✅ **As part of CI/CD pipeline**

---

💡 **Tip**: Run `npm run test:models` regularly during development to catch issues early and ensure your models are working correctly!