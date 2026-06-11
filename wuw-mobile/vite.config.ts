import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths — required for Capacitor WebView on Android.
  base: './',
  server: {
    // Dev proxy prevents browser CORS (5173 -> 3000).
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    modulePreload: false,
  },
})
