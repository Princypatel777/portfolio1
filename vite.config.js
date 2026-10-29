import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/tasks': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
    host: true,
    proxy: {
      '/tasks': {
        target: process.env.VITE_API_URL || 'http://backend:5000',
        changeOrigin: true,
      },
      '/api': {
        target: process.env.VITE_API_URL || 'http://backend:5000',
        changeOrigin: true,
      },
    },
  },
})
