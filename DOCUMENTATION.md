# 📚 Tomm&Danny - Technical Documentation

## 🏗️ Architecture Overview

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (API Routes)  │◄──►│   (Supabase)    │
│                 │    │                 │    │                 │
│ • React 19      │    │ • Next.js API   │    │ • PostgreSQL    │
│ • TypeScript    │    │ • Supabase SDK  │    │ • Real-time     │
│ • Tailwind CSS  │    │ • Authentication │    │ • File Storage  │
│ • Radix UI      │    │ • File Upload   │    │ • Row Level Sec │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow
1. **User Interaction** → Frontend Components
2. **API Calls** → Next.js API Routes
3. **Database Operations** → Supabase Client
4. **Real-time Updates** → Supabase Subscriptions
5. **State Management** → React Context + Local State

## 🗄️ Database Schema

### Core Tables

#### Products Table
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  show_in_kitchen BOOLEAN DEFAULT true,
  is_bestselling BOOLEAN DEFAULT false,
  rating DECIMAL(3,2) DEFAULT 0,
  estimated_prep_time INTEGER DEFAULT 10,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Orders Table
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  table_number INTEGER,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  status VARCHAR(50) DEFAULT 'pending',
  order_type VARCHAR(20) DEFAULT 'dine-in',
  total_amount DECIMAL(10,2) DEFAULT 0,
  payment_method VARCHAR(50),
  payment_proof_url TEXT,
  special_requests TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Staff Table
```sql
CREATE TABLE staff (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Relationships
- **Products** ↔ **Categories** (Many-to-One)
- **Orders** ↔ **Order Items** (One-to-Many)
- **Orders** ↔ **Tables** (Many-to-One)
- **Staff** ↔ **Auth Users** (One-to-One)
- **Customers** ↔ **Orders** (One-to-Many)
- **Products** ↔ **Reviews** (One-to-Many)

## 🔐 Authentication & Authorization

### User Roles
```typescript
type UserRole = 'admin' | 'cashier' | 'kitchen' | 'customer';

interface UserMetadata {
  role: UserRole;
  staff_id?: number;
  permissions?: string[];
}
```

### Role Permissions
| Feature | Admin | Cashier | Kitchen | Customer |
|---------|-------|---------|---------|----------|
| View Menu | ✅ | ✅ | ✅ | ✅ |
| Place Orders | ✅ | ✅ | ❌ | ✅ |
| Kitchen Display | ✅ | ❌ | ✅ | ❌ |
| POS System | ✅ | ✅ | ❌ | ❌ |
| Admin Dashboard | ✅ | ❌ | ❌ | ❌ |
| Staff Management | ✅ | ❌ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ | ❌ |

### Authentication Flow
```typescript
// Auth Context Implementation
const AuthContext = createContext<{
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}>({} as any);

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }: {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}) => {
  const { user } = useAuth();
  const userRole = user?.user_metadata?.role;
  
  if (!allowedRoles.includes(userRole)) {
    return <AccessDenied />;
  }
  
  return <>{children}</>;
};
```

## 🔄 Real-time Features

### Supabase Subscriptions
```typescript
// Order Updates Subscription
const subscribeToOrders = () => {
  return supabase
    .channel('orders')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'orders'
    }, (payload) => {
      handleOrderUpdate(payload);
    })
    .subscribe();
};

// Kitchen Display Updates
const subscribeToKitchenOrders = () => {
  return supabase
    .channel('kitchen-orders')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'orders',
      filter: 'status=eq.pending'
    }, (payload) => {
      playNewOrderSound();
      updateKitchenDisplay(payload.new);
    })
    .subscribe();
};
```

### Smart Refresh Hook
```typescript
const useSmartRefresh = ({
  refreshFn,
  interval = 30000,
  activityThreshold = 60000
}) => {
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  useEffect(() => {
    const handleActivity = () => setLastActivity(Date.now());
    
    // Activity listeners
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
    };
  }, []);
  
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivity;
      
      if (timeSinceActivity > activityThreshold && !isRefreshing) {
        setIsRefreshing(true);
        refreshFn().finally(() => setIsRefreshing(false));
      }
    }, interval);
    
    return () => clearInterval(refreshInterval);
  }, [lastActivity, refreshFn, interval, activityThreshold, isRefreshing]);
};
```

## 🎵 Sound Notification System

### Sound Management
```typescript
interface SoundConfig {
  newOrder: string;
  serviceRequest: string;
  urgent: string;
  enabled: boolean;
  volume: number;
}

const useSoundNotifications = () => {
  const [config, setConfig] = useState<SoundConfig>({
    newOrder: '/sounds/new-order.wav',
    serviceRequest: '/sounds/service-request.wav',
    urgent: '/sounds/urgent.wav',
    enabled: true,
    volume: 0.7
  });
  
  const playSound = useCallback((type: keyof SoundConfig) => {
    if (!config.enabled || typeof window === 'undefined') return;
    
    const audio = new Audio(config[type] as string);
    audio.volume = config.volume;
    audio.play().catch(console.error);
  }, [config]);
  
  return { playSound, config, setConfig };
};
```

## 📊 State Management

### Context Providers
```typescript
// Settings Context
interface SettingsContextType {
  cafe_name: string;
  location: string;
  phone_number: string;
  operating_hours: OperatingHours;
  system_config: SystemConfig;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
}

// Auth Context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}
```

### Component State Patterns
```typescript
// Custom Hook for Data Fetching
const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(*)')
        .eq('is_available', true);
        
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  
  return { products, loading, error, refetch: fetchProducts };
};
```

## 🎨 UI/UX Design System

### Color Palette
```css
:root {
  --brand-navy: #2C5F2D;
  --brand-dark-brown: #8B4513;
  --brand-medium-brown: #A0522D;
  --brand-caramel: #D2B48C;
  --brand-cream: #F5F5DC;
}
```

### Component Patterns
```typescript
// Base Button Component
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
}

// Card Component Pattern
const Card = ({ children, className, ...props }: CardProps) => {
  return (
    <div 
      className={cn(
        "bg-white rounded-lg shadow-md border border-gray-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
```

### Responsive Design
```typescript
// Mobile-first breakpoints
const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// Usage in components
const ResponsiveGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Grid items */}
  </div>
);
```

## 🔧 API Design

### RESTful Endpoints
```typescript
// Products API
GET    /api/products              // List all products
POST   /api/products              // Create product
GET    /api/products/[id]         // Get product by ID
PUT    /api/products/[id]         // Update product
DELETE /api/products/[id]         // Delete product
GET    /api/products/low-stock    // Get low stock products

// Orders API
GET    /api/orders                // List orders
POST   /api/orders                // Create order
GET    /api/orders/[id]           // Get order by ID
PUT    /api/orders/[id]           // Update order
GET    /api/orders/recent         // Get recent orders
```

### API Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Example implementation
export async function GET(request: Request) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*');
      
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

## 🧪 Testing Strategy

### Model Testing
```javascript
// Example test from test-models.js
const testProductCRUD = async () => {
  console.log('\n=== Testing Products Model ===');
  
  // Create
  const { data: newProduct, error: createError } = await supabase
    .from('products')
    .insert({
      name: `Test Product ${testId}`,
      price: 9.99,
      category_id: testCategoryId,
      description: 'Test product description'
    })
    .select()
    .single();
    
  assert(createError === null, 'Product creation should not error');
  assert(newProduct !== null, 'Product should be created');
  
  // Read
  const { data: fetchedProduct } = await supabase
    .from('products')
    .select('*')
    .eq('id', newProduct.id)
    .single();
    
  assert(fetchedProduct.name === newProduct.name, 'Product name should match');
  
  // Update
  const { error: updateError } = await supabase
    .from('products')
    .update({ price: 12.99 })
    .eq('id', newProduct.id);
    
  assert(updateError === null, 'Product update should not error');
  
  // Delete
  const { error: deleteError } = await supabase
    .from('products')
    .delete()
    .eq('id', newProduct.id);
    
  assert(deleteError === null, 'Product deletion should not error');
};
```

### Integration Testing
```typescript
// Cypress example
describe('Order Flow', () => {
  it('should complete a full order', () => {
    cy.visit('/menu?table=5');
    cy.get('[data-testid="product-card"]').first().click();
    cy.get('[data-testid="add-to-cart"]').click();
    cy.get('[data-testid="checkout"]').click();
    cy.get('[data-testid="customer-name"]').type('John Doe');
    cy.get('[data-testid="place-order"]').click();
    cy.get('[data-testid="order-confirmation"]').should('be.visible');
  });
});
```

## 🚀 Deployment

### Environment Variables
```bash
# Required for all environments
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_ENVIRONMENT=production
```

### Build Process
```bash
# Install dependencies
npm ci

# Run tests
npm run test:models

# Build application
npm run build

# Start production server
npm start
```

### Database Migration
```sql
-- Run in order:
1. scripts/complete-system-database.sql
2. scripts/fix-permissions.sql
3. scripts/setup-users.sql
```

## 📈 Performance Optimization

### Database Optimization
```sql
-- Indexes for better query performance
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_table_number ON orders(table_number);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_available ON products(is_available);
```

### Frontend Optimization
```typescript
// Lazy loading components
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const KitchenDisplay = lazy(() => import('./KitchenDisplay'));

// Memoization for expensive calculations
const OrderSummary = memo(({ order }: { order: Order }) => {
  const total = useMemo(() => 
    order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    [order.items]
  );
  
  return <div>Total: ${total.toFixed(2)}</div>;
});
```

## 🔍 Monitoring & Analytics

### Error Tracking
```typescript
// Error boundary implementation
class ErrorBoundary extends Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to monitoring service
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    
    return this.props.children;
  }
}
```

### Performance Metrics
```typescript
// Custom hook for performance monitoring
const usePerformanceMonitoring = () => {
  useEffect(() => {
    // Monitor page load times
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          console.log('Page load time:', entry.duration);
        }
      });
    });
    
    observer.observe({ entryTypes: ['navigation'] });
    
    return () => observer.disconnect();
  }, []);
};
```

This technical documentation provides comprehensive details for developers working on the Tomm&Danny restaurant management system. It covers architecture, implementation patterns, and best practices used throughout the codebase.