import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import yaml from '@rollup/plugin-yaml';

export default defineConfig({
  plugins: [yaml()],
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
