import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Route auth endpoints to authentication service (port 8081)
      '/api/auth': {
        target: 'http://34.213.51.153',
        changeOrigin: true,
        secure: false,
      },
      // Route admin statistics endpoints to specific services
      '/api/admin/statistics/summary': {
        target: 'http://34.213.51.153', // Reservation service
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Keep the path as is
      },
      '/api/admin/statistics/stalls': {
        target: 'http://34.213.51.153', // Stall service
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Keep the path as is
      },
      // Route stall endpoints to stall service (port 8082)
      // Frontend calls /api/admin/stalls but backend has /api/stalls
      '/api/admin/stalls': {
        target: 'http://34.213.51.153', // Stall service
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace('/api/admin/stalls', '/api/stalls'), // Convert to backend path
      },
      // Route admin reservation endpoints to reservation service (port 8083)
      '/api/admin/reservations': {
        target: 'http://34.213.51.153', // Reservation service
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Keep the path as is - AdminController handles /api/admin/reservations
      },
      // Route other admin endpoints to authentication service directly in dev (port 8081)
      '/api/admin': {
        target: 'http://34.213.51.153',
        changeOrigin: true,
        secure: false,
        // If you run nginx locally, change target back to http://localhost:80
        // or add specific overrides per service as needed.
      },
      // Fallback for other API routes
      '/api': {
        target: 'http://34.213.51.153',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

