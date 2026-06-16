import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api/catalogo-s3': {
        target: 'https://lineasdebasepublicas.mma.gob.cl',
        changeOrigin: true,
      },
    },
  },
});