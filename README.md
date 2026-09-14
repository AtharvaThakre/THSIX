# THSIX - Shopify Headless E-commerce Store

![THSIX Logo](./Assets/brand%20logos/logo-Photoroom.png)

A modern, high-performance headless e-commerce store built with React, Vite, and Shopify's Web Components. Features real-time product updates, advanced cart functionality, and seamless user experience.

## 🚀 Live Demo

**Production Site**: [Your Vercel URL will be here]

## ✨ Features

### 🛒 **Shopping Experience**
- **Real-time Product Data** - Live sync with Shopify inventory
- **Advanced Cart System** - Persistent cart with quantity controls
- **Size Chart Modal** - Comprehensive sizing guide
- **Variant Selection** - Complete size/color options
- **Price Calculations** - Subtotal, shipping, tax, total

### 🎨 **Modern UI/UX**
- **Responsive Design** - Mobile-first approach
- **Smooth Animations** - Framer Motion & GSAP
- **3D Product Views** - Three.js integration
- **Infinite Scroll** - Seamless product browsing
- **Loading States** - Enhanced user feedback

### ⚡ **Performance**
- **Vite Build System** - Lightning-fast development
- **Code Splitting** - Optimized bundle sizes
- **Image Optimization** - WebP format with fallbacks
- **Lazy Loading** - Performance-optimized loading
- **PWA Ready** - Offline support capabilities

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS, Custom CSS
- **Animation**: Framer Motion, GSAP, Lenis
- **3D Graphics**: Three.js, React Three Fiber
- **E-commerce**: Shopify Web Components
- **Deployment**: Vercel
- **State Management**: React Context
- **Routing**: React Router DOM

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/THSIX.git
   cd THSIX
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your Shopify credentials
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with:

```env
VITE_SHOPIFY_STORE_DOMAIN=https://your-store.myshopify.com
VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-storefront-token
VITE_APP_TITLE=THSIX
```

### Shopify Setup

1. **Storefront API Access**:
   - Go to Shopify Admin → Apps → Develop apps
   - Create private app with Storefront API access
   - Copy the Storefront access token

2. **Required Permissions**:
   - `unauthenticated_read_products`
   - `unauthenticated_read_collections`
   - `unauthenticated_write_checkouts`

## 🚀 Deployment

### Quick Deploy to Vercel

1. **One-click deploy**:
   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/THSIX)

2. **Manual deployment**:
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   vercel --prod
   ```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 📱 Features Deep Dive

### Cart System
- **Persistent Storage** - Cart saves across sessions
- **Real-time Calculations** - Dynamic pricing updates
- **Variant Support** - Size/color tracking
- **Quantity Controls** - Easy increment/decrement
- **Checkout Integration** - Direct Shopify checkout

### Product Pages
- **Dynamic Routing** - SEO-friendly URLs
- **Image Gallery** - Swipeable product images
- **Variant Selection** - Visual size/color picker
- **Size Chart** - Detailed sizing information
- **Reviews Integration** - Customer feedback display

### Performance Optimizations
- **Bundle Splitting** - Vendor, UI, 3D libraries separated
- **Image Optimization** - WebP with fallbacks
- **Preloading** - Critical resources loaded early
- **Caching Strategy** - Optimized for speed and freshness

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Shopify** - E-commerce platform and Web Components
- **Vercel** - Hosting and deployment platform
- **React Team** - Amazing frontend framework
- **Vite** - Next generation build tool

## 📞 Support

For support and questions:
- **Email**: support@thsix.com
- **Documentation**: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

Built with ❤️ by the THSIX team