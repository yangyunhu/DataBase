import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        ws: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('代理错误:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('代理请求:', req.url, '方法:', req.method);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('代理响应:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  }
})
