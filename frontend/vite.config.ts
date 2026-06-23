import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'

// 🛡️ VitePWA disabled — the service worker was caching old bundles and
// blocking users from receiving new deployments. Nginx provides the cache
// headers we need. Re-enable with a tested strategy once PWA scope is decided.

// Bundle analyzer: writes dist/stats.html (interactive treemap). The
// `parse-stats.mjs` script extracts the embedded JSON payload for CI
// size-tracking. Older v5/v6/v7 versions all support `template: 'treemap'`,
// so we don't depend on any newer `json` template option.
export default defineConfig(() => ({
  plugins: [
    vue(),
    visualizer({
      filename: 'dist/stats.html',
      template: 'treemap',
      gzipSize: true,
      brotliSize: true
    })
  ],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true, secure: false },
      '/uploads': { target: 'http://localhost:3000', changeOrigin: true, secure: false }
    }
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    },
    assetsInlineLimit: 4096,
    modulePreload: { polyfill: false }
  },
  css: {
    devSourcemap: false
  }
}))
