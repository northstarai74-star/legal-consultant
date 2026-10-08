import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

// Plain object (not defineConfig) so server.js can import it directly in development.
export default {
  root: fileURLToPath(new URL('./web', import.meta.url)),
  plugins: [react()],
  server: { fs: { allow: [projectRoot] } },
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
    // Two entry pages: the app (index.html) and the standalone landing page (landing.html).
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./web/index.html', import.meta.url)),
        landing: fileURLToPath(new URL('./web/landing.html', import.meta.url)),
        landingB: fileURLToPath(new URL('./web/landing-b.html', import.meta.url)),
      },
    },
  },
};
