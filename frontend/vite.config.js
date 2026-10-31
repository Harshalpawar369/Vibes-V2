import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  
  // Strip console.logs and debuggers in production automatically
  esbuild: {
    drop: ['console', 'debugger'],
  },

  build: {
    // Increase warning limit slightly so standard React builds don't trigger terminal warnings
    chunkSizeWarningLimit: 800,
    
    // Ensure standard ES modules for modern browsers
    target: 'esnext',
    
    // Enable source maps for production debugging (optional, set to false if you want smaller builds)
    sourcemap: false,

    rollupOptions: {
      output: {
        // Safe manual chunking: Groups heavy dependencies without causing race conditions
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Group React core libraries together
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            // Group Redux state management
            if (id.includes('@reduxjs/toolkit') || id.includes('react-redux')) {
              return 'vendor-redux';
            }
            // Group heavy animation libraries
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            // Catch-all for other node_modules
            return 'vendor-utils';
          }
        },
      },
    },
  },
})