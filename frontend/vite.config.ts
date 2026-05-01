import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

let commitHash = 'unknown'
try {
  commitHash = execSync('git rev-parse HEAD').toString().trim()
} catch {
  // git not available in Docker build — ok
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
    // esnext = no transpilation overhead; modern WebView on Android 7+ and iOS 12+ supports it
    target: 'esnext',
    // Sourcemaps waste bandwidth in production
    sourcemap: false,
    // Silence noisy warnings; our largest chunk (framer) is expected to be ~130kb
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Intelligent code splitting: keeps vendor libs separately cached
        manualChunks(id) {
          // React core — almost never changes, gets long-lived cache
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'react-core'
          }
          // Router — lightweight but version-stable
          if (id.includes('node_modules/react-router')) {
            return 'react-router'
          }
          // Framer Motion — large but cacheable
          if (id.includes('node_modules/framer-motion')) {
            return 'framer'
          }
          // Icons — small, stable
          if (id.includes('node_modules/lucide-react')) {
            return 'icons'
          }
          // Capacitor plugins — only used in APK, separate for web cache efficiency
          if (id.includes('node_modules/@capacitor')) {
            return 'capacitor'
          }
          // Axios — small utility
          if (id.includes('node_modules/axios')) {
            return 'http'
          }
        },
        // Use content-based hashes for long-lived caching
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      }
    },
    // Minify with esbuild (fast and excellent)
    minify: 'esbuild',
    // CSS code splitting: load only used CSS per page
    cssCodeSplit: true,
  }
})