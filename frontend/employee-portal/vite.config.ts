import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      // Route auth endpoints to authentication service (port 8081)
      '/api/auth': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      // Route admin endpoints - try nginx first (port 80), fallback to direct services
      '/api/admin': {
        target: 'http://localhost:80',
        changeOrigin: true,
        secure: false,
        // If nginx fails, you can manually change target to specific service ports:
        // '/api/admin/stalls' -> 'http://localhost:8082'
        // '/api/admin/reservations' -> 'http://localhost:8083'
        // '/api/admin/users' -> 'http://localhost:8081'
      },
      // Fallback for other API routes
      '/api': {
        target: 'http://localhost:80',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

