import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  test: { setupFiles: ['./tests/setupBackendCapabilities.ts'] },
  server: {
    port: 5173,
    strictPort: true,
  },
});
