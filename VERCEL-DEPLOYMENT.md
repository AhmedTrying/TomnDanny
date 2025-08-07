# 🚀 Vercel Deployment Guide for Tomm&Danny Restaurant System

## 📋 Prerequisites

- [Vercel Account](https://vercel.com/signup) (free tier available)
- [GitHub Account](https://github.com) with your repository
- [Supabase Project](https://supabase.com) set up and configured
- Node.js 18+ installed locally

## 🔧 Pre-Deployment Setup

### 1. Prepare Your Repository

Ensure your code is pushed to GitHub:
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Environment Variables Setup

Gather these values from your Supabase dashboard:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (keep secret!)

## 🚀 Deployment Methods

### Method 1: Vercel Dashboard (Recommended)

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select "Tomm&Danny" repository

2. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm ci` (auto-detected)

3. **Environment Variables**
   Click "Environment Variables" and add:
   ```
   NEXT_PUBLIC_SUPABASE_URL = your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY = your_service_role_key
   NEXT_PUBLIC_ENVIRONMENT = production
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (2-5 minutes)
   - Your app will be live at `https://your-project-name.vercel.app`

### Method 2: Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Project Root**
   ```bash
   cd d:/Tomndanny
   vercel
   ```

4. **Follow CLI Prompts**
   - Link to existing project or create new
   - Confirm settings
   - Add environment variables when prompted

## 🔐 Environment Variables Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NEXT_PUBLIC_ENVIRONMENT` | Environment identifier | `production` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|----------|
| `NEXT_PUBLIC_APP_URL` | Your app's URL | Auto-detected by Vercel |

## 🔧 Custom Domain Setup (Optional)

1. **Add Domain in Vercel**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Update Environment Variables**
   ```
   NEXT_PUBLIC_APP_URL = https://yourdomain.com
   ```

## 🗄️ Database Setup

Ensure your Supabase database is properly configured:

1. **Run Database Migrations**
   ```sql
   -- In Supabase SQL Editor, run:
   -- 1. scripts/Database.sql
   -- 2. scripts/fix-permissions.sql
   -- 3. scripts/setup-users.sql
   ```

2. **Configure Row Level Security (RLS)**
   - Ensure RLS policies are set up correctly
   - Test with different user roles

3. **Verify API Access**
   - Test API endpoints work with production keys
   - Check CORS settings if needed

## ✅ Post-Deployment Checklist

### Functionality Testing
- [ ] **Homepage loads** - Check main landing page
- [ ] **Menu system** - Test QR code menu access
- [ ] **Authentication** - Login with admin/cashier/kitchen accounts
- [ ] **Order placement** - Complete order flow
- [ ] **Kitchen display** - Real-time order updates
- [ ] **Admin dashboard** - Analytics and management
- [ ] **POS system** - Cashier interface
- [ ] **Reservations** - Booking system
- [ ] **Sound notifications** - Audio alerts (if applicable)

### Performance Testing
- [ ] **Page load speed** - Under 3 seconds
- [ ] **Mobile responsiveness** - Test on various devices
- [ ] **Real-time updates** - Supabase subscriptions working
- [ ] **API response times** - Under 1 second

### Security Testing
- [ ] **Environment variables** - No secrets exposed in client
- [ ] **Authentication** - Role-based access working
- [ ] **Database security** - RLS policies active
- [ ] **HTTPS** - SSL certificate active

## 🐛 Troubleshooting

### Common Issues

**❌ Build Failed - "Module not found"**
```bash
# Solution: Check package.json dependencies
npm install
npm run build  # Test locally first
```

**❌ "Supabase connection failed"**
- Verify environment variables are set correctly
- Check Supabase project is active
- Ensure API keys have correct permissions

**❌ "API routes not working"**
- Check function timeout settings in vercel.json
- Verify API route file structure
- Test API endpoints locally first

**❌ "Real-time features not working"**
- Verify Supabase Realtime is enabled
- Check WebSocket connections
- Test with different browsers

### Debug Steps

1. **Check Vercel Function Logs**
   - Go to Vercel Dashboard → Project → Functions
   - View real-time logs for API routes

2. **Test Locally First**
   ```bash
   npm run dev
   # Test all functionality locally before deploying
   ```

3. **Verify Environment Variables**
   ```bash
   vercel env ls
   # Check all required variables are set
   ```

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to your main branch:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main
# Vercel automatically deploys
```

### Branch Previews
- Every pull request gets a preview deployment
- Test features before merging to main
- Share preview links with team members

## 📊 Monitoring & Analytics

### Vercel Analytics
- Enable Vercel Analytics in project settings
- Monitor page views, performance, and user behavior

### Performance Monitoring
- Use Vercel Speed Insights
- Monitor Core Web Vitals
- Set up alerts for performance issues

## 🚀 Production Optimization

### Performance Tips
1. **Image Optimization** - Use Next.js Image component
2. **Code Splitting** - Leverage Next.js automatic splitting
3. **Caching** - Configure proper cache headers
4. **Bundle Analysis** - Use `npm run build` to check bundle size

### Security Best Practices
1. **Environment Variables** - Never commit secrets to git
2. **API Rate Limiting** - Implement in Supabase
3. **CORS Configuration** - Restrict to your domain
4. **Regular Updates** - Keep dependencies updated

## 📞 Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)

---

🎉 **Congratulations!** Your Tomm&Danny Restaurant Management System is now live on Vercel!

Share your deployment URL: `https://your-project-name.vercel.app`