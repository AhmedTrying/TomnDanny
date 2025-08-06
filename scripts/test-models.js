#!/usr/bin/env node

/**
 * Quick Model Testing Script
 * Run with: node scripts/test-models.js
 * 
 * This script tests the basic functionality of all models in the system
 * to verify they work correctly and identify any issues.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Test results tracking
let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Helper functions
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'     // Reset
  };
  
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function assert(condition, message) {
  if (condition) {
    testResults.passed++;
    log(`✓ ${message}`, 'success');
  } else {
    testResults.failed++;
    testResults.errors.push(message);
    log(`✗ ${message}`, 'error');
  }
}

function generateTestId() {
  return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Model Testing Functions

async function testCategoriesModel() {
  log('\n=== Testing Categories Model ===', 'info');
  
  try {
    const testCategory = {
      name: `Test Category ${generateTestId()}`,
      description: 'Test category description',
      color: '#FF5733',
      active: true
    };
    
    // Test CREATE
    const { data: created, error: createError } = await supabase
      .from('categories')
      .insert([testCategory])
      .select()
      .single();
    
    assert(!createError && created, 'Category creation');
    assert(created?.name === testCategory.name, 'Category name matches');
    
    // Test READ
    const { data: fetched, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', created.id)
      .single();
    
    assert(!fetchError && fetched, 'Category fetch');
    assert(fetched.color === testCategory.color, 'Category color matches');
    
    // Test UPDATE
    const updatedName = `Updated ${testCategory.name}`;
    const { data: updated, error: updateError } = await supabase
      .from('categories')
      .update({ name: updatedName })
      .eq('id', created.id)
      .select()
      .single();
    
    assert(!updateError && updated, 'Category update');
    assert(updated.name === updatedName, 'Category name updated');
    
    // Test DELETE
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', created.id);
    
    assert(!deleteError, 'Category deletion');
    
  } catch (error) {
    log(`Categories model test failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`Categories: ${error.message}`);
  }
}

async function testProductsModel() {
  log('\n=== Testing Products Model ===', 'info');
  
  try {
    // First create a category for the product
    const { data: category } = await supabase
      .from('categories')
      .insert([{ name: `Test Cat ${generateTestId()}`, color: '#123456' }])
      .select()
      .single();
    
    const testProduct = {
      name: `Test Product ${generateTestId()}`,
      description: 'Test product description',
      price: 9.99,
      category: category.name,
      active: true,
      stock_quantity: 100,
      low_stock_threshold: 10,
      track_stock: true,
      show_in_kitchen: true,
      rating: 4.5,
      reviews_count: 10
    };
    
    // Test CREATE
    const { data: created, error: createError } = await supabase
      .from('products')
      .insert([testProduct])
      .select()
      .single();
    
    assert(!createError && created, 'Product creation');
    assert(created.price === testProduct.price, 'Product price matches');
    assert(created.stock_quantity === testProduct.stock_quantity, 'Product stock matches');
    
    // Test stock management
    const newStock = 50;
    const { data: stockUpdated, error: stockError } = await supabase
      .from('products')
      .update({ stock_quantity: newStock })
      .eq('id', created.id)
      .select()
      .single();
    
    assert(!stockError && stockUpdated, 'Product stock update');
    assert(stockUpdated.stock_quantity === newStock, 'Stock quantity updated correctly');
    
    // Test low stock detection - first set stock below threshold
    const { data: lowStockUpdate, error: lowStockUpdateError } = await supabase
      .from('products')
      .update({ stock_quantity: 5 }) // Set below threshold of 10
      .eq('id', created.id)
      .select()
      .single();
    
    assert(!lowStockUpdateError, 'Low stock setup');
    
    // Test low stock query with a simple threshold
    const { data: lowStockProducts, error: lowStockError } = await supabase
      .from('products')
      .select('*')
      .lt('stock_quantity', 10); // Use hardcoded threshold for testing
    
    assert(!lowStockError, 'Low stock query works');
    assert(lowStockProducts.some(p => p.id === created.id), 'Found low stock product');
    
    // Cleanup
    await supabase.from('products').delete().eq('id', created.id);
    await supabase.from('categories').delete().eq('id', category.id);
    
  } catch (error) {
    log(`Products model test failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`Products: ${error.message}`);
  }
}

async function testOrdersModel() {
  log('\n=== Testing Orders Model ===', 'info');
  
  try {
    const testOrder = {
      table_number: 99,
      items: [
        {
          id: generateTestId(),
          name: 'Test Coffee',
          price: 4.50,
          quantity: 2
        },
        {
          id: generateTestId(),
          name: 'Test Pastry',
          price: 3.00,
          quantity: 1
        }
      ],
      subtotal: 12.00,
      total: 12.00,
      status: 'pending',
      customer_name: 'Test Customer',
      customer_phone: '+1234567890',
      order_notes: 'Test order notes'
    };
    
    // Test CREATE
    const { data: created, error: createError } = await supabase
      .from('orders')
      .insert([testOrder])
      .select()
      .single();
    
    assert(!createError && created, 'Order creation');
    assert(created.table_number === testOrder.table_number, 'Order table number matches');
    assert(created.total === testOrder.total, 'Order total matches');
    assert(Array.isArray(created.items), 'Order items is array');
    assert(created.items.length === 2, 'Order has correct number of items');
    
    // Test status workflow
    const statusFlow = ['pending', 'preparing', 'ready', 'served', 'paid'];
    
    for (let i = 1; i < statusFlow.length; i++) {
      const { data: updated, error: updateError } = await supabase
        .from('orders')
        .update({ status: statusFlow[i] })
        .eq('id', created.id)
        .select()
        .single();
      
      assert(!updateError && updated, `Order status update to ${statusFlow[i]}`);
      assert(updated.status === statusFlow[i], `Order status is ${statusFlow[i]}`);
    }
    
    // Test order filtering
    const { data: pendingOrders, error: filterError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'paid')
      .eq('table_number', 99);
    
    assert(!filterError, 'Order filtering works');
    assert(pendingOrders.length >= 1, 'Found filtered orders');
    
    // Cleanup
    await supabase.from('orders').delete().eq('id', created.id);
    
  } catch (error) {
    log(`Orders model test failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`Orders: ${error.message}`);
  }
}

async function testTablesModel() {
  log('\n=== Testing Tables Model ===', 'info');
  
  try {
    const testTable = {
      number: 999,
      zone: 'Test Zone',
      capacity: 4,
      status: 'active',
      is_available: true
    };
    
    // Test CREATE
    const { data: created, error: createError } = await supabase
      .from('tables')
      .insert([testTable])
      .select()
      .single();
    
    assert(!createError && created, 'Table creation');
    assert(created.number === testTable.number, 'Table number matches');
    assert(created.capacity === testTable.capacity, 'Table capacity matches');
    
    // Test availability toggle
    const { data: updated, error: updateError } = await supabase
      .from('tables')
      .update({ is_available: false, status: 'reserved' })
      .eq('id', created.id)
      .select()
      .single();
    
    assert(!updateError && updated, 'Table status update');
    assert(updated.is_available === false, 'Table marked as unavailable');
    assert(updated.status === 'reserved', 'Table status is reserved');
    
    // Test zone filtering
    const { data: zoneTable, error: zoneError } = await supabase
      .from('tables')
      .select('*')
      .eq('zone', 'Test Zone');
    
    assert(!zoneError, 'Zone filtering works');
    assert(zoneTable.length >= 1, 'Found tables in zone');
    
    // Cleanup
    await supabase.from('tables').delete().eq('id', created.id);
    
  } catch (error) {
    log(`Tables model test failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`Tables: ${error.message}`);
  }
}

async function testStaffModel() {
  log('\n=== Testing Staff Model ===', 'info');
  
  try {
    const testStaff = {
      full_name: `Test Staff ${generateTestId()}`,
      email: `test.staff.${generateTestId()}@test.com`,
      role: 'cashier',
      is_active: true
    };
    
    // Test CREATE
    const { data: created, error: createError } = await supabase
      .from('staff_profiles')
      .insert([testStaff])
      .select()
      .single();
    
    assert(!createError && created, 'Staff creation');
    assert(created.full_name === testStaff.full_name, 'Staff name matches');
    assert(created.role === testStaff.role, 'Staff role matches');
    
    // Test role filtering
    const { data: cashiers, error: roleError } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('role', 'cashier');
    
    assert(!roleError, 'Role filtering works');
    assert(cashiers.length >= 1, 'Found cashier staff');
    
    // Test active status toggle
    const { data: updated, error: updateError } = await supabase
      .from('staff_profiles')
      .update({ is_active: false })
      .eq('user_id', created.user_id)
      .select()
      .single();
    
    assert(!updateError && updated, 'Staff status update');
    assert(updated.is_active === false, 'Staff marked as inactive');
    
    // Cleanup
    await supabase.from('staff_profiles').delete().eq('user_id', created.user_id);
    
  } catch (error) {
    log(`Staff model test failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`Staff: ${error.message}`);
  }
}

async function testSettingsModel() {
  log('\n=== Testing Settings Model ===', 'info');
  
  try {
    const testSettings = {
      cafe_name: 'Test Cafe',
      location: 'Test Location',
      phone_number: '+1234567890',
      system_config: {
        auto_print: true,
        notifications: true,
        kitchen_auto_refresh: true,
        order_timeout_alerts: false
      }
    };
    
    // Test CREATE/UPDATE (settings uses upsert pattern)
    const { data: created, error: createError } = await supabase
      .from('settings')
      .insert([testSettings])
      .select()
      .single();
    
    assert(!createError && created, 'Settings creation');
    assert(created.cafe_name === testSettings.cafe_name, 'Cafe name matches');
    assert(typeof created.system_config === 'object', 'System config is object');
    
    // Test configuration update
    const updatedConfig = {
      ...testSettings.system_config,
      auto_print: false,
      new_feature: true
    };
    
    const { data: updated, error: updateError } = await supabase
      .from('settings')
      .update({ system_config: updatedConfig })
      .eq('id', created.id)
      .select()
      .single();
    
    assert(!updateError && updated, 'Settings config update');
    assert(updated.system_config.auto_print === false, 'Config updated correctly');
    
    // Cleanup
    await supabase.from('settings').delete().eq('id', created.id);
    
  } catch (error) {
    log(`Settings model test failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`Settings: ${error.message}`);
  }
}

async function testReservationsModel() {
  log('\n=== Testing Reservations Model ===', 'info');
  
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const testReservation = {
      reservation_date: tomorrow.toISOString().split('T')[0],
      reservation_time: '19:00:00',
      number_of_people: 4,
      customer_name: 'Test Customer',
      customer_phone: '+1234567890',
      customer_email: 'test@test.com',
      status: 'pending',
      special_requests: 'Window seat please'
    };
    
    // Test CREATE
    const { data: created, error: createError } = await supabase
      .from('reservations')
      .insert([testReservation])
      .select()
      .single();
    
    assert(!createError && created, 'Reservation creation');
    assert(created.customer_name === testReservation.customer_name, 'Customer name matches');
    assert(created.number_of_people === testReservation.number_of_people, 'Party size matches');
    
    // Test status workflow
    const statusFlow = ['pending', 'confirmed', 'completed'];
    
    for (let i = 1; i < statusFlow.length; i++) {
      const { data: updated, error: updateError } = await supabase
        .from('reservations')
        .update({ status: statusFlow[i] })
        .eq('id', created.id)
        .select()
        .single();
      
      assert(!updateError && updated, `Reservation status update to ${statusFlow[i]}`);
      assert(updated.status === statusFlow[i], `Reservation status is ${statusFlow[i]}`);
    }
    
    // Test date filtering
    const { data: dateFiltered, error: dateError } = await supabase
      .from('reservations')
      .select('*')
      .eq('reservation_date', testReservation.reservation_date);
    
    assert(!dateError, 'Date filtering works');
    assert(dateFiltered.length >= 1, 'Found reservations for date');
    
    // Cleanup
    await supabase.from('reservations').delete().eq('id', created.id);
    
  } catch (error) {
    log(`Reservations model test failed: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`Reservations: ${error.message}`);
  }
}

// Main test runner
async function runAllTests() {
  log('🚀 Starting Model Testing Suite', 'info');
  log('=====================================', 'info');
  
  const startTime = Date.now();
  
  try {
    await testCategoriesModel();
    await testProductsModel();
    await testOrdersModel();
    await testTablesModel();
    await testStaffModel();
    await testSettingsModel();
    await testReservationsModel();
    
  } catch (error) {
    log(`\nUnexpected error during testing: ${error.message}`, 'error');
    testResults.failed++;
    testResults.errors.push(`Unexpected: ${error.message}`);
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Print results
  log('\n=====================================', 'info');
  log('📊 Test Results Summary', 'info');
  log('=====================================', 'info');
  log(`✅ Passed: ${testResults.passed}`, 'success');
  log(`❌ Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'info');
  log(`⏱️  Duration: ${duration}s`, 'info');
  
  if (testResults.errors.length > 0) {
    log('\n🔍 Error Details:', 'warning');
    testResults.errors.forEach((error, index) => {
      log(`${index + 1}. ${error}`, 'error');
    });
  }
  
  const successRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1);
  log(`\n📈 Success Rate: ${successRate}%`, successRate >= 90 ? 'success' : 'warning');
  
  if (testResults.failed === 0) {
    log('\n🎉 All tests passed! Your models are working correctly.', 'success');
  } else {
    log('\n⚠️  Some tests failed. Please check the errors above.', 'warning');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch((error) => {
    log(`\nFatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testCategoriesModel,
  testProductsModel,
  testOrdersModel,
  testTablesModel,
  testStaffModel,
  testSettingsModel,
  testReservationsModel
};