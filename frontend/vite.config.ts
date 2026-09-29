import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const api = process.env.API_URL ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@texts': resolve(__dirname, '../shared/texts') } },
  server: {
    port: 5173,
    fs: { allow: ['..'] },
    proxy: {
      '/api': { target: api, ws: true, changeOrigin: false },
      '/mod-api': { target: api, changeOrigin: false },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Zwei getrennte Oberflächen: die App und das Moderationswerkzeug (M00: eigene Adresse)
    rollupOptions: { input: { app: resolve(__dirname, 'index.html'), mod: resolve(__dirname, 'mod.html') } },
  },
});
