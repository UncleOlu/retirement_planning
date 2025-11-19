
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Minify with esbuild (fast and efficient)
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Manual chunks optimization:
        // We separate core React deps but leave heavy libs like Recharts to be 
        // split automatically into their lazy-loaded components (e.g., ChartPanel, Extras)
        // This prevents loading charting logic on the initial landing page.
        manualChunks: {
          'react-core': ['react', 'react-dom'],
          'icons': ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  }
});
