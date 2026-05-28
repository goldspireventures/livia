import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const apiTarget = process.env.INTERNAL_API_PROXY ?? "http://127.0.0.1:3000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    strictPort: true,
    proxy: {
      "/api": { target: apiTarget, changeOrigin: true },
    },
  },
  preview: { port: 5175, strictPort: true },
});
