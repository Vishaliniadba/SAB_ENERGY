import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_BACKEND_URL || env.VITE_API_BASE_URL || 'http://192.23.1.7:8007';

  return {
    plugins: [
      tailwindcss(),
      react(),
    ],
    server: {
      cors: true,
      proxy: {
        '/api/Enerlink': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
          headers: {
            Origin: backendTarget,
            Referer: backendTarget,
          },
        },
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
          headers: {
            Origin: backendTarget,
            Referer: backendTarget,
          },
        },
      },
    },
  };
});

