import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: ['es2020', 'safari14', 'chrome90', 'firefox90'],
  },
  server: {
    proxy: {
      '/api/search': { target: process.env.SEARCH_PROXY ?? process.env.API_PROXY ?? 'http://localhost:8000', changeOrigin: true },
      '/api': { target: process.env.API_PROXY ?? 'http://localhost:8000', changeOrigin: true },
      '/static': { target: process.env.STATIC_PROXY ?? process.env.API_PROXY ?? 'http://localhost:8000', changeOrigin: true },
      '/go': { target: process.env.API_PROXY ?? 'http://localhost:8000', changeOrigin: true },
    },
  },
})
