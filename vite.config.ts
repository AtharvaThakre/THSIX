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
      },
    },
    rollupOptions: {
      input: path.resolve(import.meta.dirname, './index.html'),
      output: {
        manualChunks: (id) => {
          // Core React libraries
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          
          // Router
          if (id.includes('node_modules/react-router-dom')) {
            return 'vendor-router';
          }
          
          // Animation libraries - separate chunk
          if (id.includes('node_modules/gsap') || id.includes('node_modules/lenis')) {
            return 'vendor-animation';
          }
          
          // UI libraries
          if (id.includes('node_modules/lucide-react') || 
              id.includes('node_modules/@radix-ui')) {
            return 'vendor-ui';
          }
          
          // Shopify context
          if (id.includes('contexts/ShopifyContext') || 
              id.includes('contexts/CartContext')) {
            return 'shopify-contexts';
          }
          
          // Heavy below-fold components
          if (id.includes('components/Lookbook') ||
              id.includes('components/Newsletter') ||
              id.includes('components/WhyThsix') ||
              id.includes('components/InstagramReels')) {
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
          
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          
          if (/woff2?|ttf|eot/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }

          // Video files - keep in assets/videos
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


