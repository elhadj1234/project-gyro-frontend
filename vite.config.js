import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://tempra-private-launch-1.onrender.com',
        changeOrigin: true,
        secure: true,
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            const cookies = proxyRes.headers['set-cookie'];
            if (cookies) {
              // Normalize cookie for localhost dev
              proxyRes.headers['set-cookie'] = cookies.map((c) =>
                c
                  .replace(/; SameSite=Lax/gi, '; SameSite=Lax')
              );
            }
          });
        },
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
