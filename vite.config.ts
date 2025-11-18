
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Minify with esbuild (fast and efficient)
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Manual chunks for code splitting to optimize caching and bandwidth costs
        manualChunks: {
          'vendor': ['react', 'react-dom', 'recharts', 'lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  }
});
