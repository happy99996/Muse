import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Defines process.env as an empty object in the browser to prevent crashes
    // if code tries to access it directly without checking for existence.
    // The actual API key is accessed via import.meta.env in geminiService.ts
    'process.env': {}
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
});