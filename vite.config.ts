import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    // 对外监听，便于通过公网 IP/域名访问
    host: true,
    port: 46340,
    strictPort: true,
    // 允许通过域名访问（IP 直连默认放行）
    allowedHosts: ['.lingloft.cn', '154.12.29.146'],
    // 若后续通过 nginx 反代到 443 域名，取消下面注释并删除 IP 直连用法
    // hmr: { protocol: 'wss', clientPort: 443 },
  },
})
