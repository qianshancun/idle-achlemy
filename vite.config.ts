import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/' : './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/config': path.resolve(__dirname, 'src/config'),
      '@/game': path.resolve(__dirname, 'src/game'),
      '@/ui': path.resolve(__dirname, 'src/ui'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemaps in production for faster deployment
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        // Better asset naming for caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Optimize for production deployment
    minify: 'terser',
    target: 'es2020',
    cssMinify: true,
  },
}); 