import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://www.thsix.com',
        changeOrigin: true,
        secure: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2 // ponytail: extra pass for better compression
      },
      mangle: {
        safari10: true
      }
    },
    rollupOptions: {
      input: path.resolve(import.meta.dirname, './index.html'),
      output: {
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          
          // Router (used on all pages, keep separate)
          if (id.includes('node_modules/react-router-dom')) {
            return 'vendor-router';
          }
          
          // Animation libraries - lazy load with components
          if (id.includes('node_modules/gsap') || 
              id.includes('node_modules/lenis') || 
              id.includes('node_modules/motion') || 
              id.includes('node_modules/framer-motion')) {
            return 'vendor-animation';
          }
          
          // UI libraries (lucide-react, radix)
          if (id.includes('node_modules/lucide-react') || 
              id.includes('node_modules/@radix-ui')) {
            return 'vendor-ui';
          }
          
          // Shopify context (needed on product/cart pages)
          if (id.includes('contexts/ShopifyContext') || 
              id.includes('contexts/CartContext')) {
            return 'shopify-contexts';
          }
          
          // Heavy below-fold components - split separately for lazy loading
          if (id.includes('components/Lookbook') ||
              id.includes('components/Newsletter') ||
              id.includes('components/WhyThsix') ||
              id.includes('components/InstagramReels') ||
              id.includes('components/NextDrop') ||
              id.includes('components/AccordionGallery') ||
              id.includes('components/ScrollStack')) {
            return 'components-lazy';
          }
          
          // Other vendor code
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        },
        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          
          if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          
          if (/woff2?|ttf|eot/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }

          // Video files
          if (/mp4|webm|mov|avi/i.test(ext)) {
            return `assets/videos/[name]-[hash][extname]`;
          }
          
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      }
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
})


