// https://vitejs.dev/config/
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import path from 'path'; // Ajout pour gérer les chemins

export default defineConfig({
  plugins: [react(), wasm()],
  base: '/',
  build: {
    target: 'esnext',
  },
  esbuild: {
    target: 'esnext',
  },
  optimizeDeps: {
    include: [
      '@fabianbormann/cardano-peer-connect',
      '@cardano-foundation/cardano-connect-with-wallet',
    ],
  },
  resolve: {
    alias: {
      // Chemin relatif vers le fichier ESM
      '@cardano-foundation/cardano-connect-with-wallet': path.resolve(
        __dirname,
        'node_modules/@cardano-foundation/cardano-connect-with-wallet/dist/esm/index.js'
      ),
    },
  },
});
