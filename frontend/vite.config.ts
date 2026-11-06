import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    open: false,
  },
  build: {
    // Suppress chunk size warnings — 3D (Three.js) and map (MapLibre) bundles are expected to be large.
    // We will add dynamic import() code-splitting for 3D and map modules in Phase 4.
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split Three.js / R3F into its own chunk to enable browser caching
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          // Isolate React core vendor bundle
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});