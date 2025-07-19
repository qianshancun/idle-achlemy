# 🚀 Cloudflare Pages Deployment Guide

This guide will help you deploy the Idle Alchemy game to Cloudflare Pages using Wrangler.

## 📋 Prerequisites

1. **Node.js** (version 16 or higher)
2. **npm** or **yarn** package manager
3. **Cloudflare account** (free tier is sufficient)
4. **Git repository** (GitHub, GitLab, or Bitbucket)

## 🛠️ Setup Instructions

### 1. Install Dependencies

Make sure all dependencies are installed:

```bash
npm install
```

### 2. Authenticate with Cloudflare

First, log into your Cloudflare account:

```bash
npm run cf:login
```

This will open your browser for authentication. Follow the prompts to authorize Wrangler.

Verify your authentication:

```bash
npm run cf:whoami
```

### 3. Create a Cloudflare Pages Project

Create a new Pages project:

```bash
npm run cf:pages:create
```

Or create it manually through the Cloudflare dashboard:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to Pages
3. Click "Create a project"
4. Choose "Connect to Git" or "Direct Upload"

## 🏗️ Build Process

### Local Build

Build the project for production:

```bash
npm run build:cf
```

This will:
- Compile TypeScript files
- Build i18n translations
- Generate optimized production assets
- Copy Cloudflare configuration files
- Verify the build output

### Build Output

The build creates a `dist/` directory with:
- `index.html` - Main application file
- `assets/` - Optimized JS, CSS, and media files
- `_headers` - HTTP headers configuration
- `_redirects` - SPA routing configuration

## 🚀 Deployment Options

### Option 1: Direct Deploy (Recommended)

Deploy directly from your local machine:

```bash
npm run deploy:cf
```

For production deployment with project name:

```bash
npm run deploy:cf:production
```

### Option 2: Git Integration

Connect your repository to Cloudflare Pages:

1. Go to Cloudflare Dashboard → Pages
2. Click "Create a project"
3. Connect your Git repository
4. Configure build settings:
   - **Build command**: `npm run build:cf`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (or leave empty)

### Option 3: Manual Upload

1. Build the project: `npm run build:cf`
2. Go to Cloudflare Dashboard → Pages
3. Create a new project with "Direct Upload"
4. Upload the `dist/` folder

## ⚙️ Configuration

### Environment Variables

If you need environment variables, add them in:

1. **Cloudflare Dashboard**: Pages → Settings → Environment variables
2. **wrangler.toml**: Add to `[vars]` section

Example:
```toml
[vars]
NODE_ENV = "production"
GAME_VERSION = "1.0.0"
```

### Custom Domain

To use a custom domain:

1. Go to Pages → Custom domains
2. Add your domain
3. Follow DNS configuration instructions
4. Cloudflare will automatically provision SSL

### Build Settings

The project is configured with:
- **Framework preset**: None (Static site)
- **Build command**: `npm run build:cf`
- **Output directory**: `dist`
- **Node.js version**: 18+ (auto-detected)

## 🔧 Advanced Configuration

### Caching Strategy

The deployment includes optimized caching:
- **Static assets**: 1 year cache with immutable flag
- **HTML files**: No cache for instant updates
- **API responses**: Custom cache rules (if applicable)

### Security Headers

Automatic security headers are applied:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Performance Optimizations

The build includes:
- **Asset minification**: JavaScript, CSS, and HTML
- **Code splitting**: Automatic chunk optimization
- **Tree shaking**: Dead code elimination
- **Asset hashing**: Cache busting for updates

## 🐛 Troubleshooting

### Common Issues

#### Build Fails
```bash
# Check dependencies
npm install

# Verify TypeScript compilation
npm run type-check

# Test local build
npm run build:cf
```

#### Authentication Issues
```bash
# Re-authenticate
wrangler auth logout
npm run cf:login
```

#### Deployment Fails
```bash
# Check project exists
npm run cf:pages:list

# Verify build output
ls -la dist/

# Check wrangler configuration
cat wrangler.toml
```

### Debug Mode

For detailed deployment logs:
```bash
wrangler pages deploy dist --verbose
```

### Local Preview

Test the production build locally:
```bash
npm run build:cf
npm run preview
```

## 📊 Monitoring and Analytics

### Cloudflare Analytics

Access deployment analytics:
1. Cloudflare Dashboard → Pages
2. Select your project
3. View Analytics tab for traffic and performance data

### Performance Monitoring

Monitor your deployment:
- **Core Web Vitals**: Automatic monitoring
- **Uptime**: 99.99% availability guarantee
- **Global CDN**: 200+ edge locations

## 🔄 Continuous Deployment

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build project
        run: npm run build:cf
        
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: idle-alchemy
          directory: dist
```

### Webhook Deployment

Set up automatic deployments:
1. Pages → Settings → Builds & deployments
2. Add deployment webhook
3. Configure your Git provider to trigger on push

## 🎯 Production Checklist

Before going live:

- [ ] Build completes without errors
- [ ] All game functionality works in production
- [ ] Mobile responsiveness verified
- [ ] Loading performance optimized
- [ ] Security headers configured
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Analytics tracking enabled

## 📞 Support

### Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Cloudflare Community](https://community.cloudflare.com/c/developers/pages)

### Commands Reference

```bash
# Authentication
npm run cf:login          # Login to Cloudflare
npm run cf:whoami         # Check current user

# Project Management  
npm run cf:pages:create   # Create new project
npm run cf:pages:list     # List all projects

# Build & Deploy
npm run build:cf          # Build for Cloudflare
npm run deploy:cf         # Deploy to Cloudflare
npm run deploy:cf:production  # Production deployment

# Development
npm run dev               # Local development server
npm run preview           # Preview production build
npm run test              # Run tests
```

---

🎉 **Congratulations!** Your Idle Alchemy game is now ready for Cloudflare Pages deployment! 