import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    dir: 'src',
    coverage: {
      include: ['src/**/*'],
      exclude: ['src/env.js'],
    },
  },
});
