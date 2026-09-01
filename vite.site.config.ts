import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: 'site',
  publicDir: resolve(rootDir, 'public'),
  build: {
    outDir: resolve(rootDir, 'dist/site'),
    emptyOutDir: true,
    target: 'es2022',
    rollupOptions: {
      input: {
        index: resolve(rootDir, 'site/index.html'),
        demo: resolve(rootDir, 'site/demo/index.html'),
        notFound: resolve(rootDir, 'site/404.html'),
        privacy: resolve(rootDir, 'site/privacy/index.html'),
        terms: resolve(rootDir, 'site/terms/index.html')
      }
    }
  }
});
