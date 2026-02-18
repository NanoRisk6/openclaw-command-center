import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'esnext',
    minify: true,
    cssMinify: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    },
    outDir: 'dist'
  },
  server: {
    port: 5173,
    host: true
  },
  preview: {
    port: 5173,
    host: true
  }
})
