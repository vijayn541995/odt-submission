import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const enterpriseRoot = fileURLToPath(new URL('./odt 2.0 enterprise/', import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@odt/ui/sidebar', replacement: `${enterpriseRoot}packages/ui/src/layout/sidebar/index.js` },
      { find: '@odt/ui/features', replacement: `${enterpriseRoot}packages/ui/src/features/index.js` },
      { find: '@odt/ui/primitives', replacement: `${enterpriseRoot}packages/ui/src/primitives/index.js` },
      { find: '@odt/ui/utils', replacement: `${enterpriseRoot}packages/ui/src/utils/index.js` },
      { find: '@odt/config', replacement: `${enterpriseRoot}packages/config/src/index.js` },
      { find: '@odt/domain', replacement: `${enterpriseRoot}packages/domain/src/index.js` },
      { find: '@odt/ui', replacement: `${enterpriseRoot}packages/ui/src/index.js` }
    ]
  },
  server: {
    host: '127.0.0.1',
    port: 5189
  },
  preview: {
    host: '127.0.0.1',
    port: 4189
  }
});
