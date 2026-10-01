import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@union/shared': path.resolve(__dirname, '../shared/src/index.ts')
    }
  },
  build: { rollupOptions: { output: { manualChunks: { react: ['react', 'react-dom'], canvas: ['@xyflow/react'], icons: ['lucide-react'] } } } },
  server: {
    port: 1590,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 1590,
    host: true
  }
});
