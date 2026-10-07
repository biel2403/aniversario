import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    // Windows can lock photos briefly while Explorer copies or renames them.
    watch: process.platform === 'win32' ? {
      usePolling: true,
      interval: 1000,
      binaryInterval: 1500,
      awaitWriteFinish: { stabilityThreshold: 1000, pollInterval: 100 },
    } : undefined,
  },
  preview: { port: 4173, strictPort: true },
  build: { target: 'es2022', assetsInlineLimit: 0 },
});
