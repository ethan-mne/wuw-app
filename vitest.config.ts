import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.{test,spec}.ts', 'wuw-mobile/src/**/*.{test,spec}.ts'],
    coverage: {
      include: ['src/**/*'],
      exclude: ['src/env.js'],
    },
  },
});
