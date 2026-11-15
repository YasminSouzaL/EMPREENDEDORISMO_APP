import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { tsconfigPaths: true },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // Ajusta a origem para o Spring.
        headers: { origin: 'http://localhost:8080' },
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
