import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Using relative base so this builds and deploys correctly under any GitHub Pages path
// (e.g. https://username.github.io/repo-name/) without needing repo-specific config.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
