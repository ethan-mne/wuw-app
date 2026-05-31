import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative asset paths — required for Capacitor WebView on Android.
  base: './',
  build: {
    modulePreload: false,
  },
})
