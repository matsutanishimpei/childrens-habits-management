import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'generate-redirects',
      closeBundle() {
        const apiUrl = process.env.VITE_API_URL;
        if (apiUrl) {
          const distDir = path.resolve(__dirname, 'dist');
          if (!existsSync(distDir)) {
            mkdirSync(distDir, { recursive: true });
          }
          const targetUrl = apiUrl.replace(/\/$/, '');
          writeFileSync(
            path.join(distDir, '_redirects'),
            `/api/* ${targetUrl}/api/:splat 200\n`
          );
          console.log(`[Plugin] Generated _redirects mapping /api/* to ${targetUrl}/api/*`);
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@my-app/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
});
