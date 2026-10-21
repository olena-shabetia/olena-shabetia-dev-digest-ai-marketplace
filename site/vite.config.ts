import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// base './' keeps every asset URL relative, so the build works under any
// GitHub Pages sub-path (https://<user>.github.io/<repo>/).
export default defineConfig({
  base: './',
  plugins: [react()],
  // site/design/ holds static mockups with their own <script> tags: keep the
  // dependency scanner on the app entry only.
  optimizeDeps: { entries: ['index.html'] },
  build: { outDir: 'dist', emptyOutDir: true, sourcemap: false },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
