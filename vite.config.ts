import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// 展示页：开发服务直接从工程根目录提供 data/ 和 .temp/ 下的报告与图片，不复制物料
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5184,
    host: '127.0.0.1',
    strictPort: true,
    // models/ 是指向大模型缓存的软链接，生成产物频繁写入，都不用监听
    watch: { ignored: ['**/models/**', '**/external/**', '**/data/outputs/**', '**/.venv/**'] },
  },
})
