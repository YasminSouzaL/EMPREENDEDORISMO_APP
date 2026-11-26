import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const { VITE_API_PROXY_TARGET = 'http://localhost:8080' } = loadEnv(mode, '.', 'VITE_')

  return {
    plugins: [react(), tailwindcss()],
    resolve: { tsconfigPaths: true },
    server: {
      proxy: {
        '/api': {
          target: VITE_API_PROXY_TARGET,
          changeOrigin: true,
          headers: { origin: VITE_API_PROXY_TARGET },
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
