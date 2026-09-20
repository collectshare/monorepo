import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { createRequire } from 'module';
import path from 'path';
import { defineConfig } from 'vite';

const require = createRequire(import.meta.url);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      maxParallelFileOps: 200,
    },
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      // Várias deps transitivas (ex: @radix-ui/react-*) não resolvem "react"
      // sozinhas no layout isolado padrão do pnpm — cada uma fica presa numa
      // pasta .pnpm/ diferente sem enxergar o react do projeto. Apontar pro
      // caminho real resolve pra todas de uma vez, sem precisar achatar
      // node_modules via hoist (que estoura o limite fixo de file descriptors
      // do compute Lambda do CodeBuild). Regex de match exato: um alias de
      // string faz prefix match e quebraria subpaths como "react/jsx-runtime".
      { find: /^react$/, replacement: require.resolve('react') },
      { find: /^react-dom$/, replacement: require.resolve('react-dom') },
    ],
  },
});
