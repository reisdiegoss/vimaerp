import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },

  },
  server: {
    proxy: {
      '/api': {
        target: 'https://api.vimaerp.com.br',
        changeOrigin: true,
        secure: false, // para ignorar qualquer cert fake
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('🚨 [VITE PROXY ERROR]', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log(`\n========================================`);
            console.log(`🌐 [REQUEST] ${req.method} ${req.url}`);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            let body = '';
            proxyRes.on('data', (chunk) => { body += chunk; });
            proxyRes.on('end', () => {
              if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
                console.log(`❌ [ERROR RESPONSE] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`);
                try {
                  console.log(`📄 Payload:\n`, JSON.stringify(JSON.parse(body), null, 2));
                } catch {
                  console.log(`📄 Payload:\n`, body);
                }
              } else {
                console.log(`✅ [SUCCESS RESPONSE] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`);
              }
            });
          });
        }
      }
    }
  }
})
