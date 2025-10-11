import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // 允许外部访问
    port: 5174, // 固定端口
    strictPort: true, // 端口被占用时不尝试其他端口
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8700',
        changeOrigin: true,
      },
    },
  },
})
