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
        filter: /\.(js|css|html|svg)$/i,
      }),
      compression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024,
        filter: /\.(js|css|html|svg)$/i,
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui': ['lucide-react', 'motion/react'],
            'db': ['@supabase/supabase-js']
          }
        }
      },
      chunkSizeWarningLimit: 800,
      minify: 'terser' as const,
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    },
    server: {
      // HMR is disabled to avoid console errors, but we keep watching enabled.
      hmr: false,
    },
  };
});
