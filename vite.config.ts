import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'frontend',
  envDir: '../',
  build: { outDir: '../dist', emptyOutDir: true },
  worker: { format: 'es' },
});
