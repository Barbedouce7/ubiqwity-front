// https://vitejs.dev/config/
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  plugins: [react(), wasm()],
  base: '/',
  build: {
    target: 'esnext', // Définit la cible pour la construction finale
  },
  esbuild: {
    target: 'esnext', // Pour le transpileur esbuild pendant le dev
  },
  optimizeDeps: {
    include: ['@fabianbormann/cardano-peer-connect'], // Toujours pertinent si tu réinstalles ce package
  },
});
