import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import compression from 'vite-plugin-compression';

export default defineConfig(() => {
  return {
    envPrefix: ['VITE_', 'SUPABASE_'],
    plugins: [
      react(), 
      tailwindcss(),
      compression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
      }),
      compression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024,
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled to avoid console errors, but we keep watching enabled.
      hmr: false,
    },
  };
});
