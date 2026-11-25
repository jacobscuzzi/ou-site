import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: ['es2020', 'safari14', 'chrome90', 'firefox90'],
  },
  server: {
    proxy: {
      '/api': { target: process.env.API_PROXY ?? 'http://localhost:8000', changeOrigin: true },
      '/static': { target: process.env.API_PROXY ?? 'http://localhost:8000', changeOrigin: true },
      '/go': { target: process.env.API_PROXY ?? 'http://localhost:8000', changeOrigin: true },
    },
  },
})
