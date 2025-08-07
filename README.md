# 🍕 Tomm&Danny - Coffee Shop Management System

> A modern, full-stack restaurant management system built with Next.js, TypeScript, and Supabase. Streamline your café operations with real-time order management, kitchen displays, staff coordination, and comprehensive analytics.

![Project Banner]
<img width="1913" height="944" alt="image" src="https://github.com/user-attachments/assets/09557a1d-0e2b-49fa-8c50-2e70cd2026b8" />
## 🌟 Features

### 🛒 **Customer Experience**
- **QR Code Menu Ordering** - Contactless dining with table-specific QR codes
- **Real-time Menu** - Dynamic menu with live stock updates and pricing
- **Order Tracking** - Live order status updates for customers
- **Table Reservations** - Advanced booking system with pre-order capabilities
- **Customer Reviews** - Integrated rating and feedback system
- **Event Management** - Special events and promotions

### 👨‍🍳 **Kitchen Operations**
- **Kitchen Display System** - Real-time order management for kitchen staff
- **Order Prioritization** - Urgent alerts for orders over 15 minutes
- **Preparation Tracking** - Status updates from pending to ready
- **Stock Management** - Low stock alerts and inventory tracking
- **Recipe Management** - Product add-ons and customization options

### 💰 **Point of Sale (POS)**
- **Cashier Interface** - Streamlined order processing and payment handling
- **Multiple Payment Methods** - Cash, card, and digital payment support
- **Receipt Generation** - Automatic receipt printing and digital copies
- **Discount Management** - Promotional codes and special offers
- **Daily Sales Reports** - Comprehensive financial analytics

### 📊 **Admin Dashboard**
- **Real-time Analytics** - Sales, orders, and performance metrics
- **Staff Management** - Employee profiles, roles, and check-in system
- **Menu Management** - Product catalog, categories, and pricing
- **Table Management** - Table layout, capacity, and availability
- **Settings Configuration** - System-wide settings and customization

### 🔔 **Smart Features**
- **Real-time Notifications** - Sound alerts for new orders and service requests
- **Auto-refresh System** - Smart data synchronization with activity detection
- **Role-based Access** - Secure authentication with staff role management
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives
- **State Management**: React Context API
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for analytics visualization

### **Backend**
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with role-based access
- **API**: Next.js API Routes
- **Real-time**: Supabase Realtime subscriptions
- **File Storage**: Supabase Storage for images and documents

### **Development Tools**
- **Package Manager**: npm
- **Linting**: ESLint
- **Testing**: Custom model testing suite
- **Version Control**: Git

## 📱 Screenshots

### Customer Menu Interface
![Menu Interface]
<img width="1917" height="942" alt="image" src="https://github.com/user-attachments/assets/1fa3a49a-70cf-4178-80f4-0a1e5f402bfb" />

*QR code-based menu ordering with real-time stock updates*

### Kitchen Display System
![Kitchen Display]
<img width="1918" height="942" alt="image" src="https://github.com/user-attachments/assets/056d9e92-b88c-4905-bde1-e1a27d973a3c" />

*Real-time order management for kitchen staff*

### Admin Dashboard
![Admin Dashboard]
<img width="1917" height="942" alt="image" src="https://github.com/user-attachments/assets/3743d610-9980-44b7-a69a-ad6cdaefeee9" />

*Comprehensive analytics and management interface*

### POS System
![POS Interface]
<img width="1919" height="947" alt="image" src="https://github.com/user-attachments/assets/9878768d-0eaa-4d47-8f68-1b6d00d42674" />
*Streamlined cashier interface for order processing*

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Git
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/tommdanny-restaurant-system.git
   cd tommdanny-restaurant-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Database Setup**
   ```bash
   # Run the database setup script in Supabase SQL Editor:
   # 1. scripts/Database.sql
   # 2. scripts/fix-permissions.sql
   # 3. scripts/setup-users.sql
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000` to see the application.

### 🌐 Deploy to Vercel

**One-Click Deploy:**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/tommdanny-restaurant-system)

**Manual Deployment:**

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project" → Import from GitHub
   - Select your repository
   - Add environment variables (see `.env.example`)
   - Click "Deploy"

3. **Configure Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_ENVIRONMENT=production
   ```

For detailed deployment instructions, see [VERCEL-DEPLOYMENT.md](VERCEL-DEPLOYMENT.md).
## 🧪 Testing

The project includes a comprehensive testing suite for all database models:

```bash
# Run model tests
npm run test:models
```

This tests all core functionality including:
- ✅ Categories, Products, Orders, Tables
- ✅ Staff management and authentication
- ✅ Settings and configuration
- ✅ Reservations and customer data

For detailed testing information, see [MODEL-TESTING-GUIDE.md](MODEL-TESTING-GUIDE.md).

## 📁 Project Structure

```
tommdanny/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── cashier/           # POS interface
│   ├── kitchen/           # Kitchen display
│   ├── menu/              # Customer menu
│   └── dine-in/           # Table-specific landing
├── components/            # Reusable UI components
│   ├── admin/             # Admin-specific components
│   ├── cashier/           # POS components
│   ├── shared/            # Shared components
│   └── ui/                # Base UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and contexts
├── scripts/               # Database and utility scripts
└── public/                # Static assets
```

## 🔧 Configuration

### Database Models
The system includes comprehensive database models:
- **Products & Categories** - Menu item management
- **Orders & Order Items** - Order processing and tracking
- **Tables & Reservations** - Table and booking management
- **Staff & Authentication** - User and role management
- **Customers & Reviews** - Customer data and feedback
- **Settings & Configuration** - System customization

### Role-Based Access
- **Admin** - Full system access and management
- **Cashier** - POS operations and order management
- **Kitchen** - Kitchen display and order preparation
- **Customer** - Menu browsing and ordering

## 🎯 Key Features Deep Dive

### Smart Refresh System
Automatic data synchronization that pauses during user activity and resumes intelligently:
- Detects user interaction to prevent unnecessary refreshes
- Configurable refresh intervals
- Activity threshold management

### Sound Notification System
Real-time audio alerts for critical events:
- New order notifications
- Service request alerts
- Urgent order warnings
- Customizable sound preferences

### Kitchen Display Optimization
- Real-time order updates
- Color-coded priority system
- Preparation time tracking
- Order completion workflow

## 📈 Performance & Scalability

- **Real-time Updates** - Supabase subscriptions for instant data sync
- **Optimized Queries** - Efficient database queries with proper indexing
- **Responsive Design** - Mobile-first approach for all devices
- **Caching Strategy** - Smart caching for improved performance
- **Load Testing** - Comprehensive testing suite included

## 🔒 Security Features

- **Row Level Security (RLS)** - Database-level access control
- **Role-based Authentication** - Secure user role management
- **Input Validation** - Zod schema validation throughout
- **SQL Injection Protection** - Parameterized queries
- **CORS Configuration** - Proper cross-origin resource sharing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use the existing component patterns
- Add tests for new features
- Update documentation as needed

## 📋 Roadmap

### 🚀 Deployment & Infrastructure
- [x] **Vercel Deployment** - One-click deployment to Vercel
- [x] **Environment Configuration** - Production-ready setup
- [ ] **Custom Domain** - Professional domain setup
- [ ] **CDN Optimization** - Global content delivery
- [ ] **Database Scaling** - Production database optimization

### 🔮 Future Features
- [ ] **Mobile App** - React Native companion app
- [ ] **Advanced Analytics** - Enhanced reporting and insights
- [ ] **Inventory Management** - Supplier and stock management
- [ ] **Multi-location Support** - Chain restaurant management
- [ ] **Integration APIs** - Third-party service integrations
- [ ] **AI Recommendations** - Smart menu suggestions
- [ ] **Progressive Web App** - Offline functionality
- [ ] **Multi-language Support** - Internationalization

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database powered by [Supabase](https://supabase.com/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide React](https://lucide.dev/)

## 📞 Support

For support, email support@tommdanny.com or join our [Discord community](https://discord.gg/tommdanny).

---

<div align="center">
  <strong>Built with ❤️ for the Coffee Shop industry</strong>
  <br>
  <sub>Making Coffee Shop management simple and efficient</sub>
</div>