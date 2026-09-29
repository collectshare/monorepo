import { resolve } from 'node:path';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // esbuild (vitest's default) does not emit `design:paramtypes`, which the DI Registry needs.
  plugins: [
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        target: 'es2022',
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
      },
    }),
  ],
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
