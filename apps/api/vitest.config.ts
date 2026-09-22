import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@application': resolve(__dirname, './src/application'),
      '@main': resolve(__dirname, './src/main'),
      '@infra': resolve(__dirname, './src/infra'),
      '@kernel': resolve(__dirname, './src/kernel'),
      '@shared': resolve(__dirname, './src/shared'),
    },
  },
  test: {
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts'],
  },
});
