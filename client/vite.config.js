import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      // In development the browser talks to Vite, which forwards /api to Express.
      // That keeps everything same-origin, so the httpOnly refresh cookie just works.
      proxy: {
        '/api': { target: env.VITE_DEV_API_TARGET || 'http://localhost:5000' },
      },
    },
  };
});
