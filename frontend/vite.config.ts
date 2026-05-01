import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

let commitHash = 'unknown'
try {
  commitHash = execSync('git rev-parse HEAD').toString().trim()
} catch {
  console.warn('Could not retrieve git commit hash')
}

export default defineConfig({
  plugins: [react()],
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
  base: '/',
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/ws':  { target: 'ws://localhost:8080', ws: true },
    }
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react-core'
          }
          if (id.includes('node_modules/react-router')) {
            return 'react-router'
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'framer'
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons'
          }
          if (id.includes('node_modules/@capacitor')) {
            return 'capacitor'
          }
        }
      }
    }
  }
})