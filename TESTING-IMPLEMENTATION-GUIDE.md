# Testing Implementation Guide - Practical Test Cases

## Quick Start Testing Setup

### 1. Install Testing Dependencies
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev cypress @types/jest
npm install --save-dev supertest # for API testing
```

### 2. Jest Configuration (jest.config.js)
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './'
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/']
}

module.exports = createJestConfig(customJestConfig)
```

## Model Testing Examples

### 1. Products Model Testing

#### API Testing (products.test.js)
```javascript
import { createMocks } from 'node-mocks-http'
import handler from '../pages/api/products'
import { supabase } from '../lib/supabase'

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis()
    }))
  }
}))

describe('/api/products', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('GET - should fetch all products', async () => {
    const mockProducts = [
      {
        id: '1',
        name: 'Cappuccino',
        price: 4.50,
        category: 'Coffee',
        active: true
      }
    ]

    supabase.from().select.mockResolvedValue({
      data: mockProducts,
      error: null
    })

    const { req, res } = createMocks({ method: 'GET' })
    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual(mockProducts)
  })

  test('POST - should create new product', async () => {
    const newProduct = {
      name: 'Latte',
      price: 5.00,
      category: 'Coffee',
      description: 'Smooth and creamy'
    }

    supabase.from().insert.mockResolvedValue({
      data: [{ id: '2', ...newProduct }],
      error: null
    })

    const { req, res } = createMocks({
      method: 'POST',
      body: newProduct
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(201)
    expect(supabase.from).toHaveBeenCalledWith('products')
  })

  test('POST - should validate required fields', async () => {
    const invalidProduct = {
      description: 'Missing name and price'
    }

    const { req, res } = createMocks({
      method: 'POST',
      body: invalidProduct
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
  })
})
```

#### Component Testing (ProductCard.test.jsx)
```javascript
import { render, screen, fireEvent } from '@testing-library/react'
import ProductCard from '../components/shared/ProductCard'

const mockProduct = {
  id: '1',
  name: 'Cappuccino',
  price: 4.50,
  description: 'Rich espresso with steamed milk',
  image_url: '/images/cappuccino.jpg',
  category: 'Coffee',
  rating: 4.5,
  active: true
}

describe('ProductCard', () => {
  test('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />)
    
    expect(screen.getByText('Cappuccino')).toBeInTheDocument()
    expect(screen.getByText('$4.50')).toBeInTheDocument()
    expect(screen.getByText('Rich espresso with steamed milk')).toBeInTheDocument()
  })

  test('handles add to cart action', () => {
    const mockAddToCart = jest.fn()
    render(<ProductCard product={mockProduct} onAddToCart={mockAddToCart} />)
    
    const addButton = screen.getByRole('button', { name: /add to cart/i })
    fireEvent.click(addButton)
    
    expect(mockAddToCart).toHaveBeenCalledWith(mockProduct)
  })

  test('shows out of stock state', () => {
    const outOfStockProduct = { ...mockProduct, stock_quantity: 0 }
    render(<ProductCard product={outOfStockProduct} />)
    
    expect(screen.getByText(/out of stock/i)).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### 2. Orders Model Testing

#### Order Workflow Testing (orderWorkflow.test.js)
```javascript
import { createOrder, updateOrderStatus, calculateOrderTotal } from '../lib/orderUtils'

describe('Order Workflow', () => {
  test('should create order with correct total calculation', () => {
    const orderItems = [
      { id: '1', name: 'Cappuccino', price: 4.50, quantity: 2 },
      { id: '2', name: 'Croissant', price: 3.00, quantity: 1 }
    ]
    
    const fees = [{ name: 'Service Fee', amount: 1.50, type: 'fixed' }]
    const discount = { amount: 2.00, type: 'fixed' }
    
    const total = calculateOrderTotal(orderItems, fees, discount)
    
    // (4.50 * 2) + 3.00 + 1.50 - 2.00 = 11.50
    expect(total).toBe(11.50)
  })

  test('should handle order status transitions', async () => {
    const orderId = 'test-order-1'
    
    // Test valid status transition
    const result = await updateOrderStatus(orderId, 'pending', 'preparing')
    expect(result.success).toBe(true)
    
    // Test invalid status transition
    const invalidResult = await updateOrderStatus(orderId, 'pending', 'served')
    expect(invalidResult.success).toBe(false)
    expect(invalidResult.error).toContain('Invalid status transition')
  })

  test('should validate order items before creation', () => {
    const invalidOrder = {
      table_number: null,
      items: [],
      customer_name: ''
    }
    
    expect(() => createOrder(invalidOrder)).toThrow('Table number is required')
  })
})
```

### 3. Authentication & Authorization Testing

#### Auth Context Testing (authContext.test.jsx)
```javascript
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../lib/auth-context'
import { supabase } from '../lib/supabase'

// Mock Supabase auth
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn()
    }
  }
}))

const TestComponent = () => {
  const { user, signIn, loading } = useAuth()
  
  if (loading) return <div>Loading...</div>
  if (user) return <div>Welcome {user.email}</div>
  return <button onClick={() => signIn('test@test.com', 'password')}>Sign In</button>
}

describe('AuthContext', () => {
  test('should handle user authentication', async () => {
    const mockUser = { id: '1', email: 'test@test.com', role: 'admin' }
    const mockSession = { user: mockUser, access_token: 'token' }
    
    supabase.auth.getSession.mockResolvedValue({ data: { session: mockSession } })
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    })
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Welcome test@test.com')).toBeInTheDocument()
    })
  })
})
```

### 4. Integration Testing with Cypress

#### Complete Order Flow (cypress/e2e/orderFlow.cy.js)
```javascript
describe('Complete Order Flow', () => {
  beforeEach(() => {
    // Setup test data
    cy.task('seedDatabase')
    cy.visit('/menu?table=5')
  })

  it('should complete a full dine-in order', () => {
    // Select products
    cy.get('[data-testid="product-card"]').first().click()
    cy.get('[data-testid="add-to-cart"]').click()
    
    // Add another item
    cy.get('[data-testid="product-card"]').eq(1).click()
    cy.get('[data-testid="quantity-input"]').clear().type('2')
    cy.get('[data-testid="add-to-cart"]').click()
    
    // Review cart
    cy.get('[data-testid="cart-button"]').click()
    cy.get('[data-testid="cart-items"]').should('have.length', 2)
    
    // Add customer information
    cy.get('[data-testid="customer-name"]').type('John Doe')
    cy.get('[data-testid="customer-phone"]').type('+1234567890')
    
    // Place order
    cy.get('[data-testid="place-order"]').click()
    
    // Verify order confirmation
    cy.get('[data-testid="order-confirmation"]').should('be.visible')
    cy.get('[data-testid="order-id"]').should('contain', 'Order #')
  })

  it('should handle kitchen workflow', () => {
    // Create an order first
    cy.createTestOrder()
    
    // Switch to kitchen view
    cy.visit('/kitchen')
    cy.login('kitchen@test.com', 'password')
    
    // Verify order appears in kitchen
    cy.get('[data-testid="pending-orders"]').should('contain', 'Table 5')
    
    // Start preparing order
    cy.get('[data-testid="start-preparing"]').first().click()
    cy.get('[data-testid="order-status"]').should('contain', 'Preparing')
    
    // Mark as ready
    cy.get('[data-testid="mark-ready"]').click()
    cy.get('[data-testid="order-status"]').should('contain', 'Ready')
  })
})
```

## Performance Testing Examples

### Load Testing with Artillery (artillery.yml)
```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 20
  defaults:
    headers:
      Content-Type: 'application/json'

scenarios:
  - name: "Menu browsing"
    weight: 70
    flow:
      - get:
          url: "/api/products"
      - get:
          url: "/api/categories"
      - think: 2
      
  - name: "Order creation"
    weight: 30
    flow:
      - post:
          url: "/api/orders"
          json:
            table_number: 5
            items: 
              - id: "{{ $randomUUID }}"
                name: "Test Product"
                price: 10.00
                quantity: 1
            total: 10.00
```

## Database Testing Strategies

### 1. Test Data Seeding
```javascript
// scripts/testSeed.js
const { supabase } = require('../lib/supabase')

async function seedTestData() {
  // Clear existing test data
  await supabase.from('orders').delete().like('customer_name', 'Test%')
  await supabase.from('products').delete().like('name', 'Test%')
  
  // Seed categories
  const categories = [
    { name: 'Test Coffee', description: 'Test coffee category', color: '#8B4513' },
    { name: 'Test Pastry', description: 'Test pastry category', color: '#DEB887' }
  ]
  
  const { data: categoryData } = await supabase
    .from('categories')
    .insert(categories)
    .select()
  
  // Seed products
  const products = [
    {
      name: 'Test Cappuccino',
      price: 4.50,
      category: categoryData[0].id,
      description: 'Test cappuccino',
      active: true,
      stock_quantity: 100
    },
    {
      name: 'Test Croissant',
      price: 3.00,
      category: categoryData[1].id,
      description: 'Test croissant',
      active: true,
      stock_quantity: 50
    }
  ]
  
  await supabase.from('products').insert(products)
  
  console.log('Test data seeded successfully')
}

if (require.main === module) {
  seedTestData().catch(console.error)
}

module.exports = { seedTestData }
```

### 2. Database Transaction Testing
```javascript
// Test database transactions for order creation
describe('Order Transaction Testing', () => {
  test('should rollback on payment failure', async () => {
    const orderData = {
      table_number: 5,
      items: [{ id: '1', quantity: 2, price: 10.00 }],
      total: 20.00
    }
    
    // Mock payment failure
    jest.spyOn(paymentService, 'processPayment').mockRejectedValue(new Error('Payment failed'))
    
    await expect(createOrderWithPayment(orderData)).rejects.toThrow('Payment failed')
    
    // Verify order was not created
    const orders = await supabase
      .from('orders')
      .select('*')
      .eq('table_number', 5)
    
    expect(orders.data).toHaveLength(0)
  })
})
```

## Real-time Testing

### WebSocket/Realtime Testing
```javascript
describe('Real-time Updates', () => {
  test('should receive order status updates', (done) => {
    const subscription = supabase
      .channel('orders')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders'
      }, (payload) => {
        expect(payload.new.status).toBe('preparing')
        subscription.unsubscribe()
        done()
      })
      .subscribe()
    
    // Trigger status update
    setTimeout(() => {
      updateOrderStatus('test-order-1', 'preparing')
    }, 100)
  })
})
```

## Testing Checklist

### Before Each Test Run
- [ ] Database is in clean state
- [ ] Test data is properly seeded
- [ ] Environment variables are set
- [ ] Mock services are configured

### Model Testing Checklist
- [ ] CRUD operations work correctly
- [ ] Data validation is enforced
- [ ] Business rules are applied
- [ ] Error handling is proper
- [ ] Relationships are maintained

### Integration Testing Checklist
- [ ] API endpoints respond correctly
- [ ] Frontend components render properly
- [ ] User workflows complete successfully
- [ ] Real-time updates work
- [ ] Error states are handled

### Performance Testing Checklist
- [ ] Response times are acceptable
- [ ] System handles expected load
- [ ] Database queries are optimized
- [ ] Memory usage is reasonable
- [ ] No memory leaks detected

## Running Tests

### Unit Tests
```bash
npm test                    # Run all tests
npm test -- --watch        # Run in watch mode
npm test -- --coverage     # Run with coverage
```

### Integration Tests
```bash
npx cypress open           # Open Cypress GUI
npx cypress run            # Run headless
```

### Performance Tests
```bash
npx artillery run artillery.yml
```

This implementation guide provides concrete examples and practical steps to start testing your restaurant management system effectively. Each test case is designed to validate specific functionality while ensuring the overall system reliability.